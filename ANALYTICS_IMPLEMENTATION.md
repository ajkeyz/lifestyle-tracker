# Analytics Implementation Guide

## 🎯 Quick Reference: Where Events Fire

| Event | File | Location | Lines to Add |
|-------|------|----------|--------------|
| `app_opened` | `client/src/App.tsx` | useEffect on mount | 3 |
| `daily_drop_viewed` | `client/src/pages/game.tsx` | When drop loads | 4 |
| `scenario_viewed` | `client/src/pages/game.tsx` | When index changes | 3 |
| `choice_selected` | `client/src/pages/game.tsx` | handleSelectChoice | 7 |
| `answer_submitted` | `client/src/pages/game.tsx` | When result shows | 6 |
| `game_completed` | `client/src/pages/game.tsx` | submitMutation.onSuccess | 5 |
| `streak_updated` | `client/src/pages/results.tsx` | When displaying streak | 4 |
| `share_clicked` | `client/src/pages/results.tsx` | Share button | 2 |
| `paywall_viewed` | `client/src/pages/membership.tsx` | Page load | 3 |
| `purchase_initiated` | `client/src/pages/membership.tsx` | Buy button | 2 |

**Total:** ~40 lines of code across 4 files

---

## 📝 Step-by-Step Implementation

### Step 1: Install PostHog

```bash
npm install posthog-js
```

### Step 2: Add Environment Variables

Create or update `.env`:

```bash
# Analytics (PostHog)
VITE_POSTHOG_KEY=phc_your_project_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_SESSION_REPLAY=false
```

**Get your key:**
1. Sign up at https://posthog.com
2. Create a new project
3. Copy the project API key (starts with `phc_`)

### Step 3: Update App.tsx

**File:** `client/src/App.tsx`

**Add imports:**
```typescript
import { analytics, trackAppOpened } from "@/lib/analytics";
```

**Add tracking in App component:**
```typescript
function App() {
  const { user, isLoading } = useAuth();

  // Track app open and identify user
  useEffect(() => {
    trackAppOpened(user);

    if (user) {
      analytics.identify(user);
    }
  }, [user]);

  // ... rest of component
}
```

**Full diff:**
```diff
 import { queryClient } from "./lib/queryClient";
 import { QueryClientProvider } from "@tanstack/react-query";
+import { analytics, trackAppOpened } from "@/lib/analytics";

 function App() {
   const { user, isLoading } = useAuth();
+
+  // Track app open and identify user
+  useEffect(() => {
+    trackAppOpened(user);
+    if (user) {
+      analytics.identify(user);
+    }
+  }, [user]);

   return (
     // ... rest of component
```

---

### Step 4: Update Game Page

**File:** `client/src/pages/game.tsx`

**Add imports:**
```typescript
import {
  trackDailyDropViewed,
  trackScenarioViewed,
  trackChoiceSelected,
  trackAnswerSubmitted,
  trackGameCompleted,
} from "@/lib/analytics";
```

**Add state for timing:**
```typescript
export default function Game() {
  const [loadStart] = useState(Date.now());
  const [scenarioStartTimes, setScenarioStartTimes] = useState<Record<string, number>>({});

  // ... existing state
```

**Track daily drop viewed:**
```typescript
// Add after dailyDrop query
useEffect(() => {
  if (dailyDrop && user) {
    const loadTime = Date.now() - loadStart;
    trackDailyDropViewed(dailyDrop, user, loadTime);
  }
}, [dailyDrop, user]);
```

**Track scenario viewed:**
```typescript
// Add after currentScenario changes
useEffect(() => {
  if (currentScenario) {
    trackScenarioViewed(currentScenario, currentIndex, timeRemaining);
    setScenarioStartTimes(prev => ({
      ...prev,
      [currentScenario.id]: Date.now(),
    }));
  }
}, [currentScenario, currentIndex]);
```

**Track choice selected:**
```typescript
const handleSelectChoice = useCallback((label: string) => {
  if (!currentScenario || showResults[currentScenario.id]) return;

  // Get timing info
  const timeToSelect = Date.now() - (scenarioStartTimes[currentScenario.id] || 0);
  const isFirstSelection = !answers[currentScenario.id];

  // Track analytics
  trackChoiceSelected(
    currentScenario.id,
    currentIndex,
    label,
    timeToSelect,
    timeRemaining,
    isFirstSelection
  );

  // Existing logic for sounds, confetti, etc.
  const choice = currentScenario.choices.find((c) => c.label === label);
  if (choice?.isCorrect) {
    play("correct");
    vibrateSuccess();
    fireMiniCorrect();
  } else {
    play("incorrect");
    vibrateError();
  }

  setAnswers((prev) => ({ ...prev, [currentScenario.id]: label }));
  setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
  setTimerRunning(false);

  // Track answer submission
  const timeSpent = Date.now() - (scenarioStartTimes[currentScenario.id] || 0);
  trackAnswerSubmitted(
    currentScenario.id,
    currentIndex,
    label,
    choice?.isCorrect || false,
    choice?.points || 0,
    timeSpent,
    timeRemaining,
    "click" // TODO: Add keyboard detection
  );
}, [currentScenario, showResults, answers, currentIndex, timeRemaining, /* ... */]);
```

**Track game completion:**
```typescript
const submitMutation = useMutation({
  mutationFn: async (data: SubmitGame) => {
    const res = await apiRequest("POST", "/api/submit-game", data);
    return res.json();
  },
  onSuccess: async (result) => {
    // Track completion
    const sessionTime = Date.now() - loadStart;
    const streakBefore = user?.streak || 0;
    const streakAfter = result.streak || streakBefore + 1;

    trackGameCompleted(
      dailyDrop!.id,
      result,
      streakBefore,
      streakAfter,
      sessionTime
    );

    // Existing logic
    await queryClient.refetchQueries({ queryKey: ["/api/user"] });
    queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    navigate("/results");
  },
  // ... onError
});
```

**Full diff for game.tsx:**
```diff
 import { useToast } from "@/hooks/use-toast";
 import { useSound } from "@/hooks/use-sound";
 import { useHaptic } from "@/hooks/use-haptic";
+import {
+  trackDailyDropViewed,
+  trackScenarioViewed,
+  trackChoiceSelected,
+  trackAnswerSubmitted,
+  trackGameCompleted,
+} from "@/lib/analytics";

 export default function Game() {
   const [, navigate] = useLocation();
   const { toast } = useToast();
+  const [loadStart] = useState(Date.now());
+  const [scenarioStartTimes, setScenarioStartTimes] = useState<Record<string, number>>({});

   // ... existing state

+  // Track daily drop viewed
+  useEffect(() => {
+    if (dailyDrop && user) {
+      const loadTime = Date.now() - loadStart;
+      trackDailyDropViewed(dailyDrop, user, loadTime);
+    }
+  }, [dailyDrop, user]);
+
+  // Track scenario viewed
+  useEffect(() => {
+    if (currentScenario) {
+      trackScenarioViewed(currentScenario, currentIndex, timeRemaining);
+      setScenarioStartTimes(prev => ({
+        ...prev,
+        [currentScenario.id]: Date.now(),
+      }));
+    }
+  }, [currentScenario, currentIndex]);

   const handleSelectChoice = useCallback((label: string) => {
     if (!currentScenario || showResults[currentScenario.id]) return;

+    const timeToSelect = Date.now() - (scenarioStartTimes[currentScenario.id] || 0);
+    const isFirstSelection = !answers[currentScenario.id];
+
+    trackChoiceSelected(
+      currentScenario.id,
+      currentIndex,
+      label,
+      timeToSelect,
+      timeRemaining,
+      isFirstSelection
+    );
+
     const choice = currentScenario.choices.find((c) => c.label === label);
     // ... existing logic

     setAnswers((prev) => ({ ...prev, [currentScenario.id]: label }));
     setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
     setTimerRunning(false);
+
+    const timeSpent = Date.now() - (scenarioStartTimes[currentScenario.id] || 0);
+    trackAnswerSubmitted(
+      currentScenario.id,
+      currentIndex,
+      label,
+      choice?.isCorrect || false,
+      choice?.points || 0,
+      timeSpent,
+      timeRemaining,
+      "click"
+    );
   }, [/* deps */]);

   const submitMutation = useMutation({
     mutationFn: async (data: SubmitGame) => {
       const res = await apiRequest("POST", "/api/submit-game", data);
       return res.json();
     },
     onSuccess: async (result) => {
+      const sessionTime = Date.now() - loadStart;
+      const streakBefore = user?.streak || 0;
+      const streakAfter = result.streak || streakBefore + 1;
+
+      trackGameCompleted(
+        dailyDrop!.id,
+        result,
+        streakBefore,
+        streakAfter,
+        sessionTime
+      );
+
       await queryClient.refetchQueries({ queryKey: ["/api/user"] });
       queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
       navigate("/results");
     },
   });
```

---

### Step 5: Update Results Page

**File:** `client/src/pages/results.tsx`

**Add imports:**
```typescript
import { trackStreakUpdated, trackShareClicked } from "@/lib/analytics";
```

**Track streak update:**
```typescript
// Add near where you display the new streak
useEffect(() => {
  if (user && user.todayResult) {
    const oldStreak = user.streak - 1; // Assuming streak just grew
    const newStreak = user.streak;

    if (newStreak > oldStreak) {
      trackStreakUpdated(
        oldStreak,
        newStreak,
        "grew",
        false, // No freeze used
        user.freezeTokens,
        newStreak > user.highestStreak,
        user.highestStreak
      );
    }
  }
}, [user]);
```

**Track share click:**
```typescript
const handleShare = async () => {
  trackShareClicked(
    "results",
    navigator.share ? "native_share" : "copy_link",
    "text",
    {
      score_value: user?.todayResult?.score,
      streak_value: user?.streak,
    }
  );

  // Existing share logic
  if (navigator.share) {
    await navigator.share({
      title: "My Lifestyle Creep Score",
      text: `I scored ${user?.todayResult?.score} on today's money challenge!`,
      url: window.location.href,
    });
  } else {
    // Copy to clipboard
    await navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied!" });
  }
};
```

---

### Step 6: Update Membership Page

**File:** `client/src/pages/membership.tsx`

**Add imports:**
```typescript
import { trackPaywallViewed, trackPurchaseInitiated } from "@/lib/analytics";
```

**Track paywall view:**
```typescript
export default function Membership() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    if (user && !hasTrackedView) {
      const hasSeenBefore = localStorage.getItem("paywall_membership_seen") === "true";

      trackPaywallViewed(
        "membership",
        "navigation", // Or detect from URL params
        user,
        hasSeenBefore
      );

      localStorage.setItem("paywall_membership_seen", "true");
      setHasTrackedView(true);
    }
  }, [user, hasTrackedView]);

  // ... rest of component
}
```

**Track purchase initiation:**
```typescript
const handleUpgrade = (tier: "plus" | "pro") => {
  const price = tier === "plus" ? 499 : 999; // Cents
  const sessionDuration = Date.now() - performance.timing.navigationStart;

  trackPurchaseInitiated(
    tier,
    price,
    "navigation", // Or store trigger in state
    sessionDuration
  );

  // Existing Stripe redirect logic
  window.location.href = `/api/create-checkout-session?tier=${tier}`;
};
```

---

### Step 7: Add Purchase Completion Tracking (Server-Side)

**File:** `server/routes.ts`

**Add to Stripe webhook handler:**

```typescript
import { trackPurchaseCompleted } from "../client/src/lib/analytics";

// In Stripe webhook handler
app.post("/api/stripe-webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Existing logic to update user tier
    // ...

    // Track completion
    const timeToPurchase = Date.now() - session.created * 1000;
    trackPurchaseCompleted(
      session.metadata.productId,
      session.amount_total,
      session.id,
      timeToPurchase
    );
  }

  res.json({ received: true });
});
```

**Note:** Server-side tracking requires PostHog Node SDK:
```bash
npm install posthog-node
```

Or simply log and sync later:
```typescript
console.log("PURCHASE_COMPLETED", {
  product_id: session.metadata.productId,
  amount: session.amount_total,
  transaction_id: session.id,
});
```

---

## 🧪 Testing

### Development Mode

Analytics logs to console by default in dev:

```bash
npm run dev
```

Open DevTools console and look for:
```
📊 Event: app_opened { is_returning_user: false, ... }
📊 Event: daily_drop_viewed { drop_number: 42, ... }
📊 Event: choice_selected { choice_label: "A", ... }
```

### Production Testing

1. Build the app:
```bash
npm run build
```

2. Set production env var:
```bash
export NODE_ENV=production
export VITE_POSTHOG_KEY=phc_test_key
```

3. Check PostHog dashboard:
   - Go to https://app.posthog.com/project/YOUR_PROJECT/events
   - You should see events appearing live

### Manual Test Checklist

- [ ] Open app → See `app_opened` event
- [ ] Start game → See `daily_drop_viewed` event
- [ ] Click choice → See `choice_selected` event
- [ ] Lock in answer → See `answer_submitted` event
- [ ] Complete game → See `game_completed` event
- [ ] View results → See `streak_updated` event
- [ ] Click share → See `share_clicked` event
- [ ] View membership → See `paywall_viewed` event
- [ ] Click upgrade → See `purchase_initiated` event

---

## 📊 PostHog Dashboard Setup

### 1. Create Key Insights

#### Funnel: User Activation
1. Go to Insights → New Insight → Funnel
2. Add steps:
   - `app_opened`
   - `daily_drop_viewed`
   - `game_completed`
   - `share_clicked`
3. Save as "User Activation Funnel"

#### Trend: Daily Active Users
1. Insights → New Insight → Trend
2. Event: `app_opened`
3. Group by: `day`
4. Filter: `is_returning_user = true`
5. Save as "Daily Active Users"

#### Retention: Game Completion
1. Insights → New Insight → Retention
2. Starting event: `game_completed`
3. Returning event: `game_completed`
4. Show: Day 1, 7, 30 retention
5. Save as "Game Completion Retention"

### 2. Create Dashboard

1. Dashboards → New Dashboard → "Core Metrics"
2. Add tiles:
   - User Activation Funnel
   - Daily Active Users
   - Game Completion Retention
   - Conversion: `paywall_viewed` → `purchase_initiated`
   - Share Rate: `game_completed` → `share_clicked`

### 3. Set Up Alerts

1. Insights → User Activation Funnel → More → Create alert
2. Alert if: Funnel conversion drops below 50%
3. Send to: Your email or Slack

---

## 🔒 Privacy Compliance

### GDPR Checklist

- [x] No PII collected (no emails, names, IPs)
- [x] Respect Do Not Track header
- [x] Anonymize transaction IDs
- [x] No sensitive content (questions, answers)
- [x] Session replay disabled by default
- [x] Data retention: 90 days recommended

### Cookie Consent (Optional)

If you want to be extra cautious:

```typescript
// client/src/lib/analytics.ts
class Analytics {
  constructor() {
    // Check for consent before initializing
    const hasConsent = localStorage.getItem("analytics_consent") === "true";

    if (!hasConsent) {
      console.log("⏸️ Analytics paused: No consent");
      this.provider = new NoopAnalytics(); // Don't track anything
      return;
    }

    // Normal initialization
    // ...
  }
}
```

Add consent banner (use existing UI library):
```tsx
<Dialog open={!hasConsent}>
  <DialogContent>
    <h2>Help us improve</h2>
    <p>We use analytics to understand how you use the app. No personal data is collected.</p>
    <Button onClick={() => {
      localStorage.setItem("analytics_consent", "true");
      window.location.reload(); // Reinitialize analytics
    }}>
      Accept
    </Button>
  </DialogContent>
</Dialog>
```

---

## 📈 Expected Insights

### Week 1: Baseline Metrics
- Total events: ~1,000-5,000 (depending on traffic)
- Most common events: `app_opened`, `daily_drop_viewed`, `game_completed`
- Typical funnel: 100% → 90% → 70% (open → view → complete)

### Week 2: Identify Drop-offs
- "Only 60% complete the game? Why?"
- "Users drop off at question 3 - is it too hard?"
- "Mobile users take 2x longer - performance issue?"

### Week 3: Test Hypotheses
- A/B test: Simpler question 3
- Result: Completion rate ↑ to 75%
- Data-driven decision validated!

### Month 1: Optimize Monetization
- Paywall shown to 40% of users
- Conversion rate: 2-5%
- Best trigger: "streak_broke" (10% conversion)
- Optimize: Show paywall earlier, before streak breaks

---

## 🚀 Next Steps

1. **Deploy Phase 1** (Core Events)
   - [ ] Add analytics.ts
   - [ ] Update App.tsx
   - [ ] Update game.tsx
   - [ ] Test in dev console

2. **Deploy Phase 2** (Retention Events)
   - [ ] Update results.tsx
   - [ ] Add streak tracking
   - [ ] Add share tracking

3. **Deploy Phase 3** (Monetization Events)
   - [ ] Update membership.tsx
   - [ ] Add paywall tracking
   - [ ] Add purchase tracking

4. **Set Up Dashboard**
   - [ ] Create PostHog account
   - [ ] Add key insights
   - [ ] Set up alerts

5. **Iterate**
   - [ ] Review dashboard weekly
   - [ ] Identify bottlenecks
   - [ ] A/B test improvements

---

**Total Implementation Time:** 3-4 hours
**Maintenance:** ~5 minutes/week (check dashboard)
**ROI:** Priceless insights into user behavior!
