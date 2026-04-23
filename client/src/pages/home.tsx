import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Onboarding } from "@/components/onboarding";
import { DebugScreen, useDebugGesture } from "@/components/debug-screen";
import { AmbientBackground } from "@/components/ambient-background";
import { AppLogo } from "@/components/app-logo";
import { GradientText } from "@/components/gradient-text";
import { Mascot, getMascotMoodForStreak, type MascotContext } from "@/components/mascot";
import { DailyProgressCard } from "@/components/daily-progress-card";
import { useProgression } from "@/hooks/use-progression";

import {
  Play,
  Trophy,
  Sparkles,
  ChevronRight,
  Settings,
  UserCircle,
  X,
  MessageCircle,
  ArrowUp,
  Users,
  Lightbulb,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType, DailyDrop, CommunityScenario } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Rotating daily tips — a subset shown on home, full library at /tips
const HOME_TIPS = [
  { title: "Pay yourself first", content: "Automate your savings — what you don't see, you won't spend." },
  { title: "The 24-hour rule", content: "Sleep on big purchases. Most impulse wants fade overnight." },
  { title: "Cost-per-use thinking", content: "A $200 jacket worn 100 times costs less than a $50 one worn twice." },
  { title: "Start early, stay consistent", content: "Starting with $50/month at 25 beats $500/month at 45." },
  { title: "High-interest debt first", content: "Pay off credit cards before anything else. The math is brutal." },
  { title: "Subscription audit", content: "The average person wastes $200+/month on unused services." },
  { title: "Housing costs rule", content: "Keep housing under 30% of gross income. Under 25% gives real flexibility." },
];

const COMEBACK_MESSAGES = [
  { title: "Welcome back!", message: "Every expert was once a beginner. Pick up where you left off." },
  { title: "Fresh start!", message: "Missing a day doesn't erase your progress. Your knowledge stays with you." },
  { title: "Ready to rebuild?", message: "The best time to start was yesterday. The second best time is now." },
  { title: "You've got this!", message: "Streaks come and go, but financial wisdom is forever." },
  { title: "Back in action!", message: "Today is a new opportunity to make smart money moves." },
];


const FIRST_WEEK_NARRATIVE: Record<number, { phase: string; message: string }> = {
  1: { phase: "Awareness", message: "You're learning to notice your spending patterns" },
  2: { phase: "Awareness", message: "Building the habit of pausing before spending" },
  3: { phase: "Pattern spotting", message: "You're starting to see the patterns others miss" },
  4: { phase: "Pattern spotting", message: "Your instincts are sharpening with each decision" },
  5: { phase: "Pattern spotting", message: "You're thinking before spending \u2014 that's rare" },
  6: { phase: "Identity shift", message: "You're becoming someone who makes intentional choices" },
  7: { phase: "Identity shift", message: "One week in \u2014 your relationship with money is changing" },
};


function getComebackMessage(highestStreak: number) {
  return COMEBACK_MESSAGES[highestStreak % COMEBACK_MESSAGES.length];
}


export default function Home() {
  const [, navigate] = useLocation();
  const { user: authUser } = useAuth();
  const qc = useQueryClient();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDebugScreen, setShowDebugScreen] = useState(false);
  const [profileNudgeDismissed, setProfileNudgeDismissed] = useState(false);
  const { handleTap } = useDebugGesture(() => setShowDebugScreen(true));

  const {
    missionContext,
    activeMissions,
    completedMissionIds,
    completeMission,
  } = useProgression();

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


  const { data: hotPosts } = useQuery<CommunityScenario[]>({
    queryKey: ["/api/community/scenarios", { sortBy: "hot", limit: 3 }],
    queryFn: async () => {
      const res = await fetch("/api/community/scenarios?sortBy=hot&limit=3");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const hasPlayedToday = user?.todayResult != null;
  const isInFirstWeek = user ? user.gamesPlayed <= 7 : false;
  const firstWeekDay = user ? Math.min(user.gamesPlayed + 1, 7) : 1;
  const firstWeekNarrative = FIRST_WEEK_NARRATIVE[firstWeekDay];


  const [cleoGreeting, setCleoGreeting] = useState<string | undefined>(() => {
    const name = user?.username || authUser?.firstName || "there";
    // First-week users get a phase-specific greeting from Cleo
    if (isInFirstWeek && firstWeekNarrative && !hasPlayedToday) {
      return `Day ${firstWeekDay}: ${firstWeekNarrative.message}`;
    }
    // Comeback encouragement for returning users who lost their streak
    if (user && user.streak === 0 && user.highestStreak > 0 && !hasPlayedToday) {
      const comeback = getComebackMessage(user.highestStreak);
      return `${comeback.title} ${comeback.message}`;
    }
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    return `${timeOfDay}, ${name}!`;
  });

  useEffect(() => {
    if (!cleoGreeting) return;
    const t = setTimeout(() => setCleoGreeting(undefined), 6000);
    return () => clearTimeout(t);
  }, [cleoGreeting]);


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

        {/* Sticky status bar removed — stats shown in Identity Stats section */}

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
              {/* ═══ Daily Progress (collapsible missions) ═══ */}
              {activeMissions.length > 0 && (
                <DailyProgressCard
                  missions={activeMissions}
                  context={missionContext}
                  completedIds={completedMissionIds}
                  onComplete={completeMission}
                  isInFirstWeek={isInFirstWeek}
                />
              )}

              {/* ═══ PRIMARY CTA — Daily Drop ═══ */}

              {/* First-week narrative now delivered via Cleo's speech bubble */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <Card
                  className="p-4 pb-3 overflow-visible relative shadow-lg shadow-primary/5 hero-spotlight rounded-xl border-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/35"
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
                      <h2 className="text-lg font-display font-bold tracking-tight mb-1">
                        <GradientText variant="primary">Today's Drop</GradientText>
                      </h2>
                      <p className="text-muted-foreground text-sm mb-3" data-testid="text-tagline">
                        5 real-life money decisions in 2-4 minutes
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

                    </div>
                    <div className="flex flex-col items-center flex-shrink-0 relative -mt-2 -mr-1">
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
                          forceBubbleSide="bottom"
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

              {/* Comeback encouragement now delivered via Cleo's speech bubble */}

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

              {/* ═══ Community Preview ═══ */}
              {hotPosts && hotPosts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.15 }}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Community</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-primary h-7 px-2"
                        onClick={() => navigate("/community")}
                        data-testid="button-community-see-all"
                      >
                        See all
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {hotPosts.slice(0, 3).map((post) => (
                        <Card
                          key={post.id}
                          className="p-3 cursor-pointer transition-all hover:border-primary/20 hover:-translate-y-0.5"
                          onClick={() => navigate(`/community/${post.id}`)}
                          data-testid={`card-community-preview-${post.id}`}
                        >
                          <p className="text-sm font-medium line-clamp-1 mb-1.5">{post.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <ArrowUp className="w-3 h-3" />
                              {post.upvotes - post.downvotes}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              {post.commentCount}
                            </span>
                            <span className="text-muted-foreground/50">·</span>
                            <span>{post.authorUsername}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═══ Daily Tip ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {(() => {
                  const dayOfYear = Math.floor(
                    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const tip = HOME_TIPS[dayOfYear % HOME_TIPS.length];
                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tip of the day</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-primary h-7 px-2"
                          onClick={() => navigate("/tips")}
                          data-testid="button-tips-see-all"
                        >
                          All tips
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </div>
                      <Card
                        className="p-3 cursor-pointer transition-all hover:border-amber-500/20 hover:-translate-y-0.5"
                        onClick={() => navigate("/tips")}
                        data-testid="card-daily-tip"
                      >
                        <p className="text-sm font-medium mb-1">{tip.title}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
                      </Card>
                    </div>
                  );
                })()}
              </motion.div>
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
    </>
  );
}
