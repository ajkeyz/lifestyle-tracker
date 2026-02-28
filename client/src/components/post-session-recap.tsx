import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Scenario } from "@shared/schema";

interface PostSessionRecapProps {
  scenarios: Scenario[];
  answers: Record<string, string>;
  onContinue: () => void;
  isPending?: boolean;
}

export function PostSessionRecap({
  scenarios,
  answers,
  onContinue,
  isPending = false,
}: PostSessionRecapProps) {
  const totalPoints = scenarios.reduce((sum, s) => {
    const answer = answers[s.id];
    if (!answer) return sum;
    const choice = s.choices.find(c => c.label === answer);
    return sum + Math.max(0, choice?.points || 0);
  }, 0);

  const correctCount = scenarios.reduce((sum, s) => {
    const answer = answers[s.id];
    if (!answer) return sum;
    const choice = s.choices.find(c => c.label === answer);
    return sum + (choice?.isCorrect ? 1 : 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
      data-testid="post-session-recap"
    >
      {/* Summary header */}
      <div className="text-center space-y-1">
        <h3 className="text-lg font-semibold">Session Recap</h3>
        <p className="text-sm text-muted-foreground">
          {correctCount}/{scenarios.length} correct &middot; {totalPoints} pts earned
        </p>
      </div>

      {/* Scrollable question list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {scenarios.map((scenario, index) => {
          const answer = answers[scenario.id];
          const selectedChoice = scenario.choices.find(c => c.label === answer);
          const correctChoice = scenario.choices.find(c => c.isCorrect);
          const isCorrect = selectedChoice?.isCorrect || false;
          const isTimeout = !answer;
          const earnedPoints = isTimeout ? 0 : Math.max(0, selectedChoice?.points || 0);

          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Card className={cn(
                "p-3 flex items-start gap-3",
                isCorrect
                  ? "border-primary/20 bg-primary/5"
                  : "border-destructive/20 bg-destructive/5"
              )}>
                {/* Status icon */}
                <div className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
                  isCorrect
                    ? "bg-primary text-primary-foreground"
                    : "bg-destructive text-destructive-foreground"
                )}>
                  {isCorrect ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {scenario.question}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {isTimeout ? (
                      <span className="text-amber-500 font-medium">Timed out</span>
                    ) : (
                      <span>
                        You picked: <span className="font-medium">{selectedChoice?.text}</span>
                      </span>
                    )}
                  </div>
                  {!isCorrect && correctChoice && (
                    <p className="text-xs text-primary/70">
                      Best: {correctChoice.text}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div className={cn(
                  "flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums",
                  isCorrect
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/50 text-muted-foreground"
                )}>
                  <Coins className="w-3 h-3" />
                  <span>+{earnedPoints}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button */}
      <Button
        onClick={onContinue}
        disabled={isPending}
        size="lg"
        className="w-full text-base font-bold btn-gold border-0"
        data-testid="button-recap-continue"
      >
        {isPending ? (
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
    </motion.div>
  );
}
