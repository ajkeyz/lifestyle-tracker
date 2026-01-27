import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, XCircle, Trophy, Star, TrendingUp, 
  Heart, Zap, Target, Award, Crown
} from "lucide-react";

interface AnimatedIconProps {
  className?: string;
  size?: number;
  delay?: number;
}

export function AnimatedCheckIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 15,
        delay 
      }}
    >
      <CheckCircle2 className={cn("text-primary", className)} size={size} />
    </motion.div>
  );
}

export function AnimatedXIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ 
        scale: [0, 1.2, 0.9, 1],
        rotate: [0, -10, 10, 0]
      }}
      transition={{ duration: 0.4, delay }}
    >
      <XCircle className={cn("text-destructive", className)} size={size} />
    </motion.div>
  );
}

export function AnimatedTrophyIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      data-testid="icon-trophy"
    >
      <motion.div
        animate={{
          y: [0, -5, 0],
          rotateZ: [0, -5, 5, 0]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Trophy className={cn("text-chart-5", className)} size={size} />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedStarIcon({ className, size = 24, delay = 0, filled = true }: AnimatedIconProps & { filled?: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, delay }}
      data-testid="icon-star"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Star 
          className={cn(
            filled ? "text-chart-5 fill-chart-5" : "text-muted-foreground",
            className
          )} 
          size={size} 
        />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedTrendingIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
    >
      <motion.div
        animate={{
          y: [0, -3, 0],
          x: [0, 2, 0]
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <TrendingUp className={cn("text-primary", className)} size={size} />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedHeartIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 300, delay }}
      data-testid="icon-heart"
    >
      <motion.div
        animate={{
          scale: [1, 1.15, 1, 1.1, 1]
        }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
      >
        <Heart className={cn("text-destructive fill-destructive", className)} size={size} />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedZapIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ scale: 0, y: -10 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", delay }}
      data-testid="icon-zap"
    >
      <motion.div
        animate={{
          opacity: [1, 0.6, 1],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <Zap className={cn("text-chart-5 fill-chart-5", className)} size={size} />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedTargetIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <Target className={cn("text-primary", className)} size={size} />
      </motion.div>
    </motion.div>
  );
}

export function AnimatedAwardIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0, rotateY: 180 }}
      animate={{ y: 0, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 100, delay }}
      data-testid="icon-award"
    >
      <Award className={cn("text-chart-5", className)} size={size} />
    </motion.div>
  );
}

export function AnimatedCrownIcon({ className, size = 24, delay = 0 }: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, delay }}
      data-testid="icon-crown"
    >
      <motion.div
        animate={{
          y: [0, -3, 0],
          rotate: [0, -3, 3, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Crown className={cn("text-chart-5 fill-chart-5/20", className)} size={size} />
      </motion.div>
    </motion.div>
  );
}

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
}

export function AnimatedStarRating({ rating, maxRating = 5, size = 20, className }: StarRatingProps) {
  return (
    <div className={cn("flex gap-0.5", className)}>
      {Array.from({ length: maxRating }).map((_, i) => (
        <AnimatedStarIcon 
          key={i} 
          size={size} 
          filled={i < rating} 
          delay={i * 0.1}
        />
      ))}
    </div>
  );
}
