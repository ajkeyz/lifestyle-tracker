import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatBarGrid } from "@/components/stat-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StreakCalendar } from "@/components/streak-calendar";
import { Onboarding } from "@/components/onboarding";
import { AppLogo } from "@/components/app-logo";
import { QuickStatsBar } from "@/components/quick-stats-bar";
import { StreakUrgencyBanner } from "@/components/streak-urgency-banner";
import { SocialProofCounter } from "@/components/social-proof-counter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LiveActivityTicker, PlayerCounter } from "@/components/live-activity-ticker";
import { TipCardCarousel } from "@/components/stories-tips";
import { AnimatedCounter } from "@/components/animated-counter";
import { DebugScreen, useDebugGesture } from "@/components/debug-screen";
import { AmbientBackground } from "@/components/ambient-background";
import { 
  Play, 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  LogOut, 
  Clock, 
  Share2,
  Lightbulb,
  Plane,
  AlertTriangle,
  Home as HomeIcon,
  Wallet,
  ChevronRight,
  Users,
  Swords,
  Gamepad2,
  Award,
  CalendarDays,
  Settings,
  MessageSquare,
  BarChart3,
  RefreshCw,
  User,
  Flame
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType, DailyDrop, LeaderboardEntry, CommunityScenario } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const THEME_CONFIG: Record<string, { label: string; icon: typeof Plane; color: string }> = {
  travel: { label: "Travel", icon: Plane, color: "text-blue-500" },
  scam: { label: "Fraud Alert", icon: AlertTriangle, color: "text-red-500" },
  lifestyle: { label: "Lifestyle", icon: HomeIcon, color: "text-green-500" },
  tech: { label: "Tech Spending", icon: Sparkles, color: "text-purple-500" },
  investing: { label: "Investing", icon: TrendingUp, color: "text-emerald-500" },
  debt: { label: "Debt & Credit", icon: Wallet, color: "text-orange-500" },
};

const DAILY_TIPS = [
  "Automate your savings — what you don't see, you won't spend.",
  "A 24-hour rule on big purchases prevents impulse regret.",
  "Track subscriptions monthly; small leaks sink big ships.",
  "Pay yourself first, then budget what's left.",
  "Lifestyle creep happens slowly — review expenses quarterly.",
  "An emergency fund is peace of mind, not wasted money.",
  "Compare cost-per-use, not just price tags.",
];

const COMEBACK_MESSAGES = [
  { title: "Welcome back!", message: "Every expert was once a beginner. Pick up where you left off." },
  { title: "Fresh start!", message: "Missing a day doesn't erase your progress. Your knowledge stays with you." },
  { title: "Ready to rebuild?", message: "The best time to start was yesterday. The second best time is now." },
  { title: "You've got this!", message: "Streaks come and go, but financial wisdom is forever." },
  { title: "Back in action!", message: "Today is a new opportunity to make smart money moves." },
];

const WHY_THIS_MATTERS: Record<string, string[]> = {
  tech: [
    "Today's choices mirror how people overspend on tech upgrades.",
    "Tech purchases feel urgent but rarely are — today tests that instinct.",
    "Shiny new gadgets are the fastest path to lifestyle creep.",
  ],
  travel: [
    "Travel decisions reveal how we justify emotional spending.",
    "Vacation spending is where budgets quietly unravel.",
    "Today tests whether you can enjoy experiences without overspending.",
  ],
  scam: [
    "Fraud costs people billions yearly — pattern recognition is your shield.",
    "Today's scenarios train you to spot the red flags before it's too late.",
    "Scammers rely on urgency — today tests your ability to pause.",
  ],
  lifestyle: [
    "Small daily upgrades are how lifestyle creep starts unnoticed.",
    "Today's choices reflect the quiet trade-offs we make without thinking.",
    "Convenience spending adds up faster than most people realize.",
  ],
  investing: [
    "Investment decisions test patience more than knowledge.",
    "Today's scenarios mirror real moments where people panic-sell or FOMO-buy.",
    "The best investors know when not to act — today tests that.",
  ],
  debt: [
    "Debt decisions shape your financial freedom for years to come.",
    "Today tests whether you can resist the minimum-payment trap.",
    "Credit feels like freedom until it becomes a cage.",
  ],
  career: [
    "Career money decisions often get overshadowed by emotions.",
    "Today tests whether you'd trade short-term comfort for long-term growth.",
  ],
  relationships: [
    "Money and relationships are deeply intertwined — today explores that.",
    "Splitting costs, lending to friends — these test your boundaries.",
  ],
};

const FIRST_WEEK_NARRATIVE: Record<number, { phase: string; message: string }> = {
  1: { phase: "Awareness", message: "You're learning to notice your spending patterns" },
  2: { phase: "Awareness", message: "Building the habit of pausing before spending" },
  3: { phase: "Pattern spotting", message: "You're starting to see the patterns others miss" },
  4: { phase: "Pattern spotting", message: "Your instincts are sharpening with each decision" },
  5: { phase: "Pattern spotting", message: "You're thinking before spending — that's rare" },
  6: { phase: "Identity shift", message: "You're becoming someone who makes intentional choices" },
  7: { phase: "Identity shift", message: "One week in — your relationship with money is changing" },
};

function getStreakContextMessage(streak: number, hasPlayedToday: boolean): string | null {
  if (hasPlayedToday) return null;
  if (streak === 0) return null;
  if (streak === 1) return "You're 1 decision away from Day 2";
  if (streak < 7) return `Tomorrow locks Day ${streak + 1} of your streak`;
  if (streak < 14) return `${14 - streak} days until your next milestone`;
  if (streak < 30) return `${30 - streak} days until Master status`;
  return `Your consistency is building real financial intuition`;
}

function getComebackMessage(highestStreak: number) {
  const index = highestStreak % COMEBACK_MESSAGES.length;
  return COMEBACK_MESSAGES[index];
}

function getTimeUntilMidnightUTC(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diff = midnightUTC.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

function getTodaysTip(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user: authUser, logout } = useAuth();
  const [countdown, setCountdown] = useState(getTimeUntilMidnightUTC());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDebugScreen, setShowDebugScreen] = useState(false);
  const { handleTap } = useDebugGesture(() => setShowDebugScreen(true));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnightUTC());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    if (user && !user.onboardingComplete && !userLoading) {
      setShowOnboarding(true);
    }
  }, [user, userLoading]);


  const { data: dailyDrop, isLoading: dropLoading } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: hotPosts } = useQuery<CommunityScenario[]>({
    queryKey: ["/api/community/scenarios", { sortBy: "hot", limit: 3 }],
    queryFn: async () => {
      const res = await fetch("/api/community/scenarios?sortBy=hot");
      return res.json();
    },
  });

  const hasPlayedToday = user?.todayResult !== null;
  const isInFirstWeek = user ? (user.gamesPlayed <= 7) : false;
  const firstWeekDay = user ? Math.min(user.gamesPlayed + 1, 7) : 1;
  const firstWeekNarrative = FIRST_WEEK_NARRATIVE[firstWeekDay];

  const todaysTheme = dailyDrop?.scenarios?.[0]?.category || "lifestyle";
  const themeConfig = THEME_CONFIG[todaysTheme] || THEME_CONFIG.lifestyle;
  const ThemeIcon = themeConfig.icon;

  const whyMattersLines = WHY_THIS_MATTERS[todaysTheme] || WHY_THIS_MATTERS.lifestyle;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const whyThisMatters = whyMattersLines[dayOfYear % whyMattersLines.length];
  const streakContext = user ? getStreakContextMessage(user.streak, hasPlayedToday) : null;
  const isLastHour = countdown.hours === 0;

  const userRank = leaderboard?.findIndex((e) => e.id === user?.id);
  const displayRank = userRank !== undefined && userRank !== -1 ? userRank + 1 : null;

  const handleShare = () => {
    const shareText = user?.todayResult 
      ? `Lifestyle Creep Day ${dailyDrop?.dropNumber || "?"}\nScore: ${user.todayResult.score}/500\nMoney IQ: ${user.todayResult.iq}\n\nPlay now!`
      : `I'm on a ${user?.streak || 0} day streak in Lifestyle Creep! Can you beat my Money Health of ${user?.moneyHealth || 50}?`;
    
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 relative">
      <AmbientBackground variant="default" />
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-2">
          <div onClick={handleTap} className="cursor-pointer">
            <AppLogo size="sm" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
        <div className="flex items-center gap-2">
          {authUser && (
            <div className="flex items-center gap-2">
              <Link href="/profile" data-testid="link-profile">
                <Button 
                  variant="ghost" 
                  size="icon"
                >
                  <User className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => navigate("/stats")} data-testid="button-stats" aria-label="View statistics">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} data-testid="button-settings" aria-label="Open settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout" aria-label="Log out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {userLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : user ? (
          <>
            {/* Streak Urgency Banner */}
            <StreakUrgencyBanner hasPlayedToday={hasPlayedToday} streak={user.streak} />

            {/* Quick Stats Bar - consolidated with streak context */}
            <QuickStatsBar user={user} rank={displayRank} className="mb-2" />

            {/* First-Week Narrative */}
            {isInFirstWeek && firstWeekNarrative && !hasPlayedToday && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10" data-testid="card-first-week">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-primary">Day {firstWeekDay} — {firstWeekNarrative.phase}</span>
                    <p className="text-xs text-muted-foreground">{firstWeekNarrative.message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Streak Context - replaces redundant streak displays */}
            {streakContext && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.02 }}
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/10" data-testid="card-streak-context">
                  <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{streakContext}</span>
                </div>
              </motion.div>
            )}

            {/* ===== PRIMARY FOCUS: Daily Drop CTA ===== */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
            <Card 
              className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden relative shadow-sm"
              data-testid="card-daily-drop-cta"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {dropLoading ? (
                    <Skeleton className="h-8 w-40 mb-2" />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-display font-bold mb-1 tracking-tight" data-testid="text-daily-drop-title">
                      Daily Drop #{dailyDrop?.dropNumber || "..."}
                    </h1>
                  )}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 ${themeConfig.color}`}>
                      <ThemeIcon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{themeConfig.label}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-1" data-testid="text-tagline">
                    5 real-life money decisions in 2-4 minutes
                  </p>
                  <p className="text-xs text-muted-foreground/80 italic mb-3" data-testid="text-why-matters">
                    {whyThisMatters}
                  </p>
                  <div className="mb-2">
                    <SocialProofCounter />
                  </div>
                  <div className="mb-3">
                    <LiveActivityTicker className="text-xs" />
                  </div>
                  <Button
                    size="lg"
                    className="gap-2"
                    onClick={() => {
                      if (hasPlayedToday) {
                        navigate("/results");
                      } else if (!user.mode) {
                        navigate("/setup");
                      } else {
                        navigate("/play");
                      }
                    }}
                    data-testid="button-play-today"
                  >
                    {hasPlayedToday ? (
                      <>
                        <Trophy className="w-5 h-5" />
                        View Results
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Play Now
                      </>
                    )}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <button
                  onClick={() => {
                    if (hasPlayedToday) {
                      navigate("/results");
                    } else if (!user.mode) {
                      navigate("/setup");
                    } else {
                      navigate("/play");
                    }
                  }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 glow-primary cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  data-testid="button-play-icon"
                >
                  {hasPlayedToday ? (
                    <Trophy className="w-10 h-10 text-white" />
                  ) : (
                    <Play className="w-10 h-10 text-white" />
                  )}
                </button>
              </div>
            </Card>
            </motion.div>

            {/* Comeback Encouragement - show when streak is 0 but user has played before */}
            {user.streak === 0 && user.highestStreak > 0 && !hasPlayedToday && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
              >
                <Card className="p-4 border-accent/30 bg-accent/5" data-testid="card-comeback">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <RefreshCw className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold" data-testid="text-comeback-title">
                        {getComebackMessage(user.highestStreak).title}
                      </h3>
                      <p className="text-sm text-muted-foreground" data-testid="text-comeback-message">
                        {getComebackMessage(user.highestStreak).message}
                      </p>
                      {user.highestStreak >= 7 && (
                        <p className="text-xs text-accent mt-2" data-testid="text-comeback-streak">
                          Your best streak was {user.highestStreak} days — you can get there again!
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Next Drop Countdown - with emotional framing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            >
            <Card className={`p-3 ${isLastHour ? 'border-primary/30' : ''}`} data-testid="card-countdown">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 text-primary ${isLastHour ? 'animate-pulse' : ''}`} />
                  <span className="text-sm text-muted-foreground">
                    {hasPlayedToday ? "Next decision test unlocks in..." : "Today's drop expires in..."}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold font-mono ${isLastHour ? 'text-primary' : ''}`} data-testid="text-countdown">
                    {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </div>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* ===== SECONDARY SECTION: Explore More ===== */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">Explore</p>
            </div>

            {/* Quick Tip - Enhanced Carousel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
            <TipCardCarousel
              tips={DAILY_TIPS.map((content, index) => ({
                id: String(index),
                content,
              }))}
              data-testid="card-daily-tip"
            />
            </motion.div>

            {/* Game Modes Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
            >
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className="p-4 cursor-pointer hover-elevate" 
                onClick={() => navigate("/coop-lobby")}
                data-testid="card-coop-play"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Swords className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Co-op Play</h3>
                    <p className="text-[11px] text-muted-foreground">Play with a friend</p>
                  </div>
                </div>
              </Card>
              <Card 
                className="p-4 cursor-pointer hover-elevate" 
                onClick={() => navigate("/arcade")}
                data-testid="card-arcade"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Arcade</h3>
                    <p className="text-[11px] text-muted-foreground">Extra rounds</p>
                  </div>
                </div>
              </Card>
            </div>
            </motion.div>

            {/* Friends - more subtle */}
            {!user.lowPressureMode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.14, ease: "easeOut" }}
              >
              <Card 
                className="p-4 cursor-pointer hover-elevate" 
                onClick={() => navigate("/friends")}
                data-testid="card-friends"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Friends</h3>
                      <p className="text-xs text-muted-foreground">Leagues, challenges & leaderboards</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Card>
              </motion.div>
            )}

            {/* Community - Hot Posts Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
            >
            <Card className="p-4" data-testid="card-community">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Community</h3>
                    <p className="text-xs text-muted-foreground">Real scenarios, real advice</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => navigate("/community")}
                  data-testid="button-view-community"
                >
                  View All
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {hotPosts && hotPosts.length > 0 ? (
                <div className="space-y-2">
                  {hotPosts.slice(0, 2).map((post) => (
                    <div 
                      key={post.id}
                      className="p-3 rounded-lg bg-muted/30 cursor-pointer hover-elevate"
                      onClick={() => navigate(`/community/${post.id}`)}
                      data-testid={`community-post-${post.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.context}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <TrendingUp className="w-3 h-3 text-primary" />
                          <span>{post.upvotes}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>by {post.authorUsername}</span>
                        <span>·</span>
                        <span>{post.commentCount} comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground" data-testid="community-empty-state">
                  <p className="mb-1">Your question might save someone money tonight.</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => navigate("/community/submit")}
                    data-testid="button-submit-community"
                  >
                    Share a real scenario
                  </Button>
                </div>
              )}
            </Card>
            </motion.div>

            {/* Streak Calendar with Protection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18, ease: "easeOut" }}
            >
            <StreakCalendar user={user} />
            </motion.div>

            {/* Friend League Preview - hidden in low pressure mode */}
            {!user.lowPressureMode && (
              <Card className="p-4" data-testid="card-friend-league-preview">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold text-sm">Friend Leagues</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => navigate("/leagues")}
                    data-testid="button-view-leagues"
                  >
                    Manage Leagues
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-accent" />
                    <div>
                      <p className="text-2xl font-bold" data-testid="text-user-rank">
                        {displayRank ? `#${displayRank}` : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">Your rank</p>
                    </div>
                  </div>
                  {leaderboard && leaderboard.length > 0 && (
                    <div className="flex-1 flex items-center gap-1 overflow-x-auto">
                      {leaderboard.slice(0, 5).map((entry, i) => (
                        <div 
                          key={entry.id} 
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            entry.id === user.id 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          }`}
                          title={entry.username}
                          data-testid={`avatar-rank-${i + 1}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Secondary nav items */}
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className="p-4 cursor-pointer hover-elevate" 
                onClick={() => navigate("/achievements")}
                data-testid="card-achievements"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Achievements</h3>
                    <p className="text-[11px] text-muted-foreground">Badges & progress</p>
                  </div>
                </div>
              </Card>
              <Card 
                className="p-4 cursor-pointer hover-elevate" 
                onClick={() => navigate("/weekly-recap")}
                data-testid="card-weekly-recap"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Weekly Recap</h3>
                    <p className="text-[11px] text-muted-foreground">Your week in review</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Share Today's Results */}
            {hasPlayedToday && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleShare}
                data-testid="button-share-results"
              >
                <Share2 className="w-4 h-4" />
                Share Today's Results
              </Button>
            )}
          </>
        ) : (
          <Card className="p-6 text-center" data-testid="card-welcome">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2" data-testid="text-welcome-title">Welcome to Lifestyle Creep</h2>
            <p className="text-muted-foreground mb-6" data-testid="text-welcome-description">
              A daily money game that trains you to build wealth without falling
              into lifestyle inflation traps.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/setup")}
              data-testid="button-start-playing"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Playing
            </Button>
          </Card>
        )}
      </main>
      </div>
      <DebugScreen open={showDebugScreen} onOpenChange={setShowDebugScreen} />
    </>
  );
}
