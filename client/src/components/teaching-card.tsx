import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import {
  getPostAnswerReflection,
  getDelayTeachable,
} from "@/lib/game-insights";
import { DidYouKnowCard } from "@/components/did-you-know-card";
import type { Scenario } from "@shared/schema";

interface TeachingCardProps {
  scenario: Scenario;
  selectedLabel: string | null;
  didTimeOut: boolean;
  questionIndex: number;
  /** true = full (daily drop), false = compact (arcade/coop) */
  showFull?: boolean;
}

export function TeachingCard({
  scenario,
  selectedLabel,
  didTimeOut,
  questionIndex,
  showFull = true,
}: TeachingCardProps) {
  const postReflection = useMemo(() => {
    if (didTimeOut) return getDelayTeachable();
    return getPostAnswerReflection(scenario, selectedLabel);
  }, [scenario, selectedLabel, didTimeOut]);

  if (!postReflection) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: 8, height: 0 }}
      transition={{ duration: 0.5, delay: 1.5 }}
      className="space-y-2.5 overflow-hidden"
      data-testid="panel-teaching-card"
    >
      {/* Reflection insight */}
      {postReflection && (
        <div className="px-4 py-3 rounded-lg border border-border/40 bg-muted/30">
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-reflection-insight">
            {postReflection}
          </p>
        </div>
      )}

      {/* Counterfactual — removed for cleaner UX */}

      {/* Full mode: teaching box + did you know */}
      {showFull && (
        <>
          {scenario.deepDive?.teaching && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3.0, duration: 0.5 }}
              className="px-4 py-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
              data-testid="panel-teaching-reveal"
            >
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Why this matters</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {scenario.deepDive.teaching}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {scenario.deepDive && (() => {
            const fact = scenario.deepDive.realWorldExample || scenario.deepDive.ruleOfThumb;
            return fact ? <DidYouKnowCard fact={fact} /> : null;
          })()}
        </>
      )}
    </motion.div>
  );
}
