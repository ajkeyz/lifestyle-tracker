import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Flame,
  Trophy,
  Coins,
  Heart,
  Star,
  Zap,
  TrendingUp,
  Crown,
  Sparkles,
  Target,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface AnimatedIconProps {
  className?: string;
  size?: number;
}

export function FlickerFlame({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{
        scale: [1, 1.1, 1, 1.05, 1],
        rotate: [0, -3, 3, -2, 0],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      <Flame
        size={size}
        className="text-orange-500"
        style={{
          filter: "drop-shadow(0 0 6px rgba(249, 115, 22, 0.6))",
        }}
      />
    </motion.div>
  );
}

export function PulseTrophy({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex relative", className)}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Trophy size={size} className="text-amber-500" />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Trophy
          size={size}
          className="text-amber-400"
          style={{ filter: "blur(4px)" }}
        />
      </motion.div>
    </motion.div>
  );
}

export function FloatCoins({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <Coins size={size} className="text-yellow-500" />
    </motion.div>
  );
}

export function BeatHeart({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{ scale: [1, 1.15, 1, 1.15, 1] }}
      transition={{
        duration: 1,
        repeat: Infinity,
        times: [0, 0.1, 0.3, 0.4, 1],
      }}
    >
      <Heart size={size} className="text-red-500 fill-red-500" />
    </motion.div>
  );
}

export function SpinStar({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
    >
      <Star size={size} className="text-yellow-400 fill-yellow-400" />
    </motion.div>
  );
}

export function BoltZap({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{
        opacity: [1, 0.5, 1],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 0.5, repeat: Infinity }}
    >
      <Zap size={size} className="text-yellow-500 fill-yellow-500" />
    </motion.div>
  );
}

export function RiseTrend({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{ y: [0, -3, 0], rotate: [0, 5, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <TrendingUp size={size} className="text-emerald-500" />
    </motion.div>
  );
}

export function FloatCrown({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{
        y: [0, -3, 0],
        rotate: [0, -5, 5, 0],
      }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <Crown size={size} className="text-amber-500" />
    </motion.div>
  );
}

export function TwinkleSparkles({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
        rotate: [0, 15, -15, 0],
      }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Sparkles size={size} className="text-purple-500" />
    </motion.div>
  );
}

export function PulseTarget({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div className={cn("inline-flex relative", className)}>
      <Target size={size} className="text-primary" />
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary"
        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
  );
}

export function TickClock({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ duration: 1, repeat: Infinity }}
    >
      <Clock size={size} className="text-muted-foreground" />
    </motion.div>
  );
}

export function ShakeAlert({ className, size = 24 }: AnimatedIconProps) {
  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={{ x: [-2, 2, -2, 2, 0] }}
      transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2 }}
    >
      <AlertTriangle size={size} className="text-amber-500" />
    </motion.div>
  );
}

interface AnimatedMoneyHealthProps {
  value: number;
  size?: number;
  className?: string;
}

export function AnimatedMoneyHealth({
  value,
  size = 24,
  className,
}: AnimatedMoneyHealthProps) {
  const getColor = () => {
    if (value >= 80) return "text-emerald-500";
    if (value >= 60) return "text-green-500";
    if (value >= 40) return "text-yellow-500";
    if (value >= 20) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <motion.div
      className={cn("inline-flex", className)}
      animate={value >= 80 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <Heart
        size={size}
        className={cn(getColor(), value >= 60 && "fill-current")}
      />
    </motion.div>
  );
}
