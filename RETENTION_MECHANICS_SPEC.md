# Retention Mechanics - Implementation Plan

## Overview
3 retention mechanics that use existing backend data - **NO schema changes required**.

All leverage data already in `User` schema:
- `freezeTokens`, `frozenDates`, `lastPlayedDate`
- `streak`, `highestStreak`, `hadPreviousStreak`
- `gameHistory`, `todayResult`
- `badges`, `gamesPlayed`

---

## Mechanic #1: Streak Shield (Auto-Freeze Alert)

### What It Is
Before midnight on a missed day, proactively **offer to use a freeze token** to save the streak. Think of it as "Duolingo's streak repair" but preemptive.

### Value Proposition
- **Prevents accidental churn**: Users forget, life happens
- **Increases freeze token value**: Makes them feel useful
- **Creates habit loop**: Reinforces daily check-in behavior

### Data Needed

#### Existing Backend Data (no changes)
```typescript
// From User schema:
- freezeTokens: number          // Available shields
- frozenDates: string[]         // Already frozen dates
- lastPlayedDate: string | null // Last play timestamp
- todayResult: UserGameResult | null // Did they play today?
- streak: number                // Current streak to protect
```

#### Frontend-Only State
```typescript
interface StreakShieldState {
  showAlert: boolean;           // Show the modal?
  timeUntilMidnight: number;    // Countdown timer (ms)
  canAutoFreeze: boolean;       // Has tokens + hasn't played
}
```

### UI Entry Points

#### 1. Home Screen Banner (Priority)
```
┌─────────────────────────────────────────────────┐
│ ⚠️ Your streak is at risk!                      │
│                                                 │
│ ⏰ 3 hours until midnight                       │
│ 🔥 You haven't played today                     │
│                                                 │
│ [Use Streak Shield (1 token)] [Play Now]      │
└─────────────────────────────────────────────────┘
```

**When to show:**
- After 6pm local time
- `user.todayResult === null`
- `user.freezeTokens > 0`
- `user.streak > 0`

**Location:** Below header, above "Today's Drop" card

#### 2. Late Night Modal (8pm-11:59pm)
Full-screen takeover (like Duolingo's streak saver):

```
┌─────────────────────────────────────────────────┐
│                    🛡️                           │
│                                                 │
│         Protect Your Streak?                    │
│                                                 │
│   Your 🔥 12-day streak will end at midnight    │
│   Use a Streak Shield to protect it?            │
│                                                 │
│              ┌──────────────┐                  │
│              │ 🛡️ Use Shield │                  │
│              │  (1 token)   │                  │
│              └──────────────┘                  │
│                                                 │
│   ┌────────────────┐  ┌────────────────┐      │
│   │  Play Now      │  │  Skip Today    │      │
│   └────────────────┘  └────────────────┘      │
│                                                 │
│         ⏰ 2 hours, 34 minutes left             │
└─────────────────────────────────────────────────┘
```

**When to show:**
- 8:00pm-11:59pm local time
- First app open after 8pm
- Same conditions as banner

**Priority:** High (blocks UI until dismissed)

#### 3. Settings Preview
Show shield status:
```
Streak Protection
🛡️ 3 Streak Shields available
✓ Auto-shield enabled (after 8pm)
```

### Edge Cases

#### Timezone Handling
```typescript
function getTimeUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function shouldShowShieldAlert(user: User): boolean {
  const now = new Date();
  const hour = now.getHours();

  // Show between 6pm (18:00) and midnight
  if (hour < 18) return false;

  // Check if already played today
  const today = now.toISOString().split('T')[0];
  if (user.lastPlayedDate === today) return false;

  // Check if has tokens
  if (user.freezeTokens <= 0) return false;

  // Check if has active streak
  if (user.streak === 0) return false;

  return true;
}
```

#### Missed Days
```typescript
function canUseShieldForYesterday(user: User): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Can't use shield if already frozen yesterday
  if (user.frozenDates.includes(yesterdayStr)) return false;

  // Can't use if already played today (too late)
  const today = new Date().toISOString().split('T')[0];
  if (user.lastPlayedDate === today) return false;

  // Must have missed yesterday specifically
  return user.lastPlayedDate !== yesterdayStr;
}
```

#### Reinstall/New Device
```typescript
// Use server-side time only
// Client time is for UI countdown only
// API call to useStreakFreeze() handles actual logic
```

### Implementation Steps (PR-Sized)

#### PR #1: Core Logic & Banner (2-3 hours)
**Files:**
- `client/src/hooks/use-streak-shield.ts` - Hook to check shield status
- `client/src/components/streak-shield-banner.tsx` - Home screen banner
- `client/src/pages/home.tsx` - Add banner to home

**Hook:**
```typescript
// client/src/hooks/use-streak-shield.ts
export function useStreakShield() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnight());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const shouldShow = useMemo(() => {
    if (!user) return false;
    return shouldShowShieldAlert(user);
  }, [user]);

  const useShield = useMutation({
    mutationFn: () => apiRequest("POST", "/api/streak-freeze"),
    onSuccess: () => {
      toast({ title: "Streak protected! 🛡️" });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  return {
    shouldShow,
    timeLeft,
    tokensAvailable: user?.freezeTokens || 0,
    currentStreak: user?.streak || 0,
    useShield: useShield.mutate,
    isUsing: useShield.isPending,
  };
}
```

**Testing:**
- [ ] Banner shows after 6pm if not played
- [ ] Banner hides if no tokens
- [ ] Banner hides if already played
- [ ] Countdown updates every minute
- [ ] "Use Shield" calls API correctly
- [ ] Banner disappears after use

#### PR #2: Late Night Modal (2 hours)
**Files:**
- `client/src/components/streak-shield-modal.tsx` - Full-screen modal
- `client/src/App.tsx` - Show modal on app load after 8pm

**Modal:**
```typescript
// client/src/components/streak-shield-modal.tsx
export function StreakShieldModal() {
  const { shouldShow, timeLeft, currentStreak, useShield } = useStreakShield();
  const [dismissed, setDismissed] = useState(false);

  // Only show between 8pm-midnight on first load
  const hour = new Date().getHours();
  const shouldShowModal = shouldShow && hour >= 20 && !dismissed;

  if (!shouldShowModal) return null;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-6 py-8">
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3 }}
          >
            <Shield className="w-20 h-20 text-blue-500" />
          </motion.div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Protect Your Streak?</h2>
            <p className="text-muted-foreground">
              Your 🔥 <span className="font-bold text-orange-500">{currentStreak}-day</span> streak will end at midnight
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => {
              useShield();
              setDismissed(true);
            }}
            className="w-full"
          >
            🛡️ Use Shield (1 token)
          </Button>

          <div className="flex gap-2 w-full">
            <Button variant="outline" size="lg" onClick={() => navigate("/game")} className="flex-1">
              Play Now
            </Button>
            <Button variant="ghost" size="lg" onClick={() => setDismissed(true)} className="flex-1">
              Skip Today
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            ⏰ {formatTimeLeft(timeLeft)} left
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Testing:**
- [ ] Modal only shows 8pm-11:59pm
- [ ] Modal only shows once per session
- [ ] All 3 buttons work correctly
- [ ] Animation plays smoothly
- [ ] Countdown displays correctly

#### PR #3: Settings Integration (1 hour)
**Files:**
- `client/src/pages/settings.tsx` - Add shield status card

**Settings Card:**
```typescript
<Card>
  <CardHeader>
    <CardTitle>Streak Protection</CardTitle>
    <CardDescription>Automatic shield alerts to protect your streak</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Streak Shields</span>
        </div>
        <span className="text-2xl font-bold">{user.freezeTokens}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Auto-alert enabled</span>
        <Badge>After 6pm</Badge>
      </div>

      <Button variant="outline" size="sm" onClick={() => navigate("/streak-insurance")}>
        Get More Shields
      </Button>
    </div>
  </CardContent>
</Card>
```

**Testing:**
- [ ] Token count displays correctly
- [ ] Link to streak insurance works
- [ ] Card updates after using shield

---

## Mechanic #2: Weekly Recap (Engagement Summary)

### What It Is
Every Monday, show a **beautiful summary of last week's performance**. Like Spotify Wrapped but weekly. Celebrates consistency, identifies growth areas, and sets weekly goals.

### Value Proposition
- **Recognition**: Celebrates effort even if streak broke
- **Insights**: Shows patterns ("You're strongest on Tuesdays!")
- **Goal Setting**: Creates weekly mini-habits
- **Shareability**: Social proof ("I'm on a 🔥 streak!")

### Data Needed

#### Existing Backend Data (no changes)
```typescript
// From User schema:
- gameHistory: GameHistoryEntry[] // Last 30 days of games
  - date: string
  - score: number
  - correctAnswers: number
  - categoryBreakdown: { category, correct, total }[]
  - timeSpent: number
- streak: number
- highestStreak: number
- categoryStats: CategoryStats[]
```

#### Frontend-Only Calculations
```typescript
interface WeeklyRecapData {
  weekStart: string;           // Monday's date
  weekEnd: string;             // Sunday's date
  daysPlayed: number;          // 0-7
  totalScore: number;          // Sum of all scores
  avgAccuracy: number;         // Average correct %
  bestDay: string;             // "Monday"
  bestCategory: string;        // "Tech & Gadgets"
  worstCategory: string;       // "Debt & Loans"
  streakStatus: "maintained" | "grew" | "broke";
  compareToLastWeek: {
    scoreDiff: number;         // +120 or -50
    accuracyDiff: number;      // +5% or -2%
  };
}
```

### UI Entry Points

#### 1. Monday Morning Splash Screen
Full-screen celebration (like Instagram Stories):

```
┌─────────────────────────────────────────────────┐
│                    📊                           │
│                                                 │
│              Your Weekly Recap                  │
│             Jan 6 - Jan 12, 2025                │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │
│  │   🔥 You played 6 out of 7 days!        │  │
│  │                                          │  │
│  │   📈 Total Score: 1,245                 │  │
│  │      ↑ +215 from last week              │  │
│  │                                          │  │
│  │   🎯 Accuracy: 78%                      │  │
│  │      ↑ +5% from last week               │  │
│  │                                          │  │
│  │   ⭐ Best Day: Tuesday (92% accurate)   │  │
│  │                                          │  │
│  │   💪 Strongest: Tech & Gadgets (85%)    │  │
│  │   🎓 Room to Grow: Investing (62%)      │  │
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│            [Share Your Week 📱]                 │
│            [Set This Week's Goal]               │
│            [Close]                              │
└─────────────────────────────────────────────────┘
```

**When to show:**
- Monday 12:00am - 11:59pm
- First app open on Monday
- Only if played at least 1 game last week

**Location:** Full-screen modal (can't dismiss until viewed)

#### 2. Stats Page - Weekly Tab
Add "Weekly" tab next to "All Time":

```
[All Time] [Weekly] [Daily]

This Week
─────────────
🔥 Streak: 12 days
📅 Games Played: 4/7
📈 Avg Score: 180
🎯 Accuracy: 75%

Last Week
─────────────
📅 Games Played: 6/7
📈 Total Score: 1,245
🎯 Accuracy: 78%

[View Full Recap]
```

**When to show:** Always available, shows current week + last week

#### 3. Home Screen Mini-Card (Tuesday-Sunday)
After Monday, show condensed version:

```
┌─────────────────────────────────────────────────┐
│ This Week's Progress                            │
│ ████████░░ 4/7 days • 745 points                │
│ [View Recap]                                    │
└─────────────────────────────────────────────────┘
```

**Location:** Below streak counter on home

### Edge Cases

#### Timezone Handling
```typescript
function getWeekBoundaries(timezone: string = 'local'): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ...

  // Calculate last Monday
  const monday = new Date(now);
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);

  // Calculate last Sunday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
}

function getLastWeekGames(gameHistory: GameHistoryEntry[]): GameHistoryEntry[] {
  const { start, end } = getWeekBoundaries();

  return gameHistory.filter(game => {
    return game.date >= start && game.date <= end;
  });
}
```

#### First Week (< 7 Days Data)
```typescript
function generateRecap(gameHistory: GameHistoryEntry[]): WeeklyRecapData | null {
  const lastWeekGames = getLastWeekGames(gameHistory);

  // Need at least 1 game to show recap
  if (lastWeekGames.length === 0) {
    return null;
  }

  // Show recap even if only played 1-2 days
  // Celebrate small wins: "You played 2 days! Let's make it 4 this week."

  return calculateRecapData(lastWeekGames);
}
```

#### Reinstall/New Device
```typescript
// All data comes from gameHistory (server-side)
// No local state needed
// On Monday, fetch user data and calculate recap from gameHistory
```

#### No Games Last Week
```typescript
// Show encouragement message instead:
"Welcome back! Start a new week strong. 💪"
[Play Today's Drop]
```

### Implementation Steps (PR-Sized)

#### PR #1: Data Layer & Calculations (2 hours)
**Files:**
- `client/src/hooks/use-weekly-recap.ts` - Calculate recap data
- `client/src/lib/weekly-recap-utils.ts` - Helper functions

**Hook:**
```typescript
// client/src/hooks/use-weekly-recap.ts
export function useWeeklyRecap() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });
  const [hasViewed, setHasViewed] = useState(false);

  const recapData = useMemo(() => {
    if (!user?.gameHistory) return null;

    const lastWeekGames = getLastWeekGames(user.gameHistory);
    if (lastWeekGames.length === 0) return null;

    return calculateWeeklyRecap(lastWeekGames, user.streak, user.highestStreak);
  }, [user]);

  const shouldShowSplash = useMemo(() => {
    if (!recapData) return false;
    if (hasViewed) return false;

    const now = new Date();
    const isMonday = now.getDay() === 1;

    // Check if already viewed this Monday
    const viewedKey = `recap-viewed-${recapData.weekStart}`;
    const alreadyViewed = localStorage.getItem(viewedKey) === 'true';

    return isMonday && !alreadyViewed;
  }, [recapData, hasViewed]);

  const markAsViewed = useCallback(() => {
    if (!recapData) return;
    const viewedKey = `recap-viewed-${recapData.weekStart}`;
    localStorage.setItem(viewedKey, 'true');
    setHasViewed(true);
  }, [recapData]);

  return {
    recapData,
    shouldShowSplash,
    markAsViewed,
  };
}

function calculateWeeklyRecap(
  games: GameHistoryEntry[],
  currentStreak: number,
  highestStreak: number
): WeeklyRecapData {
  const totalScore = games.reduce((sum, g) => sum + g.score, 0);
  const avgAccuracy = games.reduce((sum, g) =>
    sum + (g.correctAnswers / g.totalQuestions), 0
  ) / games.length;

  // Find best performing day
  const dayScores = games.reduce((acc, game) => {
    const day = new Date(game.date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(game.correctAnswers / game.totalQuestions);
    return acc;
  }, {} as Record<string, number[]>);

  const bestDay = Object.entries(dayScores)
    .map(([day, accuracies]) => ({
      day,
      avgAccuracy: accuracies.reduce((a, b) => a + b) / accuracies.length,
    }))
    .sort((a, b) => b.avgAccuracy - a.avgAccuracy)[0]?.day || "Monday";

  // Category analysis
  const categoryPerformance = new Map<string, { correct: number; total: number }>();
  games.forEach(game => {
    game.categoryBreakdown.forEach(cat => {
      const existing = categoryPerformance.get(cat.category) || { correct: 0, total: 0 };
      existing.correct += cat.correct;
      existing.total += cat.total;
      categoryPerformance.set(cat.category, existing);
    });
  });

  const categoryScores = Array.from(categoryPerformance.entries())
    .map(([cat, stats]) => ({
      category: cat,
      accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const bestCategory = categoryScores[0]?.category || "General";
  const worstCategory = categoryScores[categoryScores.length - 1]?.category || "General";

  // Compare to previous week
  // TODO: Calculate previous week diff

  return {
    weekStart: getWeekBoundaries().start,
    weekEnd: getWeekBoundaries().end,
    daysPlayed: games.length,
    totalScore,
    avgAccuracy: Math.round(avgAccuracy * 100),
    bestDay,
    bestCategory,
    worstCategory,
    streakStatus: currentStreak >= 7 ? "maintained" : currentStreak > 0 ? "grew" : "broke",
    compareToLastWeek: {
      scoreDiff: 0, // Calculate from prev week
      accuracyDiff: 0,
    },
  };
}
```

**Testing:**
- [ ] Correctly identifies last week's games
- [ ] Handles weeks with 1-7 games
- [ ] Calculates best/worst categories
- [ ] Returns null if no games

#### PR #2: Splash Screen UI (3 hours)
**Files:**
- `client/src/components/weekly-recap-splash.tsx` - Full-screen modal
- `client/src/App.tsx` - Show on Monday

**Splash:**
```typescript
// client/src/components/weekly-recap-splash.tsx
export function WeeklyRecapSplash() {
  const { recapData, shouldShowSplash, markAsViewed } = useWeeklyRecap();
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!shouldShowSplash || !recapData) return null;

  const slides = [
    // Slide 1: Overview
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Your Weekly Recap</h2>
      <p className="text-muted-foreground">
        {recapData.weekStart} - {recapData.weekEnd}
      </p>

      <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10">
        <div className="text-center space-y-2">
          <div className="text-6xl font-bold">{recapData.daysPlayed}/7</div>
          <p className="text-lg">Days Played</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Total Score</span>
            <span className="text-2xl font-bold">{recapData.totalScore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Accuracy</span>
            <span className="text-2xl font-bold">{recapData.avgAccuracy}%</span>
          </div>
        </div>
      </Card>
    </div>,

    // Slide 2: Insights
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Your Insights</h2>

      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">Best Day</span>
          </div>
          <p className="text-2xl font-bold">{recapData.bestDay}</p>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="font-semibold">Strongest Category</span>
          </div>
          <p className="text-2xl font-bold">{recapData.bestCategory}</p>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">Room to Grow</span>
          </div>
          <p className="text-2xl font-bold">{recapData.worstCategory}</p>
        </div>
      </Card>
    </div>,

    // Slide 3: Goal Setting
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">This Week's Goal</h2>
      <p className="text-muted-foreground">Let's make this week even better!</p>

      <div className="space-y-4">
        <Button variant="outline" size="lg" className="w-full justify-start">
          Play 7/7 days this week
        </Button>
        <Button variant="outline" size="lg" className="w-full justify-start">
          Improve accuracy by 5%
        </Button>
        <Button variant="outline" size="lg" className="w-full justify-start">
          Master {recapData.worstCategory}
        </Button>
      </div>
    </div>,
  ];

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="py-8"
          >
            {slides[currentSlide]}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  i === currentSlide ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {currentSlide < slides.length - 1 ? (
            <Button onClick={() => setCurrentSlide(prev => prev + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={markAsViewed}>
              Close
            </Button>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={markAsViewed} className="mt-2">
          Share Your Recap 📱
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

**Testing:**
- [ ] Only shows on Monday
- [ ] Only shows once per week
- [ ] Slides advance correctly
- [ ] All data displays correctly
- [ ] Close marks as viewed

#### PR #3: Stats Page Integration (2 hours)
**Files:**
- `client/src/pages/stats.tsx` - Add weekly tab

**Testing:**
- [ ] Weekly tab shows current week
- [ ] Weekly tab shows last week
- [ ] Link to full recap works

---

## Mechanic #3: Comeback Bonus (Re-Engagement Rewards)

### What It Is
When a user loses their streak, give them **bonus rewards** for coming back and rebuilding. Like the "Comeback King" badge but with immediate gratification at milestones (3-day, 7-day, 14-day returns).

### Value Proposition
- **Reduces churn**: Encourages return after break
- **Positive framing**: "You can recover!" vs. "You failed"
- **Progress celebration**: Small wins build momentum
- **Badge unlocking**: Ties to "Comeback King" badge

### Data Needed

#### Existing Backend Data (no changes)
```typescript
// From User schema:
- streak: number                 // Current streak (0 after break)
- highestStreak: number          // Previous best
- hadPreviousStreak: boolean     // Did they have a streak before?
- gameHistory: GameHistoryEntry[] // To detect comeback
- badges: UserBadge[]            // "comeback_king" badge
```

#### Frontend-Only State
```typescript
interface ComebackState {
  isInComebackMode: boolean;     // Lost streak, rebuilding
  comebackDay: number;           // 1, 2, 3... days since restart
  nextMilestone: number;         // 3, 7, or 14
  previousBest: number;          // Highest streak to beat
  rewards: {
    freezeTokens: number;
    badgeProgress: number;
  };
}
```

### UI Entry Points

#### 1. First Day Back - Welcome Card
Show encouraging message when user returns after break:

```
┌─────────────────────────────────────────────────┐
│            👑 Welcome Back! 👑                   │
│                                                 │
│  You lost your 12-day streak, but you can      │
│  rebuild it and become a Comeback King!         │
│                                                 │
│  🎯 Next Milestone: 3 days                      │
│  🎁 Reward: +1 Streak Shield                    │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │        [Start Your Comeback]             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**When to show:**
- `user.streak === 0 or 1`
- `user.highestStreak >= 7` (had a meaningful streak before)
- `user.hadPreviousStreak === true`
- First visit after break

**Location:** Home screen, above Daily Drop card

#### 2. Milestone Celebration Modal
When hitting 3, 7, or 14 days:

```
┌─────────────────────────────────────────────────┐
│                    🎉                           │
│                                                 │
│           Comeback Milestone!                   │
│                                                 │
│   You've rebuilt a 7-day streak!                │
│                                                 │
│           ┌────────────────┐                   │
│           │   🛡️ +2 Shields  │                   │
│           │   👑 Badge +35%  │                   │
│           └────────────────┘                   │
│                                                 │
│  Keep going! Next: 14 days (+3 shields)         │
│                                                 │
│            [Keep Playing]                       │
└─────────────────────────────────────────────────┘
```

**When to show:**
- Right after completing game
- `user.streak === 3, 7, or 14`
- `isInComebackMode === true`

**Location:** Full-screen modal after results

#### 3. Progress Bar on Home
During comeback, show progress:

```
┌─────────────────────────────────────────────────┐
│ 👑 Comeback Progress                            │
│ ████████░░ 7/14 days to next reward             │
│ 🎁 +2 Freeze Tokens • +35% Comeback Badge       │
└─────────────────────────────────────────────────┘
```

**Location:** Below streak counter, replaces normal streak display

### Edge Cases

#### Timezone Handling
```typescript
function detectComebackMode(user: User): ComebackState | null {
  // User must have had a previous streak >= 7
  if (user.highestStreak < 7) return null;

  // Current streak must be rebuilding (1-14 days)
  if (user.streak === 0 || user.streak > 14) return null;

  // Check if this is a genuine comeback (broke streak recently)
  const lastGame = user.gameHistory[user.gameHistory.length - 1];
  if (!lastGame) return null;

  // Calculate days since last break
  // This is approximated based on gameHistory gaps

  return {
    isInComebackMode: true,
    comebackDay: user.streak,
    nextMilestone: user.streak < 3 ? 3 : user.streak < 7 ? 7 : 14,
    previousBest: user.highestStreak,
    rewards: calculateComebackRewards(user.streak),
  };
}

function calculateComebackRewards(currentStreak: number): { freezeTokens: number; badgeProgress: number } {
  if (currentStreak >= 14) {
    return { freezeTokens: 3, badgeProgress: 100 }; // Unlock badge!
  } else if (currentStreak >= 7) {
    return { freezeTokens: 2, badgeProgress: 35 };
  } else if (currentStreak >= 3) {
    return { freezeTokens: 1, badgeProgress: 15 };
  }
  return { freezeTokens: 0, badgeProgress: 0 };
}
```

#### Already Exceeded Previous Best
```typescript
// If user rebuilds past their old record:
if (user.streak > user.highestStreak) {
  // Exit comeback mode
  // Show "New Record!" message instead
  return null;
}
```

#### Missed Days During Comeback
```typescript
// If user breaks streak again during comeback:
if (comebackState.comebackDay === 0) {
  // Show encouragement: "Don't give up! Start again."
  // Reset milestone tracking
}
```

#### Reinstall/New Device
```typescript
// All data from server
// No local state required
// comebackMode calculated on each load from user data
```

### Implementation Steps (PR-Sized)

#### PR #1: Comeback Detection & Logic (2 hours)
**Files:**
- `client/src/hooks/use-comeback-mode.ts` - Detect and track comeback
- `client/src/lib/comeback-rewards.ts` - Reward calculations

**Hook:**
```typescript
// client/src/hooks/use-comeback-mode.ts
export function useComebackMode() {
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });

  const comebackState = useMemo(() => {
    if (!user) return null;
    return detectComebackMode(user);
  }, [user]);

  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    if (!comebackState) return;

    // Check if user just hit a milestone
    const milestones = [3, 7, 14];
    if (milestones.includes(user?.streak || 0)) {
      // Check if we've already celebrated this milestone
      const key = `milestone-${user?.streak}`;
      const celebrated = sessionStorage.getItem(key);

      if (!celebrated) {
        // Show milestone modal
        sessionStorage.setItem(key, 'true');
      }
    }
  }, [comebackState, user?.streak]);

  return {
    isInComebackMode: !!comebackState,
    comebackState,
    shouldShowWelcome: comebackState && !hasSeenWelcome && user?.streak === 1,
    markWelcomeAsSeen: () => setHasSeenWelcome(true),
  };
}
```

**Testing:**
- [ ] Detects comeback mode correctly
- [ ] Identifies milestones (3, 7, 14 days)
- [ ] Calculates rewards correctly
- [ ] Exits comeback mode after 14 days

#### PR #2: Welcome & Progress UI (2 hours)
**Files:**
- `client/src/components/comeback-welcome-card.tsx` - Welcome back card
- `client/src/components/comeback-progress-bar.tsx` - Progress display
- `client/src/pages/home.tsx` - Add components

**Welcome Card:**
```typescript
// client/src/components/comeback-welcome-card.tsx
export function ComebackWelcomeCard() {
  const { shouldShowWelcome, comebackState, markWelcomeAsSeen } = useComebackMode();

  if (!shouldShowWelcome || !comebackState) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20">
        <div className="text-center space-y-4">
          <div className="text-4xl">👑</div>
          <h3 className="text-2xl font-bold">Welcome Back!</h3>
          <p className="text-muted-foreground">
            You lost your {comebackState.previousBest}-day streak, but you can
            rebuild it and become a <span className="font-bold text-purple-500">Comeback King</span>!
          </p>

          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span>Next: {comebackState.nextMilestone} days</span>
            </div>
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-500" />
              <span>+{comebackState.rewards.freezeTokens} Shield</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              markWelcomeAsSeen();
              navigate("/game");
            }}
          >
            Start Your Comeback
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
```

**Progress Bar:**
```typescript
// client/src/components/comeback-progress-bar.tsx
export function ComebackProgressBar() {
  const { isInComebackMode, comebackState } = useComebackMode();

  if (!isInComebackMode || !comebackState) return null;

  const progress = (comebackState.comebackDay / comebackState.nextMilestone) * 100;

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-500" />
            Comeback Progress
          </span>
          <span className="text-xs text-muted-foreground">
            {comebackState.comebackDay}/{comebackState.nextMilestone} days
          </span>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>🎁 +{comebackState.rewards.freezeTokens} Shields</span>
          <span>•</span>
          <span>👑 +{comebackState.rewards.badgeProgress}% Badge</span>
        </div>
      </div>
    </Card>
  );
}
```

**Testing:**
- [ ] Welcome shows on first day back
- [ ] Progress bar displays correctly
- [ ] Progress bar updates after playing
- [ ] Disappears after 14 days

#### PR #3: Milestone Celebration (2 hours)
**Files:**
- `client/src/components/comeback-milestone-modal.tsx` - Celebration modal
- `client/src/pages/results.tsx` - Show after game complete

**Milestone Modal:**
```typescript
// client/src/components/comeback-milestone-modal.tsx
export function ComebackMilestoneModal({
  milestone,
  rewards,
  onClose,
}: {
  milestone: 3 | 7 | 14;
  rewards: { freezeTokens: number; badgeProgress: number };
  onClose: () => void;
}) {
  const { fireLarge } = useConfetti();

  useEffect(() => {
    fireLarge();
  }, []);

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-6 py-8">
          <motion.div
            animate={{
              rotate: [0, -10, 10, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.6 }}
          >
            <Crown className="w-24 h-24 text-purple-500" />
          </motion.div>

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Comeback Milestone!</h2>
            <p className="text-lg text-muted-foreground">
              You've rebuilt a <span className="font-bold text-purple-500">{milestone}-day</span> streak!
            </p>
          </div>

          <Card className="w-full p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-6 h-6 text-blue-500" />
                <span className="text-2xl font-bold">+{rewards.freezeTokens} Streak Shields</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold">+{rewards.badgeProgress}% Comeback Badge</span>
              </div>
            </div>
          </Card>

          {milestone < 14 && (
            <p className="text-sm text-muted-foreground">
              Keep going! Next milestone: {milestone === 3 ? 7 : 14} days
            </p>
          )}

          {milestone === 14 && (
            <Badge variant="default" className="text-lg px-4 py-2">
              🎉 Comeback King Badge Unlocked!
            </Badge>
          )}

          <Button size="lg" className="w-full" onClick={onClose}>
            Keep Playing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Testing:**
- [ ] Modal shows at 3, 7, 14 days
- [ ] Only shows once per milestone
- [ ] Confetti fires on mount
- [ ] Rewards display correctly
- [ ] Badge unlock shows at day 14

---

## Summary Table

| Mechanic | Backend Changes | Frontend Effort | Retention Impact | Risk |
|----------|----------------|-----------------|------------------|------|
| **Streak Shield** | ✅ None (uses `freezeTokens`) | 6-7 hours (3 PRs) | High - Prevents accidental churn | Low |
| **Weekly Recap** | ✅ None (uses `gameHistory`) | 7-8 hours (3 PRs) | Medium - Engagement & insights | Low |
| **Comeback Bonus** | ✅ None (uses `streak`, `badges`) | 6-7 hours (3 PRs) | High - Re-engages lost users | Low |

**Total Effort**: ~20-22 hours (9 PRs)
**Backend Changes**: 0 (all frontend-only)
**Expected Retention Lift**: 15-25% (based on similar mechanics in Duolingo, Streaks)

---

## Implementation Order

### Week 1: Streak Shield
- Quick win, prevents churn
- Highest immediate impact
- Builds on existing freeze token system

### Week 2: Comeback Bonus
- Re-engages churned users
- Complements streak shield
- Unlocks "Comeback King" badge

### Week 3: Weekly Recap
- Slower cadence (weekly vs daily)
- Adds depth to engagement
- Creates shareability

---

## Success Metrics

### Streak Shield
- **Activation Rate**: % of users who see alert and use shield
- **Churn Prevention**: % reduction in streak breaks after 8pm
- **Token Value**: Increase in perceived value of freeze tokens

### Weekly Recap
- **View Rate**: % of users who view recap on Monday
- **Share Rate**: % who share recap externally
- **Retention**: D7 retention of users who view recap vs. don't

### Comeback Bonus
- **Return Rate**: % of churned users who return within 7 days
- **Rebuild Rate**: % who reach 7-day streak after break
- **Badge Unlock**: % who unlock "Comeback King" badge

---

## Future Enhancements (Beyond Scope)

1. **Push Notifications** for Streak Shield (requires backend)
2. **Social Sharing** for Weekly Recap (requires share API)
3. **Leaderboard Integration** for Comeback Mode (show other comebacks)
4. **Personalized Goals** based on user history (ML-powered)
5. **Streak Insurance Upgrades** (auto-shield for Plus users)
