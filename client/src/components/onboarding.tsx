import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  Clock,
  Trophy,
  Flame,
  Users,
  ChevronRight,
  ChevronLeft,
  Zap,
  Target,
  Shield,
  Sparkles,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <TrendingUp className="w-12 h-12 text-primary" />,
    title: "Welcome to Lifestyle Creep",
    description:
      "A daily money decision game that teaches you financial wisdom through real-life scenarios. Play in just 2-4 minutes each day!",
    highlight: "5 scenarios daily",
  },
  {
    icon: <Clock className="w-12 h-12 text-amber-500" />,
    title: "Beat the Clock",
    description:
      "Each scenario has a 20-second timer. Think fast and make smart money decisions under pressure - just like in real life!",
    highlight: "20 seconds per question",
  },
  {
    icon: <Target className="w-12 h-12 text-green-500" />,
    title: "Build Your Money Health",
    description:
      "Your Money Health score reflects your financial wisdom. Good decisions increase it, poor ones decrease it. Aim for 100!",
    highlight: "Score 0-100",
  },
  {
    icon: <Flame className="w-12 h-12 text-orange-500" />,
    title: "Keep Your Streak Alive",
    description:
      "Play every day to build your streak. Miss a day? Use a Freeze Token to protect your progress. You start with 1 free token!",
    highlight: "Freeze tokens save streaks",
  },
  {
    icon: <Trophy className="w-12 h-12 text-yellow-500" />,
    title: "Compete & Learn",
    description:
      "Climb the leaderboard, unlock achievements, and learn from each scenario's Deep Dive explanations. Every game makes you financially smarter!",
    highlight: "Leaderboards & achievements",
  },
  {
    icon: <Users className="w-12 h-12 text-blue-500" />,
    title: "Play With Friends",
    description:
      "Join or create leagues, challenge friends, and share your results. Financial literacy is more fun together!",
    highlight: "Leagues & challenges",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/complete-onboarding", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onComplete();
    },
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeMutation.mutate();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    completeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                disabled={completeMutation.isPending}
                data-testid="button-skip-onboarding"
              >
                Skip
              </Button>
            </div>
            <Progress value={progress} className="h-2" data-testid="progress-onboarding" />
          </div>

          <div className="text-center space-y-4 mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {step.icon}
              </div>
            </div>
            <h2 className="text-2xl font-bold" data-testid="text-onboarding-title">
              {step.title}
            </h2>
            <p className="text-muted-foreground" data-testid="text-onboarding-description">
              {step.description}
            </p>
            {step.highlight && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                {step.highlight}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
              data-testid="button-onboarding-prev"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={completeMutation.isPending}
              className="gap-1 flex-1"
              data-testid="button-onboarding-next"
            >
              {completeMutation.isPending ? (
                "Saving..."
              ) : isLastStep ? (
                <>
                  <Zap className="w-4 h-4" />
                  Start Playing
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
                data-testid={`button-onboarding-dot-${index}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
