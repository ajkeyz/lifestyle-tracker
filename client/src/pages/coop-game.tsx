import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScenarioCard } from "@/components/scenario-card-improved";
import { TeachingCard } from "@/components/teaching-card";
import { AnswerStreakIndicator } from "@/components/answer-streak-indicator";
import { SpeedBonusBadge } from "@/components/speed-bonus-badge";
import { LifelineButton } from "@/components/lifeline-button";
import { AppLogo } from "@/components/app-logo";
import { ArrowRight, Clock, Check, Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { MascotInline, type MascotContext } from "@/components/mascot";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { useHaptic } from "@/hooks/use-haptic";
import { useConfetti } from "@/components/confetti";
import type { CoopSession, DailyDrop, User, CoopMessage } from "@shared/schema";

const TIMER_DURATION = 20;

export default function CoopGame() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { play } = useSound();
  const { vibrateSuccess, vibrateError } = useHaptic();
  const { fireMiniCorrect } = useConfetti();

  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [localAnswered, setLocalAnswered] = useState(false);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const playedWarnings = useRef<Set<number>>(new Set());

  // #4: Screen flash state
  const [answerFlash, setAnswerFlash] = useState<"correct" | "incorrect" | null>(null);
  // #10: Streak tracking
  const [streak, setStreak] = useState(0);
  // #11: Lifeline state
  const [lifelineUsed, setLifelineUsed] = useState(false);
  const [eliminatedChoices, setEliminatedChoices] = useState<string[]>([]);
  // #12: Speed bonus tracking
  const answerTimeRef = useRef<number>(0);
  const timerStartTime = useRef<number>(Date.now());
  const [showSpeedBadge, setShowSpeedBadge] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: session, refetch: refetchSession } = useQuery<CoopSession>({
    queryKey: ["/api/coop/session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/coop/session/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    refetchInterval: 3000,
  });

  const scenarioEndpoint = session?.mode === "arcade"
    ? `/api/arcade-drop?gameIndex=${session.arcadeGameIndex || 0}`
    : "/api/daily-drop";

  const { data: scenarioDrop } = useQuery<DailyDrop>({
    queryKey: [scenarioEndpoint],
    enabled: session?.status === "playing",
  });

  const scenarios = scenarioDrop?.scenarios || [];
  const currentIndex = session?.currentQuestionIndex || 0;
  const currentScenario = scenarios[currentIndex];
  const totalScenarios = scenarios.length;
  const progress = totalScenarios > 0 ? ((currentIndex + 1) / totalScenarios) * 100 : 0;

  const currentPlayer = session?.players.find(p => p.id === user?.id);
  const partnerPlayer = session?.players.find(p => p.id !== user?.id);

  const partnerHasAnsweredFromSession = currentScenario && partnerPlayer?.answers[currentScenario.id];
  const currentPlayerHasAnsweredFromSession = currentScenario && currentPlayer?.answers[currentScenario.id];

  const effectivePartnerAnswered = partnerAnswered || !!partnerHasAnsweredFromSession;
  const effectiveLocalAnswered = localAnswered || !!currentPlayerHasAnsweredFromSession;

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ scenarioId, choiceLabel }: { scenarioId: string; choiceLabel: string }) => {
      const res = await apiRequest("POST", `/api/coop/session/${sessionId}/answer`, {
        scenarioId,
        choiceLabel,
      });
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: () => {
      setLocalAnswered(true);
      refetchSession();
    },
  });

  const nextQuestionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/coop/session/${sessionId}/next`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.result) {
        navigate(`/coop-results/${sessionId}`);
      } else {
        setLocalAnswered(false);
        setPartnerAnswered(false);
        setTimeRemaining(TIMER_DURATION);
        setTimerRunning(true);
        setShowSpeedBadge(false);
        setEliminatedChoices([]);
        timerStartTime.current = Date.now();
        playedWarnings.current.clear();
        refetchSession();
      }
    },
  });

  useEffect(() => {
    if (!user?.id || !sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({
        type: 'join_session',
        sessionId,
        userId: user.id,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const message: CoopMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'answer_submitted':
            if ((message.payload as { playerId: string }).playerId !== user.id) {
              setPartnerAnswered(true);
            }
            break;
          case 'game_start':
            refetchSession();
            setTimerRunning(true);
            setTimeRemaining(TIMER_DURATION);
            timerStartTime.current = Date.now();
            break;
          case 'next_question':
            setLocalAnswered(false);
            setPartnerAnswered(false);
            setTimeRemaining(TIMER_DURATION);
            setTimerRunning(true);
            setShowSpeedBadge(false);
            setEliminatedChoices([]);
            timerStartTime.current = Date.now();
            playedWarnings.current.clear();
            refetchSession();
            break;
          case 'game_complete':
            navigate(`/coop-results/${sessionId}`);
            break;
          case 'player_disconnected':
            toast({
              title: "Partner disconnected",
              description: "Your friend has lost connection.",
              variant: "destructive",
            });
            break;
          case 'player_reconnected':
            toast({
              title: "Partner reconnected",
              description: "Your friend is back online!",
            });
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user?.id, sessionId, navigate, toast, refetchSession]);

  useEffect(() => {
    if (session?.status === 'playing' && !timerRunning) {
      setTimerRunning(true);
      timerStartTime.current = Date.now();
    }
  }, [session?.status, timerRunning]);

  const handleTimeUp = useCallback(() => {
    if (!currentScenario || localAnswered) return;
    play("timeUp");
    setLocalAnswered(true);
    // #10: Reset streak on timeout
    setStreak(0);
    setShowSpeedBadge(false);
  }, [currentScenario, localAnswered, play]);

  useEffect(() => {
    if (!timerRunning || !currentScenario || localAnswered) return;

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
  }, [timerRunning, currentScenario, localAnswered, handleTimeUp, play]);

  const handleSelectChoice = useCallback((label: string) => {
    if (!currentScenario || localAnswered) return;

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

    setTimerRunning(false);
    setEliminatedChoices([]);
    submitAnswerMutation.mutate({ scenarioId: currentScenario.id, choiceLabel: label });
  }, [currentScenario, localAnswered, play, vibrateSuccess, vibrateError, fireMiniCorrect, submitAnswerMutation]);

  // #11: Lifeline handler
  const handleLifeline = useCallback(() => {
    if (!currentScenario || lifelineUsed || localAnswered) return;
    setLifelineUsed(true);
    play("whoosh");

    const wrongChoices = currentScenario.choices.filter(c => !c.isCorrect);
    const shuffled = [...wrongChoices].sort(() => Math.random() - 0.5);
    const toEliminate = shuffled.slice(0, 2).map(c => c.label);
    setEliminatedChoices(toEliminate);
  }, [currentScenario, lifelineUsed, localAnswered, play]);

  const handleNext = useCallback(() => {
    nextQuestionMutation.mutate();
    window.scrollTo(0, 0);
  }, [nextQuestionMutation]);

  const bothAnswered = effectiveLocalAnswered && effectivePartnerAnswered;

  if (session && session.status === "waiting") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center space-y-4 max-w-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="font-medium" data-testid="text-waiting-host">Waiting for host to start the game...</p>
          <p className="text-sm text-muted-foreground">The host will start the game once ready.</p>
        </Card>
      </div>
    );
  }

  if (!session || !scenarioDrop) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <span className="text-sm text-muted-foreground">Co-op Mode</span>
          </div>
          <div className="flex items-center gap-2">
            {/* #10: Answer streak indicator */}
            <AnswerStreakIndicator streak={streak} mode="coop" />
            {wsConnected ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>
      </header>

      {/* Critical timer vignette overlay */}
      <AnimatePresence>
        {!localAnswered && timeRemaining <= 5 && timerRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="vignette-critical"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <main className="container px-4 py-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src={currentPlayer?.avatar} />
              <AvatarFallback>
                {currentPlayer?.username?.slice(0, 2).toUpperCase() || "ME"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">You</p>
              <p className="text-xs text-muted-foreground">
                Score: {currentPlayer?.score || 0}
              </p>
            </div>
            {effectiveLocalAnswered && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Check className="h-3 w-3" />
                Answered
              </div>
            )}
          </div>
          <div className="text-center">
            <span className="text-sm text-muted-foreground">vs</span>
          </div>
          <div className="flex items-center gap-3">
            {effectivePartnerAnswered && (
              <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Check className="h-3 w-3" />
                Answered
              </div>
            )}
            <div className="text-right">
              <p className="text-sm font-medium">{partnerPlayer?.username || "Friend"}</p>
              <p className="text-xs text-muted-foreground">
                Score: {partnerPlayer?.score || 0}
              </p>
            </div>
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={partnerPlayer?.avatar} />
              <AvatarFallback>
                {partnerPlayer?.username?.slice(0, 2).toUpperCase() || "FR"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {totalScenarios}</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        <motion.div
          className={cn(
            "mb-4 flex items-center gap-2.5 p-2 rounded-lg transition-colors duration-700",
            timeRemaining <= 5
              ? "bg-destructive/8"
              : timeRemaining <= 10
                ? "bg-amber-500/5"
                : ""
          )}
          animate={
            timerRunning && !localAnswered && timeRemaining <= 5
              ? { x: [-2, 2, -2, 2, -1, 1, 0] }
              : { x: 0 }
          }
          transition={
            timeRemaining <= 5
              ? { duration: 0.45, repeat: Infinity, repeatDelay: 0.55 }
              : { duration: 0.1 }
          }
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
              "h-3.5 w-3.5 transition-colors duration-500",
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
          {timeRemaining <= 5 && timerRunning && !localAnswered && (
            <div className="heartbeat-dot flex-shrink-0" aria-hidden="true" />
          )}

          <div className="timer-bar-track flex-1">
            <div
              className={cn(
                "timer-bar-fill",
                timeRemaining <= 5 ? "state-critical" : timeRemaining <= 10 ? "state-warning" : "state-normal"
              )}
              style={{ width: `${(timeRemaining / TIMER_DURATION) * 100}%` }}
            />
          </div>
          <motion.span
            key={timeRemaining}
            initial={timeRemaining <= 5 ? { scale: 1.4, opacity: 0.6 } : { scale: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "text-xs font-bold tabular-nums min-w-[2.5ch] text-right leading-none transition-colors duration-500",
              timeRemaining <= 5 ? "text-destructive" : timeRemaining <= 10 ? "text-amber-500" : "text-muted-foreground"
            )}
          >
            {timeRemaining}s
          </motion.span>
        </motion.div>

        {/* #11: Lifeline button */}
        {currentScenario && !effectiveLocalAnswered && (
          <div className="flex items-center justify-between mb-3">
            <LifelineButton
              used={lifelineUsed}
              onUse={handleLifeline}
              disabled={effectiveLocalAnswered}
            />
            <div />
          </div>
        )}

        {/* #12: Speed bonus badge after answering */}
        <AnimatePresence>
          {effectiveLocalAnswered && showSpeedBadge && (
            <div className="flex justify-center mb-3">
              <SpeedBonusBadge
                answerTimeSeconds={answerTimeRef.current}
                timerDuration={TIMER_DURATION}
                show={showSpeedBadge}
              />
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {currentScenario && (
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, x: 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -28, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <ScenarioCard
                scenario={currentScenario}
                selectedChoice={currentPlayer?.answers[currentScenario.id] || null}
                showResult={effectiveLocalAnswered}
                onSelectChoice={handleSelectChoice}
                questionNumber={currentIndex + 1}
                totalQuestions={totalScenarios}
                timeRemaining={timeRemaining}
                timerRunning={timerRunning && !localAnswered}
                eliminatedChoices={eliminatedChoices}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* #8: Compact teaching card for co-op */}
        <AnimatePresence>
          {effectiveLocalAnswered && currentScenario && (
            <div className="mt-3">
              <TeachingCard
                scenario={currentScenario}
                selectedLabel={currentPlayer?.answers[currentScenario.id] || null}
                didTimeOut={!currentPlayer?.answers[currentScenario.id]}
                questionIndex={currentIndex}
                showFull={false}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Cleo mascot reaction after local player answers */}
        <AnimatePresence>
          {effectiveLocalAnswered && currentScenario && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {(() => {
                const isTimeout = !currentPlayer?.answers[currentScenario.id];
                const isCorrect = !isTimeout && (currentScenario.choices.find(c => c.label === currentPlayer?.answers[currentScenario.id])?.isCorrect ?? false);
                const mood = isTimeout ? "shocked" : isCorrect ? "happy" : "sad";
                const ctx: MascotContext = {
                  screen: "game",
                  wasCorrect: isCorrect,
                  wasTimeout: isTimeout,
                  questionIndex: currentIndex,
                };
                return <MascotInline mood={mood} context={ctx} />;
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {bothAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="text-center space-y-3">
                <p className="font-medium">Both players answered!</p>
                <Button
                  onClick={handleNext}
                  disabled={nextQuestionMutation.isPending}
                  className={cn(
                    "w-full border-0",
                    currentIndex < totalScenarios - 1 ? "btn-premium" : "btn-gold"
                  )}
                  data-testid="button-next-question"
                >
                  {nextQuestionMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : currentIndex < totalScenarios - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  ) : (
                    "See Results"
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {effectiveLocalAnswered && !effectivePartnerAnswered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <Card className="p-4">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">
                  Waiting for {partnerPlayer?.username || "friend"} to answer...
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
