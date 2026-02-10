import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneColors, type ChoiceTone } from "@/lib/game-insights";

function getPointTier(points: number): { label: string; color: string; bgColor: string } {
  const displayPoints = Math.max(0, points);
  if (points >= 100) return { label: String(displayPoints), color: "text-primary", bgColor: "bg-primary/10" };
  if (points >= 80) return { label: String(displayPoints), color: "text-emerald-500 dark:text-emerald-400", bgColor: "bg-emerald-500/10" };
  if (points >= 50) return { label: String(displayPoints), color: "text-amber-500 dark:text-amber-400", bgColor: "bg-amber-500/10" };
  if (points >= 20) return { label: String(displayPoints), color: "text-muted-foreground", bgColor: "bg-muted/50" };
  return { label: String(displayPoints), color: "text-muted-foreground/60", bgColor: "bg-muted/30" };
}

interface ChoiceCardProps {
  label: string;
  text: string;
  points?: number;
  feedback?: string;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  revealStage: number;
  onSelect: () => void;
  index: number;
  disabled?: boolean;
  tone?: ChoiceTone;
}

export function ChoiceCard({
  label,
  text,
  points,
  feedback,
  isSelected,
  isCorrect,
  showResult,
  revealStage,
  onSelect,
  index,
  disabled = false,
  tone,
}: ChoiceCardProps) {
  const showCorrectness = showResult && (isSelected || isCorrect);
  const pointTier = points !== undefined ? getPointTier(points) : null;
  const earnedPoints = points !== undefined ? Math.max(0, points) : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: showResult && !isSelected && !isCorrect ? 0.4 : 1,
        y: 0,
        x: showResult && isSelected && !isCorrect ? [-3, 3, -3, 3, -2, 2, 0] : 0,
      }}
      transition={{
        opacity: { duration: 0.3 },
        y: { duration: 0.4, delay: index * 0.06, type: "spring", stiffness: 300 },
      }}
      whileTap={!showResult && !disabled ? { scale: 0.98, transition: { duration: 0.1 } } : {}}
      onClick={!disabled ? onSelect : undefined}
      disabled={disabled}
      className={cn(
        "group relative w-full rounded-xl border-2 text-left",
        "transition-colors duration-200 ease-out",
        "flex items-start gap-3 px-4 py-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !showResult && !isSelected && "border-border bg-card hover-elevate",
        !showResult && isSelected && [
          "border-primary bg-primary/10",
          "ring-2 ring-primary/20"
        ],
        showResult && isCorrect && "border-primary bg-primary/5",
        showResult && isSelected && !isCorrect && "border-destructive bg-destructive/5",
        disabled && "cursor-not-allowed"
      )}
      role="radio"
      aria-checked={isSelected}
      aria-label={`Choice ${label}: ${text}${showResult && pointTier ? `, worth ${pointTier.label} points` : ''}`}
      data-testid={`choice-${label.toLowerCase()}`}
    >
      <motion.div
        animate={showResult && revealStage >= 1 ? {
          scale: isCorrect || isSelected ? [1, 1.15, 1] : 1,
          rotate: isCorrect ? [0, -8, 8, 0] : (isSelected && !isCorrect ? [0, 5, -5, 0] : 0)
        } : {}}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className={cn(
          "relative flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
          "font-bold text-sm transition-colors duration-200",
          !showResult && !isSelected && "bg-secondary text-secondary-foreground",
          !showResult && isSelected && "bg-primary text-primary-foreground",
          showResult && isCorrect && "bg-primary text-primary-foreground",
          showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
        )}
        data-testid={`choice-label-${label.toLowerCase()}`}
      >
        <AnimatePresence mode="wait">
          {showResult && revealStage >= 2 && (isCorrect || isSelected) ? (
            <motion.div
              key="icon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              {isCorrect ? (
                <Check className="w-4.5 h-4.5" aria-label="Correct" />
              ) : (
                <X className="w-4.5 h-4.5" aria-label="Incorrect" />
              )}
            </motion.div>
          ) : (
            <motion.span
              key="label"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          {tone && !showResult && (
            <span
              className={cn(
                "flex-shrink-0 w-2 h-2 rounded-full mt-1.5 opacity-60",
                toneColors[tone]
              )}
              aria-hidden="true"
              data-testid={`tone-dot-${label.toLowerCase()}`}
            />
          )}
          <p
            className={cn(
              "text-[0.9375rem] font-medium leading-[1.45] transition-colors flex-1",
              showResult && isCorrect && "text-foreground",
              showResult && isSelected && !isCorrect && "text-foreground"
            )}
            data-testid={`choice-text-${label.toLowerCase()}`}
          >
            {text}
          </p>
        </div>

        <AnimatePresence>
          {showResult && showCorrectness && revealStage >= 3 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-2 space-y-1 overflow-hidden"
            >
              {points !== undefined && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="flex items-center gap-1.5"
                  data-testid={`points-earned-${label.toLowerCase()}`}
                >
                  <Coins className={cn("w-3.5 h-3.5", isCorrect ? "text-primary" : "text-destructive")} />
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    isCorrect ? "text-primary" : "text-destructive"
                  )}>
                    +{earnedPoints} pts
                  </span>
                  {isCorrect && points >= 100 && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 ml-1">
                      Best
                    </span>
                  )}
                  {isCorrect && points < 100 && points >= 50 && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 dark:text-amber-400/70 ml-1">
                      Good
                    </span>
                  )}
                </motion.div>
              )}
              {feedback && (
                <p className="text-sm text-muted-foreground leading-snug">
                  {feedback}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {pointTier && showResult && (isSelected || isCorrect) && revealStage >= 2 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
          className={cn(
            "flex-shrink-0 self-center",
            "flex items-center gap-1 px-2 py-0.5 rounded-full",
            "text-[11px] font-semibold tabular-nums tracking-wide",
            pointTier.bgColor,
            pointTier.color,
          )}
          data-testid={`points-hint-${label.toLowerCase()}`}
        >
          <Coins className="w-3 h-3" />
          <span>{pointTier.label}</span>
        </motion.div>
      )}
    </motion.button>
  );
}
