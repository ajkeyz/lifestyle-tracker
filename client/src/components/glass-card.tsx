import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  gradient?: boolean;
  glow?: boolean;
  animate?: boolean;
}

export function GlassCard({ 
  children, 
  className, 
  blur = "md",
  gradient = false,
  glow = false,
  animate = false
}: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg"
  };

  const content = (
    <div 
      className={cn(
        "relative rounded-xl border border-white/10 dark:border-white/5",
        "bg-white/70 dark:bg-black/40",
        blurClasses[blur],
        glow && "shadow-lg shadow-primary/10",
        gradient && "bg-gradient-to-br from-white/80 to-white/60 dark:from-white/10 dark:to-white/5",
        className
      )}
    >
      {glow && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "accent" | "mesh" | "aurora";
  animated?: boolean;
}

export function GradientBackground({ 
  children, 
  className,
  variant = "primary",
  animated = false
}: GradientBackgroundProps) {
  const gradientClasses = {
    primary: "bg-gradient-to-br from-primary/5 via-background to-accent/5",
    accent: "bg-gradient-to-tr from-accent/10 via-background to-primary/10",
    mesh: "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-background to-accent/10",
    aurora: "bg-gradient-to-b from-primary/10 via-accent/5 to-background"
  };

  if (animated) {
    return (
      <div className={cn("relative min-h-screen overflow-hidden", className)}>
        <motion.div 
          className="absolute inset-0 opacity-50"
          animate={{
            background: [
              "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 100% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 0% 100%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 100% 100%, hsl(var(--accent) / 0.2) 0%, transparent 40%)",
              "radial-gradient(circle at 0% 100%, hsl(var(--accent) / 0.2) 0%, transparent 40%)",
              "radial-gradient(circle at 0% 0%, hsl(var(--accent) / 0.2) 0%, transparent 40%)",
              "radial-gradient(circle at 100% 0%, hsl(var(--accent) / 0.2) 0%, transparent 40%)",
              "radial-gradient(circle at 100% 100%, hsl(var(--accent) / 0.2) 0%, transparent 40%)",
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        <div className={cn("relative z-10", gradientClasses[variant])}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(gradientClasses[variant], className)}>
      {children}
    </div>
  );
}

interface FloatingOrbProps {
  className?: string;
  color?: "primary" | "accent" | "destructive";
  size?: "sm" | "md" | "lg";
  delay?: number;
}

export function FloatingOrb({ 
  className, 
  color = "primary",
  size = "md",
  delay = 0
}: FloatingOrbProps) {
  const colorClasses = {
    primary: "bg-primary/20",
    accent: "bg-accent/20",
    destructive: "bg-destructive/20"
  };

  const sizeClasses = {
    sm: "w-32 h-32",
    md: "w-64 h-64",
    lg: "w-96 h-96"
  };

  return (
    <motion.div
      className={cn(
        "absolute rounded-full blur-3xl",
        colorClasses[color],
        sizeClasses[size],
        className
      )}
      animate={{
        x: [0, 30, 0, -30, 0],
        y: [0, -20, 0, 20, 0],
        scale: [1, 1.1, 1, 0.9, 1],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
    />
  );
}

interface MeshGradientProps {
  children: React.ReactNode;
  className?: string;
}

export function MeshGradient({ children, className }: MeshGradientProps) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      <div className="absolute inset-0 pointer-events-none">
        <FloatingOrb color="primary" size="lg" className="top-0 left-0 -translate-x-1/2 -translate-y-1/2" delay={0} />
        <FloatingOrb color="accent" size="md" className="top-1/4 right-0 translate-x-1/3" delay={2} />
        <FloatingOrb color="primary" size="sm" className="bottom-1/4 left-1/4" delay={4} />
        <FloatingOrb color="accent" size="lg" className="bottom-0 right-0 translate-x-1/4 translate-y-1/4" delay={6} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
