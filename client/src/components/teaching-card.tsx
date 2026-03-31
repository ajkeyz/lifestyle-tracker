import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  getPostAnswerReflection,
  getDelayTeachable,
} from "@/lib/game-insights";
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
      transition={{ duration: 0.5, delay: showFull === false ? 0.6 : 1.5 }}
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

      {/* "Why this matters" and "Did you know" removed for cleaner post-answer UX */}
    </motion.div>
  );
}
