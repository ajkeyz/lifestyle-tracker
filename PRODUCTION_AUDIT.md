# Production Readiness Audit — Lifestyle Creep

**Auditor role:** Senior Staff Engineer + Security Reviewer + Product QA Lead
**Date:** 2026-02-22
**Codebase:** React 18 / Express 5 / PostgreSQL / Drizzle ORM / WebSocket
**Deployment:** Replit Autoscale (Neon PostgreSQL)
**Files audited:** 6,741 LOC server, ~15K LOC client, 40+ components, 15 DB tables

---

## 1) Executive Summary

1. **No security headers** — no helmet, no CSP, no CORS config. Every response is naked.
2. **`/api/add-freeze-token`** is exposed to any authenticated user — free infinite freeze tokens.
3. **`/api/coop/session/:id/next`** has no auth — anyone can advance any co-op game.
4. **Race conditions** in `submitGame()` — transaction exists but lacks `SELECT ... FOR UPDATE` row locking.
5. **N+1 queries** in `getUserLeagues()` and `getUserChallenges()` — 11-51 queries per call.
6. **`staleTime: Infinity`** on React Query — daily drop never auto-refreshes at midnight.
7. **In-memory rate limiter** leaks memory indefinitely and won't survive horizontal scaling.
8. **Vote/comment count mutations** not wrapped in transactions — counts can desync or go negative.
9. **WebSocket `join_session`** accepts any `userId` — impersonation possible.
10. **`/api/active-players`** returns `Math.random()` on error — fake data in production.

---

## 2) P0 Must-Fix Before Launch

### P0-1: `/api/add-freeze-token` exploitable by any user
**Impact:** Any authenticated user can call this endpoint repeatedly and grant themselves unlimited freeze tokens.
**File:** `server/routes.ts:888-906`
**Reproduce:** `curl -X POST /api/add-freeze-token -H 'Content-Type: application/json' -d '{"count": 100}' --cookie session_cookie`
**Fix time:** S (30 min)

```diff
- app.post("/api/add-freeze-token", requireAuth, rateLimit("freeze-token", 10, 60000), async (req, res) => {
+ app.post("/api/add-freeze-token", requireAdmin, rateLimit("freeze-token", 10, 60000), async (req, res) => {
```

### P0-2: Co-op `/next` endpoint has no auth check
**Impact:** Anyone who knows a session ID can advance the game, skip questions, or force completion for other players.
**File:** `server/routes.ts:1645`
**Reproduce:** `curl -X POST /api/coop/session/UUID/next` (no cookie needed)
**Fix time:** S (15 min)

```diff
- app.post("/api/coop/session/:sessionId/next", async (req, res) => {
+ app.post("/api/coop/session/:sessionId/next", requireAuth, async (req, res) => {
    try {
+     const userId = getSessionId(req);
      const { sessionId } = req.params;
      const session = await storage.getCoopSession(sessionId);
      if (!session) return res.status(404).json({ error: "Session not found" });
+     if (session.hostId !== userId && session.guestId !== userId) {
+       return res.status(403).json({ error: "Not a participant" });
+     }
```

### P0-3: Co-op `GET /session/:id` and `GET /session/:id/result` — no auth
**Impact:** Information disclosure — anyone can fetch full session data including player answers.
**File:** `server/routes.ts:1535, 1698`
**Fix time:** S (15 min)

```diff
- app.get("/api/coop/session/:sessionId", async (req, res) => {
+ app.get("/api/coop/session/:sessionId", requireAuth, async (req, res) => {
+   const userId = getSessionId(req);
    // ...
+   if (session.hostId !== userId && session.guestId !== userId) {
+     return res.status(403).json({ error: "Not authorized" });
+   }
```

### P0-4: No security headers (helmet/CSP/CORS)
**Impact:** XSS, clickjacking, MIME-sniffing, and other browser-level attacks have zero mitigation.
**File:** `server/index.ts` — missing entirely
**Fix time:** S (30 min)

```diff
+ import helmet from "helmet";
+ import cors from "cors";

  const app = express();
+ app.use(helmet({
+   contentSecurityPolicy: {
+     directives: {
+       defaultSrc: ["'self'"],
+       scriptSrc: ["'self'", "'unsafe-inline'"],
+       styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
+       fontSrc: ["'self'", "fonts.gstatic.com"],
+       connectSrc: ["'self'", "wss:", "https://app.posthog.com"],
+       imgSrc: ["'self'", "data:", "blob:"],
+     },
+   },
+ }));
+ app.use(cors({
+   origin: process.env.ALLOWED_ORIGINS?.split(",") || ["https://lifestylecreep.app"],
+   credentials: true,
+ }));
```

### P0-5: WebSocket userId impersonation
**Impact:** Any WebSocket client can send `{ type: 'join_session', sessionId: X, userId: 'victim_id' }` and impersonate another player in co-op.
**File:** `server/routes.ts:1755-1758`
**Fix time:** M (1 hr)

```diff
  ws.on('message', async (data) => {
    const message = JSON.parse(data.toString());
    if (message.type === 'join_session') {
-     const { sessionId, userId } = message;
-     currentUserId = userId;
+     const { sessionId } = message;
+     // Derive userId from the HTTP upgrade request session
+     // Attach session parsing to WebSocket upgrade in wss.handleUpgrade
+     if (!authenticatedUserId) {
+       ws.close(4001, "Unauthorized");
+       return;
+     }
+     currentUserId = authenticatedUserId;
```

**Full fix:** Parse the session cookie during WebSocket upgrade:
```typescript
wss.on('connection', (ws, req) => {
  // req has cookies from the HTTP upgrade handshake
  const sessionId = parseSessionFromCookie(req);
  if (!sessionId) { ws.close(4001); return; }
  // Use verified sessionId, never trust client-sent userId
});
```

### P0-6: `submitGame()` race condition — no row-level lock
**Impact:** Two concurrent submissions can both read `streak: 5`, both write `streak: 6`, losing an increment. Also affects `moneyHealth`, `totalScore`, badges.
**File:** `server/postgres-storage.ts:602-753`
**Reproduce:** Send two POST `/api/submit-game` simultaneously with same session.
**Fix time:** M (1 hr)

```diff
  return await db.transaction(async (tx) => {
-   const user = await this.getOrCreateUser(sessionId);
+   // Acquire row lock to prevent concurrent updates
+   const [user] = await tx.select()
+     .from(appSchema.lifestyleUsers)
+     .where(eq(appSchema.lifestyleUsers.id, sessionId))
+     .for('update');
+   if (!user) {
+     // getOrCreateUser handles creation, then re-select with lock
+     await this.getOrCreateUser(sessionId);
+     const [lockedUser] = await tx.select()
+       .from(appSchema.lifestyleUsers)
+       .where(eq(appSchema.lifestyleUsers.id, sessionId))
+       .for('update');
+     user = lockedUser;
+   }
```

### P0-7: `active-players` returns fake random data on error
**Impact:** Production dashboard shows fabricated numbers. Undermines trust if discovered.
**File:** `server/routes.ts:174-182`
**Fix time:** S (5 min)

```diff
  } catch (error) {
-   res.json({ count: Math.floor(Math.random() * 8) + 3 });
+   console.error("Error getting active players:", error);
+   res.json({ count: 0 });
  }
```

### P0-8: Session secret is `"some-random-secret-key"`
**Impact:** Predictable session secret = session forgery. Attacker can sign their own session cookies.
**File:** `.env` — `SESSION_SECRET="some-random-secret-key"`
**Fix time:** S (5 min)

```bash
# Generate proper secret
openssl rand -hex 64
# Set in production environment variables (NOT in .env file)
```

---

## 3) P1 Should-Fix Soon

### P1-1: N+1 queries in `getUserLeagues()` — 11+ queries per call
**File:** `server/postgres-storage.ts:942-956`
**Impact:** User in 10 leagues = 11 DB queries. At 1K concurrent users = 11K queries/sec.
**Fix time:** M (2 hr)

```sql
-- Replace N+1 with single JOIN query
SELECT l.*, lm.*, lu.username, lu.avatar
FROM league_members lm
JOIN leagues l ON l.id = lm.league_id
JOIN lifestyle_users lu ON lu.id = lm.user_id
WHERE l.id IN (SELECT league_id FROM league_members WHERE user_id = $1)
ORDER BY lm.weekly_score DESC;
```

### P1-2: N+1 queries in `getUserChallenges()` — 50+ queries
**File:** `server/postgres-storage.ts:1062-1081`
**Impact:** Same pattern. 50 challenges = 51 queries.
**Fix time:** M (2 hr)

```sql
SELECT c.*,
  cu1.username as challenger_username, cu1.avatar as challenger_avatar,
  cu2.username as challengee_username, cu2.avatar as challengee_avatar
FROM challenges c
JOIN lifestyle_users cu1 ON cu1.id = c.challenger_id
JOIN lifestyle_users cu2 ON cu2.id = c.challengee_id
WHERE c.challenger_id = $1 OR c.challengee_id = $1
ORDER BY c.created_at DESC;
```

### P1-3: Vote/comment mutations not in transactions
**File:** `server/postgres-storage.ts:1584-1669` (votes), `1739-1789` (comments)
**Impact:** Comment count drifts from actual count. Vote counts desync (upvotes + downvotes don't match actual votes).
**Fix time:** M (1 hr per function)

```diff
  async addComment(userId, scenarioId, data) {
+   return await db.transaction(async (tx) => {
      const [comment] = await tx.insert(appSchema.communityComments)...;
      await tx.update(appSchema.communityScenarios)
        .set({ commentCount: sql`comment_count + 1` })...;
      return comment;
+   });
  }
```

### P1-4: Badge computation does 7+ `getUser()` + 7 `updateUser()` per game
**File:** `server/postgres-storage.ts:1239-1282, 1285-1309`
**Impact:** Each game submission triggers ~15 unnecessary DB queries.
**Fix time:** M (2 hr)

```typescript
// BEFORE: 7x getUser + 7x updateUser = 14 queries
// AFTER: 1x getUser + 1x updateUser = 2 queries
async computeAndUpdateAllBadges(userId, gameData) {
  const user = await this.getUser(userId);
  const badges = [...user.badges];

  // Compute all badge updates in memory
  updateBadgeInArray(badges, "no_spend_ninja", gameData.spendingCorrect);
  updateBadgeInArray(badges, "credit_climber", user.moneyHealth);
  // ... all 7 badges ...

  // Single write
  await this.updateUser(userId, { badges });
}
```

### P1-5: `staleTime: Infinity` breaks midnight daily drop
**File:** `client/src/lib/queryClient.ts:68`
**Impact:** User playing at 11:59 PM never gets new daily drop. Must force-refresh browser.
**Fix time:** S (15 min)

```diff
  defaultOptions: {
    queries: {
-     staleTime: Infinity,
+     staleTime: 5 * 60 * 1000, // 5 minutes
```

And add midnight invalidation in the home page:
```typescript
useEffect(() => {
  const now = new Date();
  const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  const timer = setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/daily-drop"] });
    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  }, msToMidnight);
  return () => clearTimeout(timer);
}, []);
```

### P1-6: Rate limiter memory leak
**File:** `server/routes.ts:86-114`
**Impact:** `rateLimiters` Map grows unbounded. After 100K unique sessions, consumes ~50MB+ RAM.
**Fix time:** M (1 hr)

```typescript
// Add periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key, limiter] of rateLimiters) {
    for (const [sessionId, entry] of limiter) {
      if (now > entry.resetAt) limiter.delete(sessionId);
    }
    if (limiter.size === 0) rateLimiters.delete(key);
  }
}, 60000); // Clean every minute
```

### P1-7: Community content — no HTML/XSS sanitization
**File:** `server/routes.ts:1001-1015` (scenarios), `server/routes.ts:1074` (comments)
**Impact:** Stored XSS if community scenario titles/content contain `<script>` tags. React auto-escapes in JSX, BUT `dangerouslySetInnerHTML` anywhere or future email digests would be vulnerable.
**Fix time:** S (30 min)

```diff
+ import DOMPurify from "isomorphic-dompurify";

  const scenario = await storage.createCommunityScenario(sessionId, {
+   title: DOMPurify.sanitize(parsed.data.title, { ALLOWED_TAGS: [] }),
+   context: DOMPurify.sanitize(parsed.data.context, { ALLOWED_TAGS: [] }),
+   question: DOMPurify.sanitize(parsed.data.question, { ALLOWED_TAGS: [] }),
    ...parsed.data,
  });
```

### P1-8: Invite code generation uses `Math.random()` — predictable
**File:** `server/postgres-storage.ts:70-76`, `server/storage.ts:157-164`
**Impact:** `Math.random()` is NOT cryptographically secure. With 32^6 ≈ 1B combinations, league/co-op codes can be brute-forced.
**Fix time:** S (15 min)

```diff
+ import { randomBytes } from "crypto";

  function generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
-   let code = "";
-   for (let i = 0; i < 6; i++) {
-     code += chars.charAt(Math.floor(Math.random() * chars.length));
-   }
+   const bytes = randomBytes(6);
+   let code = "";
+   for (let i = 0; i < 6; i++) {
+     code += chars.charAt(bytes[i] % chars.length);
+   }
    return code;
  }
```

### P1-9: Friend addition not atomic — one-way friendships possible
**File:** `server/postgres-storage.ts:438-473`
**Impact:** If second `UPDATE` fails (DB error, timeout), user A has user B as friend but not vice versa.
**Fix time:** M (1 hr)

```diff
  async addFriend(userId, friendId) {
+   return await db.transaction(async (tx) => {
      // Add B to A's list
      await tx.update(appSchema.lifestyleUsers)
        .set({ friendIds: sql`friend_ids || ${JSON.stringify([friendId])}::jsonb` })
        .where(eq(appSchema.lifestyleUsers.id, userId));
      // Add A to B's list
      await tx.update(appSchema.lifestyleUsers)
        .set({ friendIds: sql`friend_ids || ${JSON.stringify([userId])}::jsonb` })
        .where(eq(appSchema.lifestyleUsers.id, friendId));
+   });
  }
```

### P1-10: `saveUninitialized: true` in session config
**File:** `server/replit_integrations/auth/replitAuth.ts:44`
**Impact:** Creates a session row in PostgreSQL for EVERY visitor, even unauthenticated bots. At scale, sessions table bloats with millions of empty rows.
**Fix time:** S (5 min)

```diff
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
-   resave: true,
-   saveUninitialized: true,
+   resave: false,
+   saveUninitialized: false,
```

---

## 4) P2 Nice-to-Have

### P2-1: Logging — zero structured logging
**File:** `server/index.ts:28-37`
**Impact:** Can't search/filter logs, no request IDs, no user correlation, no error alerting integration.
**Fix:** Replace `console.log` with `pino` or `winston`. Add request ID middleware.
**Time:** M (2 hr)

### P2-2: Response body logged for ALL API calls
**File:** `server/index.ts:54-55`
**Impact:** Full JSON bodies logged including user data, scores, badges. At scale, generates GB of logs/day. Also potential PII leak.
**Fix:** Log only status + duration in production. Log bodies only on error.
**Time:** S (15 min)

### P2-3: `getAllUsersForAdmin()` loads all users unbounded
**File:** `server/postgres-storage.ts:2288-2301`
**Impact:** At 100K users, returns ~100MB. Server OOM likely.
**Fix:** Add pagination: `limit`, `offset`, `total` count.
**Time:** M (1 hr)

### P2-4: No `/api/health` endpoint
**Impact:** Load balancers can't determine if server is healthy. Replit autoscale can't make routing decisions.
**Fix time:** S (5 min)

```typescript
app.get("/api/health", async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "unhealthy" });
  }
});
```

### P2-5: Connection pool max=20 too low for concurrent load
**File:** `server/db.ts:17`
**Fix:** Increase to `max: 50` AND fix N+1 queries first. Monitor with `pg_stat_activity`.
**Time:** S (5 min)

### P2-6: Missing DB constraint — `CHECK (comment_count >= 0)`
**File:** `shared/models/db-schema.ts` — community_scenarios table
**Impact:** Concurrent vote/comment race conditions can drive counts negative.
**Time:** S (15 min migration)

### P2-7: Streak buyback double-use race condition
**File:** `server/postgres-storage.ts:1314-1348`
**Impact:** Two simultaneous requests can both bypass the `lastBuybackDate !== today` check.
**Fix:** Add `FOR UPDATE` lock or DB constraint.
**Time:** S (30 min)

### P2-8: Arcade play limit bypassable via concurrent requests
**File:** `server/postgres-storage.ts:2656-2675`
**Impact:** Two simultaneous requests both read `arcadePlaysToday: 0`, both allowed through.
**Fix:** Same — `FOR UPDATE` in transaction.
**Time:** S (30 min)

### P2-9: Missing composite indexes
**Tables affected:** `community_scenarios`, `coop_sessions`
**Missing indexes:**
- `(week_number, type)` on community_scenarios — for `getRealistOfWeek()` which does full scan
- `(status, created_at)` on coop_sessions — for cleanup queries
**Time:** S (15 min migration)

### P2-10: Timer doesn't pause when user switches tabs/apps
**File:** `client/src/pages/game.tsx:174-200`
**Impact:** User leaves app on iOS to check something, comes back to "Time's up!" — feels unfair.
**Fix:** Add `visibilitychange` event listener to pause/resume timer.
**Time:** S (30 min)

---

## 5) Non-Obvious Bugs & Edge Cases

### BUG-1: DST transition breaks "yesterday" calculation
**File:** `server/postgres-storage.ts:56-60`
```typescript
function getYesterdayDateString(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split("T")[0];
}
```
**Edge case:** At 2:30 AM during spring-forward DST, subtracting 24 hours yields 1:30 AM the same calendar day (UTC is fine, but if server ever moves off UTC, this breaks). Currently safe because Replit servers use UTC, but fragile.

### BUG-2: Midnight boundary — user plays at 23:59:59 UTC
**Scenario:** User starts game at 23:59, finishes at 00:01. `getTodayDateString()` returns next day. `lastPlayedDate` is set to tomorrow. User can't play "today" (which is tomorrow's actual date) because system thinks they already played.
**File:** `server/postgres-storage.ts:43-48` and `server/routes.ts:272`
**Fix:** Use the date from the daily drop itself (`submission.dropId` contains the date), not `now`.

### BUG-3: Username squatting via TOCTOU
**File:** `server/routes.ts:370-405`
Username availability check (`GET /api/check-username`) and update (`POST /api/update-profile`) are separate requests. Between check and update, another user could claim the name.
**Fix:** The DB has a unique index on username, so the update will fail — but the error message is generic ("Failed to update profile"), not "Username taken".

### BUG-4: Referral code self-application not checked in storage
**File:** `server/routes.ts:328-329` checks `referrer.id === sessionId`, but the storage layer `applyReferralBonus()` doesn't check. If routes are bypassed (future API), self-referral is possible.

### BUG-5: Co-op session stale after completion
**File:** `server/routes.ts:1657-1672`
After game completes, session status set to "completed" but WebSocket connections aren't force-closed. Clients might keep sending timer_sync messages to a dead session, wasting resources.

### BUG-6: `gameHistory` grows indefinitely in JSONB
**File:** `server/postgres-storage.ts:707`
```typescript
const newGameHistory = [...user.gameHistory, historyEntry].slice(-30);
```
This caps at 30 entries — but `user.gameHistory` is loaded from JSONB every submission. If the field gets corrupted (e.g., non-array), `...user.gameHistory` throws and kills the transaction.
**Fix:** Add `Array.isArray(user.gameHistory) ? user.gameHistory : []` guard.

### BUG-7: Service worker caches stale daily drop
**File:** `public/sw.js:39-53`
The SW caches `/api/daily-drop` responses. If user opens app offline, they see yesterday's drop. If they go online and play, the cached response is served first (network-first with cache fallback), but the cache isn't invalidated. Next offline visit shows stale data.

### BUG-8: League weekly score never updated from arcade games
**File:** `server/postgres-storage.ts:2062-2068`
Arcade game submission updates `user.totalScore` and `user.gamesPlayed` but `league_members.weeklyScore` is never updated. League leaderboards don't reflect arcade performance.

---

## 6) Security & Privacy Review (OWASP-style)

| # | OWASP Category | Status | Details |
|---|---------------|--------|---------|
| A01 | Broken Access Control | **FAIL** | `/api/add-freeze-token` open to all; co-op endpoints unauthed; WS userId spoofable |
| A02 | Cryptographic Failures | **WARN** | `Math.random()` for invite codes; weak session secret in dev |
| A03 | Injection | **PASS** | Drizzle ORM parameterizes all queries. Zod validates input shapes. One minor raw SQL concern in JSONB friend operations |
| A04 | Insecure Design | **WARN** | Membership upgrade has no payment verification — `POST /api/membership/upgrade` just sets the tier |
| A05 | Security Misconfiguration | **FAIL** | No helmet, no CSP, no CORS config, `saveUninitialized: true` |
| A06 | Vulnerable Components | **WARN** | Express 5.0.1 is pre-release. Check `npm audit` for known CVEs |
| A07 | Auth Failures | **WARN** | Token refresh works; session TTL 7 days; dev bypass exists (safe if env-gated) |
| A08 | Data Integrity Failures | **WARN** | No HMAC on client-submitted game answers; client could submit fabricated scores |
| A09 | Logging Failures | **FAIL** | No structured logging; response bodies logged with PII; no audit trail |
| A10 | SSRF | **PASS** | No URL fetching from user input |

### Privacy Concerns
- **PII exposure in logs:** `server/index.ts:55` logs full JSON response bodies including usernames, emails, scores
- **No data export endpoint:** GDPR Article 15 requires data portability
- **No data deletion endpoint:** GDPR Article 17 — right to erasure not implemented
- **PostHog analytics:** `VITE_POSTHOG_KEY` is in `.env` but PostHog is client-side. Ensure user consent for analytics tracking
- **Friend activity visible:** `GET /api/friends/activity` reveals when friends last played (minor privacy leak)

---

## 7) Performance & Efficiency Review

### Frontend

| Issue | File | Impact | Fix |
|-------|------|--------|-----|
| Mascot component not memoized | `components/mascot*.tsx` | Re-renders on every parent state change; heavy SVG | `React.memo()` + stable props |
| Sound system eagerly initialized | `hooks/use-sound.ts` | AudioContext created even if sounds disabled | Lazy-init on first `play()` |
| Game page eagerly loaded | `App.tsx:25` | ~800 LOC loaded on initial bundle | `lazy(() => import("./pages/game"))` |
| Timer uses `setInterval(100ms)` | `pages/game.tsx:177` | 10 callbacks/sec for simple countdown | Use `requestAnimationFrame` for display, `setTimeout` for logic |
| `staleTime: Infinity` | `lib/queryClient.ts:68` | Data never re-fetched; stale dashboards | Set to 5 min |
| `window.scrollTo(0,0)` jarring on mobile | `pages/game.tsx:212` | No smooth scroll | `{ behavior: 'smooth' }` |

### Backend

| Issue | File | Impact | Fix |
|-------|------|--------|-----|
| N+1 in `getUserLeagues` | `postgres-storage.ts:942` | 11+ queries/call | Single JOIN |
| N+1 in `getUserChallenges` | `postgres-storage.ts:1062` | 51+ queries/call | Single JOIN |
| 7x getUser in badge computation | `postgres-storage.ts:1285` | 14 queries/game submit | Batch into 2 |
| Vote query loads ALL user votes | `postgres-storage.ts:1509` | Full history scan | Add WHERE clause |
| League rank computed in JS | `postgres-storage.ts:840` | O(n log n) in Node | SQL `ROW_NUMBER()` |
| `getAllUsersForAdmin` unbounded | `postgres-storage.ts:2288` | 100K users = OOM | Add pagination |
| Missing index on `(week_number, type)` | `db-schema.ts` | Full scan for realist | Add composite index |
| Recompute badges on zero-progress | `postgres-storage.ts:1206` | Extra query per getBadges | Remove; rely on submit-time computation |

### Database

| Issue | Severity | Fix |
|-------|----------|-----|
| Pool max=20 | Medium | Increase to 50; add monitoring |
| No `statement_timeout` | Medium | Set to 30s per pool config |
| JSONB columns grow unbounded | Low | Separate `game_history` table |
| No query monitoring | Medium | Add `pg_stat_statements` |

---

## 8) UI/UX Gaps & Quick Wins

### Mobile Safari Issues
1. **Safe area bottom padding** — content can scroll behind the bottom nav on iPhone with home indicator. Fix: `padding-bottom: calc(4rem + env(safe-area-inset-bottom))` on main content area.
2. **`overflow-x-hidden` on home page** — already fixed in this session. Verify it doesn't clip interactive elements.
3. **Rubber-band scrolling during quiz** — `overscroll-behavior: contain` on quiz container to prevent pull-to-refresh during gameplay.

### Micro-interaction Gaps
1. **No haptic feedback on answer selection** — `use-haptic.ts` hook exists but isn't wired to quiz choice buttons.
2. **No button press animation on CTA** — "Play Daily Drop" button has no `active:scale-95` press state.
3. **Timer doesn't flash red in last 5 seconds** — just shows number counting down.
4. **No skeleton-to-content transition** — skeletons pop to content without fade.

### Empty States
1. **Community page empty state** — has one, but says "Someone will read this before their next purchase" which is confusing.
2. **Arcade replay** — no indication of which games the user has already completed.
3. **Challenge page with no friends** — should prompt to add friends, not just show empty list.

### Quick Wins
1. **Add `loading` attribute to mascot images** — prevent layout shift.
2. **Preload daily drop on home page mount** — `queryClient.prefetchQuery` for instant game start.
3. **Add pull-to-refresh on community feed** — component exists (`pull-to-refresh.tsx`) but not used on community page.

---

## 9) Scalability & Growth Gaps (0→10k users)

### Rate Limiting
- **Current:** In-memory per-process, non-distributed, no cleanup.
- **At 10K users:** Multiple Replit instances each have separate rate limit state. User can hit different instances to bypass limits.
- **Fix:** Redis-backed rate limiter (e.g., `rate-limiter-flexible` with Redis store).

### Caching
- **Current:** No caching layer. Every request hits PostgreSQL.
- **At 10K users:** Leaderboard queries (frequent) hammer the DB. Daily drop fetched on every page load.
- **Fix:** Redis cache for: leaderboard (TTL 60s), daily drop (TTL until midnight), user profile (TTL 30s on mutations).

### Pagination
- **Current:** Community scenarios have pagination (limit/offset). Leaderboard, challenges, friends do not.
- **At 10K users:** `getLeaderboard()` returns top 10 (hardcoded). `getUserChallenges()` returns ALL. `getFriends()` returns ALL.
- **Fix:** Add cursor-based pagination to challenges, friends, admin users.

### WebSocket Scaling
- **Current:** In-memory `coopConnections` Map. Single server only.
- **At 10K users:** Horizontal scaling means players might connect to different servers. Player A's WS on server 1, Player B on server 2 — messages never reach each other.
- **Fix:** Redis PubSub for WebSocket message brokering across instances.

### Background Jobs
- **Current:** None. All computation happens in request handlers.
- **Needed:**
  - Leaderboard aggregation (every 5 min)
  - Challenge expiration (daily cron)
  - Streak freeze auto-application (midnight cron)
  - Push notification scheduling
  - Session cleanup (expired co-op sessions)
- **Fix:** BullMQ with Redis, or simple `node-cron` for single-instance.

### Anti-Cheat
- **Current:** Client submits answers + timing. Server trusts everything.
- **Exploit:** Client can submit `{ answers: [...], score: 500 }` with perfect answers.
- **Fix:** Server should validate answers against the actual daily drop scenarios. Store scenario answer keys server-side and compute scores on submission, not trusting client-calculated scores.

### Feature Flags
- **Current:** None. All features live for all users.
- **Fix:** PostHog feature flags (already have PostHog SDK) or simple DB-backed flags.

---

## 10) Test Plan + Monitoring Plan + Release Checklist

### Regression Test Checklist

| # | Flow | Steps | Expected | Priority |
|---|------|-------|----------|----------|
| 1 | Sign up / Login | Click Login → Replit OAuth → Redirect back | User created in DB, session cookie set, home page loads | P0 |
| 2 | Session restore | Close tab → Reopen → Check `/api/user` | Returns user without re-login (within 7 days) | P0 |
| 3 | Daily drop playthrough | Home → Play → Answer 5 questions → Submit | Score calculated, streak updated, badges checked, results shown | P0 |
| 4 | Timer expiration | Start question → Wait 20s | Auto-submits wrong answer, moves to next question | P0 |
| 5 | Double submit | Click "Submit" rapidly twice | Only one submission accepted, idempotency key works | P0 |
| 6 | Results screen | Complete game → View results | Score, IQ, deep dive, share button, Cleo analysis all render | P1 |
| 7 | Cross-midnight play | Start game 23:58 UTC → Finish 00:01 UTC | Submission uses drop date, not current date | P0 |
| 8 | Co-op create + join | User A creates session → User B enters code → Both play | Both see same questions, answers sync via WS, results show both scores | P1 |
| 9 | Co-op disconnect | Mid-game, User B closes tab | User A sees "disconnected" status, game pauses or ends gracefully | P1 |
| 10 | Arcade play + limits | Play arcade → Exhaust free plays → Try again | "Limit reached" error, can replay old games but not unlock new | P1 |
| 11 | Invite friend + referral | Copy referral code → New user applies code | Both users get freeze token bonus, referralCount increments | P1 |
| 12 | Community submit + vote | Submit scenario → Another user upvotes → Check count | Vote count increments, user vote state tracked, no double-voting | P1 |
| 13 | Community comment + reply | Add comment → Reply to comment → Check thread | Comment count increments, reply nested under parent, both visible | P2 |
| 14 | Settings toggles | Toggle sound → Toggle low pressure mode → Reload | Settings persisted to DB, UI reflects on reload | P2 |
| 15 | Streak freeze | Have freeze token → Miss a day → Use freeze | Streak maintained, frozen date recorded, token decremented | P1 |
| 16 | Streak buyback | Lose streak → Use buyback within window | Streak restored, buyback marked as used for today | P1 |
| 17 | League create + join | Create league → Share code → Friend joins → Play | Both appear in league, scores update, weekly ranking works | P2 |
| 18 | Challenge friend | Create challenge → Friend accepts → Both play → Winner determined | Challenge status flows: pending→accepted→completed, winner shown | P2 |
| 19 | Admin ban user | Admin bans user → Banned user tries to access | Banned user gets error, admin sees in banned list | P2 |
| 20 | Push notification | Subscribe → Admin sends reminder → Check device | Notification appears with correct title/body | P3 |

### Monitoring Plan

| Metric | Tool | Alert Threshold |
|--------|------|-----------------|
| API response time p95 | PostHog / custom middleware | > 2s |
| API error rate | Custom logging + Sentry | > 5% of requests |
| DB connection pool usage | `pg_stat_activity` query | > 80% utilized |
| DB query duration p95 | `pg_stat_statements` | > 500ms |
| Memory usage | Process metrics | > 80% of container limit |
| WebSocket connection count | Custom counter | > 500 concurrent |
| Rate limit triggers | Custom counter per key | > 100/min (abuse signal) |
| Game submission success rate | Custom metric | < 95% |
| Auth failure rate | Custom metric | > 10/min |
| Service worker cache hit rate | SW analytics event | < 50% |

### Launch Blockers Checklist (P0 condensed)

- [ ] Fix `/api/add-freeze-token` — restrict to admin only
- [ ] Fix co-op endpoints — add `requireAuth` + participant checks
- [ ] Fix WebSocket auth — derive userId from session, not client message
- [ ] Add helmet + CSP + CORS headers
- [ ] Fix `submitGame()` row-level locking
- [ ] Remove fake `Math.random()` from active-players error handler
- [ ] Set strong `SESSION_SECRET` in production env
- [ ] Verify `.env` is NOT in git history
- [ ] Set `DEV_AUTH_BYPASS=false` in production
- [ ] Run `npm audit` and fix critical/high vulnerabilities
- [ ] Test all 5 P0 regression flows on mobile Safari
- [ ] Add error tracking (Sentry or equivalent)

### Release Checklist

**Pre-deploy:**
- [ ] `npm run build` passes
- [ ] `npm audit --production` has 0 critical/high
- [ ] All P0 fixes merged
- [ ] Environment variables set in Replit Secrets (not .env)
- [ ] `SESSION_SECRET` is 64+ char random hex
- [ ] `DEV_AUTH_BYPASS` is unset or `false`
- [ ] `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` generated and set
- [ ] Database migrations run: `npm run db:migrate`

**Post-deploy (first 24 hours):**
- [ ] Smoke test: login → play → results → leaderboard
- [ ] Verify HTTPS-only (no HTTP access)
- [ ] Verify CSP headers in browser DevTools → Network
- [ ] Check server logs for errors
- [ ] Monitor DB connection count
- [ ] Test push notifications
- [ ] Test co-op with two browsers
- [ ] Verify session persists across page reload

**Post-deploy (first week):**
- [ ] Monitor error rates
- [ ] Check for memory growth (rate limiter leak)
- [ ] Review slow query logs
- [ ] Check session table growth
- [ ] Test cross-midnight gameplay
- [ ] Load test with 100 concurrent users
