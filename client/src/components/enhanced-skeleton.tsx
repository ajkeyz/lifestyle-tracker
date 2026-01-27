import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
  variant?: "default" | "rounded" | "circle" | "card";
  style?: React.CSSProperties;
}

export function ShimmerSkeleton({ className, variant = "default", style }: ShimmerSkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    rounded: "rounded-lg",
    circle: "rounded-full",
    card: "rounded-xl"
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted",
        variantClasses[variant],
        className
      )}
      style={style}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ translateX: ["-100%", "100%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
}

interface PulseSkeletonProps {
  className?: string;
  variant?: "default" | "rounded" | "circle" | "card";
}

export function PulseSkeleton({ className, variant = "default" }: PulseSkeletonProps) {
  const variantClasses = {
    default: "rounded-md",
    rounded: "rounded-lg",
    circle: "rounded-full",
    card: "rounded-xl"
  };

  return (
    <motion.div 
      className={cn(
        "bg-muted",
        variantClasses[variant],
        className
      )}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

interface CardSkeletonProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export function CardSkeleton({ 
  className, 
  lines = 3, 
  showAvatar = false,
  showImage = false 
}: CardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "rounded-xl border bg-card p-4 space-y-4",
        className
      )}
    >
      {showImage && (
        <ShimmerSkeleton className="h-32 w-full" variant="rounded" />
      )}
      
      <div className="flex items-center gap-3">
        {showAvatar && (
          <ShimmerSkeleton className="h-10 w-10" variant="circle" />
        )}
        <div className="space-y-2 flex-1">
          <ShimmerSkeleton className="h-4 w-1/3" />
          <ShimmerSkeleton className="h-3 w-1/4" />
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <ShimmerSkeleton 
            key={i} 
            className="h-3" 
            style={{ width: `${100 - i * 15}%` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface GameSkeletonProps {
  className?: string;
}

export function GameSkeleton({ className }: GameSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-6", className)}
    >
      <div className="flex justify-between items-center">
        <ShimmerSkeleton className="h-6 w-24" />
        <ShimmerSkeleton className="h-8 w-8" variant="circle" />
      </div>

      <ShimmerSkeleton className="h-2 w-full" />

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <ShimmerSkeleton className="h-4 w-3/4" />
        <div className="space-y-2">
          <ShimmerSkeleton className="h-3 w-full" />
          <ShimmerSkeleton className="h-3 w-5/6" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <ShimmerSkeleton className="h-14 w-full" variant="rounded" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

interface LeaderboardSkeletonProps {
  className?: string;
  rows?: number;
}

export function LeaderboardSkeleton({ className, rows = 5 }: LeaderboardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
        >
          <ShimmerSkeleton className="h-6 w-6" variant="circle" />
          <ShimmerSkeleton className="h-10 w-10" variant="circle" />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton className="h-4 w-24" />
            <ShimmerSkeleton className="h-3 w-16" />
          </div>
          <ShimmerSkeleton className="h-6 w-12" />
        </motion.div>
      ))}
    </motion.div>
  );
}

interface StatsGridSkeletonProps {
  className?: string;
  cols?: number;
}

export function StatsGridSkeleton({ className, cols = 3 }: StatsGridSkeletonProps) {
  return (
    <div className={cn(`grid grid-cols-${cols} gap-4`, className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          className="p-4 rounded-xl border bg-card space-y-3 text-center"
        >
          <ShimmerSkeleton className="h-6 w-6 mx-auto" variant="circle" />
          <ShimmerSkeleton className="h-8 w-16 mx-auto" />
          <ShimmerSkeleton className="h-3 w-20 mx-auto" />
        </motion.div>
      ))}
    </div>
  );
}
