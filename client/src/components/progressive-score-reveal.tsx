import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Scenario } from "@shared/schema";

interface ProgressiveScoreRevealProps {
  scenarios: Scenario[];
  answers: Record<string, string>;
  onComplete: () => void;
}

export function ProgressiveScoreReveal({
  scenarios,
  answers,
  onComplete,
}: ProgressiveScoreRevealProps) {
  const [revealedIndex, setRevealedIndex] = useState(-1);

  useEffect(() => {
    if (revealedIndex >= scenarios.length) {
      setTimeout(onComplete, 500);
      return;
    }

    const timer = setTimeout(() => {
      setRevealedIndex((prev) => prev + 1);
    }, 600);

    return () => clearTimeout(timer);
  }, [revealedIndex, scenarios.length, onComplete]);

  const getResult = (scenario: Scenario) => {
    const answer = answers[scenario.id];
    
    if (!answer) return { correct: false, timedOut: true, points: 0 };
    
    const choice = scenario.choices.find((c) => c.label === answer);
    return { 
      correct: choice?.isCorrect || false, 
      timedOut: false,
      points: choice?.points || 0 
    };
  };

  return (
    <div className="space-y-3">
      {scenarios.map((scenario, index) => {
        const isRevealed = index <= revealedIndex;
        const result = getResult(scenario);

        return (
          <AnimatePresence key={scenario.id}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isRevealed ? 1 : 0.3,
                x: isRevealed ? 0 : -20,
              }}
              transition={{ 
                duration: 0.3,
                delay: isRevealed ? 0 : 0.1,
              }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                isRevealed && result.correct && "bg-green-500/10 border-green-500/30",
                isRevealed && !result.correct && !result.timedOut && "bg-red-500/10 border-red-500/30",
                isRevealed && result.timedOut && "bg-yellow-500/10 border-yellow-500/30",
                !isRevealed && "bg-muted/30 border-muted"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                isRevealed && result.correct && "bg-green-500 text-white",
                isRevealed && !result.correct && !result.timedOut && "bg-red-500 text-white",
                isRevealed && result.timedOut && "bg-yellow-500 text-white",
                !isRevealed && "bg-muted text-muted-foreground"
              )}>
                {isRevealed ? (
                  result.correct ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.div>
                  ) : result.timedOut ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <X className="w-4 h-4" />
                    </motion.div>
                  )
                ) : (
                  <span className="text-xs font-bold">{index + 1}</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  !isRevealed && "text-muted-foreground"
                )}>
                  Q{index + 1}: {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
                </p>
                {isRevealed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-muted-foreground"
                  >
                    {result.correct ? "Correct!" : result.timedOut ? "Time ran out" : "Incorrect"}
                  </motion.p>
                )}
              </div>

              {isRevealed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={cn(
                    "text-sm font-bold",
                    result.correct ? "text-green-500" : result.timedOut ? "text-yellow-500" : "text-red-500"
                  )}
                >
                  {result.correct ? "+100" : result.timedOut ? "+0" : result.points >= 0 ? `+${result.points}` : result.points}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
