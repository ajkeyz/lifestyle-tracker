# Analytics Event Reference Card

Quick reference for all tracked events in Lifestyle Tracker.

---

## 🎯 Core Loop Events

### 1. `app_opened`
**Trigger:** User opens/focuses app
**File:** `App.tsx`
**Properties:**
- `session_id` - Unique session ID
- `is_returning_user` - Has account?
- `device_type` - mobile | tablet | desktop
- `platform` - ios | android | web
- `viewport_width` / `viewport_height`
- `referrer` - Where they came from

---

### 2. `daily_drop_viewed`
**Trigger:** Game page loads with today's questions
**File:** `game.tsx`
**Properties:**
- `drop_id` - Daily drop identifier
- `drop_number` - Sequential day number
- `scenario_count` - Number of questions (usually 5)
- `user_streak` - Current streak
- `has_played_today` - Already completed?
- `time_to_load_ms` - Performance metric

---

### 3. `scenario_viewed`
**Trigger:** Individual question becomes visible
**File:** `game.tsx`
**Properties:**
- `scenario_id` - Question identifier
- `scenario_index` - 0-4 (position)
- `category` - "tech", "lifestyle", etc.
- `has_context` - Has scenario description?
- `choice_count` - Usually 4
- `time_remaining` - Seconds left on timer

---

### 4. `choice_selected`
**Trigger:** User clicks a choice (before submitting)
**File:** `game.tsx` → `handleSelectChoice`
**Properties:**
- `scenario_id` - Question ID
- `scenario_index` - Position
- `choice_label` - "A", "B", "C", "D"
- `time_to_select_ms` - Time since question appeared
- `time_remaining` - Seconds left
- `is_first_selection` - Or changed answer?

---

### 5. `answer_submitted`
**Trigger:** Answer locked in (result shown)
**File:** `game.tsx` → `handleSelectChoice`
**Properties:**
- `scenario_id` - Question ID
- `scenario_index` - Position
- `choice_label` - Selected choice
- `is_correct` - Got it right?
- `points_earned` - Points for this answer
- `time_spent_ms` - Total time on question
- `time_remaining` - Time left (or 0 if timeout)
- `submission_method` - "click" | "timer" | "keyboard"

---

### 6. `result_viewed`
**Trigger:** User sees correctness feedback
**File:** `game.tsx` → when `showResults` updates
**Properties:**
- `scenario_id` - Question ID
- `is_correct` - Right or wrong?
- `points_earned` - Points
- `feedback_text_length` - Character count

---

### 7. `game_completed`
**Trigger:** All questions answered, results calculated
**File:** `game.tsx` → `submitMutation.onSuccess`
**Properties:**
- `drop_id` - Daily drop ID
- `total_score` - Total points
- `correct_count` - Number correct
- `total_questions` - Usually 5
- `accuracy_percent` - % correct
- `money_health` - Final score
- `time_spent_total_ms` - Session duration
- `perfect_game` - 100% correct?
- `streak_before` / `streak_after` - Streak change
- `streak_grew` - Did it increase?

---

### 8. `streak_updated`
**Trigger:** Streak changes (grows, breaks, freezes)
**File:** `results.tsx`, streak freeze components
**Properties:**
- `old_streak` - Previous value
- `new_streak` - New value
- `change` - "grew" | "broke" | "frozen" | "restored"
- `freeze_tokens_used` - Used a shield?
- `freeze_tokens_remaining` - Shields left
- `is_personal_best` - New record?
- `previous_best` - Highest ever

---

### 9. `share_clicked`
**Trigger:** User taps share button
**File:** `results.tsx`, `share.tsx`, `social-share-card.tsx`
**Properties:**
- `share_type` - "results" | "streak" | "achievement" | "weekly_recap"
- `share_method` - "copy_link" | "native_share" | "twitter" | "facebook"
- `content_type` - "text" | "image" | "link"
- `streak_value` - (optional) Streak being shared
- `score_value` - (optional) Score being shared
- `achievement_id` - (optional) Badge being shared

---

### 10. `paywall_viewed`
**Trigger:** User sees upgrade prompt
**File:** `membership.tsx`, `streak-insurance.tsx`
**Properties:**
- `paywall_id` - "streak_insurance" | "membership" | "freeze_tokens"
- `trigger` - "streak_broke" | "freeze_depleted" | "settings" | "feature_locked"
- `feature_requested` - (optional) "late_pass", "buyback"
- `user_streak` - Current streak
- `freeze_tokens` - Tokens available
- `has_seen_before` - Returning visitor?

---

### 11. `purchase_initiated`
**Trigger:** User clicks "Upgrade" or "Buy"
**File:** `membership.tsx`, `membership-upgrade-modal.tsx`
**Properties:**
- `product_id` - "plus" | "pro" | "freeze_token_pack"
- `price` - In cents (499 = $4.99)
- `currency` - "USD"
- `trigger` - Same as paywall trigger
- `session_duration_ms` - Time from app open to purchase

---

### 12. `purchase_completed`
**Trigger:** Payment succeeds (webhook)
**File:** `server/routes.ts` → Stripe webhook
**Properties:**
- `product_id` - Product purchased
- `price` - In cents
- `currency` - "USD"
- `transaction_id` - Hashed Stripe charge ID (privacy)
- `time_to_purchase_ms` - From initiate to complete

---

## 🎁 Secondary Events (Bonus)

### `badge_unlocked`
**Trigger:** Badge earned
**File:** `use-achievement-toast.tsx`
**Properties:** `badge_id`, `badge_name`, `time_to_unlock_days`

---

### `onboarding_started`
**Trigger:** Onboarding step begins
**File:** `profile-setup.tsx`, `notifications-setup.tsx`, `friends-setup.tsx`
**Properties:** `step` - "profile" | "notifications" | "friends"

---

### `onboarding_completed`
**Trigger:** Final onboarding step done
**File:** `friends-setup.tsx`
**Properties:** `steps_completed`, `time_to_complete_ms`, `skipped_notifications`, `skipped_friends`

---

### `friend_added`
**Trigger:** Friend successfully added
**File:** `friends.tsx`
**Properties:** `method` - "search" | "invite_code" | "referral", `friend_count_after`

---

### `league_joined`
**Trigger:** User joins/creates league
**File:** `leagues.tsx`
**Properties:** `league_id`, `league_privacy`, `member_count`, `join_method`

---

### `challenge_created`
**Trigger:** Challenge sent to friend
**File:** `challenges.tsx`
**Properties:** `challenge_type`, `opponent_relation`

---

### `weekly_recap_viewed`
**Trigger:** User opens Monday recap
**File:** `weekly-recap.tsx`
**Properties:** `week_start`, `days_played`, `total_score`, `viewed_all_slides`

---

### `feature_discovered`
**Trigger:** First time viewing a feature
**File:** Various pages
**Properties:** `feature_name`, `discovery_method`

---

## 🔍 Event Flow: Typical Session

```
1. app_opened
   ↓
2. daily_drop_viewed
   ↓
3. scenario_viewed (Question 1)
   ↓
4. choice_selected (User clicks "A")
   ↓
5. answer_submitted (Locked in)
   ↓
6. result_viewed (See feedback)
   ↓
7. scenario_viewed (Question 2)
   ↓
   ... (repeat 3-6 for each question)
   ↓
8. game_completed (All done)
   ↓
9. streak_updated (New streak: 5 → 6)
   ↓
10. share_clicked (Share results)
```

---

## 📊 Key Funnels to Track

### Activation Funnel
```
app_opened
  ↓ (~90%)
daily_drop_viewed
  ↓ (~70%)
game_completed
  ↓ (~20%)
share_clicked
```

### Monetization Funnel
```
paywall_viewed
  ↓ (~15%)
purchase_initiated
  ↓ (~60%)
purchase_completed
```

### Retention Funnel
```
game_completed (Day 1)
  ↓ (D1: ~40%)
game_completed (Day 2)
  ↓ (D7: ~25%)
game_completed (Day 7)
  ↓ (D30: ~10%)
game_completed (Day 30)
```

---

## 🔒 Privacy Notes

**What We Track:**
- ✅ Anonymous user IDs
- ✅ Choice labels (A/B/C/D)
- ✅ Categories (tech, lifestyle, etc.)
- ✅ Scores and streaks
- ✅ Timing and performance

**What We DON'T Track:**
- ❌ Usernames or emails
- ❌ Question text or content
- ❌ Actual answers or choices
- ❌ IP addresses (PostHog anonymizes)
- ❌ Credit card numbers (Stripe handles)
- ❌ Session replays (disabled by default)

**GDPR Compliant:**
- Respects Do Not Track
- No PII collected
- Data retention: 90 days recommended
- User can opt out in settings

---

## 🛠️ Implementation Checklist

### Phase 1: Core Events (3-4 hours)
- [ ] Install PostHog (`npm install posthog-js`)
- [ ] Create `analytics.ts`
- [ ] Add to `App.tsx` (app_opened)
- [ ] Add to `game.tsx` (all game events)
- [ ] Test in dev console

### Phase 2: Retention Events (1-2 hours)
- [ ] Add to `results.tsx` (streak, share)
- [ ] Test streak updates
- [ ] Test share tracking

### Phase 3: Monetization Events (1 hour)
- [ ] Add to `membership.tsx`
- [ ] Add to Stripe webhook
- [ ] Test paywall tracking

### Phase 4: Dashboard (1 hour)
- [ ] Create PostHog account
- [ ] Set up funnels
- [ ] Set up retention cohorts
- [ ] Set up alerts

---

## 📈 Success Metrics

### Engagement
- **DAU** (Daily Active Users)
- **DAU/MAU** (Stickiness = Daily ÷ Monthly)
- **Session Duration** (avg time in app)
- **Games per User per Week**

### Retention
- **D1 Retention** (% who return next day)
- **D7 Retention** (% who return week later)
- **D30 Retention** (% who return month later)
- **Streak Retention** (% who maintain 7+ day streak)

### Monetization
- **Paywall CTR** (% who click upgrade)
- **Conversion Rate** (% who complete purchase)
- **ARPU** (Average Revenue Per User)
- **LTV** (Lifetime Value per cohort)

### Product Quality
- **Completion Rate** (% who finish game)
- **Average Accuracy** (% correct answers)
- **Time per Question** (avg seconds)
- **Share Rate** (% who share results)

---

## 🚀 Quick Start

1. **Install:**
   ```bash
   npm install posthog-js
   ```

2. **Add .env:**
   ```
   VITE_POSTHOG_KEY=phc_your_key_here
   ```

3. **Import in App.tsx:**
   ```typescript
   import { analytics, trackAppOpened } from "@/lib/analytics";

   useEffect(() => {
     trackAppOpened(user);
     if (user) analytics.identify(user);
   }, [user]);
   ```

4. **View Events:**
   - Dev: Open console, see `📊 Event:` logs
   - Prod: Check PostHog dashboard

---

## 📞 Support

**PostHog Docs:** https://posthog.com/docs
**Analytics Issues:** Check `ANALYTICS_AUDIT.md`
**Implementation Guide:** See `ANALYTICS_IMPLEMENTATION.md`

---

**Last Updated:** 2026-02-08
**Version:** 1.0
**Total Events:** 20 (12 core + 8 secondary)
