# Analytics Testing & Validation Guide

Complete guide to testing and validating your analytics implementation.

---

## 🧪 Phase 1: Local Development Testing (Console Mode)

### Prerequisites
```bash
# Ensure you're in development mode
export NODE_ENV=development
npm run dev
```

### Test Scenario 1: App Open
**Steps:**
1. Open browser to `http://localhost:5000`
2. Open DevTools Console (F12)

**Expected Output:**
```javascript
📊 Event: app_opened {
  session_id: "abc-123-def",
  is_returning_user: false,
  device_type: "desktop",
  platform: "web",
  viewport_width: 1920,
  viewport_height: 1080,
  referrer: null,
  timestamp: "2026-02-08T12:00:00.000Z",
  session_duration_ms: 123
}
```

**Validation:**
- ✅ Event fires immediately on page load
- ✅ `is_returning_user` is `false` for new users, `true` after login
- ✅ `device_type` matches your device (mobile/tablet/desktop)
- ✅ `platform` detects iOS/Android/web correctly

---

### Test Scenario 2: User Identification
**Steps:**
1. Log in or create account
2. Check console

**Expected Output:**
```javascript
🔷 Identify: user-123 {
  username: "testuser",
  streak: 0,
  highest_streak: 0,
  games_played: 0,
  money_health: 50,
  membership_tier: "free"
}
```

**Validation:**
- ✅ Identify fires after authentication
- ✅ User ID is correct
- ✅ Traits match user profile

---

### Test Scenario 3: Game Flow (Complete Path)
**Steps:**
1. Navigate to `/play` (game page)
2. Wait for questions to load
3. Select answer for question 1
4. Click "Continue"
5. Repeat for all questions
6. Click "Submit"

**Expected Console Output:**

#### 1. Daily Drop Viewed
```javascript
📊 Event: daily_drop_viewed {
  drop_id: "drop-123",
  drop_number: 42,
  scenario_count: 5,
  user_streak: 0,
  has_played_today: false,
  time_to_load_ms: 234
}
```

#### 2. Scenario Viewed (fires for each question)
```javascript
📊 Event: scenario_viewed {
  scenario_id: "scenario-1",
  scenario_index: 0,
  category: "tech",
  has_context: true,
  choice_count: 4,
  time_remaining: 20
}
```

#### 3. Choice Selected
```javascript
📊 Event: choice_selected {
  scenario_id: "scenario-1",
  scenario_index: 0,
  choice_label: "A",
  time_to_select_ms: 3456,
  time_remaining: 17,
  is_first_selection: true
}
```

#### 4. Answer Submitted
```javascript
📊 Event: answer_submitted {
  scenario_id: "scenario-1",
  scenario_index: 0,
  choice_label: "A",
  is_correct: true,
  points_earned: 100,
  time_spent_ms: 3456,
  time_remaining: 17,
  submission_method: "click"
}
```

#### 5. Game Completed (after all questions)
```javascript
📊 Event: game_completed {
  drop_id: "drop-123",
  total_score: 450,
  correct_count: 4,
  total_questions: 5,
  accuracy_percent: 80,
  money_health: 84,
  time_spent_total_ms: 67890,
  perfect_game: false,
  streak_before: 0,
  streak_after: 1,
  streak_grew: true
}
```

**Validation Checklist:**
- [ ] `daily_drop_viewed` fires once when page loads
- [ ] `scenario_viewed` fires 5 times (once per question)
- [ ] `choice_selected` fires 5 times (once per answer)
- [ ] `answer_submitted` fires 5 times immediately after selection
- [ ] `game_completed` fires once after submit
- [ ] Event order is correct
- [ ] Timings make sense (time_to_select < time_spent < session_duration)

---

### Test Scenario 4: Share & Paywall
**Steps:**
1. Complete game, go to `/results`
2. Click "Share" button
3. Navigate to `/membership`

**Expected Output:**

#### Share Clicked
```javascript
📊 Event: share_clicked {
  share_type: "results",
  share_method: "native_share",  // or "copy_link"
  content_type: "text",
  score_value: 450,
  streak_value: 1
}
```

#### Paywall Viewed
```javascript
📊 Event: paywall_viewed {
  paywall_id: "membership",
  trigger: "navigation",
  user_streak: 1,
  freeze_tokens: 1,
  has_seen_before: false
}
```

---

## 🔬 Phase 2: Production Testing (PostHog)

### Setup PostHog Account
1. Go to https://posthog.com/signup
2. Create account (free tier: 1M events/month)
3. Create new project: "Lifestyle Tracker"
4. Copy API key (starts with `phc_`)

### Configure Environment
```bash
# .env
VITE_POSTHOG_KEY=phc_your_actual_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_POSTHOG_SESSION_REPLAY=false
```

### Build & Deploy
```bash
# Build production bundle
npm run build

# Test locally with production build
NODE_ENV=production npm start
```

### Verify Events in PostHog

#### 1. Open PostHog Dashboard
- Navigate to: https://app.posthog.com/project/YOUR_PROJECT_ID/events

#### 2. Live Events View
- You should see events streaming in real-time
- Click on any event to see full properties

#### 3. Check Event Properties
Example `app_opened` event:

```json
{
  "event": "app_opened",
  "properties": {
    "session_id": "abc-123",
    "is_returning_user": false,
    "device_type": "mobile",
    "platform": "ios",
    "viewport_width": 390,
    "viewport_height": 844,
    "$lib": "posthog-js",
    "$lib_version": "1.x.x"
  },
  "timestamp": "2026-02-08T12:00:00.000Z",
  "distinct_id": "user-123"
}
```

**Validation:**
- ✅ Events appear within 5 seconds
- ✅ Properties are populated correctly
- ✅ No errors in browser console
- ✅ `distinct_id` matches user ID

---

## 📊 Phase 3: Dashboard Validation

### Create Key Insights

#### Funnel: User Activation
**Path:**
1. Insights → New Insight → Funnel
2. Add steps:
   - Event 1: `app_opened`
   - Event 2: `daily_drop_viewed`
   - Event 3: `game_completed`
   - Event 4: `share_clicked`
3. Time window: 1 day
4. Save as "User Activation Funnel"

**Expected Results:**
```
app_opened       → 100% (1000 users)
daily_drop_viewed → 90%  (900 users)
game_completed   → 70%  (700 users)
share_clicked    → 15%  (150 users)
```

**Validation:**
- ✅ Funnel shows reasonable drop-off rates
- ✅ Conversion rate improves over time
- ✅ Click on each step shows user list

---

#### Trend: Daily Active Users
**Path:**
1. Insights → New Insight → Trend
2. Event: `app_opened`
3. Group by: `day`
4. Filter: `is_returning_user = true`
5. Chart type: Line
6. Save as "Daily Active Users"

**Expected Results:**
- Line chart showing DAU over time
- Steady growth or plateau

**Validation:**
- ✅ DAU increases day-over-day
- ✅ No sudden drops (unless expected)
- ✅ Weekday vs weekend patterns visible

---

#### Retention: Day 1 & Day 7
**Path:**
1. Insights → New Insight → Retention
2. Initial event: `game_completed`
3. Returning event: `game_completed`
4. Show: Day 1, 3, 7, 14, 30
5. Save as "Game Retention"

**Expected Results:**
```
Day 0:  100%
Day 1:  40-50%
Day 3:  30-40%
Day 7:  20-30%
Day 30: 10-20%
```

**Validation:**
- ✅ D1 retention > 30%
- ✅ Retention curve levels off (doesn't drop to 0)
- ✅ Cohorts can be compared

---

### Create Dashboard

**Path:**
1. Dashboards → New Dashboard
2. Name: "Core Metrics"
3. Add tiles:
   - User Activation Funnel
   - Daily Active Users
   - Game Retention
   - Share Rate (custom: `game_completed` → `share_clicked`)
   - Paywall Conversion (custom: `paywall_viewed` → `purchase_initiated`)

**Dashboard Layout:**
```
┌──────────────────────────┬──────────────────────────┐
│  User Activation Funnel  │  Daily Active Users      │
│                          │                          │
│  ▼ 90% ▼ 70% ▼ 15%      │  ──────────/─            │
└──────────────────────────┴──────────────────────────┘
┌──────────────────────────┬──────────────────────────┐
│  Game Retention          │  Share Rate              │
│                          │                          │
│  D1: 45%  D7: 25%        │  15% of completions      │
└──────────────────────────┴──────────────────────────┘
┌──────────────────────────────────────────────────────┐
│  Paywall Conversion                                  │
│  2.5% overall, 10% after streak break                │
└──────────────────────────────────────────────────────┘
```

---

## 🔍 Phase 4: Data Quality Checks

### Check 1: Event Volume
**Query:**
```sql
-- In PostHog SQL editor
SELECT
  event,
  count(*) as count
FROM events
WHERE timestamp > now() - interval '7 days'
GROUP BY event
ORDER BY count DESC
```

**Expected Results:**
```
app_opened           5,000
scenario_viewed     20,000  (4x app_opened, assuming 4-5 scenarios)
choice_selected     20,000
answer_submitted    20,000
game_completed       4,000  (80% completion rate)
daily_drop_viewed    4,500  (90% of opens)
share_clicked          600  (15% share rate)
```

**Validation:**
- ✅ Event counts are proportional
- ✅ No events missing entirely
- ✅ No suspiciously high/low counts

---

### Check 2: Property Completeness
**Query:**
```sql
SELECT
  event,
  count(*) as total,
  sum(case when properties->>'drop_id' is not null then 1 else 0 end) as has_drop_id,
  sum(case when properties->>'is_correct' is not null then 1 else 0 end) as has_is_correct
FROM events
WHERE event IN ('game_completed', 'answer_submitted')
  AND timestamp > now() - interval '1 day'
GROUP BY event
```

**Expected Results:**
```
Event             Total  has_drop_id  has_is_correct
game_completed    1000   1000         0
answer_submitted  5000   0            5000
```

**Validation:**
- ✅ Required properties are 100% populated
- ✅ No null values for critical fields
- ✅ Data types are correct (numbers, not strings)

---

### Check 3: Timing Validation
**Query:**
```sql
SELECT
  avg((properties->>'time_to_select_ms')::int) as avg_time_to_select,
  min((properties->>'time_to_select_ms')::int) as min_time,
  max((properties->>'time_to_select_ms')::int) as max_time
FROM events
WHERE event = 'choice_selected'
  AND timestamp > now() - interval '1 day'
```

**Expected Results:**
```
avg_time_to_select: 5000-8000 ms
min_time: 1000 ms (fast clickers)
max_time: 20000 ms (max timer duration)
```

**Validation:**
- ✅ Average time is reasonable (5-8 seconds)
- ✅ Min time > 0 (no instant clicks)
- ✅ Max time ≤ timer duration (20s)

---

## 🐛 Common Issues & Fixes

### Issue 1: No Events Showing in Console
**Symptoms:**
- Dev mode, but no `📊 Event:` logs

**Cause:**
- `analytics.ts` not imported
- Import statement has typo

**Fix:**
```typescript
// In App.tsx, check:
import { analytics, trackAppOpened } from "@/lib/analytics";
```

---

### Issue 2: PostHog Events Not Appearing
**Symptoms:**
- Console logs work, but PostHog dashboard empty

**Causes:**
1. Wrong API key
2. Missing VITE_ prefix
3. PostHog blocked by ad blocker
4. Do Not Track enabled

**Fix:**
```bash
# 1. Check .env file
echo $VITE_POSTHOG_KEY  # Should start with phc_

# 2. Rebuild after env change
npm run build

# 3. Check browser console for errors
# Look for: "PostHog blocked" or network errors

# 4. Test without ad blocker
# Open incognito/private window
```

---

### Issue 3: Duplicate Events
**Symptoms:**
- Same event fires 2-3 times

**Cause:**
- React StrictMode (development only)
- Missing dependency in useEffect

**Fix:**
```typescript
// Add ref to prevent double-fire
const hasTracked = useRef(false);

useEffect(() => {
  if (hasTracked.current) return;
  hasTracked.current = true;

  trackAppOpened(user);
}, [user]);
```

---

### Issue 4: Wrong User ID
**Symptoms:**
- Different user IDs in PostHog than expected

**Cause:**
- Using local ID instead of database ID
- User not identified after login

**Fix:**
```typescript
// In App.tsx, ensure:
useEffect(() => {
  if (user) {
    analytics.identify(user);  // Must call this!
  }
}, [user]);
```

---

## 📈 Success Criteria

### Week 1: Baseline
- [ ] All 12 core events firing
- [ ] 0 errors in console
- [ ] Events appear in PostHog < 5 seconds
- [ ] Funnel shows ~70% completion rate
- [ ] Dashboard created with 5+ insights

### Week 2: Validation
- [ ] Event volumes look reasonable
- [ ] No missing properties
- [ ] Timings are realistic
- [ ] User IDs match expectations
- [ ] Retention cohorts show data

### Week 3: Insights
- [ ] Identified 3+ optimization opportunities
- [ ] A/B test planned for bottleneck
- [ ] Dashboard shared with team
- [ ] Alerts configured for key metrics

---

## 🎯 Quick Test Script

Run this to test all events in 2 minutes:

```bash
#!/bin/bash
# test-analytics.sh

echo "🧪 Testing Analytics Implementation"
echo ""

# Open dev console
npm run dev &
sleep 3

# Open browser (macOS)
open http://localhost:5000

echo "✅ App opened - Check console for app_opened event"
echo "👉 Now complete these steps:"
echo "   1. Log in"
echo "   2. Start game (/play)"
echo "   3. Answer all questions"
echo "   4. Click share"
echo "   5. Check console for all events"
echo ""
echo "Expected events:"
echo "  📊 app_opened"
echo "  🔷 Identify: user-id"
echo "  📊 daily_drop_viewed"
echo "  📊 scenario_viewed (5x)"
echo "  📊 choice_selected (5x)"
echo "  📊 answer_submitted (5x)"
echo "  📊 game_completed"
echo "  📊 share_clicked"
```

---

## 📞 Troubleshooting Checklist

### Before asking for help, verify:
- [ ] `client/src/lib/analytics.ts` exists
- [ ] Imports in `App.tsx` and `game.tsx` are correct
- [ ] PostHog API key in `.env` has `VITE_` prefix
- [ ] Rebuilt after adding `.env` (`npm run build`)
- [ ] No errors in browser console (F12)
- [ ] Not using ad blocker (test in incognito)
- [ ] Do Not Track is disabled (check browser settings)
- [ ] Events show in console (development mode)

### Still not working?
1. Check PostHog status: https://status.posthog.com
2. Review PostHog docs: https://posthog.com/docs/integrate
3. Check repo issues: `ANALYTICS_IMPLEMENTATION.md`

---

## 🚀 Next Steps After Validation

1. **Set up alerts**
   - DAU drops > 20%
   - Conversion rate < 2%
   - Error rate > 1%

2. **Create weekly report**
   - Email dashboard snapshot
   - Highlight key changes
   - Action items for team

3. **Plan A/B tests**
   - Test button copy
   - Test paywall triggers
   - Test onboarding flow

4. **Iterate on events**
   - Add new events as needed
   - Remove unused events
   - Refine property schema

---

**Last Updated:** 2026-02-08
**Version:** 1.0
**Estimated Testing Time:** 30 minutes
