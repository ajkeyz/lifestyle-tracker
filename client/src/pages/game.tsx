import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScenarioCard } from "@/components/scenario-card-improved";
import { ProgressPill } from "@/components/progress-pill";
import { ThemeToggle } from "@/components/theme-toggle";
import { TeachingCard } from "@/components/teaching-card";
import { AnswerStreakIndicator } from "@/components/answer-streak-indicator";
import { SpeedBonusBadge } from "@/components/speed-bonus-badge";
import { LifelineButton } from "@/components/lifeline-button";
import { PostSessionRecap } from "@/components/post-session-recap";
import { SwipeDotIndicators } from "@/components/swipe-dot-indicators";
import { useSwipe } from "@/hooks/use-swipe";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { useHaptic } from "@/hooks/use-haptic";
import { useConfetti } from "@/components/confetti";
import type { DailyDrop, User, SubmitGame } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MascotInline, type MascotContext } from "@/components/mascot";
import { StoryIntroCard } from "@/components/story-intro-card";
import { LivePlayerIndicator } from "@/components/live-player-indicator";

const TIMER_DURATION = 20;

export default function Game() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { play } = useSound();
  const { vibrateSuccess, vibrateError } = useHaptic();
  const { fireMiniCorrect } = useConfetti();
  const prefersReducedMotion = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timedOut, setTimedOut] = useState<Record<string, boolean>>({});
  const [storyIntroDismissed, setStoryIntroDismissed] = useState(false);
  const playedWarnings = useRef<Set<number>>(new Set());
  const timerStartTime = useRef<number>(Date.now());

  // #4: Screen flash state
  const [answerFlash, setAnswerFlash] = useState<"correct" | "incorrect" | null>(null);
  // #10: Streak tracking
  const [streak, setStreak] = useState(0);
  // #11: Lifeline state
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  // #12: Speed bonus tracking
  const answerTimeRef = useRef<number>(0);
  const [showSpeedBadge, setShowSpeedBadge] = useState(false);
  // #14: Recap state
  const [showRecap, setShowRecap] = useState(false);
  // #15: Swipe review enabled after all answered

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
      // 30s timeout — Neon serverless can be slow on cold starts
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      try {
        const res = await fetch("/api/submit-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          const text = (await res.text()) || res.statusText;
          throw new Error(`${res.status}: ${text}`);
        }
        return res.json();
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") {
          throw new Error("Request timed out — your answers may have been saved. Check results.");
        }
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidate caches (non-blocking) and navigate immediately
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      navigate("/results");
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      const alreadyPlayed = msg.includes("already played") || msg.includes("Already played");
      const timedOut = msg.includes("timed out");
      toast({
        title: alreadyPlayed ? "Already played" : timedOut ? "Slow connection" : "Error",
        description: alreadyPlayed
          ? "You've already played today! Redirecting to results."
          : timedOut
          ? "Taking longer than expected. Tap Submit again to retry."
          : "Failed to submit your answers. Please try again.",
        variant: alreadyPlayed || timedOut ? "default" : "destructive",
      });
      if (alreadyPlayed) {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        navigate("/results");
      }
      // On timeout or error: stay on game page. The submit button becomes
      // clickable again so the user can retry. The server's idempotency cache
      // prevents double-processing if the first request actually succeeded.
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

  const handleSelectChoice = useCallback((label: string) => {
    if (!currentScenario || showResults[currentScenario.id]) return;
    play("tap");

    const choice = currentScenario.choices.find((c) => c.label === label);

    // #12: Track answer time
    const elapsed = Math.floor((Date.now() - timerStartTime.current) / 1000);
    answerTimeRef.current = elapsed;

    if (choice?.isCorrect) {
      play("correct");
      vibrateSuccess();
      fireMiniCorrect();
      // #4: Flash correct
      setAnswerFlash("correct");
      // #10: Increment streak
      setStreak(prev => prev + 1);
      // #12: Show speed badge
      setShowSpeedBadge(true);
    } else {
      play("incorrect");
      vibrateError();
      // #4: Flash incorrect
      setAnswerFlash("incorrect");
      // #10: Reset streak
      setStreak(0);
      setShowSpeedBadge(false);
    }

    // #4: Clear flash after animation
    setTimeout(() => setAnswerFlash(null), 400);

    setAnswers((prev) => ({ ...prev, [currentScenario.id]: label }));
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
    // #11: Clear eliminated choices for next question
    setEliminatedChoices([]);
  }, [currentScenario, showResults, play, vibrateSuccess, vibrateError, fireMiniCorrect]);

  const handleTimeUp = useCallback(() => {
    if (!currentScenario || showResults[currentScenario.id]) return;
    play("timeUp");
    setTimedOut((prev) => ({ ...prev, [currentScenario.id]: true }));
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
    // #10: Reset streak on timeout
    setStreak(0);
    setShowSpeedBadge(false);
  }, [currentScenario, showResults, play]);

  // P2-10: Pause timer when user switches tabs/apps (prevents unfair time loss on mobile)
  const pausedAtRef = useRef<number | null>(null);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerRunning) {
        // Tab hidden — remember when we paused
        pausedAtRef.current = Date.now();
      } else if (!document.hidden && pausedAtRef.current && timerRunning) {
        // Tab visible again — add the paused duration to the start time
        const pausedMs = Date.now() - pausedAtRef.current;
        timerStartTime.current += pausedMs;
        pausedAtRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || !currentScenario || showResults[currentScenario.id]) return;

    const interval = setInterval(() => {
      // Don't tick while paused (tab hidden)
      if (pausedAtRef.current) return;

      const elapsed = Math.floor((Date.now() - timerStartTime.current) / 1000);
      const remaining = Math.max(0, TIMER_DURATION - elapsed);

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        handleTimeUp();
        return;
      }

      // Play warning sounds at specific thresholds (only once each)
      if (remaining === 10 && !playedWarnings.current.has(10)) {
        playedWarnings.current.add(10);
        play("timerWarning");
      }
      if (remaining === 5 && !playedWarnings.current.has(5)) {
        playedWarnings.current.add(5);
        play("timerCritical");
      }
      // Heartbeat at 3, 2, 1 seconds
      if (remaining <= 3 && remaining > 0 && !playedWarnings.current.has(remaining + 100)) {
        playedWarnings.current.add(remaining + 100);
        play("heartbeat");
      }
    }, 100); // Check every 100ms for more accurate timing

    return () => clearInterval(interval);
  }, [timerRunning, currentScenario, showResults, handleTimeUp, play]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalScenarios - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(TIMER_DURATION);
      setTimerRunning(true);
      timerStartTime.current = Date.now(); // Reset timer start time
      playedWarnings.current.clear();
      play("readyDing");
      setTimeout(() => play("whoosh"), 80);
      setShowSpeedBadge(false);
      setEliminatedChoices([]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentIndex, totalScenarios, play]);

  // Use ref for mutate to keep handleSubmit stable across renders
  const mutateRef = useRef(submitMutation.mutate);
  mutateRef.current = submitMutation.mutate;

  const handleSubmit = useCallback(() => {
    if (!dailyDrop) return;

    const submissionAnswers = scenarios.map((s) => ({
      scenarioId: s.id,
      choiceLabel: answers[s.id] || "",
    }));

    mutateRef.current({
      dropId: dailyDrop.id,
      answers: submissionAnswers,
    });
  }, [dailyDrop, scenarios, answers]);

  // #11: Lifeline handler — pick 2 random wrong, non-selected choices to eliminate
  const handleLifeline = useCallback(() => {
    if (!currentScenario || lifelineUsed || showResults[currentScenario.id]) return;
    setLifelineUsed(true);
    play("whoosh");

    const wrongChoices = currentScenario.choices.filter(
      c => !c.isCorrect && c.label !== selectedLabel
    );
    // Shuffle and pick 2
    const shuffled = [...wrongChoices].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2).map(c => c.label);
    setEliminatedChoices(toEliminate);
  }, [currentScenario, lifelineUsed, showResults, selectedLabel, play]);

  // P1: Memoize expensive calculation to prevent re-running on every render
  const allAnswered = useMemo(() => {
    return scenarios.length > 0 && scenarios.every((s) => showResults[s.id] === true);
  }, [scenarios, showResults]);

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

  // Warn user before leaving page during active quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!allAnswered && scenarios.length > 0) {
        e.preventDefault();
        e.returnValue = "You haven't finished the quiz yet. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [allAnswered, scenarios.length]);

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 dark:from-background dark:via-background dark:to-card/40">
      {/* #4: Full-screen answer flash overlay */}
      <AnimatePresence>
        {answerFlash && (
          <div
            key={answerFlash}
            className={answerFlash === "correct" ? "screen-flash-correct" : "screen-flash-incorrect"}
          />
        )}
      </AnimatePresence>

      {/* Sticky top bar: logo + progress pill + timer */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container max-w-2xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AppLogo size="sm" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-muted-foreground">Daily Drop</span>
                <span className="text-sm font-semibold">#{dailyDrop?.dropNumber || "..."}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <LivePlayerIndicator />
              {/* #10: Answer streak indicator */}
              <AnswerStreakIndicator streak={streak} mode="daily" />
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
          currentScenario && !showResults[currentScenario.id] && timerRunning && timeRemaining <= 5 && !prefersReducedMotion
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
          {/* Overall scenario progress */}
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden" aria-hidden="true">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          {/* Screen-reader accessible progress label */}
          <div className="sr-only" role="status">
            Question {currentIndex + 1} of {totalScenarios}
          </div>

          {/* Timer row */}
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

                {/* Animated timer bar */}
                <div
                  className="timer-bar-track flex-1"
                  aria-label={`Time remaining: ${timeRemaining} seconds`}
                  data-testid="timer-bar"
                >
                  <div
                    className={cn(
                      "timer-bar-fill",
                      timeRemaining <= 5
                        ? "state-critical"
                        : timeRemaining <= 10
                          ? "state-warning"
                          : "state-normal"
                    )}
                    style={{ width: `${(timeRemaining / TIMER_DURATION) * 100}%` }}
                  />
                </div>

                {/* Timer digit — pops on each second when critical */}
                <motion.span
                  key={timeRemaining}
                  initial={timeRemaining <= 5 ? { scale: 1.4, opacity: 0.6 } : { scale: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "text-xs font-bold tabular-nums min-w-[2.5ch] text-right leading-none transition-colors duration-500",
                    timeRemaining <= 5
                      ? "text-destructive"
                      : timeRemaining <= 10
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
        {isLoading ? (
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
        ) : isError ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-lg font-semibold">Failed to load Daily Drop</p>
            <p className="text-sm text-muted-foreground">{error?.message || "Unknown error"}</p>
            <Button onClick={() => refetch()} variant="outline" size="lg">
              Try Again
            </Button>
          </div>
        ) : !storyIntroDismissed && currentIndex === 0 && currentScenario ? (
          <AnimatePresence mode="wait">
            <StoryIntroCard
              key="story-intro"
              category={currentScenario.category as any}
              onBegin={() => {
                setStoryIntroDismissed(true);
                setTimerRunning(true);
                timerStartTime.current = Date.now();
              }}
            />
          </AnimatePresence>
        ) : showRecap && scenarios.length > 0 ? (
          /* #14: Post-session recap */
          <PostSessionRecap
            scenarios={scenarios}
            answers={answers}
            onContinue={handleSubmit}
            isPending={submitMutation.isPending}
          />
        ) : currentScenario ? (
          <div className="grid gap-5" {...swipeHandlers}>
            {/* #11: Lifeline button + #12: Speed bonus in a row */}
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
              {hasAnswered && showSpeedBadge && (
                <div className="flex justify-center">
                  <SpeedBonusBadge
                    answerTimeSeconds={answerTimeRef.current}
                    timerDuration={TIMER_DURATION}
                    show={showSpeedBadge}
                  />
                </div>
              )}
            </AnimatePresence>

            {/* Zone A+B+C: Context, Question, Answers — #1 animated transition */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, x: 28, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -28, scale: 0.97 }}
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

            {/* #8: Unified teaching card (replaces inline post-answer content) */}
            <AnimatePresence>
              {hasAnswered && (
                <TeachingCard
                  scenario={currentScenario}
                  selectedLabel={selectedLabel}
                  didTimeOut={didTimeOut}
                  questionIndex={currentIndex}
                  showFull={true}
                />
              )}
            </AnimatePresence>

            {/* Mascot reaction after answer */}
            <AnimatePresence>
              {hasAnswered && currentScenario && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  {(() => {
                    const isCorrect = currentScenario.choices.find(c => c.label === answers[currentScenario.id])?.isCorrect ?? false;
                    const didTimeout = timedOut[currentScenario.id];
                    const gameMascotMood = didTimeout
                      ? "shocked"
                      : isCorrect
                        ? timeRemaining > 14 ? "smug" : "happy"
                        : "sad";
                    const gameMascotCtx: MascotContext = {
                      screen: "game",
                      wasCorrect: isCorrect,
                      wasTimeout: didTimeout,
                      timeRemainingOnAnswer: timeRemaining,
                      questionIndex: currentIndex,
                      username: user?.username,
                    };
                    return (
                      <MascotInline
                        mood={gameMascotMood}
                        context={gameMascotCtx}
                      />
                    );
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
              {/* Micro affirmation — removed for cleaner UX */}

              {currentIndex < totalScenarios - 1 ? (
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={handleNext}
                    disabled={!showResults[currentScenario.id]}
                    size="lg"
                    className={cn(
                      "w-full text-base font-semibold btn-premium relative overflow-hidden",
                      !showResults[currentScenario.id] && "opacity-50"
                    )}
                    aria-label="Continue to next question"
                    data-testid="button-next"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <Button
                  onClick={() => {
                    // #14: Show recap before submitting
                    setShowRecap(true);
                  }}
                  disabled={!allAnswered || submitMutation.isPending}
                  size="lg"
                  className={cn(
                    "w-full text-base font-bold btn-gold relative overflow-hidden border-0",
                    (!allAnswered || submitMutation.isPending) && "opacity-60"
                  )}
                  aria-label="Review your answers"
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
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No questions available</p>
          </div>
        )}
      </main>
    </div>
  );
}
