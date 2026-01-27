import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Circle } from "lucide-react";
import { useState, useEffect } from "react";

interface LivePlayersProps {
  count: number;
  className?: string;
  showPulse?: boolean;
}

export function LivePlayers({ count, className, showPulse = true }: LivePlayersProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isIncreasing, setIsIncreasing] = useState(false);

  useEffect(() => {
    if (count !== displayCount) {
      setIsIncreasing(count > displayCount);
      setDisplayCount(count);
    }
  }, [count, displayCount]);

  return (
    <motion.div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-primary/10 border border-primary/20",
        className
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      data-testid="live-players-count"
    >
      <div className="relative">
        <Circle className="w-2 h-2 fill-primary text-primary" />
        {showPulse && (
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 2, 1],
              opacity: [1, 0, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Circle className="w-2 h-2 fill-primary/50 text-primary/50" />
          </motion.div>
        )}
      </div>

      <Users className="w-4 h-4 text-muted-foreground" />
      
      <AnimatePresence mode="wait">
        <motion.span
          key={displayCount}
          className="font-medium text-sm"
          initial={{ opacity: 0, y: isIncreasing ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: isIncreasing ? -10 : 10 }}
          transition={{ duration: 0.2 }}
        >
          {displayCount.toLocaleString()}
        </motion.span>
      </AnimatePresence>

      <span className="text-xs text-muted-foreground">playing now</span>
    </motion.div>
  );
}

interface RecentPlayerActivityProps {
  activities: {
    id: string;
    username: string;
    action: "completed" | "streak" | "perfect";
    value?: number;
  }[];
  className?: string;
}

export function RecentPlayerActivity({ activities, className }: RecentPlayerActivityProps) {
  const [visibleActivities, setVisibleActivities] = useState(activities.slice(0, 3));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (activities.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [activities.length]);

  useEffect(() => {
    const start = currentIndex;
    const end = Math.min(start + 3, activities.length);
    setVisibleActivities(activities.slice(start, end));
  }, [currentIndex, activities]);

  const getActionText = (action: string, value?: number) => {
    switch (action) {
      case "completed":
        return "just finished today's drop";
      case "streak":
        return `hit a ${value}-day streak`;
      case "perfect":
        return "got a perfect score";
      default:
        return "is playing";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "perfect":
        return "text-chart-5";
      case "streak":
        return "text-chart-4";
      default:
        return "text-primary";
    }
  };

  return (
    <div className={cn("space-y-2", className)} data-testid="recent-player-activity">
      <AnimatePresence mode="popLayout">
        {visibleActivities.map((activity, index) => (
          <motion.div
            key={activity.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 text-sm"
            data-testid={`activity-${activity.id}`}
          >
            <span className="font-medium">{activity.username}</span>
            <span className={cn("text-muted-foreground", getActionColor(activity.action))}>
              {getActionText(activity.action, activity.value)}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
