import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScenarioCard } from "@/components/scenario-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimerProgress } from "@/components/animated-progress";
import { AppLogo } from "@/components/app-logo";
import { ArrowRight, Clock, Check, Loader2, Wifi, WifiOff } from "lucide-react";
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
            break;
          case 'next_question':
            setLocalAnswered(false);
            setPartnerAnswered(false);
            setTimeRemaining(TIMER_DURATION);
            setTimerRunning(true);
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
    }
  }, [session?.status, timerRunning]);

  const handleTimeUp = useCallback(() => {
    if (!currentScenario || localAnswered) return;
    play("timeUp");
    setLocalAnswered(true);
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
    if (choice?.isCorrect) {
      play("correct");
      vibrateSuccess();
      fireMiniCorrect();
    } else {
      play("incorrect");
      vibrateError();
    }

    setTimerRunning(false);
    submitAnswerMutation.mutate({ scenarioId: currentScenario.id, choiceLabel: label });
  }, [currentScenario, localAnswered, play, vibrateSuccess, vibrateError, fireMiniCorrect, submitAnswerMutation]);

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" />
            <span className="text-sm text-muted-foreground">Co-op Mode</span>
          </div>
          <div className="flex items-center gap-2">
            {wsConnected ? (
              <Wifi className="h-4 w-4 text-primary" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

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

        <div className="space-y-1 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentIndex + 1} of {totalScenarios}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {timeRemaining}s
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-4">
          <TimerProgress
            maxTime={TIMER_DURATION}
            timeLeft={timeRemaining}
            warning={timeRemaining <= 10}
            danger={timeRemaining <= 5}
          />
        </div>

        <AnimatePresence mode="wait">
          {currentScenario && (
            <motion.div
              key={currentScenario.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <ScenarioCard
                scenario={currentScenario}
                selectedChoice={currentPlayer?.answers[currentScenario.id] || null}
                showResult={effectiveLocalAnswered}
                onSelectChoice={handleSelectChoice}
                questionNumber={currentIndex + 1}
                totalQuestions={totalScenarios}
                timeRemaining={timeRemaining}
              />
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
                  className="w-full"
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
