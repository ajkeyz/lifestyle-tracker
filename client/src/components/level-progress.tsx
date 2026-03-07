import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { computeLevel } from "@shared/lib/progression";
import { Brain } from "lucide-react";

interface LevelProgressProps {
  totalXP: number;
  className?: string;
}

export function LevelProgress({ totalXP, className }: LevelProgressProps) {
  const { level, xpIntoLevel, xpRequiredThisLevel, progress } = computeLevel(totalXP);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card
        className={cn(
          "p-4 rounded-xl border-primary/10 bg-gradient-to-r from-card to-primary/[0.03]",
          className
        )}
        data-testid="level-progress"
      >
        <div className="flex items-center gap-3">
          {/* Level badge */}
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-lg leading-none">{level}</span>
            </div>
            <motion.div
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-card flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400 }}
            >
              <Brain className="w-2.5 h-2.5 text-primary" />
            </motion.div>
          </div>

          {/* Level info + progress bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-semibold">Money IQ Level {level}</span>
              <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
                {xpIntoLevel} / {xpRequiredThisLevel} XP
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-1.5">Your learning progress</p>

            {/* XP progress bar */}
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progress * 100, 2)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>

            <p className="text-[10px] text-muted-foreground mt-1">
              Level {level + 1} unlocks new features
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
