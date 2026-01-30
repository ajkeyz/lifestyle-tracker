import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, Clock, ChevronRight } from "lucide-react";
import { useSound } from "@/hooks/use-sound";

interface ResultItem {
  question: string;
  answer: string | null;
  isCorrect: boolean;
  points: number;
  category?: string;
}

interface StaggeredResultsProps {
  results: ResultItem[];
  onComplete?: () => void;
  autoPlay?: boolean;
  delay?: number;
  className?: string;
}

export function StaggeredResults({
  results,
  onComplete,
  autoPlay = true,
  delay = 800,
  className,
}: StaggeredResultsProps) {
  const [visibleCount, setVisibleCount] = useState(autoPlay ? 0 : results.length);
  const [isRevealing, setIsRevealing] = useState(autoPlay);
  const { play } = useSound();

  useEffect(() => {
    if (!autoPlay || visibleCount >= results.length) {
      if (visibleCount >= results.length) {
        setIsRevealing(false);
        onComplete?.();
      }
      return;
    }

    const timer = setTimeout(() => {
      const nextResult = results[visibleCount];
      if (nextResult.isCorrect) {
        play("correct");
      } else if (nextResult.answer === null) {
        play("timeUp");
      } else {
        play("incorrect");
      }
      setVisibleCount((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleCount, results, autoPlay, delay, onComplete, play]);

  const skipToEnd = () => {
    setVisibleCount(results.length);
    setIsRevealing(false);
    onComplete?.();
  };

  return (
    <div className={cn("space-y-4", className)}>
      <AnimatePresence mode="popLayout">
        {results.slice(0, visibleCount).map((result, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className={cn(
              "p-4 rounded-xl border",
              result.isCorrect
                ? "border-primary/50 bg-primary/5"
                : result.answer === null
                ? "border-muted bg-muted/30"
                : "border-destructive/50 bg-destructive/5"
            )}
          >
            <div className="flex items-start gap-3">
              <motion.div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  result.isCorrect
                    ? "bg-primary text-primary-foreground"
                    : result.answer === null
                    ? "bg-muted-foreground text-muted"
                    : "bg-destructive text-destructive-foreground"
                )}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
              >
                {result.isCorrect ? (
                  <Check className="w-5 h-5" />
                ) : result.answer === null ? (
                  <Clock className="w-5 h-5" />
                ) : (
                  <X className="w-5 h-5" />
                )}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{result.question}</p>
                <div className="flex items-center gap-2 mt-1">
                  {result.category && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {result.category}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      result.isCorrect ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {result.answer || "No answer"}
                  </span>
                </div>
              </div>

              <motion.div
                className={cn(
                  "text-lg font-bold",
                  result.isCorrect ? "text-primary" : "text-muted-foreground"
                )}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                +{result.points}
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {isRevealing && visibleCount < results.length && (
        <motion.button
          onClick={skipToEnd}
          className="w-full p-3 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Skip to results
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}

      {!isRevealing && visibleCount === results.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-muted-foreground">
            {results.filter((r) => r.isCorrect).length} of {results.length} correct
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface RevealCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function RevealCard({ children, delay = 0, className }: RevealCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CountUpRevealProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
}

export function CountUpReveal({
  value,
  duration = 1500,
  prefix = "",
  suffix = "",
  className,
  onComplete,
}: CountUpRevealProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(easeOut * endValue);

      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, onComplete]);

  return (
    <motion.span
      className={cn("tabular-nums", className)}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}
