import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { RollingNumber } from "@/components/animated-counter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareCard } from "@/components/share-card";
import { SocialShareCard } from "@/components/social-share-card";
import { FriendLeague } from "@/components/leaderboard-card";
import { useConfetti } from "@/components/confetti";
import { useSound } from "@/hooks/use-sound";
import { QuickWinsPopup } from "@/components/quick-wins-popup";
import { ArrowLeft, Home, Trophy, Calendar, Share2, BookOpen, Sparkles, Flame, Brain, RefreshCw } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Mascot, getMascotMoodForScore, getMascotScoreMessage, getMascotContextDialogue, CelebrationBurst, BODY_COLORS, type MascotContext } from "@/components/mascot";
import { CleoCongratsPeek } from "@/components/cleo-edge-presence";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User, DailyDrop, LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { trackStreakUpdated, trackShareClicked } from "@/lib/analytics";
import { analyzeAnswerPatterns, toneColors } from "@/lib/game-insights";
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

export default function Results() {
  const [, navigate] = useLocation();
  const { firePerfectScore, fireStreakMilestone, fireAchievement } = useConfetti();
  const { play } = useSound();
  const confettiFired = useRef(false);
  const [showQuickWins, setShowQuickWins] = useState(false);

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

  const patternSummary = useMemo(() => {
    if (!result || scenarios.length === 0) return null;
    return analyzeAnswerPatterns(scenarios, result.answers);
  }, [result, scenarios]);

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
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground" data-testid="text-no-results">Loading results...</p>
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
                <Mascot
                  mood={getMascotMoodForScore(result.score)}
                  size="xl"
                  showBubble={false}
                  disableTapBubble={true}
                  context={mascotContext}
                />
                <ResultsBubble mood={getMascotMoodForScore(result.score)} context={mascotContext} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="relative z-10"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent mb-3">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-semibold tracking-wide uppercase" data-testid="text-drop-complete">Drop Complete</span>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                  className="mb-2"
                >
                  <span className="text-5xl font-display font-bold tabular-nums">
                    <RollingNumber value={result.score} />
                  </span>
                  <span className="text-lg text-muted-foreground font-medium">/500</span>
                </motion.div>
                <h1
                  className={cn(
                    "text-3xl font-bold tracking-[-0.03em] mb-1",
                    result.score >= 400 ? "gradient-text" : ""
                  )}
                  data-testid="text-great-job"
                >
                  {result.score >= 400 ? "Amazing!" : result.score >= 250 ? "Nice work!" : "Keep growing!"}
                </h1>
                <p className="text-muted-foreground text-sm" data-testid="text-come-back">
                  {user?.streak && user.streak > 0
                    ? `Keep your ${user.streak}-day streak alive!`
                    : "Come back tomorrow to build your streak!"}
                </p>
              </motion.div>
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

            {/* Social Share Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center"
            >
              <SocialShareCard
                user={user!}
                score={result.score}
                dropNumber={dailyDrop?.dropNumber}
                trigger={
                  <Button size="lg" className="gap-2 btn-gold border-0 font-bold relative overflow-hidden">
                    <Share2 className="w-5 h-5" />
                    Share on Social Media
                  </Button>
                }
              />
            </motion.div>

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
                Deep Dive
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
                Customize Share
              </Button>
            </motion.div>

            {/* Pattern Recognition */}
            {patternSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
              >
                <Card className="p-5" data-testid="card-pattern-recognition">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Brain className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold" data-testid="text-pattern-headline">Your Pattern Today</h3>
                  </div>
                  <p className="font-medium mb-1" data-testid="text-pattern-summary">
                    {patternSummary.headline}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4" data-testid="text-pattern-detail">
                    {patternSummary.detail}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap" data-testid="tone-breakdown">
                    {(Object.entries(patternSummary.toneBreakdown) as [string, number][])
                      .filter(([, count]) => count > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([tone, count]) => (
                        <div key={tone} className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            toneColors[tone as keyof typeof toneColors]
                          )} />
                          <span className="text-xs text-muted-foreground capitalize">
                            {tone} ({count})
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </Card>
              </motion.div>
            )}

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

            {leaderboard && leaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.55, ease: "easeOut" }}
              >
                <FriendLeague entries={leaderboard} currentUserId={user?.id ?? ""} />
              </motion.div>
            )}

            <Card className="p-4 bg-muted/50 rounded-xl relative overflow-hidden" data-testid="card-next-drop">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-t-xl" aria-hidden="true" />
              <div className="flex items-center gap-3 flex-wrap">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-next-drop-label">Next Drop</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-next-drop-time">
                    Tomorrow at midnight UTC
                  </p>
                </div>
              </div>
            </Card>

            <Button
              className="w-full gap-2 btn-premium border-0"
              onClick={async () => {
                try {
                  const res = await fetch("/api/daily-drop/replay", { method: "POST" });
                  if (res.ok) {
                    queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                    navigate("/play");
                  }
                } catch (e) { console.error("Replay failed", e); }
              }}
              data-testid="button-replay"
            >
              <RefreshCw className="w-4 h-4" />
              Replay Today's Drop
            </Button>

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
    {/* Cleo slides in from top-right for streak milestones */}
    <CleoCongratsPeek
      trigger={!!user?.streak && user.streak >= 7 && [7, 14, 30, 60, 100].includes(user.streak)}
      message={`${user?.streak}-day streak! You're on a roll!`}
    />
    </>
  );
}
