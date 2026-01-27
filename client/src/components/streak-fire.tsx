import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface StreakFireProps {
  streak: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  animate?: boolean;
}

export function StreakFire({ 
  streak, 
  className, 
  size = "md",
  showNumber = true,
  animate = true
}: StreakFireProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };

  const getFlameIntensity = () => {
    if (streak >= 100) return "text-chart-5";
    if (streak >= 30) return "text-chart-4";
    if (streak >= 7) return "text-destructive";
    return "text-destructive/70";
  };

  if (streak === 0) {
    return (
      <div className={cn("flex items-center gap-1", className)} data-testid="streak-fire">
        <Flame className={cn(sizeClasses[size], "text-muted-foreground opacity-30")} />
        {showNumber && <span className="text-muted-foreground">0</span>}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)} data-testid="streak-fire">
      <motion.div
        className="relative"
        animate={animate ? {
          scale: [1, 1.1, 1],
          rotate: [0, -5, 5, 0],
        } : {}}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Flame 
          className={cn(
            sizeClasses[size], 
            getFlameIntensity()
          )} 
        />
        
        {streak >= 7 && (
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
            }}
          >
            <Flame 
              className={cn(
                sizeClasses[size], 
                getFlameIntensity(),
                "blur-sm opacity-50"
              )} 
            />
          </motion.div>
        )}

        {streak >= 30 && (
          <>
            <motion.div
              className="absolute -top-1 -left-1"
              animate={{
                y: [0, -3, 0],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.2,
              }}
            >
              <Flame className="w-3 h-3 text-chart-5" />
            </motion.div>
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{
                y: [0, -4, 0],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: 0.4,
              }}
            >
              <Flame className="w-2 h-2 text-chart-4" />
            </motion.div>
          </>
        )}
      </motion.div>

      {showNumber && (
        <motion.span
          className={cn(
            "font-bold",
            textSizes[size],
            getFlameIntensity()
          )}
          animate={streak >= 7 ? {
            textShadow: [
              "0 0 0px currentColor",
              "0 0 10px currentColor",
              "0 0 0px currentColor"
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {streak}
        </motion.span>
      )}
    </div>
  );
}

interface StreakMilestoneProps {
  streak: number;
  className?: string;
}

export function StreakMilestone({ streak, className }: StreakMilestoneProps) {
  const milestones = [7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak) || streak + 1;
  const prevMilestone = [...milestones].reverse().find(m => m <= streak) || 0;
  
  const progress = prevMilestone === 0 
    ? (streak / nextMilestone) * 100
    : ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return (
    <motion.div 
      className={cn("flex items-center gap-3", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StreakFire streak={streak} size="lg" />
      
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">
            {streak} day streak
          </span>
          <span className="text-muted-foreground">
            {nextMilestone - streak} to go
          </span>
        </div>
        
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-destructive via-chart-4 to-chart-5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        <div className="flex justify-between mt-1 gap-2">
          {milestones.slice(0, 4).map((milestone) => (
            <motion.div
              key={milestone}
              className={cn(
                "text-xs",
                streak >= milestone ? "text-chart-4" : "text-muted-foreground"
              )}
              animate={streak === milestone ? {
                scale: [1, 1.2, 1],
              } : {}}
              transition={{ duration: 0.5, repeat: streak === milestone ? Infinity : 0 }}
            >
              {milestone}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
