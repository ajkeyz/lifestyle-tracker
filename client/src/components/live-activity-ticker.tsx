import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Flame, Star, TrendingUp, Users, Zap } from "lucide-react";

interface Activity {
  id: string;
  type: "score" | "streak" | "join" | "perfect" | "challenge" | "level_up";
  username: string;
  value?: number;
  timestamp: Date;
}


interface LiveActivityTickerProps {
  activities?: Activity[];
  interval?: number;
  className?: string;
}

export function LiveActivityTicker({
  activities = [],
  interval = 4000,
  className,
}: LiveActivityTickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsVisible(false);
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 300);
    }, interval);

    return () => {
      clearInterval(timer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [activities.length, interval]);

  const activity = activities[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case "score": return Trophy;
      case "streak": return Flame;
      case "perfect": return Star;
      case "join": return Users;
      case "challenge": return Zap;
      case "level_up": return TrendingUp;
      default: return Trophy;
    }
  };

  const getMessage = (act: Activity) => {
    switch (act.type) {
      case "score":
        return `scored ${act.value} points`;
      case "streak":
        return `hit a ${act.value}-day streak!`;
      case "perfect":
        return `got a perfect score!`;
      case "join":
        return `just joined the game`;
      case "challenge":
        return `won a challenge`;
      case "level_up":
        return `reached Money Health ${act.value}`;
      default:
        return "is playing";
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "score": return "text-amber-500";
      case "streak": return "text-orange-500";
      case "perfect": return "text-yellow-500";
      case "join": return "text-primary";
      case "challenge": return "text-purple-500";
      case "level_up": return "text-emerald-500";
      default: return "text-muted-foreground";
    }
  };

  if (!activities?.length) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Activity will appear once friends join</span>;
  }

  const Icon = getIcon(activity.type);

  return (
    <div className={cn("overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key={activity.id + currentIndex}
            className="flex items-center gap-2 text-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <Icon className={cn("w-4 h-4", getColor(activity.type))} />
            <span className="font-medium">{activity.username}</span>
            <span className="text-muted-foreground">{getMessage(activity)}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActivityFeedProps {
  activities?: Activity[];
  maxItems?: number;
  className?: string;
}

export function ActivityFeed({
  activities = [],
  maxItems = 5,
  className,
}: ActivityFeedProps) {
  const [feed, setFeed] = useState<Activity[]>(activities.slice(0, maxItems));

  const addActivity = useCallback((activity: Activity) => {
    setFeed((prev) => [activity, ...prev.slice(0, maxItems - 1)]);
  }, [maxItems]);

  useEffect(() => {
    const interval = setInterval(() => {
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      addActivity({
        ...randomActivity,
        id: Date.now().toString(),
        timestamp: new Date(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activities, addActivity]);

  const getIcon = (type: string) => {
    switch (type) {
      case "score": return Trophy;
      case "streak": return Flame;
      case "perfect": return Star;
      case "join": return Users;
      case "challenge": return Zap;
      case "level_up": return TrendingUp;
      default: return Trophy;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {feed.map((activity) => {
          const Icon = getIcon(activity.type);
          return (
            <motion.div
              key={activity.id}
              layout
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.username}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.type === "score" && `Scored ${activity.value} points`}
                  {activity.type === "streak" && `${activity.value}-day streak`}
                  {activity.type === "perfect" && "Perfect score!"}
                  {activity.type === "join" && "Joined"}
                  {activity.type === "challenge" && "Won a challenge"}
                  {activity.type === "level_up" && `Level ${activity.value}`}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">now</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface PlayerCounterProps {
  count: number;
  label?: string;
  className?: string;
}

export function PlayerCounter({
  count,
  label = "playing now",
  className,
}: PlayerCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + change);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className={cn("flex items-center gap-2", className)}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-sm">
        <span className="font-medium tabular-nums">{displayCount.toLocaleString()}</span>
        <span className="text-muted-foreground ml-1">{label}</span>
      </span>
    </motion.div>
  );
}
