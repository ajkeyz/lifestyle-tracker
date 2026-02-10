import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScenarioCard } from "@/components/scenario-card-improved";
import { ProgressPill } from "@/components/progress-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRight, Clock } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { useHaptic } from "@/hooks/use-haptic";
import { useConfetti } from "@/components/confetti";
import {
  getTimerMessage,
  getMicroAffirmation,
  getPostAnswerReflection,
  getCounterfactual,
  getDelayTeachable,
} from "@/lib/game-insights";
import type { DailyDrop, User, SubmitGame } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TIMER_DURATION = 20;

export default function Game() {
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
  const [timedOut, setTimedOut] = useState<Record<string, boolean>>({});
  const playedWarnings = useRef<Set<number>>(new Set());

  useEffect(() => {
    window.history.pushState({ inGame: true }, "");

    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState({ inGame: true }, "");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const { data: dailyDrop, isLoading, isError, error, refetch } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
    retry: 1,
    retryDelay: 1000,
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitGame) => {
      const res = await apiRequest("POST", "/api/submit-game", data);
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      navigate("/results");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit your answers. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scenarios = dailyDrop?.scenarios || [];
  const currentScenario = scenarios[currentIndex];
  const totalScenarios = scenarios.length;
  const progress = totalScenarios > 0 ? ((currentIndex + 1) / totalScenarios) * 100 : 0;

  const isAnswering = currentScenario && !showResults[currentScenario.id];
  const hasAnswered = currentScenario && showResults[currentScenario.id];
  const selectedLabel = currentScenario ? answers[currentScenario.id] || null : null;
  const didTimeOut = currentScenario ? timedOut[currentScenario.id] || false : false;

  const timerMessage = useMemo(() => {
    return getTimerMessage(timeRemaining, TIMER_DURATION);
  }, [timeRemaining]);

  const microAffirmation = useMemo(() => {
    if (!hasAnswered || !selectedLabel || didTimeOut) return null;
    return getMicroAffirmation(currentIndex, selectedLabel);
  }, [hasAnswered, selectedLabel, currentIndex, didTimeOut]);

  const postReflection = useMemo(() => {
    if (!hasAnswered || !currentScenario) return null;
    if (didTimeOut) return getDelayTeachable();
    return getPostAnswerReflection(currentScenario, selectedLabel);
  }, [hasAnswered, currentScenario, selectedLabel, didTimeOut]);

  const counterfactual = useMemo(() => {
    if (!hasAnswered) return null;
    return getCounterfactual(currentIndex);
  }, [hasAnswered, currentIndex]);

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
    setTimedOut((prev) => ({ ...prev, [currentScenario.id]: true }));
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
  }, [currentScenario, showResults, play]);

  useEffect(() => {
    if (!timerRunning || !currentScenario || showResults[currentScenario.id]) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        if (prev === 11 && !playedWarnings.current.has(10)) {
          playedWarnings.current.add(10);
          play("timerWarning");
        }
        if (prev === 6 && !playedWarnings.current.has(5)) {
          playedWarnings.current.add(5);
          play("timerCritical");
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, currentScenario, showResults, handleTimeUp, play]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalScenarios - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(TIMER_DURATION);
      setTimerRunning(true);
      playedWarnings.current.clear();
      play("whoosh");
      window.scrollTo(0, 0);
    }
  }, [currentIndex, totalScenarios, play]);

  const handleSubmit = useCallback(() => {
    if (!dailyDrop) return;

    const submissionAnswers = scenarios.map((s) => ({
      scenarioId: s.id,
      choiceLabel: answers[s.id] || "",
    }));

    submitMutation.mutate({
      dropId: dailyDrop.id,
      answers: submissionAnswers,
    });
  }, [dailyDrop, scenarios, answers, submitMutation]);

  const allAnswered = scenarios.length > 0 && scenarios.every((s) => showResults[s.id] === true);

  useEffect(() => {
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
  }, [currentScenario, showResults, currentIndex, totalScenarios, allAnswered, handleSelectChoice, handleNext, handleSubmit, submitMutation.isPending]);

  useEffect(() => {
    if (user?.todayResult) {
      navigate("/results");
    } else if (user && !user.mode) {
      navigate("/setup");
    }
  }, [user?.todayResult, user?.mode, navigate]);

  if (user?.todayResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground" data-testid="text-redirect-results">Redirecting to results...</p>
      </div>
    );
  }

  if (user && !user.mode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
        <p className="text-muted-foreground" data-testid="text-redirect-setup">Setting up your game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <motion.header
        animate={{ opacity: isAnswering ? 0.4 : 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm"
      >
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AppLogo size="sm" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-muted-foreground">Daily Drop</span>
                <span className="font-semibold">#{dailyDrop?.dropNumber || "..."}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isLoading && currentScenario && (
                <ProgressPill
                  current={currentIndex + 1}
                  total={totalScenarios}
                />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <Progress
            value={progress}
            className="h-2 bg-secondary"
            aria-label={`Progress: ${currentIndex + 1} of ${totalScenarios} questions`}
            data-testid="progress-bar"
          />

          {currentScenario && !showResults[currentScenario.id] && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 mt-2"
            >
              <Clock className={cn(
                "w-4 h-4",
                timeRemaining <= 5 ? "text-destructive" : "text-muted-foreground"
              )} />
              <Progress
                value={(timeRemaining / TIMER_DURATION) * 100}
                className={cn(
                  "flex-1 h-1.5 transition-all",
                  timeRemaining <= 5 && "animate-pulse"
                )}
                aria-label={`Time remaining: ${timeRemaining} seconds`}
                data-testid="timer-bar"
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={timerMessage}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    timeRemaining <= 5 ? "text-destructive" : "text-muted-foreground"
                  )}
                  aria-live="polite"
                  data-testid="timer-text"
                >
                  {timerMessage}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      <main className="container max-w-3xl mx-auto px-4 py-6 md:py-8">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg font-semibold">Failed to load Daily Drop</p>
            <p className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</p>
            <Button onClick={() => refetch()} variant="outline" size="lg">
              Try Again
            </Button>
          </div>
        ) : currentScenario ? (
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, x: 20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.98 }}
                transition={{
                  duration: 0.35,
                  ease: [0.4, 0, 0.2, 1],
                }}
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

            <AnimatePresence>
              {hasAnswered && (postReflection || counterfactual) && (
                <motion.div
                  initial={{ opacity: 0, y: 16, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: 8, height: 0 }}
                  transition={{ duration: 0.5, delay: 1.5 }}
                  className="space-y-3 overflow-hidden"
                  data-testid="panel-post-reflection"
                >
                  {postReflection && (
                    <div className="p-4 rounded-lg border bg-muted/30 backdrop-blur-sm">
                      <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-reflection-insight">
                        {postReflection}
                      </p>
                    </div>
                  )}
                  {counterfactual && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.5 }}
                      className="text-xs text-muted-foreground/70 italic text-center"
                      data-testid="text-counterfactual"
                    >
                      Many people also considered: &ldquo;{counterfactual}&rdquo;
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <AnimatePresence>
                {microAffirmation && hasAnswered && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="text-center text-sm text-muted-foreground italic"
                    data-testid="text-micro-affirmation"
                  >
                    {microAffirmation}
                  </motion.p>
                )}
              </AnimatePresence>

              {currentIndex < totalScenarios - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!showResults[currentScenario.id]}
                  size="lg"
                  className="w-full h-14 text-base font-semibold"
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
                  className="w-full h-14 text-base font-semibold"
                  aria-label="Submit your answers"
                  data-testid="button-submit"
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
                className="text-center text-xs text-muted-foreground"
              >
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">1</kbd>-
                <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">4</kbd> to answer
              </motion.p>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No questions available</p>
          </div>
        )}
      </main>
    </div>
  );
}
