/**
 * Endpoint Catalog — All 70+ API endpoints with metadata
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface EndpointDef {
  method: HttpMethod;
  path: string;
  auth: boolean;          // requires authentication
  adminOnly?: boolean;    // requires admin/moderator
  rateLimit?: number;     // max requests per 60s window (undefined = no limit)
  description: string;
  tags: string[];
  /** If true, test should send a body */
  hasBody?: boolean;
  /** Sample body for POST/PATCH/DELETE */
  sampleBody?: Record<string, unknown>;
  /** Skip schema/reachability check (endpoint needs specific setup or is known flaky) */
  skipSchema?: boolean;
}

export const ENDPOINT_CATALOG: EndpointDef[] = [
  // ── User & Profile ────────────────────────────────────────
  { method: "GET",  path: "/api/user",               auth: false, description: "Get or create current user", tags: ["p1-core", "user"] },
  { method: "POST", path: "/api/profile",             auth: true,  rateLimit: 10, description: "Update user profile", tags: ["p6-settings", "user"], hasBody: true, sampleBody: { username: "TestBot", avatar: "cat" } },
  { method: "GET",  path: "/api/check-username/TestUnique123", auth: false, description: "Check username availability", tags: ["p6-settings", "user"] },
  { method: "GET",  path: "/api/search-user/TestBot",  auth: true, description: "Search user by username", tags: ["p2-social", "user"] },
  { method: "POST", path: "/api/set-mode",             auth: true, description: "Set game mode", tags: ["p6-settings", "user"], hasBody: true, sampleBody: { mode: "tech" } },
  { method: "GET",  path: "/api/active-players",       auth: false, description: "Active player count", tags: ["p1-core", "user"] },

  // ── Settings ──────────────────────────────────────────────
  { method: "POST", path: "/api/toggle-sound",         auth: true, description: "Toggle sound", tags: ["p6-settings"] },
  { method: "POST", path: "/api/low-pressure-mode",    auth: true, description: "Toggle low-pressure mode", tags: ["p6-settings"], hasBody: true, sampleBody: { enabled: true } },
  { method: "POST", path: "/api/notification-prefs",   auth: true, description: "Update notification prefs", tags: ["p6-settings"], hasBody: true, sampleBody: { dailyReminder: true, friendActivity: true, challenges: true, streakWarning: true } },
  { method: "POST", path: "/api/complete-onboarding",  auth: true, description: "Complete onboarding", tags: ["p6-settings"] },
  { method: "POST", path: "/api/toggle-plus",          auth: true, description: "Toggle Plus membership", tags: ["p6-settings"], hasBody: true, sampleBody: { isPlus: true } },

  // ── Data & Privacy ────────────────────────────────────────
  { method: "GET",    path: "/api/export-data",        auth: true, description: "Export user data (GDPR)", tags: ["p6-settings", "privacy"] },
  { method: "DELETE", path: "/api/account",            auth: true, description: "Delete account", tags: ["p6-settings", "privacy"] },

  // ── Daily Game ────────────────────────────────────────────
  { method: "GET",  path: "/api/daily-drop",           auth: false, description: "Get today's daily drop", tags: ["p1-core", "game"] },
  { method: "POST", path: "/api/submit-game",          auth: true, rateLimit: 5, description: "Submit daily game", tags: ["p1-core", "game"], hasBody: true, sampleBody: { dropId: "will-be-fetched", answers: [], score: 0, totalQuestions: 5 }, skipSchema: true },
  { method: "GET",  path: "/api/leaderboard",          auth: false, description: "Get leaderboard", tags: ["p1-core", "game"] },
  { method: "GET",  path: "/api/daily-stats",          auth: false, description: "Get daily statistics", tags: ["p1-core", "game"] },

  // ── Arcade ────────────────────────────────────────────────
  { method: "GET",  path: "/api/arcade-status",        auth: true, description: "Get arcade status", tags: ["p1-core", "arcade"] },
  { method: "GET",  path: "/api/arcade-drop",          auth: true, description: "Get arcade scenario", tags: ["p1-core", "arcade"] },
  { method: "POST", path: "/api/submit-arcade",        auth: true, rateLimit: 5, description: "Submit arcade game", tags: ["p1-core", "arcade"], hasBody: true, sampleBody: { arcadeDropId: "placeholder", answers: [], gameIndex: 0 } },

  // ── Social & Friends ──────────────────────────────────────
  { method: "GET",  path: "/api/friends",              auth: true, description: "Get friend list", tags: ["p2-social", "friends"] },
  { method: "GET",  path: "/api/friends/activity",     auth: true, description: "Get friend activity", tags: ["p2-social", "friends"] },
  { method: "POST", path: "/api/friends/add",          auth: true, rateLimit: 20, description: "Add friend", tags: ["p2-social", "friends"], hasBody: true, sampleBody: { friendId: "placeholder" } },

  // ── Challenges ────────────────────────────────────────────
  { method: "GET",  path: "/api/challenges",           auth: true, description: "Get user challenges", tags: ["p2-social", "challenges"] },
  { method: "POST", path: "/api/challenges",           auth: true, rateLimit: 10, description: "Create challenge", tags: ["p2-social", "challenges"], hasBody: true, sampleBody: { challengeeId: "placeholder", type: "money_health", trashTalk: "ready?" }, skipSchema: true },

  // ── Leagues ───────────────────────────────────────────────
  { method: "GET",  path: "/api/leagues",              auth: true, description: "Get user leagues", tags: ["p2-social", "leagues"] },
  { method: "POST", path: "/api/leagues",              auth: true, rateLimit: 5, description: "Create league", tags: ["p2-social", "leagues"], hasBody: true, sampleBody: { name: "Test League", emoji: "🏆", privacy: "private" } },
  { method: "POST", path: "/api/leagues/join",         auth: true, rateLimit: 10, description: "Join league", tags: ["p2-social", "leagues"], hasBody: true, sampleBody: { inviteCode: "PLACEHOLDER" } },

  // ── Streak Protection ─────────────────────────────────────
  { method: "GET",  path: "/api/streak-calendar",      auth: true, description: "Get streak calendar", tags: ["p7-streak", "streak"] },
  { method: "POST", path: "/api/use-freeze",           auth: true, rateLimit: 5, description: "Use streak freeze", tags: ["p7-streak", "streak"] },
  { method: "POST", path: "/api/streak-buyback",       auth: true, rateLimit: 3, description: "Buyback broken streak", tags: ["p7-streak", "streak"] },
  { method: "POST", path: "/api/late-pass",            auth: true, rateLimit: 3, description: "Use late pass", tags: ["p7-streak", "streak"] },

  // ── Community ─────────────────────────────────────────────
  { method: "GET",  path: "/api/community/scenarios",            auth: false, description: "Get community scenarios", tags: ["p3-community", "community"] },
  { method: "POST", path: "/api/community/scenarios",            auth: true, rateLimit: 5, description: "Create community scenario", tags: ["p3-community", "community"], hasBody: true, sampleBody: { title: "Test scenario", context: "Test context", question: "Test?", type: "hypothetical", category: "tech" } },
  { method: "GET",  path: "/api/community/top-creators",        auth: false, description: "Get top community creators", tags: ["p3-community", "community"] },
  { method: "GET",  path: "/api/community/realest-of-week",     auth: false, description: "Get realest of week", tags: ["p3-community", "community"] },

  // ── Co-op ─────────────────────────────────────────────────
  { method: "POST", path: "/api/coop/create",          auth: true, rateLimit: 5, description: "Create co-op session", tags: ["p4-coop", "coop"] },
  { method: "GET",  path: "/api/coop/pending-invites",  auth: true, description: "Get co-op pending invites", tags: ["p4-coop", "coop"] },
  { method: "POST", path: "/api/coop/join",            auth: true, rateLimit: 10, description: "Join co-op session", tags: ["p4-coop", "coop"], hasBody: true, sampleBody: { code: "PLACEHOLDER" } },

  // ── Survival ──────────────────────────────────────────────
  { method: "POST",   path: "/api/survival/queue",     auth: true, rateLimit: 10, description: "Join survival queue", tags: ["p5-survival", "survival"] },
  { method: "DELETE", path: "/api/survival/queue",      auth: true, description: "Leave survival queue", tags: ["p5-survival", "survival"] },
  { method: "POST",   path: "/api/survival/create",    auth: true, rateLimit: 5, description: "Create survival lobby", tags: ["p5-survival", "survival"] },

  // ── Badges ────────────────────────────────────────────────
  { method: "GET",  path: "/api/badges",               auth: true, description: "Get user badges", tags: ["p1-core", "badges"] },

  // ── Membership ────────────────────────────────────────────
  { method: "POST", path: "/api/membership/upgrade",   auth: true, description: "Upgrade membership tier", tags: ["p6-settings", "membership"], hasBody: true, sampleBody: { tier: "plus" } },
  { method: "POST", path: "/api/apply-referral",       auth: true, rateLimit: 5, description: "Apply referral code", tags: ["p2-social", "referral"], hasBody: true, sampleBody: { code: "PLACEHOLDER" } },

  // ── Push Notifications (VAPID not configured in dev — expect 503) ──
  { method: "GET",  path: "/api/push/vapid-key",       auth: false, description: "Get VAPID public key", tags: ["p6-settings", "push"], skipSchema: true },
  { method: "POST", path: "/api/push/subscribe",       auth: true, description: "Subscribe to push", tags: ["p6-settings", "push"], hasBody: true, sampleBody: { endpoint: "https://test.push", keys: { p256dh: "test", auth: "test" } }, skipSchema: true },
  { method: "POST", path: "/api/push/unsubscribe",     auth: true, description: "Unsubscribe from push", tags: ["p6-settings", "push"], hasBody: true, sampleBody: { endpoint: "https://test.push" }, skipSchema: true },

  // ── Admin ─────────────────────────────────────────────────
  { method: "GET",    path: "/api/admin/check",            auth: false, description: "Check admin status", tags: ["p8-admin", "admin"] },
  { method: "GET",    path: "/api/admin/users",            auth: true, adminOnly: true, description: "Get all users", tags: ["p8-admin", "admin"] },
  { method: "GET",    path: "/api/admin/moderators",       auth: true, adminOnly: true, description: "Get moderators", tags: ["p8-admin", "admin"] },
  { method: "POST",   path: "/api/admin/moderators",       auth: true, adminOnly: true, description: "Add moderator", tags: ["p8-admin", "admin"], hasBody: true, sampleBody: { userId: "placeholder" } },
  { method: "GET",    path: "/api/admin/banned",           auth: true, adminOnly: true, description: "Get banned users", tags: ["p8-admin", "admin"] },
  { method: "POST",   path: "/api/admin/ban",             auth: true, adminOnly: true, description: "Ban user", tags: ["p8-admin", "admin"], hasBody: true, sampleBody: { userId: "placeholder", reason: "test ban" } },
  { method: "GET",    path: "/api/admin/scenarios",        auth: true, adminOnly: true, description: "Get admin scenarios", tags: ["p8-admin", "admin"] },
  { method: "POST",   path: "/api/admin/scenarios",        auth: true, adminOnly: true, description: "Create admin scenario", tags: ["p8-admin", "admin"], hasBody: true },

  // ── Health (DB health check — may 503 if DB is slow) ──────
  { method: "GET", path: "/api/health",                auth: false, description: "Health check", tags: ["p1-core", "health"], skipSchema: true },
];

/** Get endpoints filtered by tags */
export function getEndpointsByTag(tag: string): EndpointDef[] {
  return ENDPOINT_CATALOG.filter((e) => e.tags.includes(tag));
}

/** Get only auth-required endpoints */
export function getAuthEndpoints(): EndpointDef[] {
  return ENDPOINT_CATALOG.filter((e) => e.auth);
}

/** Get rate-limited endpoints */
export function getRateLimitedEndpoints(): EndpointDef[] {
  return ENDPOINT_CATALOG.filter((e) => e.rateLimit !== undefined);
}
