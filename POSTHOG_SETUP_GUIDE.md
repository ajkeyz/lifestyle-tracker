# PostHog Setup Guide - Ready-to-Use Insights

Complete PostHog configuration with copy-paste insights, funnels, and dashboards.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Account
1. Go to https://posthog.com/signup
2. Sign up (free tier: 1M events/month)
3. Create project: **"Lifestyle Tracker"**

### Step 2: Get API Key
1. Project Settings → API Keys
2. Copy the Project API Key (starts with `phc_`)
3. Add to `.env`:
   ```bash
   VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
   ```

### Step 3: Test Connection
```bash
npm run build
npm start
```
Visit app → Check PostHog "Live Events" → Should see `app_opened`

---

## 📊 Pre-Built Insights (Copy-Paste Ready)

### 1. User Activation Funnel

**Purpose:** See where users drop off in the core loop

**Configuration:**
- **Type:** Funnel
- **Steps:**
  1. `app_opened`
  2. `daily_drop_viewed`
  3. `game_completed`
  4. `share_clicked`
- **Time Window:** Within 1 day
- **Breakdown:** None

**Query (JSON - importable):**
```json
{
  "insight": "FUNNELS",
  "events": [
    {"id": "app_opened", "type": "events", "order": 0},
    {"id": "daily_drop_viewed", "type": "events", "order": 1},
    {"id": "game_completed", "type": "events", "order": 2},
    {"id": "share_clicked", "type": "events", "order": 3}
  ],
  "funnel_window_interval": 1,
  "funnel_window_interval_unit": "day",
  "breakdown": null
}
```

**Expected Conversion:**
```
app_opened       → 100% (baseline)
daily_drop_viewed → 85-95%  (high intent)
game_completed   → 65-75%  (core metric)
share_clicked    → 10-20%  (viral growth)
```

**Optimization Targets:**
- Step 1→2 < 90%: Improve loading speed
- Step 2→3 < 70%: Simplify gameplay
- Step 3→4 < 15%: Better share prompts

---

### 2. Daily Active Users (DAU)

**Purpose:** Track daily engagement

**Configuration:**
- **Type:** Trend (Line Chart)
- **Event:** `app_opened`
- **Filter:** `is_returning_user = true`
- **Group By:** Day
- **Date Range:** Last 30 days

**Query:**
```json
{
  "insight": "TRENDS",
  "events": [
    {
      "id": "app_opened",
      "type": "events",
      "properties": [{
        "key": "is_returning_user",
        "value": [true],
        "type": "event"
      }]
    }
  ],
  "interval": "day",
  "date_from": "-30d"
}
```

**Benchmarks:**
- **Good:** Steady growth (5-10% week-over-week)
- **Warning:** Flat or declining
- **Great:** 20%+ growth week-over-week

---

### 3. Game Completion Rate

**Purpose:** % of users who finish the game

**Configuration:**
- **Type:** Trend (Number)
- **Formula:** `game_completed / daily_drop_viewed * 100`
- **Date Range:** Last 7 days

**Query:**
```json
{
  "insight": "TRENDS",
  "formula": "(B / A) * 100",
  "events": [
    {"id": "daily_drop_viewed", "type": "events", "name": "A"},
    {"id": "game_completed", "type": "events", "name": "B"}
  ],
  "display": "BoldNumber"
}
```

**Benchmarks:**
- **Good:** 70-80%
- **Warning:** < 60%
- **Great:** > 85%

---

### 4. D1, D7, D30 Retention

**Purpose:** How many users come back?

**Configuration:**
- **Type:** Retention
- **Initial Event:** `game_completed`
- **Returning Event:** `game_completed`
- **Retention Type:** Unbounded
- **Period:** Daily
- **Show:** Day 1, 3, 7, 14, 30

**Query:**
```json
{
  "insight": "RETENTION",
  "target_entity": {
    "id": "game_completed",
    "type": "events"
  },
  "returning_entity": {
    "id": "game_completed",
    "type": "events"
  },
  "retention_type": "retention_first_time",
  "period": "Day"
}
```

**Benchmarks (casual mobile games):**
- **D1:** 35-45% (good), 50%+ (great)
- **D7:** 15-25% (good), 30%+ (great)
- **D30:** 8-12% (good), 15%+ (great)

**Red Flags:**
- D1 < 30%: Onboarding issue
- D7 < 15%: Core loop not engaging
- D30 < 5%: No long-term value

---

### 5. Streak Retention Curve

**Purpose:** Retention by streak length

**Configuration:**
- **Type:** Trend (Line Chart)
- **Event:** `streak_updated`
- **Breakdown:** `new_streak`
- **Filter:** `change = "grew"`
- **Group By:** Day

**Query:**
```json
{
  "insight": "TRENDS",
  "events": [{
    "id": "streak_updated",
    "type": "events",
    "properties": [{
      "key": "change",
      "value": ["grew"],
      "type": "event"
    }]
  }],
  "breakdown": "new_streak",
  "breakdown_type": "event"
}
```

**Expected Pattern:**
```
Day 1-2:  High volume (new users)
Day 3-5:  Drop-off cliff (first churn point)
Day 7:    Plateau (engaged users)
Day 14+:  Steady (loyal users)
```

**Insight:** Most users drop at 3-5 day streak. Add retention mechanic here!

---

### 6. Share Rate by Platform

**Purpose:** Which platform drives most shares?

**Configuration:**
- **Type:** Trend (Bar Chart)
- **Event:** `share_clicked`
- **Breakdown:** `share_method`
- **Date Range:** Last 30 days

**Query:**
```json
{
  "insight": "TRENDS",
  "events": [{
    "id": "share_clicked",
    "type": "events"
  }],
  "breakdown": "share_method",
  "breakdown_type": "event",
  "display": "ActionsBarValue"
}
```

**Expected Breakdown:**
```
native_share  60%  (mobile Safari/Chrome)
copy_link     30%  (desktop users)
twitter       8%   (power users)
facebook      2%   (older demographic)
```

---

### 7. Paywall Conversion Funnel

**Purpose:** Measure monetization funnel

**Configuration:**
- **Type:** Funnel
- **Steps:**
  1. `paywall_viewed`
  2. `purchase_initiated`
  3. `purchase_completed`
- **Time Window:** Within 1 hour
- **Breakdown:** `trigger`

**Query:**
```json
{
  "insight": "FUNNELS",
  "events": [
    {"id": "paywall_viewed", "type": "events", "order": 0},
    {"id": "purchase_initiated", "type": "events", "order": 1},
    {"id": "purchase_completed", "type": "events", "order": 2}
  ],
  "funnel_window_interval": 1,
  "funnel_window_interval_unit": "hour",
  "breakdown": "trigger"
}
```

**Benchmarks by Trigger:**
```
Trigger            View→Init  Init→Complete  Overall
streak_broke       15%        70%            10.5%
freeze_depleted    12%        65%            7.8%
settings           5%         80%            4.0%
navigation         3%         75%            2.25%
```

**Optimization:**
- Show paywall earlier (before streak breaks)
- Emphasize streak protection value prop
- Reduce friction in checkout (pre-fill forms)

---

### 8. Time to First Game

**Purpose:** How long from signup to playing?

**Configuration:**
- **Type:** Trend (Number)
- **Formula:** `AVG(time_between(app_opened, game_completed))`
- **Date Range:** Last 7 days

**Query:**
```json
{
  "insight": "TRENDS",
  "formula": "avgTimeBetweenEvents(app_opened, game_completed)",
  "display": "BoldNumber",
  "date_from": "-7d"
}
```

**Benchmarks:**
- **Excellent:** < 2 minutes
- **Good:** 2-5 minutes
- **Warning:** > 10 minutes

**If high:** Simplify onboarding, skip unnecessary steps

---

### 9. Question Drop-off Analysis

**Purpose:** Which questions lose users?

**Configuration:**
- **Type:** Funnel
- **Steps:**
  1. `scenario_viewed` (filter: `scenario_index = 0`)
  2. `scenario_viewed` (filter: `scenario_index = 1`)
  3. `scenario_viewed` (filter: `scenario_index = 2`)
  4. `scenario_viewed` (filter: `scenario_index = 3`)
  5. `scenario_viewed` (filter: `scenario_index = 4`)

**Query:**
```json
{
  "insight": "FUNNELS",
  "events": [
    {"id": "scenario_viewed", "properties": [{"key": "scenario_index", "value": [0]}], "order": 0},
    {"id": "scenario_viewed", "properties": [{"key": "scenario_index", "value": [1]}], "order": 1},
    {"id": "scenario_viewed", "properties": [{"key": "scenario_index", "value": [2]}], "order": 2},
    {"id": "scenario_viewed", "properties": [{"key": "scenario_index", "value": [3]}], "order": 3},
    {"id": "scenario_viewed", "properties": [{"key": "scenario_index", "value": [4]}], "order": 4}
  ]
}
```

**Expected Pattern:**
```
Q1: 100%
Q2: 95%
Q3: 90%  ← Watch this
Q4: 88%
Q5: 85%
```

**If drop > 10% at any question:** Review difficulty/clarity

---

### 10. Average Session Duration

**Purpose:** How long do users spend per session?

**Configuration:**
- **Type:** SQL Query
- **Query:**
```sql
SELECT
  avg((properties->>'session_duration_ms')::int / 1000) as avg_session_seconds
FROM events
WHERE event = 'game_completed'
  AND timestamp > now() - interval '7 days'
```

**Benchmarks:**
- **Quick Game (Goal):** 2-4 minutes (120-240s)
- **Warning:** > 5 minutes (too slow)
- **Warning:** < 1 minute (too easy/broken)

---

## 🎨 Pre-Built Dashboard

### Dashboard: "Core Metrics"

**Tiles:**
1. **DAU** (Trend, 2x1)
2. **D7 Retention** (Retention, 2x1)
3. **User Activation** (Funnel, 2x2)
4. **Share Rate** (Bar Chart, 1x1)
5. **Paywall Conversion** (Funnel, 2x2)
6. **Completion Rate** (Number, 1x1)
7. **Session Duration** (Number, 1x1)

**Import JSON:**
```json
{
  "name": "Core Metrics",
  "tiles": [
    {
      "name": "Daily Active Users",
      "insight": "TRENDS",
      "filters": {"events": [{"id": "app_opened"}]},
      "layout": {"x": 0, "y": 0, "w": 6, "h": 4}
    },
    {
      "name": "D7 Retention",
      "insight": "RETENTION",
      "filters": {"target_entity": {"id": "game_completed"}},
      "layout": {"x": 6, "y": 0, "w": 6, "h": 4}
    },
    {
      "name": "User Activation Funnel",
      "insight": "FUNNELS",
      "filters": {"events": [
        {"id": "app_opened", "order": 0},
        {"id": "daily_drop_viewed", "order": 1},
        {"id": "game_completed", "order": 2},
        {"id": "share_clicked", "order": 3}
      ]},
      "layout": {"x": 0, "y": 4, "w": 8, "h": 5}
    }
  ]
}
```

**To Import:**
1. Dashboards → New Dashboard
2. Click "..." → Import JSON
3. Paste above JSON
4. Save

---

## 🔔 Recommended Alerts

### Alert 1: DAU Drop
- **Metric:** Daily Active Users
- **Condition:** Drops > 20% day-over-day
- **Action:** Email team immediately

**Setup:**
1. Create "DAU" trend insight
2. Click "Set up alert"
3. Condition: "Decreases by more than 20%"
4. Frequency: Check hourly
5. Recipients: team@example.com

---

### Alert 2: Completion Rate Drop
- **Metric:** Game Completion Rate
- **Condition:** < 60%
- **Action:** Investigate immediately (bug?)

---

### Alert 3: Error Rate Spike
- **Metric:** Count of events with `error` property
- **Condition:** > 10 errors per hour
- **Action:** Page on-call engineer

---

## 🎯 Session Replay (Optional)

### Enable Session Recording
**Warning:** Privacy implications - only enable if needed

```bash
# .env
VITE_POSTHOG_SESSION_REPLAY=true
```

**Configuration:**
```typescript
// In analytics.ts
posthog.init(key, {
  session_recording: {
    maskAllInputs: true,        // Hide form inputs
    maskTextSelector: '.sensitive', // Hide elements with class
    recordCrossOriginIframes: false,
    blockClass: 'no-record',    // Don't record these elements
  }
});
```

**Use Cases:**
- Debug failed purchases
- Watch user struggle with UI
- Understand confusion points

**Privacy:**
- ✅ Mask all form inputs (passwords, emails)
- ✅ Block recording of sensitive pages (`/admin`, `/payment`)
- ✅ Limit retention to 30 days
- ✅ Only watch sessions with errors

---

## 🧪 Feature Flags (A/B Testing)

### Test: Paywall Trigger Timing

**Hypothesis:** Showing paywall before streak breaks (at 23:00) converts better than after break

**Setup:**
1. PostHog → Feature Flags → New Flag
2. Name: `early-paywall-test`
3. Variants:
   - **Control (50%):** Show after break (current)
   - **Test (50%):** Show at 23:00 if not played

**Code:**
```typescript
// In game.tsx
const showEarlyPaywall = posthog.isFeatureEnabled('early-paywall-test');

if (showEarlyPaywall && hour === 23 && !user.todayResult) {
  // Show paywall with "Protect your streak!" message
  setShowPaywall(true);
}
```

**Measure:**
- Primary: Conversion rate (`paywall_viewed` → `purchase_completed`)
- Secondary: Churn rate (D7 retention)

**Decision Criteria:**
- If test variant converts >20% better → Ship to 100%
- If no difference → Keep current behavior
- Run for 2 weeks (minimum 1000 users per variant)

---

## 📊 SQL Queries (Advanced)

### Query 1: Top Performing Questions (by accuracy)
```sql
SELECT
  properties->>'category' as category,
  avg(case when (properties->>'is_correct')::boolean then 1 else 0 end) as accuracy,
  count(*) as total_answers
FROM events
WHERE event = 'answer_submitted'
  AND timestamp > now() - interval '7 days'
GROUP BY properties->>'category'
ORDER BY accuracy DESC
```

---

### Query 2: User Cohorts by Signup Week
```sql
WITH cohorts AS (
  SELECT
    distinct_id,
    date_trunc('week', min(timestamp)) as cohort_week
  FROM events
  WHERE event = 'app_opened'
    AND (properties->>'is_returning_user')::boolean = false
  GROUP BY distinct_id
)
SELECT
  cohort_week,
  count(distinct c.distinct_id) as cohort_size,
  count(distinct case
    when e.timestamp > c.cohort_week + interval '7 days'
    then e.distinct_id
  end) as retained_d7,
  round(
    count(distinct case when e.timestamp > c.cohort_week + interval '7 days' then e.distinct_id end)::numeric
    / count(distinct c.distinct_id)::numeric * 100,
    2
  ) as retention_d7_pct
FROM cohorts c
LEFT JOIN events e ON e.distinct_id = c.distinct_id AND e.event = 'game_completed'
GROUP BY cohort_week
ORDER BY cohort_week DESC
```

---

### Query 3: Revenue by User Segment
```sql
SELECT
  case
    when u.properties->>'streak' < 7 then 'New (< 7 days)'
    when u.properties->>'streak' < 30 then 'Engaged (7-30 days)'
    else 'Power (30+ days)'
  end as user_segment,
  count(distinct e.distinct_id) as purchasers,
  sum((e.properties->>'price')::int / 100.0) as total_revenue,
  avg((e.properties->>'price')::int / 100.0) as avg_purchase_value
FROM events e
LEFT JOIN (
  SELECT DISTINCT ON (distinct_id) distinct_id, properties
  FROM events
  WHERE event = 'streak_updated'
  ORDER BY distinct_id, timestamp DESC
) u ON u.distinct_id = e.distinct_id
WHERE e.event = 'purchase_completed'
  AND e.timestamp > now() - interval '30 days'
GROUP BY user_segment
ORDER BY total_revenue DESC
```

---

## 🔗 Useful Links

- **PostHog Docs:** https://posthog.com/docs
- **SQL Query Guide:** https://posthog.com/docs/product-analytics/sql
- **Feature Flags:** https://posthog.com/docs/feature-flags
- **Session Replay:** https://posthog.com/docs/session-replay
- **API Reference:** https://posthog.com/docs/api

---

## ✅ Setup Checklist

- [ ] PostHog account created
- [ ] API key added to `.env`
- [ ] Events appearing in "Live Events"
- [ ] User Activation Funnel created
- [ ] DAU trend created
- [ ] Retention cohort created
- [ ] Core Metrics dashboard created
- [ ] DAU drop alert configured
- [ ] Team has dashboard access
- [ ] First insights documented

---

**Estimated Setup Time:** 30-45 minutes
**Last Updated:** 2026-02-08
**Version:** 1.0
