import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneColors, type ChoiceTone } from "@/lib/game-insights";

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
      aria-label={`Choice ${label}: ${text}`}
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
                <p className={cn(
                  "text-sm font-semibold",
                  isCorrect ? "text-primary" : "text-destructive"
                )}>
                  +{points} points
                </p>
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
    </motion.button>
  );
}
