import { useEffect, useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface GameTimerProps {
  duration: number;
  isRunning: boolean;
  onTimeUp: () => void;
  onTick?: (remaining: number) => void;
}

export function GameTimer({ duration, isRunning, onTimeUp, onTick }: GameTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const next = prev - 1;
          onTick?.(next);
          if (next <= 0) {
            onTimeUp();
            return 0;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUp, onTick]);

  const percentage = (remaining / duration) * 100;
  const isLow = remaining <= 5;

  return (
    <div className="w-full space-y-1">
      <Progress
        value={percentage}
        className={cn(
          "h-2 transition-all",
          isLow && "animate-pulse"
        )}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Time</span>
        <span className={cn(isLow && "text-destructive font-bold")}>
          {remaining}s
        </span>
      </div>
    </div>
  );
}
