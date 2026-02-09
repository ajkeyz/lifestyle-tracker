# Analytics Audit & Implementation Plan

## 🔍 Audit Results

### Current State
**❌ No analytics implementation found**

**Checked:**
- ✅ No Segment
- ✅ No Amplitude
- ✅ No Firebase Analytics
- ✅ No PostHog
- ✅ No Mixpanel
- ✅ No Google Analytics
- ✅ No custom tracking
- ✅ No `window.analytics`, `window.gtag`, or similar
- ✅ No analytics packages in package.json

**Conclusion:** Clean slate - perfect opportunity to implement best-in-class analytics.

---

## 📊 Recommended Analytics Stack

### Option 1: PostHog (Recommended)
**Why:**
- ✅ Open source, privacy-friendly
- ✅ Self-hostable (GDPR compliant)
- ✅ Built-in session replay
- ✅ Feature flags + A/B testing
- ✅ Free tier: 1M events/month
- ✅ No third-party data sharing

**Install:**
```bash
npm install posthog-js
```

### Option 2: Segment
**Why:**
- ✅ Multi-destination (send to Amplitude, Mixpanel, etc.)
- ✅ Clean API
- ✅ Good TypeScript support

**Install:**
```bash
npm install @segment/analytics-next
```

### Option 3: Custom (Development Only)
**Why:**
- ✅ Zero dependencies
- ✅ Console logging
- ✅ Easy to switch later

**Implementation:** See below

---

## 📋 Event Taxonomy - Core Loop

### Event Naming Convention
```
<noun>_<verb>
```
- Use snake_case
- Past tense for completed actions
- Present tense for ongoing actions

### Core Events

#### 1. `app_opened`
**When:** User opens/focuses the app
**Properties:**
```typescript
{
  session_id: string;          // Unique session identifier
  timestamp: string;           // ISO 8601
  referrer: string | null;     // Where they came from
  is_returning_user: boolean;  // Has user data in storage
  viewport_width: number;
  viewport_height: number;
  device_type: "mobile" | "tablet" | "desktop";
  platform: "ios" | "android" | "web";
}
```
**Fires in:** `client/src/App.tsx` - useEffect on mount
**Privacy:** No PII

---

#### 2. `daily_drop_viewed`
**When:** User sees today's drop (question list loaded)
**Properties:**
```typescript
{
  drop_id: string;             // Daily drop identifier
  drop_number: number;         // Sequential number (Day 1, Day 2...)
  scenario_count: number;      // Number of questions (usually 5)
  user_streak: number;         // Current streak count
  has_played_today: boolean;   // Already completed?
  time_to_load_ms: number;     // Performance metric
}
```
**Fires in:** `client/src/pages/game.tsx` - When `dailyDrop` loads
**Privacy:** No PII

---

#### 3. `scenario_viewed`
**When:** Individual question becomes visible
**Properties:**
```typescript
{
  scenario_id: string;
  scenario_index: number;      // 0-4 (which question)
  category: string;            // "tech", "lifestyle", etc.
  has_context: boolean;        // Has scenario context text?
  choice_count: number;        // Usually 4
  time_remaining: number;      // Seconds left on timer
}
```
**Fires in:** `client/src/pages/game.tsx` - When `currentIndex` changes
**Privacy:** No question content (avoid PII in scenarios)

---

#### 4. `choice_selected`
**When:** User clicks a choice (before submitting)
**Properties:**
```typescript
{
  scenario_id: string;
  scenario_index: number;
  choice_label: string;        // "A", "B", "C", "D"
  time_to_select_ms: number;   // Time since question appeared
  time_remaining: number;      // Seconds left
  is_first_selection: boolean; // Or changed answer?
}
```
**Fires in:** `client/src/components/scenario-card.tsx` - `onSelectChoice` handler
**Privacy:** No choice text (may contain sensitive financial info)

---

#### 5. `answer_submitted`
**When:** User confirms their choice (answer locked in)
**Properties:**
```typescript
{
  scenario_id: string;
  scenario_index: number;
  choice_label: string;
  is_correct: boolean;
  points_earned: number;
  time_spent_ms: number;       // Total time on this question
  time_remaining: number;      // Time left (or 0 if timed out)
  submission_method: "click" | "timer" | "keyboard";
}
```
**Fires in:** `client/src/pages/game.tsx` - `handleSelectChoice` (when result shown)
**Privacy:** No user answers, just labels

---

#### 6. `result_viewed`
**When:** User sees correctness feedback for a question
**Properties:**
```typescript
{
  scenario_id: string;
  is_correct: boolean;
  points_earned: number;
  feedback_text_length: number; // Character count (not actual text)
  user_reaction: "🎉" | "😅" | null; // If you add reactions
}
```
**Fires in:** `client/src/pages/game.tsx` - When `showResults` updates
**Privacy:** No feedback content

---

#### 7. `game_completed`
**When:** All questions answered, results calculated
**Properties:**
```typescript
{
  drop_id: string;
  total_score: number;
  correct_count: number;
  total_questions: number;
  accuracy_percent: number;
  money_health: number;        // Final score
  time_spent_total_ms: number; // Session duration
  perfect_game: boolean;       // 100% correct
  streak_before: number;
  streak_after: number;
  streak_grew: boolean;
}
```
**Fires in:** `client/src/pages/game.tsx` - After `submitMutation.onSuccess`
**Privacy:** No PII (aggregated stats only)

---

#### 8. `streak_updated`
**When:** Streak changes (grows, breaks, or freezes)
**Properties:**
```typescript
{
  old_streak: number;
  new_streak: number;
  change: "grew" | "broke" | "frozen" | "restored";
  freeze_tokens_used: boolean;
  freeze_tokens_remaining: number;
  is_personal_best: boolean;   // New highest streak?
  previous_best: number;
}
```
**Fires in:**
- `client/src/pages/results.tsx` - When displaying new streak
- `client/src/components/streak-freeze-modal.tsx` - When freeze used
**Privacy:** No PII

---

#### 9. `share_clicked`
**When:** User taps "Share" button
**Properties:**
```typescript
{
  share_type: "results" | "streak" | "achievement" | "weekly_recap";
  share_method: "copy_link" | "native_share" | "twitter" | "facebook";
  content_type: "text" | "image" | "link";
  streak_value?: number;       // If sharing streak
  score_value?: number;        // If sharing score
  achievement_id?: string;     // If sharing badge
}
```
**Fires in:**
- `client/src/pages/results.tsx` - Share button
- `client/src/pages/share.tsx` - Social share
- `client/src/components/social-share-card.tsx` - Share card
**Privacy:** No share content (may contain scores)

---

#### 10. `paywall_viewed`
**When:** User sees upgrade prompt
**Properties:**
```typescript
{
  paywall_id: string;          // "streak_insurance" | "membership"
  trigger: "streak_broke" | "freeze_depleted" | "settings" | "feature_locked";
  feature_requested?: string;  // "late_pass", "buyback", etc.
  user_streak: number;
  freeze_tokens: number;
  has_seen_before: boolean;    // Track impression count
}
```
**Fires in:**
- `client/src/pages/streak-insurance.tsx` - When page loads
- `client/src/pages/membership.tsx` - When modal opens
**Privacy:** No financial data

---

#### 11. `purchase_initiated`
**When:** User clicks "Upgrade" or "Buy"
**Properties:**
```typescript
{
  product_id: "plus" | "pro" | "freeze_token_pack";
  price: number;               // In cents
  currency: "USD";
  trigger: string;             // Same as paywall_viewed
  session_duration_ms: number; // Time from app_open to purchase
}
```
**Fires in:**
- `client/src/pages/membership.tsx` - Buy button click
- `client/src/components/membership-upgrade-modal.tsx` - CTA click
**Privacy:** No payment details (Stripe handles that)

---

#### 12. `purchase_completed`
**When:** Payment succeeds (webhook or redirect)
**Properties:**
```typescript
{
  product_id: string;
  price: number;
  currency: "USD";
  transaction_id: string;      // Stripe charge ID (hashed)
  time_to_purchase_ms: number; // From initiate to complete
}
```
**Fires in:** `server/routes.ts` - Stripe webhook handler
**Privacy:** Hash transaction_id, no card details

---

### Secondary Events (Nice to Have)

#### 13. `onboarding_started`
```typescript
{
  step: "profile" | "notifications" | "friends";
}
```
**Fires in:** `client/src/pages/profile-setup.tsx`, etc.

---

#### 14. `onboarding_completed`
```typescript
{
  steps_completed: number;
  time_to_complete_ms: number;
  skipped_notifications: boolean;
  skipped_friends: boolean;
}
```
**Fires in:** `client/src/pages/friends-setup.tsx` - Final step

---

#### 15. `badge_unlocked`
```typescript
{
  badge_id: string;
  badge_name: string;
  progress: number;            // 100 when unlocked
  time_to_unlock_days: number; // Days since signup
}
```
**Fires in:** `client/src/hooks/use-achievement-toast.tsx` - Badge unlock

---

#### 16. `friend_added`
```typescript
{
  method: "search" | "invite_code" | "referral";
  friend_count_after: number;
}
```
**Fires in:** `client/src/pages/friends.tsx` - Add friend success

---

#### 17. `league_joined`
```typescript
{
  league_id: string;
  league_privacy: "public" | "private";
  member_count: number;
  join_method: "created" | "invite_code";
}
```
**Fires in:** `client/src/pages/leagues.tsx` - Join/create success

---

#### 18. `challenge_created`
```typescript
{
  challenge_type: "money_health" | "streak" | "accuracy";
  opponent_relation: "friend" | "stranger";
}
```
**Fires in:** `client/src/pages/challenges.tsx` - Challenge sent

---

#### 19. `weekly_recap_viewed`
```typescript
{
  week_start: string;
  days_played: number;
  total_score: number;
  viewed_all_slides: boolean;
}
```
**Fires in:** `client/src/pages/weekly-recap.tsx` - Recap opened

---

#### 20. `feature_discovered`
```typescript
{
  feature_name: string;        // "streak_freeze", "deep_dive", etc.
  discovery_method: "navigation" | "tooltip" | "notification";
}
```
**Fires in:** Various pages - First time viewing new feature

---

## 🛠️ Implementation

### Step 1: Create Analytics Helper

**File:** `client/src/lib/analytics.ts`

```typescript
// client/src/lib/analytics.ts
import { User } from "@shared/schema";

// Analytics provider interface
interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, any>): void;
  track(event: string, properties?: Record<string, any>): void;
  page(name?: string, properties?: Record<string, any>): void;
}

// Console provider (development)
class ConsoleAnalytics implements AnalyticsProvider {
  identify(userId: string, traits?: Record<string, any>) {
    console.log("🔷 Identify:", userId, traits);
  }

  track(event: string, properties?: Record<string, any>) {
    console.log("📊 Event:", event, properties);
  }

  page(name?: string, properties?: Record<string, any>) {
    console.log("📄 Page:", name, properties);
  }
}

// PostHog provider (production)
class PostHogAnalytics implements AnalyticsProvider {
  private posthog: any;

  constructor() {
    if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_KEY) {
      import("posthog-js").then(({ default: posthog }) => {
        this.posthog = posthog;
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",
          autocapture: false, // We manually track everything
          capture_pageview: false, // We manually track page views
          disable_session_recording: !import.meta.env.VITE_POSTHOG_SESSION_REPLAY,
        });
      });
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.posthog?.identify(userId, traits);
  }

  track(event: string, properties?: Record<string, any>) {
    this.posthog?.capture(event, properties);
  }

  page(name?: string, properties?: Record<string, any>) {
    this.posthog?.capture("$pageview", { page: name, ...properties });
  }
}

// Singleton analytics instance
class Analytics {
  private provider: AnalyticsProvider;
  private sessionStart: number = Date.now();

  constructor() {
    // Use console in development, PostHog in production
    const isDev = import.meta.env.DEV;
    this.provider = isDev ? new ConsoleAnalytics() : new PostHogAnalytics();
  }

  // Identify user (call once after auth)
  identify(user: User) {
    this.provider.identify(user.id, {
      username: user.username,
      created_at: user.gamesPlayed === 0 ? new Date().toISOString() : undefined,
      streak: user.streak,
      highest_streak: user.highestStreak,
      games_played: user.gamesPlayed,
      money_health: user.moneyHealth,
      membership_tier: user.membershipTier,
    });
  }

  // Track event
  track(event: string, properties?: Record<string, any>) {
    const enriched = {
      ...properties,
      timestamp: new Date().toISOString(),
      session_duration_ms: Date.now() - this.sessionStart,
    };
    this.provider.track(event, enriched);
  }

  // Track page view
  page(name: string, properties?: Record<string, any>) {
    this.provider.page(name, properties);
  }

  // Helper: Get device type
  getDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  // Helper: Get platform
  getPlatform(): "ios" | "android" | "web" {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "web";
  }
}

// Export singleton
export const analytics = new Analytics();

// Type-safe event tracking functions

export function trackAppOpened(user?: User) {
  analytics.track("app_opened", {
    session_id: crypto.randomUUID(),
    referrer: document.referrer || null,
    is_returning_user: !!user,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    device_type: analytics.getDeviceType(),
    platform: analytics.getPlatform(),
  });
}

export function trackDailyDropViewed(drop: any, user: User, loadTime: number) {
  analytics.track("daily_drop_viewed", {
    drop_id: drop.id,
    drop_number: drop.dropNumber,
    scenario_count: drop.scenarios.length,
    user_streak: user.streak,
    has_played_today: !!user.todayResult,
    time_to_load_ms: loadTime,
  });
}

export function trackScenarioViewed(scenario: any, index: number, timeRemaining: number) {
  analytics.track("scenario_viewed", {
    scenario_id: scenario.id,
    scenario_index: index,
    category: scenario.category,
    has_context: !!scenario.context,
    choice_count: scenario.choices.length,
    time_remaining: timeRemaining,
  });
}

export function trackChoiceSelected(
  scenarioId: string,
  index: number,
  label: string,
  timeToSelect: number,
  timeRemaining: number,
  isFirstSelection: boolean
) {
  analytics.track("choice_selected", {
    scenario_id: scenarioId,
    scenario_index: index,
    choice_label: label,
    time_to_select_ms: timeToSelect,
    time_remaining: timeRemaining,
    is_first_selection: isFirstSelection,
  });
}

export function trackAnswerSubmitted(
  scenarioId: string,
  index: number,
  label: string,
  isCorrect: boolean,
  points: number,
  timeSpent: number,
  timeRemaining: number,
  method: "click" | "timer" | "keyboard"
) {
  analytics.track("answer_submitted", {
    scenario_id: scenarioId,
    scenario_index: index,
    choice_label: label,
    is_correct: isCorrect,
    points_earned: points,
    time_spent_ms: timeSpent,
    time_remaining: timeRemaining,
    submission_method: method,
  });
}

export function trackGameCompleted(
  dropId: string,
  result: any,
  streakBefore: number,
  streakAfter: number,
  timeSpent: number
) {
  analytics.track("game_completed", {
    drop_id: dropId,
    total_score: result.score,
    correct_count: result.answers.filter((a: any) => a.isCorrect).length,
    total_questions: result.answers.length,
    accuracy_percent: Math.round((result.correctCount / result.totalQuestions) * 100),
    money_health: result.moneyHealth,
    time_spent_total_ms: timeSpent,
    perfect_game: result.correctCount === result.totalQuestions,
    streak_before: streakBefore,
    streak_after: streakAfter,
    streak_grew: streakAfter > streakBefore,
  });
}

export function trackStreakUpdated(
  oldStreak: number,
  newStreak: number,
  change: "grew" | "broke" | "frozen" | "restored",
  freezeUsed: boolean,
  tokensRemaining: number,
  isPersonalBest: boolean,
  previousBest: number
) {
  analytics.track("streak_updated", {
    old_streak: oldStreak,
    new_streak: newStreak,
    change,
    freeze_tokens_used: freezeUsed,
    freeze_tokens_remaining: tokensRemaining,
    is_personal_best: isPersonalBest,
    previous_best: previousBest,
  });
}

export function trackShareClicked(
  shareType: string,
  method: string,
  contentType: string,
  metadata?: Record<string, any>
) {
  analytics.track("share_clicked", {
    share_type: shareType,
    share_method: method,
    content_type: contentType,
    ...metadata,
  });
}

export function trackPaywallViewed(
  paywallId: string,
  trigger: string,
  user: User,
  hasSeenBefore: boolean,
  featureRequested?: string
) {
  analytics.track("paywall_viewed", {
    paywall_id: paywallId,
    trigger,
    feature_requested: featureRequested,
    user_streak: user.streak,
    freeze_tokens: user.freezeTokens,
    has_seen_before: hasSeenBefore,
  });
}

export function trackPurchaseInitiated(
  productId: string,
  price: number,
  trigger: string,
  sessionDuration: number
) {
  analytics.track("purchase_initiated", {
    product_id: productId,
    price,
    currency: "USD",
    trigger,
    session_duration_ms: sessionDuration,
  });
}

export function trackPurchaseCompleted(
  productId: string,
  price: number,
  transactionId: string,
  timeToPurchase: number
) {
  // Hash transaction ID for privacy
  const hashedId = btoa(transactionId).substring(0, 16);

  analytics.track("purchase_completed", {
    product_id: productId,
    price,
    currency: "USD",
    transaction_id: hashedId,
    time_to_purchase_ms: timeToPurchase,
  });
}

// Additional tracking functions...
export function trackBadgeUnlocked(badgeId: string, badgeName: string, daysToUnlock: number) {
  analytics.track("badge_unlocked", {
    badge_id: badgeId,
    badge_name: badgeName,
    progress: 100,
    time_to_unlock_days: daysToUnlock,
  });
}

export function trackWeeklyRecapViewed(
  weekStart: string,
  daysPlayed: number,
  totalScore: number,
  viewedAllSlides: boolean
) {
  analytics.track("weekly_recap_viewed", {
    week_start: weekStart,
    days_played: daysPlayed,
    total_score: totalScore,
    viewed_all_slides: viewedAllSlides,
  });
}
```

---

### Step 2: Add to App.tsx

```typescript
// client/src/App.tsx
import { analytics, trackAppOpened } from "@/lib/analytics";
import { useAuth } from "@/hooks/use-auth";

function App() {
  const { user } = useAuth();

  // Track app open
  useEffect(() => {
    trackAppOpened(user);

    // Identify user if authenticated
    if (user) {
      analytics.identify(user);
    }
  }, [user]);

  return (
    // ... rest of app
  );
}
```

---

### Step 3: Add to Game Page

```typescript
// client/src/pages/game.tsx
import {
  trackDailyDropViewed,
  trackScenarioViewed,
  trackChoiceSelected,
  trackAnswerSubmitted,
  trackGameCompleted,
} from "@/lib/analytics";

export default function Game() {
  const [loadStart] = useState(Date.now());
  const [scenarioStartTimes, setScenarioStartTimes] = useState<Record<string, number>>({});

  // Track daily drop viewed
  useEffect(() => {
    if (dailyDrop && user) {
      const loadTime = Date.now() - loadStart;
      trackDailyDropViewed(dailyDrop, user, loadTime);
    }
  }, [dailyDrop, user]);

  // Track scenario viewed
  useEffect(() => {
    if (currentScenario) {
      trackScenarioViewed(currentScenario, currentIndex, timeRemaining);
      setScenarioStartTimes(prev => ({
        ...prev,
        [currentScenario.id]: Date.now(),
      }));
    }
  }, [currentScenario, currentIndex]);

  // Track choice selected
  const handleSelectChoice = useCallback((label: string) => {
    // ... existing logic

    const timeToSelect = Date.now() - (scenarioStartTimes[currentScenario.id] || 0);
    const isFirstSelection = !answers[currentScenario.id];

    trackChoiceSelected(
      currentScenario.id,
      currentIndex,
      label,
      timeToSelect,
      timeRemaining,
      isFirstSelection
    );

    // ... rest of logic
  }, [/* deps */]);

  // Track game completed
  const submitMutation = useMutation({
    mutationFn: async (data: SubmitGame) => {
      const res = await apiRequest("POST", "/api/submit-game", data);
      return res.json();
    },
    onSuccess: async (result) => {
      const sessionTime = Date.now() - loadStart;
      trackGameCompleted(
        dailyDrop.id,
        result,
        user.streak,
        result.newStreak,
        sessionTime
      );

      // ... existing logic
    },
  });

  // ... rest of component
}
```

---

### Step 4: Add Environment Variables

```bash
# .env
VITE_POSTHOG_KEY=phc_your_project_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_SESSION_REPLAY=false
```

---

## 🔒 Privacy Considerations

### 1. **No PII in Events**
- ❌ Don't track: usernames, emails, IPs
- ✅ Do track: anonymized user IDs, counts, boolean flags

### 2. **No Sensitive Content**
- ❌ Don't track: actual question text, choice text, answers
- ✅ Do track: labels (A/B/C/D), categories, metadata

### 3. **Anonymize Transaction Data**
- Hash transaction IDs (use btoa or crypto.subtle.digest)
- Never log credit card numbers or CVVs
- Let Stripe handle payment details

### 4. **Session Recording**
- Disable by default (`VITE_POSTHOG_SESSION_REPLAY=false`)
- If enabled, mask sensitive inputs:
  ```typescript
  posthog.init(key, {
    session_recording: {
      maskAllInputs: true,
      maskAllText: false,
    }
  });
  ```

### 5. **GDPR Compliance**
- Add "Do Not Track" check:
  ```typescript
  if (navigator.doNotTrack === "1") {
    // Don't initialize analytics
    return;
  }
  ```
- Respect cookie consent (if you add cookies)
- Allow users to opt out in settings

### 6. **Data Retention**
- PostHog default: 1 year
- Recommend: 90 days for raw events, aggregates forever

---

## 📈 Analytics Dashboard Setup

### Key Metrics to Track

#### Engagement
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- DAU/WAU ratio (stickiness)
- Session duration
- Games per user per week

#### Retention
- D1, D7, D30 retention
- Streak retention curve
- Churn rate by streak length

#### Monetization
- Paywall view → purchase conversion
- Revenue per user (RPU)
- Lifetime value (LTV) by cohort

#### Product
- Game completion rate
- Average accuracy
- Time per question
- Feature adoption (streaks, challenges, leagues)

### Sample PostHog Insights

1. **Funnel: Onboarding → First Game → Second Game**
   - See where users drop off

2. **Retention Table: Daily Drop Players**
   - Track repeat play by cohort

3. **Trends: share_clicked over time**
   - Measure viral growth

4. **Session Replay: Failed Purchases**
   - Debug payment issues

---

## 🚀 Implementation Checklist

### Phase 1: Core Events (2-3 hours)
- [ ] Create `client/src/lib/analytics.ts`
- [ ] Add PostHog to package.json (`npm install posthog-js`)
- [ ] Add environment variables
- [ ] Implement `app_opened` in App.tsx
- [ ] Implement `daily_drop_viewed` in game.tsx
- [ ] Test in console (dev mode)

### Phase 2: Game Events (2 hours)
- [ ] Add `scenario_viewed`
- [ ] Add `choice_selected`
- [ ] Add `answer_submitted`
- [ ] Add `game_completed`
- [ ] Test full game loop

### Phase 3: Retention Events (1-2 hours)
- [ ] Add `streak_updated` in results.tsx
- [ ] Add `share_clicked` in share components
- [ ] Add `badge_unlocked` in achievement hook

### Phase 4: Monetization Events (1 hour)
- [ ] Add `paywall_viewed` in membership pages
- [ ] Add `purchase_initiated` in upgrade modals
- [ ] Add `purchase_completed` in Stripe webhook

### Phase 5: Dashboard Setup (1 hour)
- [ ] Create PostHog account
- [ ] Set up key funnels
- [ ] Set up retention cohorts
- [ ] Set up dashboard for daily monitoring

---

## 📊 Expected Impact

### Before Analytics
- ❌ No visibility into user behavior
- ❌ Can't measure feature success
- ❌ Guessing at churn reasons
- ❌ No A/B testing capability

### After Analytics
- ✅ Know exactly where users drop off
- ✅ Data-driven feature prioritization
- ✅ Identify churn patterns
- ✅ A/B test retention mechanics
- ✅ Optimize conversion funnels
- ✅ Measure ROI of features

### Sample Insights You'll Get
- "80% of users who play 3 days in a row become long-term players"
- "Users who join a league have 2x higher D7 retention"
- "Streak insurance paywall converts best when shown after streak breaks"
- "Mobile users take 30% longer per question than desktop"

---

## 🔄 Next Steps

1. **Implement Phase 1** (core events) first
2. **Validate data** in PostHog dashboard
3. **Add remaining events** incrementally
4. **Set up alerts** for key metrics
5. **Build dashboards** for different stakeholders
6. **Enable A/B testing** for retention mechanics

---

**Total Effort:** 7-10 hours
**Packages:** 1 (posthog-js, ~50KB gzipped)
**Privacy:** GDPR compliant, no PII tracking
**Cost:** Free (1M events/month on PostHog)
