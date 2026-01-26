import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScenarioCard } from "@/components/scenario-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimerProgress } from "@/components/animated-progress";
import { ArrowLeft, ArrowRight, Send, Clock } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import type { DailyDrop, User, SubmitGame } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const TIMER_DURATION = 20;

export default function Game() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { play } = useSound();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const [timerRunning, setTimerRunning] = useState(true);
  const playedWarnings = useRef<Set<number>>(new Set());

  const { data: dailyDrop, isLoading } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
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

  const handleSelectChoice = useCallback((label: string) => {
    if (!currentScenario || showResults[currentScenario.id]) return;
    
    const choice = currentScenario.choices.find((c) => c.label === label);
    if (choice?.isCorrect) {
      play("correct");
    } else {
      play("incorrect");
    }
    
    setAnswers((prev) => ({ ...prev, [currentScenario.id]: label }));
    setShowResults((prev) => ({ ...prev, [currentScenario.id]: true }));
    setTimerRunning(false);
  }, [currentScenario, showResults, play]);

  const handleTimeUp = useCallback(() => {
    if (!currentScenario || showResults[currentScenario.id]) return;
    play("timeUp");
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

  const handleNext = () => {
    if (currentIndex < totalScenarios - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeRemaining(TIMER_DURATION);
      setTimerRunning(true);
      playedWarnings.current.clear();
      play("whoosh");
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (!dailyDrop) return;

    const submissionAnswers = scenarios.map((s) => ({
      scenarioId: s.id,
      choiceLabel: answers[s.id] || "",
    }));

    submitMutation.mutate({
      dropId: dailyDrop.id,
      answers: submissionAnswers,
    });
  };

  const allAnswered = scenarios.every((s) => showResults[s.id]);

  useEffect(() => {
    if (user?.todayResult) {
      navigate("/results");
    } else if (user && !user.mode) {
      navigate("/setup");
    }
  }, [user?.todayResult, user?.mode, navigate]);

  if (user?.todayResult || (user && !user.mode)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
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
          <span className="font-bold" data-testid="text-drop-header">Drop #{dailyDrop?.dropNumber || "..."}</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="sticky top-[65px] z-40 bg-background/95 backdrop-blur-sm border-b p-3">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Progress value={progress} className="flex-1 h-2" data-testid="progress-questions" />
            <span className="text-sm font-medium text-muted-foreground" data-testid="text-question-progress">
              {currentIndex + 1}/{totalScenarios}
            </span>
          </div>
          {currentScenario && !showResults[currentScenario.id] && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <Progress
                value={(timeRemaining / TIMER_DURATION) * 100}
                className={`flex-1 h-1.5 ${timeRemaining <= 5 ? "animate-pulse" : ""}`}
                data-testid="progress-timer"
              />
              <span
                className={`font-mono text-sm ${
                  timeRemaining <= 5 ? "text-destructive font-bold" : "text-muted-foreground"
                }`}
                data-testid="text-time-remaining"
              >
                {timeRemaining}s
              </span>
            </div>
          )}
        </div>
      </div>

      <main className="container max-w-2xl mx-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : currentScenario ? (
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <ScenarioCard
                  scenario={currentScenario}
                  selectedChoice={answers[currentScenario.id] || null}
                  onSelectChoice={handleSelectChoice}
                  showResult={showResults[currentScenario.id] || false}
                  questionNumber={currentIndex + 1}
                  totalQuestions={totalScenarios}
                  timeRemaining={!showResults[currentScenario.id] ? timeRemaining : undefined}
                />
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex-1"
                data-testid="button-prev-question"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentIndex < totalScenarios - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!showResults[currentScenario.id]}
                  className="flex-1"
                  data-testid="button-next-question"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || submitMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-game"
                >
                  {submitMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Card className="p-6 text-center" data-testid="card-no-scenarios">
            <p className="text-muted-foreground">No scenarios available today.</p>
            <Button className="mt-4" onClick={() => navigate("/")} data-testid="button-go-home-empty">
              Go Home
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
