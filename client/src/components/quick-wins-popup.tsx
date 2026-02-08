import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  X,
  ChevronRight,
  Sparkles,
  Users,
  Award,
} from "lucide-react";

interface QuickWinsPopupProps {
  score: number;
  moneyHealth: number;
  isFirstGame: boolean;
  onClose: () => void;
}

interface WinStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: string;
  stat?: string;
}

export function QuickWinsPopup({ score, moneyHealth, isFirstGame, onClose }: QuickWinsPopupProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isFirstGame) return null;

  const percentile = Math.floor(Math.random() * 20) + 60; // Mock: 60-80% better than new players

  const steps: WinStep[] = [
    {
      icon: <Trophy className="w-12 h-12 text-yellow-500" />,
      title: "Great Start! 🎉",
      description: `You scored ${score} points! That's better than ${percentile}% of new players.`,
      highlight: `${score}/500 points`,
      stat: "First game complete!",
    },
    {
      icon: <Target className="w-12 h-12 text-green-500" />,
      title: "Your Money Health",
      description: "Every decision affects your Money Health score. Good choices increase it, poor ones decrease it. Keep it above 50 to stay healthy!",
      highlight: `${moneyHealth}/100`,
      stat: "Current Money Health",
    },
    {
      icon: <Flame className="w-12 h-12 text-orange-500" />,
      title: "Start Your Streak",
      description: "Play every day to build your streak! You get 1 free Freeze Token to protect your streak if you miss a day.",
      highlight: "1 day",
      stat: "Your streak starts now",
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-blue-500" />,
      title: "Keep Improving",
      description: "The more you play, the smarter you get with money. Check out the Deep Dive section to learn why your answers were right or wrong.",
      highlight: "Learn & earn",
      stat: "New scenarios every day",
    },
  ];

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex justify-end mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center space-y-4 mb-8">
                <motion.div
                  key={currentStep}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="flex justify-center mb-4"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    {step.icon}
                  </div>
                </motion.div>

                <motion.h2
                  key={`title-${currentStep}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold"
                >
                  {step.title}
                </motion.h2>

                <motion.p
                  key={`desc-${currentStep}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground"
                >
                  {step.description}
                </motion.p>

                {step.highlight && (
                  <motion.div
                    key={`highlight-${currentStep}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="inline-flex flex-col items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
                  >
                    <div className="text-3xl font-bold text-primary">
                      {step.highlight}
                    </div>
                    {step.stat && (
                      <div className="text-xs text-muted-foreground">
                        {step.stat}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleNext}
                  className="gap-2 flex-1"
                  size="lg"
                >
                  {isLastStep ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Let's Go!
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
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
