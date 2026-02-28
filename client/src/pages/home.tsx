import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Onboarding } from "@/components/onboarding";
import { QuickStatsBar } from "@/components/quick-stats-bar";
import { StreakUrgencyBanner } from "@/components/streak-urgency-banner";
import { SocialProofCounter } from "@/components/social-proof-counter";
import { LiveActivityTicker } from "@/components/live-activity-ticker";
import { TipCardCarousel } from "@/components/stories-tips";
import { AnimatedCounter, RollingNumber } from "@/components/animated-counter";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { DebugScreen, useDebugGesture } from "@/components/debug-screen";
import { AmbientBackground } from "@/components/ambient-background";
import { AppLogo } from "@/components/app-logo";
import { Mascot, getMascotMoodForStreak, type MascotContext } from "@/components/mascot";
import { CleoPlayNudge } from "@/components/cleo-edge-presence";
import { MissionBoard } from "@/components/mission-board";
import { NextUnlockCard } from "@/components/next-unlock-card";
import { LevelProgress } from "@/components/level-progress";
import { ResourceBar } from "@/components/resource-bar";
import { useProgression } from "@/hooks/use-progression";
import type { MissionContext } from "@shared/lib/progression";
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
  Flame,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType, DailyDrop, LeaderboardEntry, CommunityScenario } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { handleTap } = useDebugGesture(() => setShowDebugScreen(true));

  const {
    unlocks,
    nextUnlock,
    levelInfo,
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

  const { data: hotPosts } = useQuery<CommunityScenario[]>({
    queryKey: ["/api/community/scenarios", { sortBy: "hot", limit: 3 }],
    queryFn: async () => {
      const res = await fetch("/api/community/scenarios?sortBy=hot");
      return res.json();
    },
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
    return `${timeOfDay}, ${user?.username || authUser?.username || "there"}!`;
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
      : `I'm on a ${user?.streak || 0} day streak in Lifestyle Creep! Can you beat my Money Health of ${user?.moneyHealth || 50}?`;
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  // Mission context for checking completions
  const missionContext: MissionContext = useMemo(
    () => ({
      hasPlayedToday,
      arcadePlaysToday: user?.arcadePlaysToday ?? 0,
      streak: user?.streak ?? 0,
      gamesPlayed: user?.gamesPlayed ?? 0,
      friendCount: user?.friendIds?.length ?? 0,
      coopPlayed: false,
      survivalPlayed: false,
      referralCount: user?.referralCount ?? 0,
    }),
    [hasPlayedToday, user]
  );

  return (
    <>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-hidden">
        <AmbientBackground variant="default" />
        <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
          <div className="flex items-center gap-2.5 min-h-[40px]">
            <AppLogo size="sm" />
            <span
              className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
              style={{ fontFeatureSettings: '"ss01", "ss02"' }}
            >
              Lifestyle Creep
            </span>
          </div>
          {authUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => navigate("/settings")}
              data-testid="button-settings"
              aria-label="Open settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
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
              <StreakUrgencyBanner hasPlayedToday={hasPlayedToday} streak={user.streak} />

              <QuickStatsBar
                user={user}
                rank={displayRank}
                streakContext={streakContext}
                className="mb-2"
              />

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

              {/* ===== PRIMARY CTA: Play Today's Drop ===== */}
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
                      <p className="text-muted-foreground text-sm mb-1" data-testid="text-tagline">
                        5 real-life money decisions in 2-4 minutes
                      </p>
                      <p
                        className="text-xs text-muted-foreground/80 italic mb-3"
                        data-testid="text-why-matters"
                      >
                        {whyThisMatters}
                      </p>
                      <div className="mb-2">
                        <SocialProofCounter />
                      </div>
                      <div className="mb-3">
                        <LiveActivityTicker
                          activities={friendsActivity?.recentActivity as any}
                          className="text-xs"
                        />
                      </div>
                      <Button
                        size="lg"
                        className={cn(
                          "gap-2 relative overflow-hidden font-bold",
                          hasPlayedToday ? "" : "btn-premium border-0"
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
                        animate={{
                          y: [0, -6, 0],
                          rotate: [0, 1.5, 0, -1.5, 0],
                        }}
                        transition={{
                          y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                          rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
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
                  transition={{ duration: 0.4, delay: 0.05 }}
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

              {/* Money IQ Level */}
              <LevelProgress totalXP={user.totalScore} />

              {/* Resource Bar */}
              <ResourceBar
                totalScore={user.totalScore}
                freezeTokens={user.freezeTokens}
                bonusArcadePlays={user.bonusArcadePlays ?? 0}
              />

              {/* Mission Board */}
              {activeMissions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <MissionBoard
                    missions={activeMissions}
                    context={missionContext}
                    completedIds={completedMissionIds}
                    onComplete={completeMission}
                  />
                </motion.div>
              )}

              {/* Next Unlock Card */}
              {nextUnlock && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <NextUnlockCard
                    mode={nextUnlock.mode}
                    label={nextUnlock.label}
                    info={nextUnlock.info}
                    level={levelInfo.level}
                  />
                </motion.div>
              )}

              {/* Community - Hot Posts Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
              >
              <Card className="p-4 rounded-xl" data-testid="card-community">
                <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <MessageSquare className="w-4 h-4 text-white" />
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
                    {hotPosts.slice(0, 2).map((post, i) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="p-3 rounded-lg bg-muted/30 cursor-pointer hover-elevate border border-transparent hover:border-border/50 transition-all"
                        onClick={() => navigate(`/community/${post.id}`)}
                        data-testid={`community-post-${post.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{post.context}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {post.upvotes + post.downvotes + post.commentCount >= 10 && (
                              <Badge variant="outline" className="text-[10px] h-5 border-orange-500/30 text-orange-500 px-1.5">
                                <Flame className="w-2.5 h-2.5 mr-0.5" />
                                Hot
                              </Badge>
                            )}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <TrendingUp className="w-3 h-3 text-primary" />
                              <span>{post.upvotes}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <AnimatedAvatar avatarId={post.authorAvatar || "cosmic-cat"} size="xs" />
                          <span>{post.authorUsername}</span>
                          <span>·</span>
                          <span>{post.commentCount} comments</span>
                        </div>
                      </motion.div>
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

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
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
                transition={{ duration: 0.4, delay: 0.05 }}
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
