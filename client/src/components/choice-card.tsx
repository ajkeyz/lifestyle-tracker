import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { toneColors, type ChoiceTone } from "@/lib/game-insights";
import { useSoundEffect } from "@/hooks/use-sound";

function getPointTier(points: number): { label: string; color: string; bgColor: string } {
  const displayPoints = Math.max(0, points);
  if (points >= 100) return { label: String(displayPoints), color: "text-primary", bgColor: "bg-primary/10" };
  if (points >= 80) return { label: String(displayPoints), color: "text-emerald-500 dark:text-emerald-400", bgColor: "bg-emerald-500/10" };
  if (points >= 50) return { label: String(displayPoints), color: "text-amber-500 dark:text-amber-400", bgColor: "bg-amber-500/10" };
  if (points >= 20) return { label: String(displayPoints), color: "text-muted-foreground", bgColor: "bg-muted/50" };
  return { label: String(displayPoints), color: "text-muted-foreground/60", bgColor: "bg-muted/30" };
}

// ─── Points Burst Particles (#7) ───
function PointsBurst() {
  const particles = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      tx: (Math.random() - 0.5) * 50,
      ty: (Math.random() - 0.5) * 40 - 10,
      delay: i * 0.03,
      size: 2 + Math.random() * 2,
    })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 rounded-full bg-primary"
          style={{ width: p.size, height: p.size }}
          initial={{ scale: 1, opacity: 1, x: 0, y: 0 }}
          animate={{ scale: 0, opacity: 0, x: p.tx, y: p.ty }}
          transition={{ duration: 0.6, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
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
  communityPct?: number;    // #9 community answer distribution
  eliminated?: boolean;     // #11 lifeline 50/50
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
  communityPct,
  eliminated = false,
}: ChoiceCardProps) {
  const showCorrectness = showResult && (isSelected || isCorrect);
  const pointTier = points !== undefined ? getPointTier(points) : null;
  const earnedPoints = points !== undefined ? Math.max(0, points) : 0;
  const isDisabledByElimination = eliminated && !showResult;

  // Play coin collect sound when points burst appears on correct answer
  useSoundEffect("coinCollect", showResult && isCorrect && revealStage >= 3);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDisabledByElimination
          ? 0.15
          : showResult && !isSelected && !isCorrect
            ? 0.4
            : 1,
        y: 0,
        x: showResult && isSelected && !isCorrect ? [-3, 3, -3, 3, -2, 2, 0] : 0,
        scale: isDisabledByElimination ? 0.92 : 1,
        rotateX: isDisabledByElimination ? 8 : 0,
        filter: isDisabledByElimination ? "blur(1px)" : "blur(0px)",
      }}
      transition={{
        opacity: isDisabledByElimination
          ? { duration: 0.5, ease: "easeOut" }
          : { duration: 0.3 },
        scale: isDisabledByElimination
          ? { duration: 0.5, ease: [0.36, 0, 0.66, -0.56] }
          : { duration: 0.3 },
        rotateX: isDisabledByElimination
          ? { duration: 0.4, ease: "easeOut" }
          : { duration: 0.2 },
        filter: isDisabledByElimination
          ? { duration: 0.6, delay: 0.1 }
          : { duration: 0.2 },
        y: { duration: 0.4, delay: index * 0.06, type: "spring", stiffness: 300 },
      }}
      style={{ transformPerspective: 600 }}
      whileTap={!showResult && !disabled && !isDisabledByElimination
        ? { scale: 0.97, transition: { duration: 0.08, type: "spring", stiffness: 500 } }
        : {}
      }
      onClick={!disabled && !isDisabledByElimination ? onSelect : undefined}
      disabled={disabled || isDisabledByElimination}
      className={cn(
        "group relative w-full rounded-xl border-2 text-left",
        "transition-colors duration-200 ease-out",
        "flex items-start gap-3 px-4 py-3.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // #6: hover glow
        !showResult && !isSelected && !isDisabledByElimination && "choice-hover-glow",
        !showResult && !isSelected && !isDisabledByElimination && "border-border bg-card hover-elevate",
        !showResult && isSelected && [
          "border-primary bg-primary/10",
          "ring-2 ring-primary/20",
          "shadow-[0_0_0_2px_hsl(var(--primary)/0.15)]",
        ],
        showResult && isCorrect && "border-primary bg-primary/5",
        showResult && isSelected && !isCorrect && "border-destructive bg-destructive/5",
        // #11: eliminated by lifeline
        isDisabledByElimination && "cursor-not-allowed line-through border-dashed border-muted/40",
        disabled && !isDisabledByElimination && "cursor-not-allowed"
      )}
      role="radio"
      aria-checked={isSelected}
      aria-label={`Choice ${label}: ${text}${showResult && pointTier ? `, worth ${pointTier.label} points` : ''}`}
      data-testid={`choice-${label.toLowerCase()}`}
    >
      <AnimatePresence>
        {isDisabledByElimination && (
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center rounded-xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <motion.div
              className="absolute w-[120%] h-[2px] bg-destructive/40 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ rotate: "-8deg" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
          showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground",
          isDisabledByElimination && "bg-muted/30 text-muted-foreground/30"
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
          {tone && !showResult && !isDisabledByElimination && (
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
              showResult && isSelected && !isCorrect && "text-foreground",
              isDisabledByElimination && "text-muted-foreground/40"
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
              className="mt-2 space-y-1.5 overflow-hidden"
            >
              {points !== undefined && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                  className="relative flex items-center gap-1.5"
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
                  {/* #7: Points burst particles on correct answer */}
                  {isCorrect && <PointsBurst />}
                </motion.div>
              )}
              {feedback && (
                <p className="text-sm text-muted-foreground leading-snug">
                  {feedback}
                </p>
              )}
              {/* #9: Community answer distribution bar — removed for cleaner UX */}
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
