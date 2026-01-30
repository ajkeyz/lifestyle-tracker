import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GradientVariant = 
  | "primary" 
  | "accent" 
  | "rainbow" 
  | "fire" 
  | "ice" 
  | "gold" 
  | "emerald"
  | "purple";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: GradientVariant;
  animate?: boolean;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4";
}

const gradients: Record<GradientVariant, string> = {
  primary: "from-primary via-primary/80 to-accent",
  accent: "from-accent via-amber-400 dark:via-amber-500 to-orange-500 dark:to-orange-400",
  rainbow: "from-rose-500 dark:from-rose-400 via-amber-500 dark:via-amber-400 to-emerald-500 dark:to-emerald-400",
  fire: "from-amber-400 dark:from-amber-300 via-orange-500 dark:via-orange-400 to-red-600 dark:to-red-500",
  ice: "from-cyan-400 dark:from-cyan-300 via-blue-500 dark:via-blue-400 to-indigo-600 dark:to-indigo-500",
  gold: "from-amber-300 dark:from-amber-200 via-amber-400 dark:via-amber-300 to-amber-600 dark:to-amber-500",
  emerald: "from-emerald-400 dark:from-emerald-300 via-green-500 dark:via-green-400 to-teal-600 dark:to-teal-500",
  purple: "from-purple-400 dark:from-purple-300 via-violet-500 dark:via-violet-400 to-indigo-600 dark:to-indigo-500",
};

export function GradientText({
  children,
  className,
  variant = "primary",
  animate = false,
  as: Component = "span",
}: GradientTextProps) {
  const gradientClass = gradients[variant];

  if (animate) {
    return (
      <Component
        className={cn(
          "bg-gradient-to-r bg-clip-text text-transparent bg-[length:200%_auto]",
          gradientClass,
          "animate-gradient-x",
          className
        )}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        gradientClass,
        className
      )}
    >
      {children}
    </Component>
  );
}

interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: GradientVariant;
  delay?: number;
}

export function AnimatedGradientText({
  children,
  className,
  variant = "primary",
  delay = 0,
}: AnimatedGradientTextProps) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <GradientText variant={variant} animate className={className}>
        {children}
      </GradientText>
    </motion.span>
  );
}

interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  color?: "primary" | "accent" | "white";
  intensity?: "low" | "medium" | "high";
}

export function GlowText({
  children,
  className,
  color = "primary",
  intensity = "medium",
}: GlowTextProps) {
  const colorClasses = {
    primary: "text-primary",
    accent: "text-accent",
    white: "text-white",
  };

  const glowClasses = {
    low: "drop-shadow-[0_0_8px_rgba(var(--glow-color),0.3)]",
    medium: "drop-shadow-[0_0_12px_rgba(var(--glow-color),0.5)]",
    high: "drop-shadow-[0_0_20px_rgba(var(--glow-color),0.7)]",
  };

  const glowColorVar = {
    primary: "16,185,129",
    accent: "245,158,11",
    white: "255,255,255",
  };

  return (
    <span
      className={cn(colorClasses[color], className)}
      style={{
        "--glow-color": glowColorVar[color],
        filter: intensity === "low" 
          ? `drop-shadow(0 0 8px rgba(${glowColorVar[color]},0.3))`
          : intensity === "medium"
          ? `drop-shadow(0 0 12px rgba(${glowColorVar[color]},0.5))`
          : `drop-shadow(0 0 20px rgba(${glowColorVar[color]},0.7))`,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
}

interface TypewriterTextProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  className,
  speed = 50,
  delay = 0,
  onComplete,
}: TypewriterTextProps) {
  return (
    <motion.span className={className}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.01,
            delay: delay + i * (speed / 1000),
          }}
          onAnimationComplete={i === text.length - 1 ? onComplete : undefined}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

interface HighlightTextProps {
  children: React.ReactNode;
  className?: string;
  color?: "primary" | "accent" | "yellow";
  animated?: boolean;
}

export function HighlightText({
  children,
  className,
  color = "accent",
  animated = false,
}: HighlightTextProps) {
  const bgColors = {
    primary: "bg-primary/20",
    accent: "bg-accent/20",
    yellow: "bg-yellow-300/30 dark:bg-yellow-500/20",
  };

  if (animated) {
    return (
      <motion.span
        className={cn(
          "relative inline-block px-1 -mx-1",
          className
        )}
      >
        <motion.span
          className={cn(
            "absolute inset-0 rounded",
            bgColors[color]
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ originX: 0 }}
        />
        <span className="relative">{children}</span>
      </motion.span>
    );
  }

  return (
    <span
      className={cn(
        "px-1 -mx-1 rounded",
        bgColors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
