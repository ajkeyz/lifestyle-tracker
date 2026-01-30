import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  delay?: number;
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
}: AnimatedCounterProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const display = useTransform(spring, (current) =>
    current.toFixed(decimals)
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      spring.set(value);
      setHasAnimated(true);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, spring, delay]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

interface RollingDigitProps {
  digit: string;
  delay?: number;
}

function RollingDigit({ digit, delay = 0 }: RollingDigitProps) {
  const isNumber = !isNaN(parseInt(digit));
  
  if (!isNumber) {
    return <span className="inline-block">{digit}</span>;
  }

  return (
    <span className="inline-block relative overflow-hidden h-[1em]">
      <motion.span
        className="inline-block"
        initial={{ y: "100%" }}
        animate={{ y: "0%" }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          delay,
        }}
      >
        {digit}
      </motion.span>
    </span>
  );
}

interface RollingNumberProps {
  value: number | string;
  className?: string;
  staggerDelay?: number;
}

export function RollingNumber({
  value,
  className,
  staggerDelay = 0.05,
}: RollingNumberProps) {
  const chars = String(value).split("");

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      {chars.map((char, i) => (
        <RollingDigit key={i} digit={char} delay={i * staggerDelay} />
      ))}
    </span>
  );
}

interface ScoreCounterProps {
  score: number;
  maxScore?: number;
  className?: string;
  showGlow?: boolean;
}

export function ScoreCounter({
  score,
  maxScore = 500,
  className,
  showGlow = true,
}: ScoreCounterProps) {
  const percentage = (score / maxScore) * 100;
  const glowColor = percentage >= 80 ? "text-primary" : percentage >= 60 ? "text-accent" : "text-foreground";
  
  return (
    <motion.div
      className={cn("relative inline-flex items-baseline gap-1", className)}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {showGlow && percentage >= 80 && (
        <motion.div
          className="absolute inset-0 blur-xl bg-primary/30 rounded-full"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span className={cn("relative font-bold text-4xl", glowColor)}>
        <AnimatedCounter value={score} duration={1.2} />
      </span>
      <span className="text-muted-foreground text-lg">/ {maxScore}</span>
    </motion.div>
  );
}

interface StreakCounterProps {
  streak: number;
  className?: string;
  showFlame?: boolean;
}

export function StreakCounter({
  streak,
  className,
  showFlame = true,
}: StreakCounterProps) {
  const isHot = streak >= 7;
  const isBurning = streak >= 30;

  return (
    <motion.div
      className={cn("inline-flex items-center gap-2", className)}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {showFlame && (
        <motion.span
          className={cn(
            "text-2xl",
            isBurning ? "text-red-500" : isHot ? "text-orange-500" : "text-muted-foreground"
          )}
          animate={isHot ? { 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          } : {}}
          transition={{ duration: 0.5, repeat: isHot ? Infinity : 0, repeatDelay: 1 }}
        >
          🔥
        </motion.span>
      )}
      <span className="font-bold text-2xl">
        <AnimatedCounter value={streak} duration={0.8} />
      </span>
      <span className="text-muted-foreground text-sm">day streak</span>
    </motion.div>
  );
}

interface MoneyHealthCounterProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MoneyHealthCounter({
  value,
  className,
  size = "md",
}: MoneyHealthCounterProps) {
  const getHealthColor = (v: number) => {
    if (v >= 80) return "text-emerald-500";
    if (v >= 60) return "text-green-500";
    if (v >= 40) return "text-yellow-500";
    if (v >= 20) return "text-orange-500";
    return "text-red-500";
  };

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  return (
    <motion.div
      className={cn("relative inline-flex items-center gap-1", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <span className={cn("font-bold", sizeClasses[size], getHealthColor(value))}>
        <AnimatedCounter value={value} duration={1} />
      </span>
      <span className="text-muted-foreground text-sm">/100</span>
    </motion.div>
  );
}
