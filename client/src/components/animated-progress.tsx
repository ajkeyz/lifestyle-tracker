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
      data-testid="animated-number"
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
    <div className={cn("text-center", className)} data-testid="score-animation">
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
    <div className="relative">
      <motion.div 
        className={cn(
          "relative w-full h-3 bg-muted rounded-full overflow-hidden",
          danger && "shadow-lg shadow-destructive/30"
        )}
        animate={danger ? {
          scale: [1, 1.02, 1],
          boxShadow: [
            "0 0 0px rgba(239, 68, 68, 0)",
            "0 0 20px rgba(239, 68, 68, 0.5)",
            "0 0 0px rgba(239, 68, 68, 0)"
          ]
        } : {}}
        transition={danger ? {
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      >
        <motion.div
          className={cn(
            "h-full rounded-full transition-colors relative",
            danger ? "bg-destructive" : warning ? "bg-chart-5" : "bg-primary"
          )}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        >
          {danger && (
            <motion.div
              className="absolute inset-0 bg-white/30 rounded-full"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 0.3, repeat: Infinity }}
            />
          )}
        </motion.div>
      </motion.div>
      {danger && (
        <motion.div
          className="absolute -top-1 -bottom-1 -left-1 -right-1 rounded-full border-2 border-destructive/50"
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </div>
  );
}

interface RollingNumberProps {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
  prefix?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "default" | "primary" | "accent" | "destructive";
}

export function RollingNumber({ 
  value, 
  className, 
  duration = 1.2,
  suffix = "",
  prefix = "",
  size = "md",
  color = "default"
}: RollingNumberProps) {
  const springValue = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
  });
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      springValue.set(value);
      setHasAnimated(true);
    }, 100);
    
    const unsubscribe = springValue.on("change", (v) => {
      setDisplayValue(Math.round(v));
    });
    
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [value, springValue]);

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-7xl"
  };

  const colorClasses = {
    default: "text-foreground",
    primary: "text-primary",
    accent: "text-accent",
    destructive: "text-destructive"
  };

  return (
    <motion.div 
      className={cn(
        "font-display font-semibold tabular-nums",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: hasAnimated ? [1, 1.05, 1] : 1 
      }}
      transition={{ 
        duration: 0.4,
        scale: { duration: 0.3, delay: duration }
      }}
    >
      <motion.span
        animate={hasAnimated && displayValue === value ? {
          textShadow: [
            "0 0 0px currentColor",
            "0 0 20px currentColor",
            "0 0 0px currentColor"
          ]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {prefix}{displayValue.toLocaleString()}{suffix}
      </motion.span>
    </motion.div>
  );
}

interface ScoreRevealProps {
  score: number;
  maxScore: number;
  label: string;
  icon?: React.ReactNode;
  delay?: number;
  color?: "primary" | "accent" | "destructive";
}

export function ScoreReveal({ score, maxScore, label, icon, delay = 0, color = "primary" }: ScoreRevealProps) {
  const percentage = Math.min((score / maxScore) * 100, 100);
  
  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent", 
    destructive: "text-destructive"
  };

  const bgClasses = {
    primary: "bg-primary",
    accent: "bg-accent",
    destructive: "bg-destructive"
  };
  
  return (
    <motion.div 
      className="text-center space-y-2"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {icon && (
        <motion.div 
          className={cn("flex justify-center", colorClasses[color])}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: delay + 0.2 }}
        >
          {icon}
        </motion.div>
      )}
      <RollingNumber 
        value={score} 
        size="lg" 
        color={color}
        duration={1}
      />
      <motion.p 
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.5 }}
      >
        {label}
      </motion.p>
      <motion.div
        className="h-1.5 bg-muted rounded-full overflow-hidden mt-2"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.3, duration: 0.3 }}
      >
        <motion.div
          className={cn("h-full rounded-full", bgClasses[color])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay + 0.6, duration: 0.8, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
