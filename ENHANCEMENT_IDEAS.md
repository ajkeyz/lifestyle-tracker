# ✨ UI Enhancement & Feature Ideas

**Date:** 2026-02-08
**Purpose:** Build on new polish features to create premium experiences
**Status:** 15 Enhancement Opportunities Identified

---

## 🎨 VISUAL ENHANCEMENTS

### Enhancement #1: Animated Gradient Stat Cards
**Build On:** Glass cards, gradient animations
**Effort:** Low
**Impact:** High

**Idea:**
Make the stat cards even more premium by adding animated gradient borders:

```tsx
import { GradientBorder } from "@/components/gradient-border";

<GradientBorder animated colors="primary" rounded="xl">
  <Card className="glass-card hover-lift">
    <CardContent className="p-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500
                        shadow-lg shadow-blue-500/30 animate-pulse-glow">
          <Target className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold gradient-text-animated">{user.gamesPlayed}</p>
          <p className="text-xs text-muted-foreground">Games Played</p>
        </div>
      </div>
    </CardContent>
  </Card>
</GradientBorder>
```

**Visual Effect:**
- Rotating rainbow border around stat cards
- Gradient text for numbers
- Pulsing glow on icons
- Premium, eye-catching appearance

**When:** Use for milestone achievements (10 games, 50 games, 100 games, etc.)

---

### Enhancement #2: Streak Milestone Celebration
**Build On:** Confetti, glass effects, animations
**Effort:** Medium
**Impact:** High

**Idea:**
When user hits streak milestones (7, 14, 30, 100 days), show a special celebration modal:

```tsx
function StreakMilestoneModal({ streak }: { streak: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <GradientBorder animated colors="premium" borderWidth="thick" rounded="xl">
        <GlassCard blur="xl" className="max-w-md p-8 text-center">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <Flame className="w-24 h-24 mx-auto text-orange-500 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]" />
          </motion.div>

          <h2 className="text-3xl font-bold mt-4 gradient-text-animated">
            {streak} Day Streak!
          </h2>

          <p className="text-muted-foreground mt-2">
            You're on fire! Keep the momentum going.
          </p>

          {/* Achievement badges */}
          <div className="flex gap-2 justify-center mt-6">
            {[...Array(Math.min(5, Math.floor(streak / 7)))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500
                           flex items-center justify-center shadow-lg shadow-orange-500/50"
              >
                <Trophy className="w-6 h-6 text-white" />
              </motion.div>
            ))}
          </div>

          <Button className="mt-6 w-full" onClick={onClose}>
            Continue
          </Button>
        </GlassCard>
      </GradientBorder>
    </motion.div>
  );
}
```

**Features:**
- Animated fire icon
- Gradient text
- Badge collection visualization
- Premium glass modal
- Confetti background

---

### Enhancement #3: Score Progress Ring Animation
**Build On:** Progress bar gradients
**Effort:** Medium
**Impact:** Medium

**Idea:**
Instead of linear progress bars for accuracy, use circular progress rings:

```tsx
function CircularProgress({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 45; // 45 = radius
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="transform -rotate-90 w-32 h-32">
        {/* Background circle */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-secondary"
        />

        {/* Progress circle with gradient */}
        <circle
          cx="64"
          cy="64"
          r="45"
          stroke="url(#gradient)"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
          strokeLinecap="round"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold gradient-text-animated">{value}%</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

// Usage
<CircularProgress value={accuracyRate} label="Accuracy" />
```

**Visual Impact:**
- More engaging than linear bars
- Gradient stroke with glow
- Animated on mount
- Better use of space

---

### Enhancement #4: Hover Preview for Game History
**Build On:** Glass cards, animations
**Effort:** Low
**Impact:** Medium

**Idea:**
Show detailed breakdown on hover over game history items:

```tsx
<motion.div
  className="relative p-3 rounded-lg bg-muted/50 hover-lift cursor-pointer"
  whileHover={{ scale: 1.02 }}
>
  {/* Existing game info */}
  <div>
    <p className="font-medium text-sm">Drop #{game.dropNumber}</p>
    <p className="text-xs text-muted-foreground">{game.date}</p>
  </div>

  {/* Hover tooltip */}
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileHover={{ opacity: 1, y: 0 }}
    className="absolute left-0 right-0 top-full mt-2 z-10 pointer-events-none"
  >
    <GlassCard blur="xl" className="p-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">Score</p>
          <p className="font-bold">{game.score} pts</p>
        </div>
        <div>
          <p className="text-muted-foreground">Accuracy</p>
          <p className="font-bold">{game.accuracy}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Money Health</p>
          <Progress value={game.moneyHealth} gradient className="mt-1" />
        </div>
        <div>
          <p className="text-muted-foreground">Categories</p>
          <div className="flex gap-1 mt-1">
            {game.categories.map(cat => (
              <Badge key={cat} variant="secondary" className="text-xs">
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  </motion.div>
</motion.div>
```

**Benefits:**
- Quick preview without clicking
- Shows categories, health, accuracy
- Glass tooltip effect
- Smooth animations

---

### Enhancement #5: Interactive Category Performance Chart
**Build On:** Trend charts, gradients
**Effort:** High
**Impact:** High

**Idea:**
Make category breakdown interactive with hover states and drill-downs:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function InteractiveCategoryChart({ categoryStats }: { categoryStats: CategoryStats[] }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const data = categoryStats.map(cat => ({
    name: categoryLabels[cat.category],
    accuracy: cat.accuracy,
    correct: cat.correctAnswers,
    total: cat.totalQuestions,
    color: categoryColors[cat.category],
  }));

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle>Category Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const data = payload[0].payload;
                return (
                  <GlassCard blur="xl" className="p-3">
                    <p className="font-bold">{data.name}</p>
                    <p className="text-sm">Accuracy: {data.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">
                      {data.correct}/{data.total} correct
                    </p>
                  </GlassCard>
                );
              }}
            />
            <Bar
              dataKey="accuracy"
              radius={[8, 8, 0, 0]}
              onMouseEnter={(data) => setActiveCategory(data.name)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={`url(#gradient-${index})`}
                  className={activeCategory === entry.name ? "opacity-100 drop-shadow-xl" : "opacity-70"}
                />
              ))}
            </Bar>
            <defs>
              {data.map((entry, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={entry.color.split(" ")[0]} />
                  <stop offset="100%" stopColor={entry.color.split(" ")[1]} />
                </linearGradient>
              ))}
            </defs>
          </BarChart>
        </ResponsiveContainer>

        {/* Category details on hover */}
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10"
          >
            <h4 className="font-bold">{activeCategory}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {CATEGORY_TIPS[activeCategory] || "Keep practicing to improve!"}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Features:**
- Hover highlights bars
- Shows tips for each category
- Gradient-filled bars
- Glass tooltip
- Smooth transitions

---

## 🚀 FUNCTIONAL ENHANCEMENTS

### Enhancement #6: Quick Stats Comparison Widget
**Build On:** Glass cards, stat cards
**Effort:** Medium
**Impact:** Medium

**Idea:**
Add a "Compare" mode to see week-over-week or month-over-month stats:

```tsx
function StatsComparison({ currentWeek, previousWeek }: Props) {
  const scoreDiff = currentWeek.avgScore - previousWeek.avgScore;
  const streakDiff = currentWeek.streak - previousWeek.streak;

  return (
    <GlassCard blur="xl" className="p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Week Over Week
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Avg Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{currentWeek.avgScore}</span>
            <span className={cn(
              "text-sm font-medium",
              scoreDiff > 0 ? "text-green-500" : "text-red-500"
            )}>
              {scoreDiff > 0 ? "+" : ""}{scoreDiff}
            </span>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Streak</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{currentWeek.streak}</span>
            <span className={cn(
              "text-sm font-medium",
              streakDiff > 0 ? "text-green-500" : "text-red-500"
            )}>
              {streakDiff > 0 ? "+" : ""}{streakDiff}
            </span>
          </div>
        </div>
      </div>

      {/* Mini trend chart */}
      <div className="mt-4 h-20">
        <MiniTrendLine data={weeklyScores} />
      </div>
    </GlassCard>
  );
}
```

**Benefits:**
- See progress at a glance
- Green/red indicators for improvement
- Mini trend line
- Motivates users to improve

---

### Enhancement #7: Achievement Showcase
**Build On:** Gradient borders, glass cards
**Effort:** High
**Impact:** High

**Idea:**
Create an achievement/badge system with visual rewards:

```tsx
const ACHIEVEMENTS = [
  { id: "first_game", name: "First Steps", icon: "🎯", condition: (user) => user.gamesPlayed >= 1 },
  { id: "streak_7", name: "Week Warrior", icon: "🔥", condition: (user) => user.streak >= 7 },
  { id: "perfect_score", name: "Perfectionist", icon: "💯", condition: (user) => user.perfectGames > 0 },
  { id: "100_games", name: "Centurion", icon: "🏆", condition: (user) => user.gamesPlayed >= 100 },
  // ... more achievements
];

function AchievementShowcase({ user }: { user: User }) {
  const earned = ACHIEVEMENTS.filter(a => a.condition(user));
  const locked = ACHIEVEMENTS.filter(a => !a.condition(user));

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievements ({earned.length}/{ACHIEVEMENTS.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {ACHIEVEMENTS.map(achievement => {
            const isEarned = earned.some(a => a.id === achievement.id);

            return (
              <motion.div
                key={achievement.id}
                whileHover={{ scale: 1.1 }}
                className="relative"
              >
                {isEarned ? (
                  <GradientBorder animated colors="premium" rounded="xl">
                    <div className="aspect-square flex flex-col items-center justify-center p-3 bg-card rounded-xl">
                      <span className="text-3xl">{achievement.icon}</span>
                      <p className="text-xs mt-1 text-center font-medium">{achievement.name}</p>
                    </div>
                  </GradientBorder>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center p-3 bg-muted/30 rounded-xl opacity-30 grayscale">
                    <span className="text-3xl">{achievement.icon}</span>
                    <p className="text-xs mt-1 text-center">???</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Features:**
- Grid of achievement badges
- Animated gradient borders for earned badges
- Locked/grayed out for unearned
- Hover to see details
- Progress tracking

---

### Enhancement #8: Personalized Insights Banner
**Build On:** Glass cards, gradient text
**Effort:** Medium
**Impact:** High

**Idea:**
Show personalized insights based on recent performance:

```tsx
function InsightsBanner({ user }: { user: User }) {
  const insights = generateInsights(user);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % insights.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [insights.length]);

  const insight = insights[currentIndex];

  return (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <GlassCard blur="xl" className="p-4 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">{insight.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{insight.message}</p>
            {insight.action && (
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                {insight.action.label} →
              </Button>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function generateInsights(user: User) {
  const insights = [];

  // Streak insights
  if (user.streak >= 7 && user.streak < 14) {
    insights.push({
      title: "You're on a roll!",
      message: `Just ${14 - user.streak} more days to reach a 2-week streak.`,
      action: { label: "View Streak", onClick: () => {} }
    });
  }

  // Performance insights
  const recentAccuracy = calculateRecentAccuracy(user.gameHistory.slice(-5));
  if (recentAccuracy < 70) {
    insights.push({
      title: "Time to review?",
      message: "Your last 5 games show lower accuracy. Check your weak categories.",
      action: { label: "See Categories", onClick: () => {} }
    });
  }

  // Category insights
  const weakCategory = findWeakestCategory(user.categoryStats);
  insights.push({
    title: `Improve ${weakCategory.name}`,
    message: `You're at ${weakCategory.accuracy}% accuracy. Try reviewing the tips!`,
    action: { label: "View Tips", onClick: () => {} }
  });

  return insights;
}
```

**Benefits:**
- Rotates through personalized tips
- Actionable insights
- Motivates improvement
- Glass card design

---

## 🎮 GAMIFICATION ENHANCEMENTS

### Enhancement #9: Daily Challenge Streak Visualization
**Build On:** Gradient effects, animations
**Effort:** Medium
**Impact:** High

**Idea:**
Visual streak calendar with hover effects:

```tsx
function StreakCalendar({ streakDays }: { streakDays: Date[] }) {
  const today = new Date();
  const last30Days = [...Array(30)].map((_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Streak Calendar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1">
          {last30Days.map((date, index) => {
            const hasPlayed = streakDays.some(d =>
              d.toDateString() === date.toDateString()
            );

            return (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ scale: 1.2 }}
                className={cn(
                  "aspect-square rounded-md",
                  hasPlayed
                    ? "bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30"
                    : "bg-muted/30"
                )}
                title={date.toLocaleDateString()}
              />
            );
          })}
        </div>

        {/* Streak stats */}
        <div className="mt-4 flex justify-around text-center">
          <div>
            <p className="text-2xl font-bold gradient-text-animated">{streakDays.length}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{user.highestStreak}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Visual Effect:**
- Grid of squares (like GitHub contributions)
- Gradient fill for active days
- Hover to see date
- Animated entrance
- Streak stats below

---

### Enhancement #10: Share Score Card Generator
**Build On:** Glass effects, gradients, confetti
**Effort:** High
**Impact:** Medium

**Idea:**
Generate beautiful, shareable score cards:

```tsx
import html2canvas from "html2canvas";

function ShareableScoreCard({ result, user }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current);
    const image = canvas.toDataURL("image/png");
    // Download or share
  };

  return (
    <>
      <div ref={cardRef} className="w-[400px] p-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl">
        <GlassCard blur="xl" className="p-6">
          {/* Logo */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold gradient-text-animated">Lifestyle Tracker</h1>
          </div>

          {/* Score */}
          <div className="text-center mb-6">
            <p className="text-6xl font-black gradient-text-animated">{result.score}</p>
            <p className="text-sm text-muted-foreground">Daily Drop #{dropNumber}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold">{result.accuracy}%</p>
              <p className="text-xs text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-500/10">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-500" />
                {user.streak}
              </p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>

          {/* Answer visualization */}
          <div className="flex gap-1 justify-center">
            {result.answers.map((correct, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                  correct
                    ? "bg-gradient-to-br from-green-500 to-emerald-500"
                    : "bg-gradient-to-br from-red-500 to-rose-500"
                )}
              >
                {correct ? "✓" : "×"}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Join me at lifestyletracker.app
          </p>
        </GlassCard>
      </div>

      <Button onClick={generateImage} className="mt-4">
        Download Card
      </Button>
    </>
  );
}
```

**Features:**
- Beautiful card design
- Gradient backgrounds
- Score visualization
- Answer breakdown
- Export to PNG

---

## 🔧 UTILITY ENHANCEMENTS

### Enhancement #11: Theme Customization Panel
**Build On:** Glass effects, color system
**Effort:** High
**Impact:** Medium

**Idea:**
Let users customize accent colors:

```tsx
const THEME_PRESETS = [
  { name: "Emerald (Default)", primary: "160 84% 39%", accent: "43 96% 56%" },
  { name: "Ocean", primary: "199 89% 48%", accent: "270 67% 58%" },
  { name: "Sunset", primary: "25 95% 53%", accent: "340 82% 52%" },
  { name: "Forest", primary: "142 71% 45%", accent: "84 81% 44%" },
];

function ThemeCustomizer() {
  const [selectedTheme, setSelectedTheme] = useState(0);

  const applyTheme = (theme: typeof THEME_PRESETS[0]) => {
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--accent", theme.accent);
  };

  return (
    <GlassCard blur="xl">
      <CardHeader>
        <CardTitle>Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {THEME_PRESETS.map((theme, index) => (
            <motion.button
              key={index}
              onClick={() => {
                setSelectedTheme(index);
                applyTheme(theme);
              }}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "p-4 rounded-lg border-2 transition-all",
                selectedTheme === index
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30"
              )}
            >
              <div className="flex gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: `hsl(${theme.primary})` }}
                />
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: `hsl(${theme.accent})` }}
                />
              </div>
              <p className="text-sm font-medium">{theme.name}</p>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </GlassCard>
  );
}
```

**Benefits:**
- Personalization
- Multiple color schemes
- Instant preview
- Saved to localStorage

---

### Enhancement #12: Quick Actions Menu
**Build On:** Glass effects, animations
**Effort:** Medium
**Impact:** Medium

**Idea:**
Floating action button with radial menu:

```tsx
function QuickActionsMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: Play, label: "Play", onClick: () => navigate("/play") },
    { icon: BarChart3, label: "Stats", onClick: () => navigate("/stats") },
    { icon: Share2, label: "Share", onClick: () => {} },
    { icon: Settings, label: "Settings", onClick: () => navigate("/settings") },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <>
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  x: -Math.cos((index * Math.PI) / 2) * 80,
                  y: -Math.sin((index * Math.PI) / 2) * 80,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: index * 0.05 }}
                className="absolute bottom-0 right-0"
              >
                <Button
                  size="icon"
                  className="w-12 h-12 rounded-full glass-card shadow-lg"
                  onClick={action.onClick}
                  aria-label={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30 flex items-center justify-center"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          <Plus className="w-6 h-6 text-white" />
        </motion.div>
      </motion.button>
    </div>
  );
}
```

**Features:**
- Radial menu animation
- Glass action buttons
- Gradient FAB
- Rotate animation on open

---

### Enhancement #13: Loading State Enhancements
**Build On:** Shimmer animations, glass effects
**Effort:** Low
**Impact:** Low

**Idea:**
Better loading skeletons with shimmer:

```tsx
function EnhancedSkeleton() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded shimmer w-3/4" />
            <div className="h-3 bg-muted rounded shimmer w-1/2" />
          </div>
        </div>
      </div>

      {/* Progress bar skeleton */}
      <div className="glass-card p-6">
        <div className="h-3 bg-muted rounded-full shimmer w-full" />
      </div>
    </div>
  );
}
```

**Features:**
- Glass cards for skeletons
- Shimmer animation
- Gradient hints of final colors
- Smooth transitions

---

### Enhancement #14: Micro-interactions Library
**Build On:** All animations
**Effort:** Medium
**Impact:** High

**Idea:**
Create reusable micro-interaction components:

```tsx
// Haptic feedback simulation
function HapticButton({ children, ...props }: ButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Visual feedback
    e.currentTarget.classList.add("animate-wiggle");
    setTimeout(() => {
      e.currentTarget.classList.remove("animate-wiggle");
    }, 500);

    props.onClick?.(e);
  };

  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  );
}

// Success check animation
function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/50"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
            viewBox="0 0 24 24"
            className="w-10 h-10 text-white"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Number counter animation
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = (value - displayValue) / steps;
    let current = displayValue;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}</span>;
}
```

**Benefits:**
- Consistent interactions
- Reusable across app
- Polished feel
- Better UX

---

### Enhancement #15: Dark Mode Enhancements
**Build On:** Glass effects, ambient backgrounds
**Effort:** Low
**Impact:** Medium

**Idea:**
Darker ambient orbs and adjusted glass in dark mode:

```tsx
// In ambient-background.tsx
export function AmbientBackground({ variant = "default" }: Props) {
  const isDark = document.documentElement.classList.contains("dark");

  // Adjust opacity for dark mode
  const orbOpacity = isDark ? "0.15" : "0.25";

  return (
    <div className="...">
      <div
        className="..."
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / ${orbOpacity}) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
```

**CSS adjustments:**
```css
.dark .glass-card {
  @apply bg-card/60 border-white/3;  /* Darker glass in dark mode */
}

.dark .ambient-orb {
  opacity: 0.6;  /* More subtle orbs */
}
```

**Benefits:**
- Better contrast in dark mode
- Reduced eye strain
- Ambient effects still visible but subtler

---

## 📊 Priority Matrix

| Enhancement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| #2: Streak Celebration | High | Med | ⭐⭐⭐⭐⭐ |
| #7: Achievement System | High | High | ⭐⭐⭐⭐⭐ |
| #8: Insights Banner | High | Med | ⭐⭐⭐⭐⭐ |
| #5: Interactive Charts | High | High | ⭐⭐⭐⭐ |
| #9: Streak Calendar | High | Med | ⭐⭐⭐⭐ |
| #1: Gradient Stat Cards | High | Low | ⭐⭐⭐⭐ |
| #6: Quick Comparison | Med | Med | ⭐⭐⭐ |
| #12: Quick Actions Menu | Med | Med | ⭐⭐⭐ |
| #11: Theme Customizer | Med | High | ⭐⭐ |
| #3: Circular Progress | Med | Med | ⭐⭐ |

---

## 🎯 Implementation Roadmap

### Week 1: Quick Wins
- Enhancement #1: Gradient stat cards
- Enhancement #13: Better loading states
- Enhancement #15: Dark mode tweaks

### Week 2: Gamification
- Enhancement #2: Streak celebration modal
- Enhancement #9: Streak calendar

### Week 3: Insights
- Enhancement #8: Insights banner
- Enhancement #6: Stats comparison

### Week 4: Advanced
- Enhancement #7: Achievement system
- Enhancement #5: Interactive charts

---

**All enhancements build on existing polish features and maintain the premium visual style.**
