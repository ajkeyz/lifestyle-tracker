import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Onboarding } from "@/components/onboarding";
import { StreakUrgencyBanner } from "@/components/streak-urgency-banner";
import { SocialProofCounter } from "@/components/social-proof-counter";
import { LiveActivityTicker } from "@/components/live-activity-ticker";
import { TipCardCarousel } from "@/components/stories-tips";
import { AnimatedCounter, RollingNumber } from "@/components/animated-counter";
import { DebugScreen, useDebugGesture } from "@/components/debug-screen";
import { AmbientBackground } from "@/components/ambient-background";
import { AppLogo } from "@/components/app-logo";
import { GradientText } from "@/components/gradient-text";
import { Mascot, getMascotMoodForStreak, type MascotContext } from "@/components/mascot";
import { CleoPlayNudge } from "@/components/cleo-edge-presence";
import { DailyProgressCard } from "@/components/daily-progress-card";
import { NextUnlockCard } from "@/components/next-unlock-card";
import { LevelProgress } from "@/components/level-progress";
import { ResourceBar } from "@/components/resource-bar";
import { IdentityStatsCard } from "@/components/identity-stats-card";
import { useProgression } from "@/hooks/use-progression";
import { useToast } from "@/hooks/use-toast";

import {
  Play,
  Trophy,
  Sparkles,
  Clock,
  Share2,
  Plane,
  AlertTriangle,
  Home as HomeIcon,
  Wallet,
  ChevronRight,
  Gamepad2,
  Settings,
  RefreshCw,
  Zap,
  Shield,
  Flame,
  UserCircle,
  X,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType, DailyDrop, LeaderboardEntry, League } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const THEME_CONFIG: Record<string, { label: string; icon: typeof Plane; color: string }> = {
  travel: { label: "Travel", icon: Plane, color: "text-blue-500" },
  scam: { label: "Fraud Alert", icon: AlertTriangle, color: "text-red-500" },
  lifestyle: { label: "Lifestyle", icon: HomeIcon, color: "text-green-500" },
  tech: { label: "Tech Spending", icon: Sparkles, color: "text-purple-500" },
  investing: { label: "Investing", icon: Sparkles, color: "text-emerald-500" },
  debt: { label: "Debt & Credit", icon: Wallet, color: "text-orange-500" },
};

const DAILY_TIPS = [
  "Automate your savings \u2014 what you don't see, you won't spend.",
  "A 24-hour rule on big purchases prevents impulse regret.",
  "Track subscriptions monthly; small leaks sink big ships.",
  "Pay yourself first, then budget what's left.",
  "Lifestyle creep happens slowly \u2014 review expenses quarterly.",
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
  tech: ["Today's choices mirror how people overspend on tech upgrades."],
  travel: ["Travel decisions reveal how we justify emotional spending."],
  scam: ["Fraud costs people billions yearly \u2014 pattern recognition is your shield."],
  lifestyle: ["Today's choices reflect the quiet trade-offs we make without thinking."],
  investing: ["Investment decisions test patience more than knowledge."],
  debt: ["Debt decisions shape your financial freedom for years to come."],
};

const FIRST_WEEK_NARRATIVE: Record<number, { phase: string; message: string }> = {
  1: { phase: "Awareness", message: "You're learning to notice your spending patterns" },
  2: { phase: "Awareness", message: "Building the habit of pausing before spending" },
  3: { phase: "Pattern spotting", message: "You're starting to see the patterns others miss" },
  4: { phase: "Pattern spotting", message: "Your instincts are sharpening with each decision" },
  5: { phase: "Pattern spotting", message: "You're thinking before spending \u2014 that's rare" },
  6: { phase: "Identity shift", message: "You're becoming someone who makes intentional choices" },
  7: { phase: "Identity shift", message: "One week in \u2014 your relationship with money is changing" },
};

function getStreakContextMessage(streak: number, hasPlayedToday: boolean): string | null {
  if (hasPlayedToday) return null;
  if (streak === 0) return null;
  if (streak === 1) return "You're 1 decision away from Day 2";
  if (streak < 7) return `Tomorrow locks Day ${streak + 1} of your streak`;
  if (streak < 14) return `${14 - streak} days until your next milestone`;
  if (streak < 30) return `${30 - streak} days until Master status`;
  return "Your consistency is building real financial intuition";
}

function getComebackMessage(highestStreak: number) {
  return COMEBACK_MESSAGES[highestStreak % COMEBACK_MESSAGES.length];
}

function getTimeUntilMidnightUTC(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const midnightUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  const diff = midnightUTC.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export default function Home() {
  const [, navigate] = useLocation();
  const { user: authUser } = useAuth();
  const qc = useQueryClient();
  const [countdown, setCountdown] = useState(getTimeUntilMidnightUTC());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDebugScreen, setShowDebugScreen] = useState(false);
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(false);
  const { handleTap } = useDebugGesture(() => setShowDebugScreen(true));

  const { toast } = useToast();
  const {
    unlocks,
    nextUnlock,
    levelInfo,
    missionContext,
    activeMissions,
    completedMissionIds,
    completeMission,
  } = useProgression();

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getTimeUntilMidnightUTC()), 1000);
    return () => clearInterval(timer);
  }, []);

  // P1-5: Invalidate daily drop and user data at midnight UTC
  useEffect(() => {
    const now = new Date();
    const msToMidnight =
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).getTime() -
      now.getTime();
    const midnightTimer = setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["/api/daily-drop"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      qc.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    }, msToMidnight + 2000);
    return () => clearTimeout(midnightTimer);
  }, [qc]);

  const { data: user, isLoading: userLoading } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  useEffect(() => {
    if (user && !user.onboardingComplete && !userLoading) {
      setShowOnboarding(true);
    }
  }, [user, userLoading]);

  const { data: dailyDrop } = useQuery<DailyDrop>({ queryKey: ["/api/daily-drop"] });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const { data: friendsActivity } = useQuery<{
    friendsPlayedToday: number;
    totalFriends: number;
    recentActivity: Array<{
      id: string;
      type: string;
      username: string;
      value?: number;
      timestamp: string;
    }>;
  }>({
    queryKey: ["/api/friends/activity"],
    refetchInterval: 60000,
  });

  const { data: userLeagues } = useQuery<League[]>({
    queryKey: ["/api/leagues"],
  });

  const hasPlayedToday = user?.todayResult != null;
  const isInFirstWeek = user ? user.gamesPlayed <= 7 : false;
  const firstWeekDay = user ? Math.min(user.gamesPlayed + 1, 7) : 1;
  const firstWeekNarrative = FIRST_WEEK_NARRATIVE[firstWeekDay];

  const todaysTheme = dailyDrop?.scenarios?.[0]?.category || "lifestyle";
  const themeConfig = THEME_CONFIG[todaysTheme] || THEME_CONFIG.lifestyle;
  const ThemeIcon = themeConfig.icon;

  const whyMattersLines = WHY_THIS_MATTERS[todaysTheme] || WHY_THIS_MATTERS.lifestyle;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const whyThisMatters = whyMattersLines[dayOfYear % whyMattersLines.length];
  const streakContext = user ? getStreakContextMessage(user.streak, hasPlayedToday) : null;
  const isLastHour = countdown.hours === 0;

  const [cleoGreeting, setCleoGreeting] = useState<string | undefined>(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return `${timeOfDay}, ${user?.username || authUser?.firstName || "there"}!`;
  });

  useEffect(() => {
    if (!cleoGreeting) return;
    const t = setTimeout(() => setCleoGreeting(undefined), 6000);
    return () => clearTimeout(t);
  }, [cleoGreeting]);

  const userRank = leaderboard?.findIndex((e) => e.id === user?.id);
  const displayRank = userRank !== undefined && userRank !== -1 ? userRank + 1 : null;

  const handleShare = () => {
    const shareText = user?.todayResult
      ? `Lifestyle Creep Day ${dailyDrop?.dropNumber || "?"}\nScore: ${user.todayResult.score}/500\nMoney IQ: ${user.todayResult.iq}\n\nPlay now!`
      : `I'm on a ${user?.streak || 0} day streak in Lifestyle Creep! Can you beat my Financial Fitness of ${user?.moneyHealth || 50}?`;
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied!", description: "Share link copied to clipboard" });
    }
  };

  // missionContext is now provided by useProgression (shared with server-side validation)

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
        <AmbientBackground variant="default" />
        <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
          <div className="flex items-center gap-2.5 min-h-[40px]">
            <AppLogo size="sm" glow />
            <span
              className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em] text-foreground drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
              style={{ fontFeatureSettings: '"ss01", "ss02"' }}
            >
              Lifestyle Creep
            </span>
          </div>
          {authUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => navigate("/settings")}
              data-testid="button-settings"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </header>

        {user && !userLoading && (
          <div
            className="sticky top-14 z-40 bg-card/90 backdrop-blur-xl border-b border-border/40"
            data-testid="sticky-status-bar"
          >
            <div className="container max-w-2xl mx-auto flex items-center justify-between px-4 py-1.5 gap-3">
              <div className="flex items-center gap-1.5" data-testid="status-xp">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-bold tabular-nums text-yellow-400">{user.totalScore}</span>
                <span className="text-[10px] text-muted-foreground">XP</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="status-shields">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-bold tabular-nums text-blue-400">{user.freezeTokens}</span>
                <span className="text-[10px] text-muted-foreground">Shields</span>
              </div>
              <div className="flex items-center gap-1.5" data-testid="status-streak">
                <Flame className={cn("w-3.5 h-3.5", user.streak >= 3 ? "text-orange-400" : "text-muted-foreground")} />
                <span className={cn("text-xs font-bold tabular-nums", user.streak >= 3 ? "text-orange-400" : "text-foreground")}>{user.streak}</span>
                <span className="text-[10px] text-muted-foreground">Streak</span>
              </div>
            </div>
          </div>
        )}

        <main className="container max-w-2xl mx-auto p-4 space-y-4">
          {userLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-16 flex-1 rounded-lg" />
                <Skeleton className="h-16 flex-1 rounded-lg" />
                <Skeleton className="h-16 flex-1 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : user ? (
            <>
              {/* ═══ SECTION 1: PRIMARY CTA — Daily Drop ═══ */}
              <StreakUrgencyBanner hasPlayedToday={hasPlayedToday} streak={user.streak} />

              {/* First-Week Narrative */}
              {isInFirstWeek && firstWeekNarrative && !hasPlayedToday && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10"
                    data-testid="card-first-week"
                  >
                    <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-primary">
                        Day {firstWeekDay} — {firstWeekNarrative.phase}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {firstWeekNarrative.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Card
                  className="p-6 overflow-visible relative shadow-lg shadow-primary/5 hero-spotlight rounded-xl border-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/35"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 60%, hsl(var(--primary) / 0.06) 100%)",
                  }}
                  data-testid="card-daily-drop-cta"
                >
                  <div
                    className="pointer-events-none absolute -top-8 -left-8 w-48 h-48 rounded-full opacity-30 dark:opacity-20 ambient-orb"
                    style={{
                      background:
                        "radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, transparent 70%)",
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute -bottom-6 -right-6 w-36 h-36 rounded-full opacity-20 dark:opacity-15"
                    style={{
                      background:
                        "radial-gradient(circle, hsl(var(--accent) / 0.4) 0%, transparent 70%)",
                    }}
                    aria-hidden="true"
                  />
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 ${themeConfig.color}`}
                        >
                          <ThemeIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{themeConfig.label}</span>
                        </div>
                      </div>
                      <h2 className="text-lg font-display font-bold tracking-tight mb-1">
                        <GradientText variant="primary">Today's Drop</GradientText>
                      </h2>
                      <p className="text-muted-foreground text-sm mb-1" data-testid="text-tagline">
                        5 real-life money decisions in 2-4 minutes
                      </p>
                      <p
                        className="text-xs text-muted-foreground/80 italic mb-3"
                        data-testid="text-why-matters"
                      >
                        {whyThisMatters}
                      </p>
                      <Button
                        size="lg"
                        className={cn(
                          "gap-2 relative overflow-hidden font-bold",
                          hasPlayedToday ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0" : "btn-premium border-0"
                        )}
                        onClick={() => {
                          if (hasPlayedToday) navigate("/results");
                          else if (!user.mode) navigate("/setup");
                          else navigate("/play");
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
                            Play Today's Drop
                          </>
                        )}
                        <ChevronRight className="w-4 h-4" />
                      </Button>

                      {unlocks.playHub.unlocked && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 mt-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
                          onClick={() => navigate("/play-hub")}
                          data-testid="button-explore-modes"
                        >
                          <Gamepad2 className="w-4 h-4" />
                          Explore Game Modes
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <SocialProofCounter />
                        <span className="text-border">·</span>
                        <LiveActivityTicker
                          activities={friendsActivity?.recentActivity as any}
                          className="text-xs"
                        />
                      </div>

                      {hasPlayedToday && user.todayResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center gap-2.5 mt-3 p-2 rounded-lg bg-muted/30 border border-border/30"
                          data-testid="card-today-score-summary"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold leading-tight">
                              <AnimatedCounter value={user.todayResult.score} duration={1.2} />
                              <span className="text-muted-foreground font-normal text-xs">
                                /500
                              </span>
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              IQ:{" "}
                              <span className="font-medium text-primary">
                                {user.todayResult.iq}
                              </span>
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 flex-shrink-0 h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare();
                            }}
                            data-testid="button-share-inline"
                          >
                            <Share2 className="w-3 h-3" />
                            Share
                          </Button>
                        </motion.div>
                      )}
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 relative">
                      <motion.div
                        data-testid="mascot-home"
                        onClick={handleTap}
                        style={{ cursor: "pointer" }}
                        whileTap={{ scale: 0.95 }}
                        animate={{
                          y: [0, -6, 0],
                          rotate: [0, 1.5, 0, -1.5, 0],
                        }}
                        transition={{
                          y: { duration: 3, repeat: 2, ease: "easeInOut" },
                          rotate: { duration: 5, repeat: 2, ease: "easeInOut" },
                        }}
                      >
                        <Mascot
                          mood={
                            cleoGreeting
                              ? "waving"
                              : getMascotMoodForStreak(user.streak, hasPlayedToday)
                          }
                          size="lg"
                          message={cleoGreeting}
                          showBubble={!!cleoGreeting || !hasPlayedToday}
                          streakCount={user.streak}
                          showStreakFlame={user.streak >= 3}
                          context={
                            {
                              screen: "home",
                              username: user.username,
                              streak: user.streak,
                              daysInactive: undefined,
                            } satisfies MascotContext
                          }
                        />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Comeback Encouragement */}
              {user.streak === 0 && user.highestStreak > 0 && !hasPlayedToday && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="p-4 border-accent/30 bg-accent/5" data-testid="card-comeback">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <RefreshCw className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">
                          {getComebackMessage(user.highestStreak).title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {getComebackMessage(user.highestStreak).message}
                        </p>
                        {user.highestStreak >= 7 && (
                          <p className="text-xs text-accent mt-2">
                            Your best streak was {user.highestStreak} days — you can get there
                            again!
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {!user.profileSetupComplete && !profileNudgeDismissed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <Card
                    className="p-4 border-primary/20 bg-primary/5 cursor-pointer hover-elevate"
                    onClick={() => navigate("/profile-setup")}
                    data-testid="card-profile-nudge"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <UserCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm" data-testid="text-profile-nudge-title">
                          Set up your profile
                        </h3>
                        <p className="text-xs text-muted-foreground" data-testid="text-profile-nudge-desc">
                          Choose a username and avatar to appear on leaderboards
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileNudgeDismissed(true);
                          }}
                          data-testid="button-dismiss-profile-nudge"
                          aria-label="Dismiss profile setup nudge"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* ═══ SECTION 2: Daily Progress (collapsible missions) ═══ */}
              {activeMissions.length > 0 && (
                <DailyProgressCard
                  missions={activeMissions}
                  context={missionContext}
                  completedIds={completedMissionIds}
                  onComplete={completeMission}
                  isInFirstWeek={isInFirstWeek}
                />
              )}

              {/* ═══ SECTION 3: Money IQ Level ═══ */}
              <LevelProgress totalXP={user.totalScore} />

              {/* ═══ SECTION 4: Resource Bar ═══ */}
              <ResourceBar
                totalScore={user.totalScore}
                freezeTokens={user.freezeTokens}
                bonusArcadePlays={user.bonusArcadePlays ?? 0}
              />

              {/* ═══ SECTION 5: Identity Stats (Financial Fitness, Streak, Rank) ═══ */}
              <IdentityStatsCard
                user={user}
                rank={displayRank}
                streakContext={streakContext}
              />

              {/* ═══ SECTION 5.5: League Rank Widget ═══ */}
              {userLeagues && userLeagues.length > 0 && user && (() => {
                const topLeague = userLeagues.reduce((best, league) => {
                  const myMember = league.members.find(m => m.userId === user.id);
                  const bestMember = best ? best.members.find(m => m.userId === user.id) : null;
                  if (!myMember) return best;
                  if (!best || !bestMember) return league;
                  return myMember.weeklyRank < bestMember.weeklyRank ? league : best;
                }, null as League | null);

                if (!topLeague) return null;

                const myMember = topLeague.members.find(m => m.userId === user.id);
                if (!myMember) return null;

                const sortedMembers = [...topLeague.members].sort((a, b) => b.weeklyScore - a.weeklyScore);
                const myRank = sortedMembers.findIndex(m => m.userId === user.id) + 1;
                const leader = sortedMembers[0];
                const pointsFromTop = leader && leader.userId !== user.id
                  ? leader.weeklyScore - myMember.weeklyScore
                  : 0;

                const rankSuffix = (n: number) => {
                  if (n % 100 >= 11 && n % 100 <= 13) return "th";
                  switch (n % 10) {
                    case 1: return "st";
                    case 2: return "nd";
                    case 3: return "rd";
                    default: return "th";
                  }
                };

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <Card
                      className="p-4 hover-elevate cursor-pointer"
                      onClick={() => navigate("/leagues")}
                      data-testid="card-league-rank"
                    >
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold" data-testid="text-league-rank">
                                {myRank}{rankSuffix(myRank)}
                              </span>
                              <span className="text-sm text-muted-foreground">in</span>
                              <span className="text-sm font-semibold truncate" data-testid="text-league-name">
                                {topLeague.name}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground" data-testid="text-league-distance">
                              {myRank === 1
                                ? "You're leading the pack!"
                                : `${pointsFromTop} pts from #1`}
                            </p>
                          </div>
                        </div>
                        {userLeagues.length > 1 && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0" data-testid="badge-league-count">
                            +{userLeagues.length - 1} more
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Card>
                  </motion.div>
                );
              })()}

              {/* Next Unlock Card */}
              {nextUnlock && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <NextUnlockCard
                    mode={nextUnlock.mode}
                    label={nextUnlock.label}
                    info={nextUnlock.info}
                    level={levelInfo.level}
                  />
                </motion.div>
              )}

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Card
                  className={cn(
                    "p-3 transition-colors duration-500",
                    isLastHour ? "border-primary/35 bg-primary/5" : "border-border/60"
                  )}
                  data-testid="card-countdown"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={isLastHour ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                        transition={isLastHour ? { duration: 1.2, repeat: Infinity } : {}}
                      >
                        <Clock
                          className={cn(
                            "w-4 h-4",
                            isLastHour ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      </motion.div>
                      <span className="text-sm text-muted-foreground">
                        {hasPlayedToday
                          ? "Next decision test unlocks in..."
                          : "Today's drop expires in..."}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "text-lg font-bold font-mono tabular-nums transition-colors duration-500 flex items-center",
                        isLastHour ? "text-primary" : "text-foreground"
                      )}
                      data-testid="text-countdown"
                    >
                      <RollingNumber value={String(countdown.hours).padStart(2, "0")} />
                      <span className="mx-0.5">:</span>
                      <RollingNumber value={String(countdown.minutes).padStart(2, "0")} />
                      <span className="mx-0.5">:</span>
                      <RollingNumber value={String(countdown.seconds).padStart(2, "0")} />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Quick Tips */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <TipCardCarousel
                  tips={DAILY_TIPS.map((content, index) => ({
                    id: String(index),
                    content,
                  }))}
                  data-testid="card-daily-tip"
                />
              </motion.div>

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
                <Play className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Welcome to Lifestyle Creep</h2>
              <p className="text-muted-foreground mb-6">
                A daily money game that trains you to build wealth without falling into lifestyle
                inflation traps.
              </p>
              <Button size="lg" className="w-full" onClick={() => navigate("/setup")}>
                <Play className="w-5 h-5 mr-2" />
                Start Playing
              </Button>
            </Card>
          )}
        </main>
      </div>
      <DebugScreen open={showDebugScreen} onOpenChange={setShowDebugScreen} />
      {user && (
        <CleoPlayNudge
          hasPlayedToday={hasPlayedToday}
          streak={user.streak}
          onPlay={() => {
            if (!user.mode) navigate("/setup");
            else navigate("/play");
          }}
        />
      )}
    </>
  );
}
