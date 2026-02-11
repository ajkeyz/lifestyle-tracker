import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScenarioCard } from "@/components/scenario-card-improved";
import { ProgressPill } from "@/components/progress-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Clock, Gamepad2, ArrowLeft, RotateCcw } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
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

// Experimental game modes: faster timer, speed bonuses
const TIMER_DURATION = 20;
const EXPERIMENTAL_TIMER_DURATION = 15;

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

  // Experimental game modes flag
  const isExperimentalMode = isFeatureEnabled("new_game_modes");
  const timerDuration = isExperimentalMode ? EXPERIMENTAL_TIMER_DURATION : TIMER_DURATION;

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
    if (choice?.isCorrect) {
      play("correct");
      vibrateSuccess();
      fireMiniCorrect();
    } else {
      play("incorrect");
      vibrateError();
    }

    setAnswers((prev) => ({ ...prev, [currentScenario.id]: label }));
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
  }, [currentScenario, showResults, play, vibrateSuccess, vibrateError, fireMiniCorrect]);

  const handleTimeUp = useCallback(() => {
    if (!currentScenario || showResults[currentScenario.id]) return;
    play("timeUp");
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
  }, [currentScenario, showResults, play]);

  useEffect(() => {
    if (!gameStarted || !timerRunning || !currentScenario || showResults[currentScenario.id]) return;

    // Adjust warning thresholds for experimental mode
    const warningThreshold = isExperimentalMode ? 8 : 10;
    const criticalThreshold = isExperimentalMode ? 4 : 5;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        if (prev === warningThreshold + 1 && !playedWarnings.current.has(warningThreshold)) {
          playedWarnings.current.add(warningThreshold);
          play("timerWarning");
        }
        if (prev === criticalThreshold + 1 && !playedWarnings.current.has(criticalThreshold)) {
          playedWarnings.current.add(criticalThreshold);
          play("timerCritical");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStarted, timerRunning, currentScenario, showResults, handleTimeUp, play, isExperimentalMode]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalScenarios - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(timerDuration);
      setTimerRunning(true);
      playedWarnings.current.clear();
      play("whoosh");
      window.scrollTo(0, 0);
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

  const allAnswered = scenarios.every((s) => showResults[s.id]);

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

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
          <div className="container max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <AppLogo size="sm" />
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container max-w-3xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto">
              <Gamepad2 className="w-10 h-10 text-white" />
            </div>

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
                    ⚡ Speed Mode active: {EXPERIMENTAL_TIMER_DURATION}s per question (faster gameplay)
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
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold" data-testid="text-plays-remaining">{arcadeStatus.playsRemaining}</p>
                    <p className="text-xs text-muted-foreground">plays left today</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold" data-testid="text-plays-used">{arcadeStatus.playsUsedToday}</p>
                    <p className="text-xs text-muted-foreground">played today</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold" data-testid="text-max-plays">{arcadeStatus.maxPlaysToday}</p>
                    <p className="text-xs text-muted-foreground">max today</p>
                  </div>
                </div>

                {arcadeStatus.canPlay ? (
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base font-semibold"
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Sticky top bar: logo + progress pill */}
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

      {/* Sticky progress + timer zone */}
      <div className="sticky top-[57px] z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-2">
          <Progress
            value={progress}
            className="h-1.5 bg-secondary"
            aria-label={`Progress: ${currentIndex + 1} of ${totalScenarios} questions`}
            data-testid="progress-bar"
          />

          {currentScenario && !showResults[currentScenario.id] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-1.5"
            >
              <Clock className={cn(
                "w-3.5 h-3.5 flex-shrink-0",
                timeRemaining <= (isExperimentalMode ? 4 : 5) ? "text-destructive" : "text-muted-foreground"
              )} />
              <Progress
                value={(timeRemaining / timerDuration) * 100}
                className={cn(
                  "flex-1 h-1 transition-all",
                  timeRemaining <= (isExperimentalMode ? 4 : 5) && "animate-pulse"
                )}
                aria-label={`Time remaining: ${timeRemaining} seconds`}
                data-testid="timer-bar"
              />
              <motion.span
                key={timeRemaining}
                initial={{ scale: 0.9 }}
                animate={{ scale: timeRemaining <= (isExperimentalMode ? 4 : 5) ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "font-mono text-xs font-medium tabular-nums",
                  timeRemaining <= (isExperimentalMode ? 4 : 5) ? "text-destructive" : "text-muted-foreground"
                )}
                aria-live="polite"
                data-testid="timer-text"
              >
                {timeRemaining}s
              </motion.span>
            </motion.div>
          )}
        </div>
      </div>

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
        ) : (
          <div className="grid gap-5">
            {/* Zone A+B+C: Context, Question, Answers */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              >
                <ScenarioCard
                  scenario={currentScenario}
                  selectedChoice={answers[currentScenario.id] || null}
                  onSelectChoice={handleSelectChoice}
                  showResult={showResults[currentScenario.id] || false}
                  questionNumber={currentIndex + 1}
                  totalQuestions={totalScenarios}
                />
              </motion.div>
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
                  className="w-full text-base font-semibold"
                  aria-label="Continue to next question"
                  data-testid="button-next"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitMutation.isPending}
                  size="lg"
                  className="w-full text-base font-semibold"
                  aria-label="Submit your answers"
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
                      Submit Answers
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
                className="text-center text-xs text-muted-foreground/50"
              >
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">1</kbd>-
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">4</kbd> to answer
              </motion.p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
