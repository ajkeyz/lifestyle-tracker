# Monetization Plan: Premium Insights Tier

**Created:** 2026-02-08
**Status:** Ready to Implement

---

## 📊 Current State Analysis

### ✅ What Exists

**1. Membership Infrastructure (90% Complete)**
- ✅ Database field: `membershipTier: "free" | "plus" | "pro"` ([db-schema.ts:70](shared/models/db-schema.ts#L70))
- ✅ User schema includes membership tier ([schema.ts:134](shared/schema.ts#L134))
- ✅ Membership page UI with tier comparison ([membership.tsx](client/src/pages/membership.tsx))
- ✅ Settings page shows current tier ([settings.tsx:260-270](client/src/pages/settings.tsx#L260-L270))
- ✅ Analytics tracking for `paywall_viewed` and `purchase_initiated` ✨ NEW

**2. Data Collection (100% Complete)**
- ✅ `gameHistory[]` - All past game results ([schema.ts:128](shared/schema.ts#L128))
- ✅ `categoryStats[]` - Per-category performance ([schema.ts:129](shared/schema.ts#L129))
- ✅ Streak data with calendar ([schema.ts:113](shared/schema.ts#L113))
- ✅ Money health tracking over time
- ✅ Perfect games, scam streaks, badges

**3. Free Stats Page (100% Complete)**
- ✅ Basic metrics: Games played, streak, avg score, best score ([stats.tsx](client/src/pages/stats.tsx))
- ✅ Category performance breakdown
- ✅ Last 7 games history
- ⚠️ **No premium features or gating**

**4. Existing Premium Features**
- ✅ Unlimited freeze tokens (Plus/Pro)
- ✅ Streak buyback (Plus/Pro)
- ✅ Late pass (Plus/Pro)
- ⚠️ **Gated by `streakInsurance.isPlus` NOT `membershipTier`** ([streak-insurance.tsx](client/src/pages/streak-insurance.tsx))

### ❌ What's Missing

**1. Payment Integration**
- ❌ No Stripe/payment backend
- ❌ No subscription management
- ❌ No webhook handling
- ⚠️ Current workaround: `/api/toggle-plus` for demo/testing ([routes.ts](server/routes.ts))

**2. Premium Insights**
- ❌ No advanced analytics
- ❌ No trend visualization
- ❌ No personality/behavior insights
- ❌ No comparative analytics (vs. friends/community)
- ❌ No predictive features

**3. Feature Gating**
- ⚠️ Stats page is 100% free
- ⚠️ No paywall for insights
- ⚠️ Inconsistent gating (`isPlus` vs `membershipTier`)

---

## 🎯 Monetization Strategy

### Core Principle
**Keep Daily Drop 100% free. Monetize insights, not gameplay.**

### Pricing Tiers

| Feature | Free | Plus ($4.99/mo) | Pro ($9.99/mo) |
|---------|------|-----------------|----------------|
| **Core Gameplay** | | | |
| Daily Drop (5 scenarios) | ✅ | ✅ | ✅ |
| Deep Dive explanations | ✅ | ✅ | ✅ |
| Basic stats (7 games) | ✅ | ✅ | ✅ |
| 1 freeze token/month | ✅ | ✅ | ✅ |
| **Streak Protection** | | | |
| Unlimited freeze tokens | ❌ | ✅ | ✅ |
| Streak buyback (1x/mo) | ❌ | ✅ | ✅ |
| Late pass | ❌ | ✅ | ✅ |
| **Premium Insights** 🆕 | | | |
| Extended history (30+ games) | ❌ | ✅ | ✅ |
| Category deep dives | ❌ | ✅ | ✅ |
| Score trend charts | ❌ | ✅ | ✅ |
| "What your choices say" | ❌ | ❌ | ✅ |
| Comparative analytics | ❌ | ❌ | ✅ |
| AI Money Coach | ❌ | ❌ | ✅ |
| Weekly/monthly reports | ❌ | ❌ | ✅ |

---

## 🏗️ Implementation Plan

### Phase 1: Feature Gating (2-3 hours) 🎯 PRIORITY

**Goal:** Gate existing stats page with premium insights

**Files to Modify:**
1. `client/src/pages/stats.tsx` - Add premium sections
2. `client/src/components/premium-gate.tsx` - Create reusable paywall component
3. `server/postgres-storage.ts` - Fix `isPlus` / `membershipTier` inconsistency

**New Premium Features (using existing data):**
- 📊 **Extended History:** Show all games (not just 7) for Plus+
- 📈 **Trend Charts:** Line chart of score over time for Plus+
- 🎯 **Category Deep Dives:** Detailed recommendations per category for Plus+
- 💡 **Insights Tab:** "What your choices say about you" for Pro

**Paywall UX:**
```
┌─────────────────────────────────────┐
│  📊 Extended History (30+ games)    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  [Blurred preview of chart]        │
│                                     │
│  🔒 Unlock with Plus                │
│  Track your full journey            │
│                                     │
│  [Upgrade to Plus →]                │
└─────────────────────────────────────┘
```

---

### Phase 2: Enhanced Insights (4-5 hours)

**Goal:** Build compelling premium features

#### A. Extended Game History View
- **File:** `client/src/pages/stats.tsx`
- **Free:** Last 7 games
- **Plus/Pro:** All games with pagination
- **UI:** Tabular view with filters (date range, score range, category)

#### B. Trend Visualizations
- **File:** `client/src/components/trend-chart.tsx` (NEW)
- **Library:** Recharts or Chart.js
- **Charts:**
  - Score over time (line chart)
  - Accuracy over time (line chart)
  - Category performance radar chart
  - Money health progression

#### C. Category Deep Dives
- **File:** `client/src/components/category-insights.tsx` (NEW)
- **Features:**
  - Strongest categories (top 3)
  - Weakest categories (bottom 3)
  - Improvement suggestions
  - Recent trends (improving/declining)
  - Time to master estimates

#### D. Personality Insights (Pro Only)
- **File:** `client/src/pages/insights.tsx` (NEW)
- **Analysis Based On:**
  - Risk tolerance (investing questions)
  - Spending patterns (lifestyle questions)
  - Scam awareness (scam questions)
  - Long-term thinking (saving/debt questions)
- **Output:**
  - Money personality type (8 archetypes)
  - Strengths & blind spots
  - Personalized recommendations

---

### Phase 3: Payment Integration (6-8 hours) ⚠️ OPTIONAL

**Goal:** Real payment processing (skip if not needed yet)

#### Option A: Stripe Checkout (Recommended)
**Pros:** Hosted, PCI compliant, handles subscriptions
**Cons:** 2.9% + 30¢ per transaction

**Implementation:**
1. Install Stripe: `npm install stripe @stripe/stripe-js`
2. Add env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
3. Create pricing products in Stripe dashboard
4. Add routes:
   - `POST /api/create-checkout-session` - Redirect to Stripe
   - `POST /api/stripe-webhook` - Handle subscription events
5. Update membership page to redirect to Stripe

**Files:**
- `server/routes.ts` - Add Stripe routes
- `server/stripe.ts` (NEW) - Stripe integration
- `client/src/pages/membership.tsx` - Wire up checkout button
- `.env` - Add Stripe keys

#### Option B: Keep Toggle (Demo Mode)
**Current:** `/api/toggle-plus` lets you manually set tier
**Good for:** MVP, testing, limited launch
**Bad for:** Production revenue

---

## 📁 File Structure (New Files)

```
client/src/
  components/
    premium-gate.tsx          # Reusable paywall UI
    trend-chart.tsx           # Score/accuracy charts
    category-insights.tsx     # Category deep dives
    personality-card.tsx      # Pro insights
  pages/
    insights.tsx              # Pro-only personality page

server/
  stripe.ts                   # Stripe integration (Phase 3)
```

---

## 🎯 PR Breakdown

### PR #1: Premium Gate Infrastructure (2-3 hours)

**Goal:** Add paywall components, no content changes yet

**Files:**
- ✅ Create: `client/src/components/premium-gate.tsx`
- ✅ Create: `client/src/hooks/use-premium.ts`
- ✅ Update: `server/postgres-storage.ts` - Sync `isPlus` with `membershipTier`

**Acceptance Criteria:**
- `<PremiumGate tier="plus">` component works
- `usePremium()` hook returns `{ isPremium, tier, canAccess(feature) }`
- No UI changes yet (just infrastructure)

**Code Example:**
```tsx
// components/premium-gate.tsx
export function PremiumGate({
  tier = "plus",
  feature,
  children
}: PremiumGateProps) {
  const { canAccess } = usePremium();

  if (canAccess(tier)) return <>{children}</>;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90 backdrop-blur-sm" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6">
          <Lock className="w-12 h-12 mx-auto mb-4" />
          <h3 className="font-bold mb-2">{feature}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Available with {tier === "pro" ? "Pro" : "Plus"}
          </p>
          <Button onClick={() => navigate("/membership")}>
            Upgrade Now
          </Button>
        </div>
      </div>
      <div className="blur-sm pointer-events-none">
        {children}
      </div>
    </Card>
  );
}
```

---

### PR #2: Extended History & Trends (3-4 hours)

**Goal:** Show full game history and score trends (Plus+)

**Files:**
- ✅ Update: `client/src/pages/stats.tsx`
- ✅ Create: `client/src/components/trend-chart.tsx`
- ✅ Update: Add recharts: `npm install recharts`

**Changes:**
1. **Stats Page:**
   - Free: Last 7 games (unchanged)
   - Plus/Pro: Add "View All History" button → expands to show all games
   - Plus/Pro: Add "Score Trends" section with line chart

2. **Trend Chart:**
   - X-axis: Date
   - Y-axis: Score (0-500)
   - Line: Score over time
   - Dots: Individual games
   - Tooltip: Shows date, score, accuracy

**Acceptance Criteria:**
- Free users see 7 games, Plus+ see all games
- Trend chart renders for Plus+ only
- Chart is interactive (hover tooltips)
- Empty state if < 3 games

**Visual:**
```
Free Users:
┌──────────────────────────┐
│ Recent Games (Last 7)    │
│ [Game 1]                 │
│ [Game 2]                 │
│ ...                      │
└──────────────────────────┘

Plus/Pro Users:
┌──────────────────────────┐
│ Score Trends            │
│  [Line Chart]           │
└──────────────────────────┘
┌──────────────────────────┐
│ All Games (35)           │
│ [Filter: Date ▼]         │
│ [Game 1] [Game 2] ...    │
└──────────────────────────┘
```

---

### PR #3: Category Deep Dives (2-3 hours)

**Goal:** Show detailed category analysis (Plus+)

**Files:**
- ✅ Update: `client/src/pages/stats.tsx`
- ✅ Create: `client/src/components/category-insights.tsx`

**Features:**
1. **Strengths Section (Top 3 Categories)**
   - Icon + name
   - Accuracy %
   - "Keep it up!" message

2. **Improvement Opportunities (Bottom 3)**
   - Icon + name
   - Accuracy %
   - Specific tip (based on category)

3. **Trend Indicators**
   - 📈 Improving (accuracy up > 5% in last 5 games)
   - 📉 Declining (accuracy down > 5%)
   - ➡️ Stable

**Acceptance Criteria:**
- Requires Plus or Pro
- Shows top 3 and bottom 3 categories
- Provides actionable tips
- Empty state if < 10 games played

**Tips Database:**
```ts
const CATEGORY_TIPS = {
  tech: "Consider setting a 24-hour rule before tech purchases.",
  scam: "Always verify sender URLs before clicking links.",
  debt: "Focus on high-interest debt first (avalanche method).",
  // ... etc
};
```

---

### PR #4: "What Your Choices Say" (Pro Only) (4-5 hours)

**Goal:** Personality insights based on answer patterns

**Files:**
- ✅ Create: `client/src/pages/insights.tsx`
- ✅ Create: `client/src/lib/personality-analyzer.ts`
- ✅ Update: `client/src/App.tsx` - Add `/insights` route

**Personality Dimensions (0-100 scale):**
1. **Risk Tolerance:** Conservative ↔ Aggressive
   - Based on: Investing, debt, emergency fund questions
2. **Spending Style:** Saver ↔ Spender
   - Based on: Lifestyle, tech, travel questions
3. **Scam Awareness:** Trusting ↔ Skeptical
   - Based on: Scam questions
4. **Time Horizon:** Present ↔ Future
   - Based on: Saving, investing, debt questions

**Money Personality Types (8 Archetypes):**
- 🦸 "The Wealth Builder" (high future, low spending)
- 🎯 "The Calculated Risk-Taker" (high risk, high future)
- 🛡️ "The Safety Seeker" (low risk, high future)
- 🎨 "The Balanced Optimist" (moderate on all)
- 🎉 "The YOLO Spender" (high spending, low future)
- 😰 "The Anxious Saver" (low risk, high saving)
- 🚀 "The Growth Chaser" (high risk, high spending)
- 🧘 "The Zen Minimalist" (low spending, low risk)

**Analysis Algorithm:**
```ts
function analyzePersonality(gameHistory: GameHistoryEntry[]) {
  // Calculate dimension scores
  const riskTolerance = calculateRiskScore(gameHistory);
  const spendingStyle = calculateSpendingScore(gameHistory);
  const scamAwareness = calculateScamScore(gameHistory);
  const timeHorizon = calculateTimeScore(gameHistory);

  // Map to archetype
  const archetype = mapToArchetype({
    riskTolerance,
    spendingStyle,
    scamAwareness,
    timeHorizon,
  });

  return {
    archetype,
    dimensions: { ... },
    strengths: [...],
    blindSpots: [...],
    recommendations: [...],
  };
}
```

**UI Layout:**
```
┌────────────────────────────────────┐
│  🦸 You're a "Wealth Builder"      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  You prioritize long-term growth  │
│  and avoid unnecessary spending.   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Your Money Personality            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  Risk Tolerance:   ●●●○○ (55%)     │
│  Spending Style:   ●●○○○ (35%)     │
│  Scam Awareness:   ●●●●● (90%)     │
│  Time Horizon:     ●●●●○ (80%)     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Strengths                         │
│  • Great at spotting scams         │
│  • Strong long-term thinking       │
│  • Disciplined with spending       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Blind Spots                       │
│  • May miss growth opportunities   │
│  • Could be too conservative       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│  Recommendations                   │
│  1. Consider diversifying risk     │
│  2. Set aside fun money budget     │
│  3. Learn about index funds        │
└────────────────────────────────────┘
```

**Acceptance Criteria:**
- Only accessible to Pro users
- Requires 20+ games for accurate analysis
- Shows personality archetype with description
- 4 dimension scores visualized
- Actionable recommendations

---

### PR #5: Payment Integration (Optional, 6-8 hours)

**Goal:** Real Stripe subscriptions (only if launching for revenue)

**Decision Point:** Skip this if you're not ready to charge real money yet.

**Files:**
- ✅ Create: `server/stripe.ts`
- ✅ Update: `server/routes.ts`
- ✅ Update: `client/src/pages/membership.tsx`
- ✅ Create: `.env.local` with Stripe keys

**Stripe Setup:**
1. Create Stripe account
2. Add products:
   - Plus: $4.99/month (recurring)
   - Pro: $9.99/month (recurring)
3. Copy API keys to `.env`
4. Set up webhook endpoint: `https://yourdomain.com/api/stripe-webhook`

**Implementation:**
```ts
// server/stripe.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(
  userId: string,
  tier: 'plus' | 'pro'
) {
  const priceId = tier === 'plus'
    ? process.env.STRIPE_PLUS_PRICE_ID
    : process.env.STRIPE_PRO_PRICE_ID;

  const session = await stripe.checkout.sessions.create({
    customer_email: 'user@example.com', // Get from user
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/membership?success=true`,
    cancel_url: `${process.env.APP_URL}/membership?canceled=true`,
    metadata: { userId, tier },
  });

  return session.url;
}

export async function handleWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, tier } = session.metadata;
      await storage.updateMembershipTier(userId, tier);
      break;

    case 'customer.subscription.deleted':
      // Downgrade to free
      break;
  }
}
```

**Routes:**
```ts
// POST /api/create-checkout-session
app.post("/api/create-checkout-session", async (req, res) => {
  const { tier } = req.body;
  const userId = req.userId!;

  const url = await createCheckoutSession(userId, tier);
  res.json({ url });
});

// POST /api/stripe-webhook
app.post("/api/stripe-webhook", async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  await handleWebhook(event);
  res.json({ received: true });
});
```

**UI Changes:**
```tsx
// membership.tsx
const handleUpgrade = async (tier: 'plus' | 'pro') => {
  const { url } = await fetch('/api/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  }).then(r => r.json());

  window.location.href = url; // Redirect to Stripe
};
```

---

## 🧪 Testing Checklist

### Feature Gating
- [ ] Free users see paywall on premium features
- [ ] Plus users can access Plus features
- [ ] Pro users can access all features
- [ ] Paywall button navigates to `/membership`
- [ ] Upgrade modal shows correct tier highlights

### Extended History
- [ ] Free users see only 7 games
- [ ] Plus users see all games
- [ ] Pagination works (if > 20 games)
- [ ] Empty state shows for new users

### Trend Charts
- [ ] Chart renders with correct data
- [ ] Tooltips show on hover
- [ ] Empty state for < 3 games
- [ ] Chart is responsive (mobile friendly)

### Category Insights
- [ ] Shows top 3 and bottom 3 categories
- [ ] Tips are relevant to category
- [ ] Trend indicators are accurate
- [ ] Empty state for < 10 games

### Personality Insights
- [ ] Only Pro users can access
- [ ] Requires 20+ games
- [ ] Archetype matches behavior
- [ ] Recommendations are actionable
- [ ] Dimensions are visualized correctly

### Payment (If Implemented)
- [ ] Stripe checkout redirects correctly
- [ ] Webhook upgrades membership tier
- [ ] User sees success message
- [ ] Canceled checkout returns to membership page
- [ ] Subscription cancellation downgrades tier

---

## 💰 Revenue Projections

### Assumptions
- 10,000 MAU (monthly active users)
- 5% conversion to Plus ($4.99/mo)
- 1% conversion to Pro ($9.99/mo)

### Monthly Revenue
```
Plus:  10,000 × 5%  × $4.99 = $2,495
Pro:   10,000 × 1%  × $9.99 = $999
Total: $3,494/month = $41,928/year
```

### At 100,000 MAU
```
Plus:  100,000 × 5%  × $4.99 = $24,950
Pro:   100,000 × 1%  × $9.99 = $9,990
Total: $34,940/month = $419,280/year
```

---

## 📊 Success Metrics

### Conversion Funnel
1. **Paywall Views:** Track `paywall_viewed` ✅ (already implemented)
2. **Upgrade Clicks:** Track `purchase_initiated` ✅ (already implemented)
3. **Checkout Started:** Stripe session created
4. **Subscription Active:** Webhook received

### Target Metrics
- **Paywall CTR:** 15%+ (views → clicks)
- **Checkout Conversion:** 30%+ (clicks → active)
- **Overall Conversion:** 5%+ (DAU → paying)
- **Churn Rate:** < 5% monthly

### Analytics to Track
- Most viewed premium features (which paywall gets most views?)
- Conversion by feature (which feature drives upgrades?)
- Upgrade timing (how many games before upgrade?)
- Retention by tier (do Plus/Pro users stay longer?)

---

## 🎓 Marketing Copy

### Homepage Teasers (Free Users)
```
"Want to see your full journey? 📈
Unlock extended history with Plus"

"Curious what your choices say about you? 🧠
Get personality insights with Pro"

"Track your improvement over time 📊
View trends and analytics with Plus"
```

### Paywall Messages

**Extended History:**
> 🔒 **Unlock Your Full Journey**
> Track all your games, not just the last 7.
> See how far you've come!
> **Upgrade to Plus →**

**Trend Charts:**
> 🔒 **Visualize Your Progress**
> See your score trends over time.
> Identify patterns and celebrate wins!
> **Upgrade to Plus →**

**Category Insights:**
> 🔒 **Master Every Category**
> Get personalized tips for your weakest areas.
> Turn blind spots into strengths!
> **Upgrade to Plus →**

**Personality Insights:**
> 🔒 **Discover Your Money Personality**
> What do your choices say about you?
> Unlock deep insights and recommendations!
> **Upgrade to Pro →**

### Membership Page Bullets

**Plus Benefits:**
- ✨ Unlimited freeze tokens
- 📈 Extended game history (30+ games)
- 📊 Score trend charts
- 🎯 Category performance deep dives
- 🛡️ Streak buyback (1x/month)
- 📅 Late pass - play yesterday
- 🎨 Gold badge frames

**Pro Benefits (Everything in Plus +):**
- 🧠 "What your choices say about you"
- 🤝 Compare with friends & community
- 🤖 AI Money Coach
- 📧 Weekly & monthly reports
- 🎯 2x scenarios daily (10 questions)
- 📊 Advanced statistics & predictions
- 👑 Exclusive Pro badges & avatars

---

## 🚀 Launch Plan

### Week 1: Soft Launch (Free → Plus Testing)
- Ship PR #1-3 (gating + extended history + trends)
- Use `/api/toggle-plus` for beta testers
- Collect feedback on premium features
- Measure: Paywall views, hypothetical conversion intent

### Week 2: Content Polish
- Refine paywall copy based on feedback
- Add more category tips
- Improve chart UX
- A/B test pricing ($4.99 vs $5.99)

### Week 3: Payment Integration (Optional)
- Ship PR #5 (Stripe) if ready for revenue
- Test checkout flow end-to-end
- Set up webhook monitoring

### Week 4: Public Launch
- Announce Plus tier on homepage
- Email existing users about new features
- Track conversion metrics
- Monitor churn signals

---

## 🎯 Key Decision Points

### 1. Launch with or without payments?
**Option A: Ship PR #1-4 now, delay payments**
- ✅ Validate features first
- ✅ Build waitlist
- ✅ Refine based on feedback
- ❌ No revenue yet

**Option B: Build everything including Stripe**
- ✅ Start earning immediately
- ❌ More complex
- ❌ Risk shipping untested features

**Recommendation:** **Option A** - Ship features first, add payments once validated.

### 2. How to handle existing users?
**Option A: Grandfather early users (free Plus for 6 months)**
- ✅ Rewards loyalty
- ✅ Good PR
- ❌ Lost revenue

**Option B: Everyone starts free, upgrade anytime**
- ✅ Fair
- ❌ May disappoint early supporters

**Recommendation:** **Option A** - Grandfather the first 1,000 users.

### 3. Pricing strategy?
**Current:** Plus $4.99, Pro $9.99
**Alternative:** Plus $3.99, Pro $7.99 (cheaper)
**Alternative:** Annual discount (15% off)

**Recommendation:** Start with $4.99/$9.99, add annual later.

---

## 📝 Next Steps

1. **Review this plan** - Confirm approach with team
2. **Choose launch strategy** - With or without payments?
3. **Start with PR #1** - Premium gate infrastructure (2-3 hours)
4. **Iterate based on data** - Ship, measure, improve
5. **Add payments when ready** - Not required for MVP

---

**Questions? Concerns? Let's discuss!**

Created by: Claude Code
Last Updated: 2026-02-08
