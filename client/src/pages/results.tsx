import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareCard } from "@/components/share-card";
import { FriendLeague } from "@/components/leaderboard-card";
import { useConfetti } from "@/components/confetti";
import { useSound } from "@/hooks/use-sound";
import { QuickWinsPopup } from "@/components/quick-wins-popup";
import { ArrowLeft, Home, Calendar, Share2, BookOpen, Users, UserCircle, ChevronRight, BellRing, Check } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Mascot, getMascotMoodForScore, getMascotScoreMessage, getMascotContextDialogue, CelebrationBurst, BODY_COLORS, type MascotContext } from "@/components/mascot";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User, DailyDrop, LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { trackStreakUpdated, trackShareClicked } from "@/lib/analytics";
import { CleoAnalysis } from "@/components/cleo-analysis";
import { cn } from "@/lib/utils";

function ResultsBubble({ mood, context }: { mood: import("@/components/mascot").MascotMood; context: MascotContext }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const colors = BODY_COLORS[mood];
  const message = useMemo(() => getMascotContextDialogue(context) || getMascotScoreMessage(context.score || 0), [context]);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    if (!message) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i >= message.length) { setDone(true); clearInterval(interval); return; }
      setDisplayed(message.slice(0, i + 1));
      i++;
    }, 62);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <motion.div
      className="mt-2 rounded-xl px-4 py-2.5 max-w-[260px] text-center backdrop-blur-md"
      style={{
        background: `${colors.main}18`,
        border: `1px solid ${colors.main}30`,
        boxShadow: `0 2px 12px ${colors.main}15`,
      }}
      initial={{ opacity: 0, y: -6, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, delay: 0.5 }}
      data-testid="results-mascot-bubble"
    >
      <p className="text-[13px] font-medium leading-snug text-foreground/90">
        {displayed}
        {!done && (
          <motion.span
            className="inline-block w-[2px] h-[14px] ml-0.5 align-middle rounded-full"
            style={{ background: colors.main }}
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </p>
    </motion.div>
  );
}

function NextDropCard() {
  const [reminderSet, setReminderSet] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemind = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/push/remind-next-drop", { method: "POST", credentials: "include" });
      if (res.ok) {
        setReminderSet(true);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-muted/50 rounded-xl relative overflow-hidden" data-testid="card-next-drop">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-t-xl" aria-hidden="true" />
      <div className="flex items-center gap-3">
        <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium" data-testid="text-next-drop-label">Next Drop</p>
          <p className="text-xs text-muted-foreground" data-testid="text-next-drop-time">
            Tomorrow at midnight UTC
          </p>
        </div>
        <Button
          variant={reminderSet ? "ghost" : "outline"}
          size="sm"
          className={cn("gap-1 text-xs h-7 flex-shrink-0", reminderSet && "text-green-500")}
          onClick={handleRemind}
          disabled={reminderSet || loading}
          data-testid="button-remind-next-drop"
        >
          {reminderSet ? (
            <>
              <Check className="w-3 h-3" />
              Set
            </>
          ) : loading ? (
            "..."
          ) : (
            <>
              <BellRing className="w-3 h-3" />
              Remind Me
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export default function Results() {
  const [, navigate] = useLocation();
  const { firePerfectScore, fireStreakMilestone, fireAchievement } = useConfetti();
  const { play } = useSound();
  const confettiFired = useRef(false);
  const [showQuickWins, setShowQuickWins] = useState(false);
  const [revealPhase, setRevealPhase] = useState<"anticipation" | "building" | "final">("anticipation");
  const revealStarted = useRef(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: dailyDrop, isLoading: dropLoading } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  // Guard: redirect to home if no todayResult, but with a grace period.
  // The submission may still be processing on the server (Neon cold start),
  // so refetch once before giving up and redirecting.
  const redirectAttempts = useRef(0);
  useEffect(() => {
    if (!userLoading && user && !user.todayResult) {
      if (redirectAttempts.current < 2) {
        // First 2 attempts: refetch user data after a short delay
        redirectAttempts.current++;
        const timer = setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }, 1500);
        return () => clearTimeout(timer);
      }
      // After 2 retries (~3s), give up and redirect
      navigate("/");
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (user?.todayResult && !confettiFired.current) {
      confettiFired.current = true;
      const isPerfectScore = user.todayResult.score === 500;
      const streakMilestones = [7, 14, 30, 60, 100];
      const isStreakMilestone = streakMilestones.includes(user.streak);
      const isFirstGame = user.gamesPlayed === 1;

      // Score reveal sound + count ticks synced with RollingNumber animation
      setTimeout(() => play("scoreReveal"), 200);
      const tickTimers: ReturnType<typeof setTimeout>[] = [];
      for (let i = 0; i < 6; i++) {
        tickTimers.push(setTimeout(() => play("countTick"), 280 + i * 80));
      }

      if (isPerfectScore) {
        setTimeout(() => {
          firePerfectScore();
          play("perfectScore");
        }, 500);
      } else if (isStreakMilestone) {
        setTimeout(() => {
          fireStreakMilestone(user.streak);
          play("streakMilestone");
        }, 500);
      } else if (user.todayResult.score >= 400) {
        setTimeout(() => {
          fireAchievement();
          play("achievement");
        }, 500);
      }

      // Show Quick Wins popup after first game
      if (isFirstGame) {
        setTimeout(() => {
          setShowQuickWins(true);
        }, 1500); // Show after confetti/celebrations
      }
    }
  }, [user, firePerfectScore, fireStreakMilestone, fireAchievement, play]);

  // Track streak update
  useEffect(() => {
    if (user?.todayResult && user.streak > 0) {
      const oldStreak = user.streak - 1;
      const newStreak = user.streak;

      if (newStreak > oldStreak) {
        trackStreakUpdated(
          oldStreak,
          newStreak,
          "grew",
          false, // No freeze used (they played)
          user.freezeTokens,
          newStreak > user.highestStreak,
          user.highestStreak
        );
      }
    }
  }, [user]);

  // Dynamic mascot mood during score reveal animation
  useEffect(() => {
    if (user?.todayResult && !revealStarted.current) {
      revealStarted.current = true;
      // Phase 1: "anticipation" — mascot starts nervous/thinking (already set as initial state)
      // Phase 2: "building" — score is counting up, mascot shifts to intermediate mood
      const buildTimer = setTimeout(() => {
        setRevealPhase("building");
      }, 600);
      // Phase 3: "final" — score reveal complete, mascot settles on final mood
      const finalTimer = setTimeout(() => {
        setRevealPhase("final");
      }, 1400);
      return () => {
        clearTimeout(buildTimer);
        clearTimeout(finalTimer);
      };
    }
  }, [user?.todayResult]);

  const result = user?.todayResult ?? null;
  const scenarios = dailyDrop?.scenarios || [];

  const correctAnswers = useMemo(() => {
    if (!result) return [];
    return result.answers.map((answer: string, index: number) => {
      const scenario = scenarios[index];
      if (!scenario) return false;
      const choice = scenario.choices.find((c: any) => c.label === answer);
      return choice?.isCorrect || false;
    });
  }, [result, scenarios]);

  // Dynamic mascot mood that shifts during score reveal animation
  const dynamicMascotMood = useMemo(() => {
    if (!result) return "thinking" as const;
    const finalMood = getMascotMoodForScore(result.score);
    if (revealPhase === "anticipation") return "thinking" as const;
    if (revealPhase === "building") {
      if (result.score >= 380) return "encouraging" as const;
      if (result.score >= 260) return "thinking" as const;
      return "sad" as const;
    }
    return finalMood;
  }, [result, revealPhase]);

  // Rich context for the mascot — makes Cleo contextually aware on results page
  const STREAK_MILESTONES = [7, 14, 30, 60, 100];
  const mascotContext: MascotContext = useMemo(() => {
    if (!result || !user) return { screen: "results" as const } as MascotContext;
    return {
      screen: "results",
      score: result.score,
      iq: result.iq,
      moneyHealth: result.moneyHealth,
      streakGained: user.streak > 0,
      streakBroken: user.streak === 0 && user.highestStreak > 0,
      isStreakMilestone: STREAK_MILESTONES.includes(user.streak),
      username: user.username,
      streak: user.streak,
      percentile: leaderboard && leaderboard.length > 0
        ? Math.round(((leaderboard.length - (leaderboard.findIndex(e => e.id === user.id) + 1)) / leaderboard.length) * 100)
        : undefined,
    };
  }, [result, user, leaderboard]);

  if (!result) {
    // Still loading user data, or briefly waiting for the submission to land
    // (see grace-period retry logic above). Show a soft loading state.
    const stillLoading = userLoading || redirectAttempts.current < 2;
    if (stillLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-no-results">Loading results...</p>
        </div>
      );
    }
    // Grace period expired with no result — give the user a clear way out
    // instead of a blank screen, in case the auto-redirect fails or feels slow.
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-xl font-bold" data-testid="text-no-results-title">
            No results yet today
          </h2>
          <p className="text-sm text-muted-foreground" data-testid="text-no-results-message">
            Play today's drop to see your score, IQ, and money health here.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate("/play")} data-testid="button-play-now">
              Play Today's Drop
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              data-testid="button-back-home-empty"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showQuickWins && (
        <QuickWinsPopup
          score={result.score}
          moneyHealth={result.moneyHealth}
          isFirstGame={user?.gamesPlayed === 1}
          onClose={() => setShowQuickWins(false)}
        />
      )}
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
        <header className="flex items-center justify-between gap-2 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <AppLogo size="sm" />
          <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-results-header">Results</span>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        {userLoading || dropLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="text-center py-6 relative"
            >
              {/* Ambient glow behind the hero section */}
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background: `radial-gradient(ellipse 70% 50% at 50% 30%, hsl(var(--${result.score >= 400 ? "accent" : "primary"}) / 0.18) 0%, transparent 70%)`,
                }}
                aria-hidden="true"
              />

              {/* Full-screen confetti for near-perfect or perfect scores */}
              <CelebrationBurst trigger={result.score >= 380} intensity={result.score >= 480 ? "epic" : "normal"} />

              <div className="flex flex-col items-center mb-4 relative z-10" data-testid="mascot-results">
                <motion.div
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
                    mood={dynamicMascotMood}
                    size="lg"
                    showBubble={false}
                    disableTapBubble={true}
                    streakCount={user?.streak ?? 0}
                    showStreakFlame={(user?.streak ?? 0) >= 3}
                    context={mascotContext}
                  />
                </motion.div>
                <ResultsBubble mood={dynamicMascotMood} context={mascotContext} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
            <ShareCard
              dropNumber={dailyDrop?.dropNumber || 0}
              result={result}
              answers={correctAnswers}
              streak={user?.streak ?? 0}
            />
            </motion.div>

            {mascotContext.percentile !== undefined && mascotContext.percentile > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
              >
                <Card className="p-5 text-center relative overflow-hidden" data-testid="card-percentile">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      background: `radial-gradient(ellipse 80% 60% at 50% 40%, hsl(var(--accent) / 0.25) 0%, transparent 70%)`,
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent/15 border border-accent/25">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <p className="text-3xl font-display font-bold tabular-nums" data-testid="text-percentile-value">
                      {mascotContext.percentile}%
                    </p>
                    <p className="text-sm text-muted-foreground font-medium" data-testid="text-percentile-label">
                      You beat {mascotContext.percentile}% of players today
                    </p>
                  </div>
                </Card>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
              className="flex gap-3 flex-wrap"
            >
              <Button
                onClick={() => navigate("/deep-dive")}
                variant="outline"
                className="flex-1"
                data-testid="button-deep-dive"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                {(() => {
                  const mistakeCount = correctAnswers.filter(a => a === false).length;
                  if (mistakeCount === 0) return "See why you aced it";
                  if (mistakeCount === 1) return "Review your 1 mistake";
                  return `Review your ${mistakeCount} mistakes`;
                })()}
              </Button>
              <Button
                onClick={() => {
                  trackShareClicked(
                    "results",
                    "copy_link",
                    "link",
                    {
                      score_value: result.score,
                      streak_value: user?.streak,
                    }
                  );
                  navigate("/share");
                }}
                className="flex-1"
                data-testid="button-customize-share"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </motion.div>

            {/* Cleo AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
            >
              <CleoAnalysis
                score={correctAnswers.filter(Boolean).length}
                totalQuestions={scenarios.length}
                moneyHealth={result.moneyHealth}
              />
            </motion.div>

            {/* Show FriendLeague only if user actually has friends */}
            {leaderboard && leaderboard.length > 0 && user && (user.friendIds?.length ?? 0) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
              >
                <FriendLeague entries={leaderboard} currentUserId={user.id} />
              </motion.div>
            )}

            <NextDropCard />

            {user && !user.profileSetupComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
              >
                <Card
                  className="p-5 border-primary/25 bg-primary/5 cursor-pointer hover-elevate"
                  onClick={() => navigate("/profile-setup?postgame=true")}
                  data-testid="card-profile-setup-prompt"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm" data-testid="text-setup-prompt-title">
                        {user.gamesPlayed === 1 ? "Great first game!" : "Nice work!"} Set up your profile
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-setup-prompt-desc">
                        Pick a username and avatar to show up on leaderboards and compete with friends
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
              data-testid="button-go-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </>
        )}
      </main>
    </div>
    </>
  );
}
