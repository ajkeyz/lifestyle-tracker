import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScenarioCard } from "@/components/scenario-card-improved";
import { ProgressPill } from "@/components/progress-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { TeachingCard } from "@/components/teaching-card";
import { SpeedBonusBadge } from "@/components/speed-bonus-badge";
import { LifelineButton } from "@/components/lifeline-button";
import { PostSessionRecap } from "@/components/post-session-recap";
import { SwipeDotIndicators } from "@/components/swipe-dot-indicators";
import { useSwipe } from "@/hooks/use-swipe";
import { ArrowRight, Clock, Gamepad2, ArrowLeft, RotateCcw, Flame, Trophy, Zap, Coins } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { useHaptic } from "@/hooks/use-haptic";
import { useConfetti } from "@/components/confetti";
import type { DailyDrop, ArcadeStatus, SubmitArcadeGame } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { Mascot, MascotInline, type MascotContext } from "@/components/mascot";

// Experimental game modes: faster timer, speed bonuses
const TIMER_DURATION = 20;
const EXPERIMENTAL_TIMER_DURATION = 15;
const POINTS_PER_CORRECT = 100;

// ─── localStorage helpers for best score ───
function getArcadeBestScore(): number {
  try {
    return parseInt(localStorage.getItem("arcade_best_score") || "0", 10);
  } catch {
    return 0;
  }
}

function setArcadeBestScore(score: number) {
  try {
    localStorage.setItem("arcade_best_score", String(score));
  } catch { /* noop */ }
}

function getArcadeBestAccuracy(): number {
  try {
    return parseInt(localStorage.getItem("arcade_best_accuracy") || "0", 10);
  } catch {
    return 0;
  }
}

function setArcadeBestAccuracy(accuracy: number) {
  try {
    localStorage.setItem("arcade_best_accuracy", String(accuracy));
  } catch { /* noop */ }
}

// ─── Animated Arcade Background ───
function ArcadeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Floating pixel particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          initial={{
            x: `${10 + (i * 7) % 80}%`,
            y: "110%",
            opacity: 0,
          }}
          animate={{
            y: "-10%",
            opacity: [0, 0.6, 0.6, 0],
          }}
          transition={{
            duration: 8 + (i % 4) * 2,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ─── Arcade Token ───
function ArcadeToken({ filled, index }: { filled: boolean; index: number }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.1 }}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
        filled
          ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 shadow-lg shadow-amber-500/30"
          : "bg-muted/30 border-dashed border-muted-foreground/20"
      )}
    >
      {filled ? (
        <Gamepad2 className="w-4 h-4 text-white" />
      ) : (
        <Gamepad2 className="w-4 h-4 text-muted-foreground/30" />
      )}
    </motion.div>
  );
}

// ─── Score Popup ───
function ScorePopup({ isCorrect, isTimeout }: { isCorrect: boolean; isTimeout: boolean }) {
  if (isTimeout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 0, scale: 0.8 }}
        animate={{ opacity: [1, 1, 0], y: -40, scale: 1 }}
        transition={{ duration: 1.2, times: [0, 0.7, 1] }}
        className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
      >
        <span className="text-lg font-bold text-muted-foreground">Time's Up!</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [1, 1, 0], y: -50, scale: [1.2, 1] }}
      transition={{ duration: 1, times: [0, 0.6, 1] }}
      className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      <span className={cn(
        "text-xl font-bold",
        isCorrect ? "text-emerald-500" : "text-destructive"
      )}>
        {isCorrect ? `+${POINTS_PER_CORRECT}` : "Wrong"}
      </span>
    </motion.div>
  );
}

// ─── Combo Indicator ───
function ComboIndicator({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <motion.div
      key={streak}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/25"
    >
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.4, repeat: Infinity }}
      >
        <Flame className="w-4 h-4 text-orange-500" />
      </motion.div>
      <span className="text-sm font-bold text-orange-500">
        {streak}x Streak!
      </span>
    </motion.div>
  );
}

export default function Arcade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { play } = useSound();
  const { vibrateSuccess, vibrateError } = useHaptic();
  const { fireMiniCorrect } = useConfetti();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const [timerRunning, setTimerRunning] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [replayGameIndex, setReplayGameIndex] = useState<number | null>(null);
  const playedWarnings = useRef<Set<number>>(new Set());

  // Running score + combo state
  const [runningScore, setRunningScore] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [showScorePopup, setShowScorePopup] = useState<{ key: number; isCorrect: boolean; isTimeout: boolean } | null>(null);
  const popupCounter = useRef(0);

  // #4: Screen flash state
  const [answerFlash, setAnswerFlash] = useState<"correct" | "incorrect" | null>(null);
  // #11: Lifeline state
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  // #12: Speed bonus tracking
  const answerTimeRef = useRef<number>(0);
  const timerStartTime = useRef<number>(Date.now());
  // Timer pause when tab hidden
  const pausedAtRef = useRef<number | null>(null);
  const [showSpeedBadge, setShowSpeedBadge] = useState(false);
  // #14: Recap state
  const [showRecap, setShowRecap] = useState(false);

  // Experimental game modes flag
  const isExperimentalMode = isFeatureEnabled("new_game_modes");
  const timerDuration = isExperimentalMode ? EXPERIMENTAL_TIMER_DURATION : TIMER_DURATION;

  // Best score from localStorage
  const bestScore = getArcadeBestScore();
  const bestAccuracy = getArcadeBestAccuracy();

  useEffect(() => {
    if (gameStarted) {
      window.history.pushState({ inGame: true }, "");

      const handlePopState = () => {
        window.history.pushState({ inGame: true }, "");
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [gameStarted]);

  const { data: arcadeStatus, isLoading: statusLoading } = useQuery<ArcadeStatus>({
    queryKey: ["/api/arcade-status"],
  });

  const arcadeDropEndpoint = replayGameIndex !== null
    ? `/api/arcade-drop?gameIndex=${replayGameIndex}`
    : "/api/arcade-drop";

  const { data: arcadeDrop, isLoading: dropLoading, refetch: refetchDrop } = useQuery<DailyDrop>({
    queryKey: [arcadeDropEndpoint],
    enabled: false,
  });

  const isReplaying = replayGameIndex !== null;

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitArcadeGame) => {
      const res = await apiRequest("POST", "/api/submit-arcade", data);
      return res.json();
    },
    onSuccess: async (result) => {
      // Save best score to localStorage
      if (result.score > getArcadeBestScore()) {
        setArcadeBestScore(result.score);
      }
      const accuracy = result.totalQuestions > 0
        ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
        : 0;
      if (accuracy > getArcadeBestAccuracy()) {
        setArcadeBestAccuracy(accuracy);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/arcade-status"] });
      navigate(`/arcade-results?score=${result.score}&correct=${result.correctAnswers}&total=${result.totalQuestions}&remaining=${result.playsRemaining}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit your answers. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startGame = useCallback(async () => {
    const result = await refetchDrop();
    if (result.isError || !result.data) {
      await queryClient.invalidateQueries({ queryKey: ["/api/arcade-status"] });
      toast({
        title: "Can't start game",
        description: "You've used all your arcade plays for today, or an error occurred.",
        variant: "destructive",
      });
      return;
    }
    setGameStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setShowResults({});
    setTimeRemaining(timerDuration);
    setTimerRunning(true);
    setRunningScore(0);
    setComboStreak(0);
    setShowScorePopup(null);
    setLifelineUsed(false);
    setEliminatedChoices([]);
    setShowSpeedBadge(false);
    setShowRecap(false);
    timerStartTime.current = Date.now();
    playedWarnings.current.clear();
  }, [refetchDrop, toast]);

  const startReplay = useCallback(async (gameIndex: number) => {
    setReplayGameIndex(gameIndex);
  }, []);

  useEffect(() => {
    if (replayGameIndex !== null && !gameStarted) {
      startGame();
    }
  }, [replayGameIndex, gameStarted, startGame]);

  const scenarios = arcadeDrop?.scenarios || [];
  const currentScenario = scenarios[currentIndex];
  const totalScenarios = scenarios.length;
  const progress = totalScenarios > 0 ? ((currentIndex + 1) / totalScenarios) * 100 : 0;

  const handleSelectChoice = useCallback((label: string) => {
    if (!currentScenario || showResults[currentScenario.id]) return;

    const choice = currentScenario.choices.find((c) => c.label === label);
    const isCorrect = !!choice?.isCorrect;

    // #12: Track answer time
    const elapsed = Math.floor((Date.now() - timerStartTime.current) / 1000);
    answerTimeRef.current = elapsed;

    if (isCorrect) {
      play("correct");
      vibrateSuccess();
      fireMiniCorrect();
      setRunningScore(prev => prev + POINTS_PER_CORRECT);
      setComboStreak(prev => prev + 1);
      // #4: Flash correct
      setAnswerFlash("correct");
      // #12: Show speed badge
      setShowSpeedBadge(true);
    } else {
      play("incorrect");
      vibrateError();
      setComboStreak(0);
      // #4: Flash incorrect
      setAnswerFlash("incorrect");
      setShowSpeedBadge(false);
    }

    // #4: Clear flash after animation
    setTimeout(() => setAnswerFlash(null), 400);

    popupCounter.current += 1;
    setShowScorePopup({ key: popupCounter.current, isCorrect, isTimeout: false });

    setAnswers((prev) => ({ ...prev, [currentScenario.id]: label }));
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
    setEliminatedChoices([]);
  }, [currentScenario, showResults, play, vibrateSuccess, vibrateError, fireMiniCorrect]);

  const handleTimeUp = useCallback(() => {
    if (!currentScenario || showResults[currentScenario.id]) return;
    play("timeUp");
    setComboStreak(0);
    popupCounter.current += 1;
    setShowScorePopup({ key: popupCounter.current, isCorrect: false, isTimeout: true });
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
    setShowSpeedBadge(false);
  }, [currentScenario, showResults, play]);

  useEffect(() => {
    if (!gameStarted || !timerRunning || !currentScenario || showResults[currentScenario.id]) return;

    const warningThreshold = isExperimentalMode ? 8 : 10;
    const criticalThreshold = isExperimentalMode ? 4 : 5;
    const startTime = Date.now();
    const startValue = timeRemaining;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const newTime = Math.max(0, startValue - elapsed);

      if (newTime !== timeRemaining) {
        setTimeRemaining(newTime);
      }

      if (newTime <= 0) {
        handleTimeUp();
        return;
      }
      if (newTime === warningThreshold && !playedWarnings.current.has(warningThreshold)) {
        playedWarnings.current.add(warningThreshold);
        play("timerWarning");
      }
      if (newTime === criticalThreshold && !playedWarnings.current.has(criticalThreshold)) {
        playedWarnings.current.add(criticalThreshold);
        play("timerCritical");
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, timerRunning, currentScenario, showResults, handleTimeUp, play, isExperimentalMode]);

  // Pause timer when tab is hidden to prevent unfair time loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerRunning) {
        pausedAtRef.current = Date.now();
      } else if (!document.hidden && pausedAtRef.current && timerRunning) {
        const pausedMs = Date.now() - pausedAtRef.current;
        timerStartTime.current += pausedMs;
        pausedAtRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timerRunning]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalScenarios - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(timerDuration);
      setTimerRunning(true);
      setShowScorePopup(null);
      setShowSpeedBadge(false);
      setEliminatedChoices([]);
      timerStartTime.current = Date.now();
      playedWarnings.current.clear();
      play("whoosh");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex, totalScenarios, timerDuration, play]);

  const handleSubmit = useCallback(() => {
    if (!arcadeDrop) return;

    const submissionAnswers = scenarios.map((s) => ({
      scenarioId: s.id,
      choiceLabel: answers[s.id] || "",
    }));

    submitMutation.mutate({
      arcadeDropId: arcadeDrop.id,
      answers: submissionAnswers,
    });
  }, [arcadeDrop, scenarios, answers, submitMutation]);

  // #11: Lifeline handler
  const handleLifeline = useCallback(() => {
    if (!currentScenario || lifelineUsed || showResults[currentScenario.id]) return;
    setLifelineUsed(true);
    play("whoosh");

    const wrongChoices = currentScenario.choices.filter(c => !c.isCorrect);
    const shuffled = [...wrongChoices].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2).map(c => c.label);
    setEliminatedChoices(toEliminate);
  }, [currentScenario, lifelineUsed, showResults, play]);

  const allAnswered = scenarios.every((s) => showResults[s.id]);

  // #15: Swipe handlers for navigating between answered questions
  const swipeHandlers = useSwipe({
    enabled: allAnswered && !showRecap,
    onSwipeLeft: () => {
      if (currentIndex < totalScenarios - 1) {
        setCurrentIndex(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    onSwipeRight: () => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
  });

  useEffect(() => {
    if (!gameStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (currentScenario && !showResults[currentScenario.id]) {
        const choiceIndex = parseInt(e.key) - 1;
        if (choiceIndex >= 0 && choiceIndex < currentScenario.choices.length) {
          const choice = currentScenario.choices[choiceIndex];
          if (choice) {
            handleSelectChoice(choice.label);
          }
        }
      }

      if (e.key === "ArrowRight" && showResults[currentScenario?.id || ""] && currentIndex < totalScenarios - 1) {
        handleNext();
      }

      if (e.key === "Enter" && allAnswered && !submitMutation.isPending) {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted, currentScenario, showResults, currentIndex, totalScenarios, allAnswered, handleSelectChoice, handleNext, handleSubmit, submitMutation.isPending]);

  // ─── START SCREEN ───
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative">
        <ArcadeBackground />

        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm relative">
          <div className="container max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/play-hub")} data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <AppLogo size="sm" />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container max-w-3xl mx-auto px-4 py-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            {/* Cleo mascot instead of generic icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <Mascot mood="hyped" size="md" context={{ screen: "arcade" }} />
            </motion.div>

            <div>
              <h1 className="text-3xl font-semibold mb-2 tracking-[-0.02em]" data-testid="text-arcade-title">
                Arcade Mode
                {isExperimentalMode && (
                  <Badge variant="outline" className="ml-2 text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    Speed Mode
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Play extra rounds with different scenarios. Your scores don't affect your daily streak.
                {isExperimentalMode && (
                  <span className="block mt-2 text-sm text-purple-600 dark:text-purple-400 font-medium">
                    ⚡ Speed Mode active: {EXPERIMENTAL_TIMER_DURATION}s per question
                  </span>
                )}
              </p>
            </div>

            {statusLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-48 mx-auto rounded-lg" />
                <Skeleton className="h-10 w-40 mx-auto rounded-lg" />
              </div>
            ) : arcadeStatus ? (
              <div className="space-y-5">
                {/* Arcade token visuals */}
                <div className="flex items-center justify-center gap-3">
                  {Array.from({ length: arcadeStatus.maxPlaysToday }).map((_, i) => (
                    <ArcadeToken
                      key={i}
                      index={i}
                      filled={i < arcadeStatus.playsUsedToday}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{arcadeStatus.playsRemaining}</span>{" "}
                  {arcadeStatus.playsRemaining === 1 ? "play" : "plays"} remaining today
                </p>

                {/* Best score card */}
                {(bestScore > 0 || bestAccuracy > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="p-4 max-w-xs mx-auto bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/15">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-500">Personal Best</span>
                      </div>
                      <div className="flex items-center justify-center gap-6">
                        {bestScore > 0 && (
                          <div className="text-center">
                            <p className="text-xl font-bold">{bestScore}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</p>
                          </div>
                        )}
                        {bestAccuracy > 0 && (
                          <div className="text-center">
                            <p className="text-xl font-bold">{bestAccuracy}%</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {arcadeStatus.canPlay ? (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base font-semibold btn-premium border-0"
                    onClick={startGame}
                    disabled={dropLoading}
                    data-testid="button-start-arcade"
                  >
                    {dropLoading ? (
                      <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        Loading...
                      </motion.span>
                    ) : (
                      <>
                        <Gamepad2 className="w-5 h-5 mr-2" />
                        {arcadeStatus.gamesUnlocked > 0
                          ? `Start Game ${arcadeStatus.currentGameIndex + 1} of ${arcadeStatus.gamesUnlocked + 1}`
                          : "Start Arcade Game"}
                      </>
                    )}
                  </Button>
                ) : arcadeStatus.canReplay ? (
                  <div className="space-y-3">
                    <p className="text-muted-foreground font-medium" data-testid="text-all-played">
                      All games played for today!
                    </p>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 px-8 text-base font-semibold"
                      onClick={() => startReplay(0)}
                      disabled={dropLoading}
                      data-testid="button-replay-arcade"
                    >
                      {dropLoading ? (
                        <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          Loading...
                        </motion.span>
                      ) : (
                        <>
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Play Again
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-muted-foreground font-medium" data-testid="text-limit-reached">
                      You've used all your arcade plays for today
                    </p>
                    {arcadeStatus.membershipTier === "free" && (
                      <Button variant="outline" onClick={() => navigate("/membership")} data-testid="button-upgrade">
                        Upgrade for more plays
                      </Button>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  {arcadeStatus.membershipTier === "free" && "Free tier: 1 game/day"}
                  {arcadeStatus.membershipTier === "plus" && "Plus tier: 3 games/day"}
                  {arcadeStatus.membershipTier === "pro" && "Pro tier: Unlimited games"}
                </p>
              </div>
            ) : null}
          </motion.div>
        </main>
      </div>
    );
  }

  // ─── IN-GAME SCREEN ───
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      {/* #4: Full-screen answer flash overlay */}
      <AnimatePresence>
        {answerFlash && (
          <div
            key={answerFlash}
            className={answerFlash === "correct" ? "screen-flash-correct" : "screen-flash-incorrect"}
          />
        )}
      </AnimatePresence>

      {/* Sticky top bar: logo + score + progress pill */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container max-w-2xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AppLogo size="sm" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" /> Arcade Mode
                </span>
                <span className="text-sm font-semibold flex items-center gap-2 flex-wrap">
                  {isReplaying ? (
                    <>
                      Replaying Game {replayGameIndex + 1}
                      <Badge variant="secondary" className="text-xs">Replay</Badge>
                    </>
                  ) : (
                    `Game #${(arcadeStatus?.playsUsedToday || 0) + 1}`
                  )}
                  {isExperimentalMode && (
                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                      Speed Mode
                    </Badge>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Running score counter */}
              <motion.div
                key={runningScore}
                initial={runningScore > 0 ? { scale: 1.3 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20"
              >
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-bold tabular-nums text-primary">{runningScore}</span>
              </motion.div>

              {/* Combo streak */}
              <ComboIndicator streak={comboStreak} />

              {currentScenario && (
                <ProgressPill
                  current={currentIndex + 1}
                  total={totalScenarios}
                />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Critical timer vignette overlay */}
      <AnimatePresence>
        {currentScenario && !showResults[currentScenario.id] && timeRemaining <= 5 && timerRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="vignette-critical"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sticky progress + timer zone */}
      <motion.div
        className={cn(
          "sticky top-[57px] z-40 backdrop-blur-sm border-b transition-colors duration-700",
          currentScenario && !showResults[currentScenario.id] && timeRemaining <= 5
            ? "bg-destructive/8 border-destructive/25"
            : currentScenario && !showResults[currentScenario.id] && timeRemaining <= 10
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-background/95"
        )}
        animate={
          currentScenario && !showResults[currentScenario.id] && timerRunning && timeRemaining <= 5
            ? { x: [-3, 3, -3, 3, -2, 2, 0] }
            : { x: 0 }
        }
        transition={
          timeRemaining <= 5
            ? { duration: 0.45, repeat: Infinity, repeatDelay: 0.55 }
            : { duration: 0.1 }
        }
      >
        <div className="container max-w-2xl mx-auto px-4 py-2">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <div className="sr-only" role="status">
            Question {currentIndex + 1} of {totalScenarios}
          </div>

          <AnimatePresence initial={false}>
            {currentScenario && !showResults[currentScenario.id] && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5 mt-1.5"
              >
                {/* Clock icon — shakes with increasing intensity as time runs out */}
                <motion.div
                  animate={
                    timeRemaining <= 3
                      ? { rotate: [-8, 8, -8, 8, -6, 6, 0], scale: [1, 1.3, 1.1, 1.3, 1] }
                      : timeRemaining <= 5
                        ? { rotate: [-5, 5, -5, 5, 0], scale: [1, 1.2, 1] }
                        : timeRemaining <= 10
                          ? { rotate: [-2, 2, -2, 0], scale: 1 }
                          : { rotate: 0, scale: 1 }
                  }
                  transition={
                    timeRemaining <= 3
                      ? { duration: 0.3, repeat: Infinity, ease: "easeInOut" }
                      : timeRemaining <= 5
                        ? { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
                        : timeRemaining <= 10
                          ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
                          : {}
                  }
                  className="flex-shrink-0"
                >
                  <Clock className={cn(
                    "w-3.5 h-3.5 transition-colors duration-500",
                    timeRemaining <= 3
                      ? "text-destructive drop-shadow-[0_0_4px_hsl(var(--destructive)/0.6)]"
                      : timeRemaining <= 5
                        ? "text-destructive"
                        : timeRemaining <= 10
                          ? "text-amber-500"
                          : "text-muted-foreground"
                  )} />
                </motion.div>

                {/* #5: Heartbeat dot when critical */}
                {timeRemaining <= 5 && timerRunning && (
                  <div className="heartbeat-dot flex-shrink-0" aria-hidden="true" />
                )}

                <div
                  className="timer-bar-track flex-1"
                  aria-label={`Time remaining: ${timeRemaining} seconds`}
                  data-testid="timer-bar"
                >
                  <div
                    className={cn(
                      "timer-bar-fill",
                      timeRemaining <= (isExperimentalMode ? 4 : 5)
                        ? "state-critical"
                        : timeRemaining <= (isExperimentalMode ? 8 : 10)
                          ? "state-warning"
                          : "state-normal"
                    )}
                    style={{ width: `${(timeRemaining / timerDuration) * 100}%` }}
                  />
                </div>

                <motion.span
                  key={timeRemaining}
                  initial={timeRemaining <= 5 ? { scale: 1.4, opacity: 0.6 } : { scale: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "text-xs font-bold tabular-nums min-w-[2.5ch] text-right leading-none transition-colors duration-500",
                    timeRemaining <= (isExperimentalMode ? 4 : 5)
                      ? "text-destructive"
                      : timeRemaining <= (isExperimentalMode ? 8 : 10)
                        ? "text-amber-500"
                        : "text-muted-foreground"
                  )}
                  aria-live="polite"
                  data-testid="timer-text"
                >
                  {timeRemaining}s
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main quiz grid */}
      <main className="container max-w-2xl mx-auto px-4 py-5 md:py-6">
        {!currentScenario ? (
          <div className="grid gap-4">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid gap-2.5 mt-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        ) : showRecap && scenarios.length > 0 ? (
          /* #14: Post-session recap */
          <PostSessionRecap
            scenarios={scenarios}
            answers={answers}
            onContinue={handleSubmit}
            isPending={submitMutation.isPending}
          />
        ) : (
          <div className="grid gap-5 relative" {...swipeHandlers}>
            {/* Score popup */}
            <AnimatePresence>
              {showScorePopup && showResults[currentScenario.id] && (
                <ScorePopup
                  key={showScorePopup.key}
                  isCorrect={showScorePopup.isCorrect}
                  isTimeout={showScorePopup.isTimeout}
                />
              )}
            </AnimatePresence>

            {/* #11: Lifeline button */}
            {currentScenario && !showResults[currentScenario.id] && (
              <div className="flex items-center justify-start">
                <LifelineButton
                  used={lifelineUsed}
                  onUse={handleLifeline}
                  disabled={showResults[currentScenario.id] || false}
                />
              </div>
            )}

            {/* #12: Speed bonus badge after answering */}
            <AnimatePresence>
              {showResults[currentScenario.id] && showSpeedBadge && (
                <div className="flex justify-center">
                  <SpeedBonusBadge
                    answerTimeSeconds={answerTimeRef.current}
                    timerDuration={timerDuration}
                    show={showSpeedBadge}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Zone A+B+C: Context, Question, Answers */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <ScenarioCard
                  scenario={currentScenario}
                  selectedChoice={answers[currentScenario.id] || null}
                  onSelectChoice={handleSelectChoice}
                  showResult={showResults[currentScenario.id] || false}
                  questionNumber={currentIndex + 1}
                  totalQuestions={totalScenarios}
                  timeRemaining={timeRemaining}
                  timerRunning={timerRunning}
                  eliminatedChoices={eliminatedChoices}
                />
              </motion.div>
            </AnimatePresence>

            {/* #8: Compact teaching card for arcade */}
            <AnimatePresence>
              {showResults[currentScenario.id] && (
                <TeachingCard
                  scenario={currentScenario}
                  selectedLabel={answers[currentScenario.id] || null}
                  didTimeOut={!answers[currentScenario.id]}
                  questionIndex={currentIndex}
                  showFull={false}
                />
              )}
            </AnimatePresence>

            {/* Cleo mascot reaction after answer */}
            <AnimatePresence>
              {showResults[currentScenario.id] && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  {(() => {
                    const isTimeout = !answers[currentScenario.id];
                    const isCorrect = !isTimeout && (currentScenario.choices.find(c => c.label === answers[currentScenario.id])?.isCorrect ?? false);
                    const mood = isTimeout ? "shocked" : isCorrect ? "happy" : "sad";
                    const ctx: MascotContext = {
                      screen: "game",
                      wasCorrect: isCorrect,
                      wasTimeout: isTimeout,
                      timeRemainingOnAnswer: timeRemaining,
                      questionIndex: currentIndex,
                    };
                    return <MascotInline mood={mood} context={ctx} />;
                  })()}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zone D: Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid gap-2.5"
            >
              {currentIndex < totalScenarios - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!showResults[currentScenario.id]}
                  size="lg"
                  className={cn(
                    "w-full text-base font-semibold btn-premium border-0",
                    !showResults[currentScenario.id] && "opacity-50"
                  )}
                  aria-label="Continue to next question"
                  data-testid="button-next"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    // #14: Show recap before submitting
                    setShowRecap(true);
                  }}
                  disabled={!allAnswered || submitMutation.isPending}
                  size="lg"
                  className={cn(
                    "w-full text-base font-bold btn-gold border-0",
                    (!allAnswered || submitMutation.isPending) && "opacity-60"
                  )}
                  aria-label="Review your answers"
                  data-testid="button-submit-arcade"
                >
                  {submitMutation.isPending ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Submitting...
                    </motion.span>
                  ) : (
                    <>
                      Review & Submit
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </motion.div>

            {!showResults[currentScenario.id] && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-xs text-muted-foreground/50 hidden md:block"
              >
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">1</kbd>-
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">4</kbd> to answer
              </motion.p>
            )}

            {/* #15: Swipe dot indicators for review mode */}
            {allAnswered && !showRecap && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-center text-xs text-muted-foreground/50 mb-1">
                  Swipe to review your answers
                </p>
                <SwipeDotIndicators
                  total={totalScenarios}
                  current={currentIndex}
                  onDotClick={(i) => {
                    setCurrentIndex(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
