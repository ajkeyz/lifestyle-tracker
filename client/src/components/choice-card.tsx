import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
}: ChoiceCardProps) {
  const showCorrectness = showResult && (isSelected || isCorrect);

  return (
    <motion.button
      // Staggered entrance animation
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: showResult && !isSelected && !isCorrect ? 0.4 : 1,
        y: 0,
      }}
      transition={{
        opacity: { duration: 0.3 },
        y: { duration: 0.4, delay: index * 0.06, type: "spring", stiffness: 300 },
      }}
      // Micro-interactions
      whileHover={!showResult && !disabled ? { y: -2, transition: { duration: 0.15 } } : {}}
      whileTap={!showResult && !disabled ? { scale: 0.98, transition: { duration: 0.1 } } : {}}
      // Shake on incorrect
      animate={{
        x: showResult && isSelected && !isCorrect ? [-3, 3, -3, 3, -2, 2, 0] : 0,
      }}
      onClick={!disabled ? onSelect : undefined}
      disabled={disabled}
      className={cn(
        // Base styles
        "group relative w-full min-h-[56px] p-4 rounded-xl border-2 text-left",
        "transition-all duration-200 ease-out",
        "flex items-start gap-3",
        // Focus styles for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Default state
        !showResult && !isSelected && [
          "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
          "shadow-sm hover:shadow-md"
        ],
        // Selected (pre-result)
        !showResult && isSelected && [
          "border-primary bg-primary/10 shadow-md",
          "ring-2 ring-primary/20"
        ],
        // Result: correct
        showResult && isCorrect && [
          "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-background",
          "shadow-lg"
        ],
        // Result: incorrect (if selected)
        showResult && isSelected && !isCorrect && [
          "border-destructive bg-gradient-to-br from-destructive/10 via-destructive/5 to-background",
        ],
        // Disabled state
        disabled && "opacity-60 cursor-not-allowed"
      )}
      // Accessibility
      role="radio"
      aria-checked={isSelected}
      aria-label={`Choice ${label}: ${text}`}
      data-testid={`choice-${label.toLowerCase()}`}
    >
      {/* Choice Letter/Icon */}
      <motion.div
        animate={showResult && revealStage >= 1 ? {
          scale: isCorrect || isSelected ? [1, 1.15, 1] : 1,
          rotate: isCorrect ? [0, -8, 8, 0] : (isSelected && !isCorrect ? [0, 5, -5, 0] : 0)
        } : {}}
        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
        className={cn(
          "relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          "font-bold text-base transition-colors duration-200",
          // Default
          !showResult && !isSelected && "bg-secondary text-secondary-foreground group-hover:bg-primary/10",
          // Selected
          !showResult && isSelected && "bg-primary text-primary-foreground",
          // Result states
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
                <Check className="w-5 h-5" aria-label="Correct" />
              ) : (
                <X className="w-5 h-5" aria-label="Incorrect" />
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

      {/* Choice Text & Feedback */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium leading-snug transition-colors",
            !showResult && "group-hover:text-foreground",
            showResult && isCorrect && "text-foreground",
            showResult && isSelected && !isCorrect && "text-foreground"
          )}
          data-testid={`choice-text-${label.toLowerCase()}`}
        >
          {text}
        </p>

        {/* Points & Feedback reveal */}
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

      {/* Decorative gradient overlay on hover */}
      {!showResult && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.button>
  );
}
