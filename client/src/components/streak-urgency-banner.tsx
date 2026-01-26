import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakUrgencyBannerProps {
  hasPlayedToday: boolean;
  streak: number;
}

function getTimeUntilMidnightUTC(): { hours: number; minutes: number; seconds: number; totalSeconds: number } {
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  const diff = midnightUTC.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  const totalSeconds = Math.floor(diff / 1000);
  
  return { hours, minutes, seconds, totalSeconds };
}

export function StreakUrgencyBanner({ hasPlayedToday, streak }: StreakUrgencyBannerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightUTC());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilMidnightUTC());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Only show if user hasn't played today and has a streak, and less than 4 hours remain
  const shouldShow = !hasPlayedToday && streak > 0 && timeLeft.hours < 4;
  
  // Determine urgency level
  const isUrgent = timeLeft.hours < 1;
  const isCritical = timeLeft.totalSeconds < 1800; // Less than 30 minutes

  if (!shouldShow) return null;

  const formatTime = () => {
    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    }
    if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
    return `${timeLeft.seconds}s`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className={cn(
          "rounded-lg p-3 flex items-center gap-3 border",
          isCritical
            ? "bg-red-500/10 border-red-500/30 text-red-500"
            : isUrgent
              ? "bg-orange-500/10 border-orange-500/30 text-orange-500"
              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400"
        )}
        data-testid="streak-urgency-banner"
      >
        <div className={cn("flex items-center gap-1", isCritical && "animate-pulse")}>
          {isCritical ? (
            <AlertTriangle className="w-5 h-5" />
          ) : (
            <Flame className="w-5 h-5 fire-animation" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {isCritical
              ? "Your streak is about to expire!"
              : isUrgent
                ? "Don't lose your streak!"
                : "Keep your streak alive!"}
          </p>
          <p className="text-xs opacity-80">
            {streak} day streak ends in {formatTime()}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-mono bg-background/50 px-2 py-1 rounded">
          <Clock className="w-3 h-3" />
          {formatTime()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
