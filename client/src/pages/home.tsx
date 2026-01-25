import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatBarGrid } from "@/components/stat-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StreakCalendar } from "@/components/streak-calendar";
import { Onboarding } from "@/components/onboarding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Award,
  CalendarDays,
  Settings,
  MessageSquare,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { User, DailyDrop, LeaderboardEntry } from "@shared/schema";
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnightUTC());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: user, isLoading: userLoading } = useQuery<User>({
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

  const hasPlayedToday = user?.todayResult !== null;

  const todaysTheme = dailyDrop?.scenarios?.[0]?.category || "lifestyle";
  const themeConfig = THEME_CONFIG[todaysTheme] || THEME_CONFIG.lifestyle;
  const ThemeIcon = themeConfig.icon;

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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
        <div className="flex items-center gap-2">
          {authUser && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8" data-testid="avatar-user">
                <AvatarImage src={authUser.profileImageUrl || undefined} alt={authUser.firstName || "User"} />
                <AvatarFallback>{authUser.firstName?.[0] || authUser.email?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={() => navigate("/stats")} data-testid="button-stats">
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} data-testid="button-settings">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => logout()} data-testid="button-logout">
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
            {/* Daily Drop CTA Tile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
            <Card 
              className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20"
              data-testid="card-daily-drop-cta"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  {dropLoading ? (
                    <Skeleton className="h-8 w-40 mb-2" />
                  ) : (
                    <h1 className="text-2xl md:text-3xl font-bold mb-1" data-testid="text-daily-drop-title">
                      Daily Drop #{dailyDrop?.dropNumber || "..."}
                    </h1>
                  )}
                  <p className="text-muted-foreground text-sm mb-3" data-testid="text-tagline">
                    5 real-life money decisions in 2-4 minutes
                  </p>
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
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  {hasPlayedToday ? (
                    <Trophy className="w-10 h-10 text-white" />
                  ) : (
                    <Play className="w-10 h-10 text-white" />
                  )}
                </div>
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

            {/* Today's Theme */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
            >
            <Card className="p-4" data-testid="card-todays-theme">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-md bg-muted flex items-center justify-center ${themeConfig.color}`}>
                  <ThemeIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Today's Theme</p>
                  <p className="font-semibold" data-testid="text-theme-name">{themeConfig.label}</p>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Streak Calendar with Protection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
            >
            <StreakCalendar user={user} />
            </motion.div>

            {/* Next Drop Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            >
            <Card className="p-4" data-testid="card-countdown">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Next Drop</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold font-mono" data-testid="text-countdown">
                    {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
                  </div>
                  <span className="text-xs text-muted-foreground">until midnight UTC</span>
                </div>
              </div>
            </Card>
            </motion.div>

            {/* Friend League Preview - hidden in low pressure mode */}
            {!user.lowPressureMode && (
              <Card className="p-4" data-testid="card-friend-league-preview">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    <h3 className="font-semibold">Friend Leagues</h3>
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

            {/* Challenge a Friend - hidden in low pressure mode */}
            {!user.lowPressureMode && (
              <Card 
                className="p-4 cursor-pointer" 
                onClick={() => navigate("/challenges")}
                data-testid="card-challenge-friend"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <Swords className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Challenge a Friend</h3>
                      <p className="text-xs text-muted-foreground">See who's got better money moves</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            )}

            {/* Achievements */}
            <Card 
              className="p-4 cursor-pointer" 
              onClick={() => navigate("/achievements")}
              data-testid="card-achievements"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Achievements</h3>
                    <p className="text-xs text-muted-foreground">Collect badges and track progress</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            {/* Community */}
            <Card 
              className="p-4 cursor-pointer" 
              onClick={() => navigate("/community")}
              data-testid="card-community"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Community</h3>
                    <p className="text-xs text-muted-foreground">Real scenarios, real advice</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            {/* Weekly Recap */}
            <Card 
              className="p-4 cursor-pointer" 
              onClick={() => navigate("/weekly-recap")}
              data-testid="card-weekly-recap"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Weekly Recap</h3>
                    <p className="text-xs text-muted-foreground">Your week in review</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>

            {/* Money Health Stats */}
            <Card className="p-5" data-testid="card-money-health">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold" data-testid="text-money-health-value">Money Health: {user.moneyHealth}</h3>
              </div>
              <StatBarGrid {...user.stats} />
            </Card>

            {/* Quick Tip of the Day */}
            <Card className="p-4 bg-muted/30" data-testid="card-daily-tip">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tip of the Day</p>
                  <p className="text-sm" data-testid="text-daily-tip">{getTodaysTip()}</p>
                </div>
              </div>
            </Card>

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
    </>
  );
}
