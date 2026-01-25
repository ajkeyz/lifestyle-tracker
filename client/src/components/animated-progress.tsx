import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AnimatedProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  duration?: number;
}

export function AnimatedProgress({ 
  value, 
  className,
  indicatorClassName,
  duration = 0.5 
}: AnimatedProgressProps) {
  const springValue = useSpring(0, { duration: duration * 1000 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = springValue.on("change", (v) => {
      setDisplayValue(Math.round(v));
    });
    return () => unsubscribe();
  }, [value, springValue]);

  return (
    <div className={cn("relative w-full h-3 bg-muted rounded-full overflow-hidden", className)}>
      <motion.div
        className={cn("h-full bg-primary rounded-full", indicatorClassName)}
        initial={{ width: 0 }}
        animate={{ width: `${displayValue}%` }}
        transition={{ duration, ease: "easeOut" }}
      />
    </div>
  );
}

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function AnimatedNumber({ 
  value, 
  className, 
  duration = 0.8,
  suffix = "",
  prefix = ""
}: AnimatedNumberProps) {
  const springValue = useSpring(0, { 
    stiffness: 100, 
    damping: 30,
    duration: duration * 1000 
  });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    springValue.set(value);
    const unsubscribe = springValue.on("change", (v) => {
      setDisplayValue(Math.round(v));
    });
    return () => unsubscribe();
  }, [value, springValue]);

  return (
    <motion.span 
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}

interface ScoreAnimationProps {
  score: number;
  maxScore: number;
  className?: string;
}

export function ScoreAnimation({ score, maxScore, className }: ScoreAnimationProps) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <div className={cn("text-center", className)}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-5xl font-bold"
      >
        <AnimatedNumber value={score} suffix="" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-sm mt-1"
      >
        out of {maxScore} points
      </motion.div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-4"
      >
        <AnimatedProgress value={percentage} />
      </motion.div>
    </div>
  );
}

interface TimerProgressProps {
  timeLeft: number;
  maxTime: number;
  warning?: boolean;
  danger?: boolean;
}

export function TimerProgress({ timeLeft, maxTime, warning, danger }: TimerProgressProps) {
  const percentage = (timeLeft / maxTime) * 100;
  
  return (
    <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
      <motion.div
        className={cn(
          "h-full rounded-full transition-colors",
          danger ? "bg-destructive" : warning ? "bg-yellow-500" : "bg-primary"
        )}
        initial={{ width: "100%" }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.3, ease: "linear" }}
      />
    </div>
  );
}
