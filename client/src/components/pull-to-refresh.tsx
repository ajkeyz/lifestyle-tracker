import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, ArrowDown, Check } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  className,
}: PullToRefreshProps) {
  const [state, setState] = useState<"idle" | "pulling" | "ready" | "refreshing" | "complete">("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { vibrateRefresh, vibrateLight, vibrateSuccess } = useHaptic();
  
  const y = useMotionValue(0);
  const indicatorY = useTransform(y, [0, threshold], [-40, 20]);
  const indicatorOpacity = useTransform(y, [0, threshold * 0.3], [0, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);
  const indicatorRotation = useTransform(y, [0, threshold * 0.8, threshold], [0, 0, 180]);

  const handlePanStart = useCallback(() => {
    if (disabled || state === "refreshing") return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;
    
    setState("pulling");
  }, [disabled, state]);

  const handlePan = useCallback(
    (_: unknown, info: { offset: { y: number } }) => {
      if (disabled || state === "refreshing") return;
      
      const scrollTop = containerRef.current?.scrollTop || 0;
      if (scrollTop > 0) return;

      const newY = Math.max(0, info.offset.y * 0.5);
      y.set(newY);

      if (newY >= threshold && state === "pulling") {
        setState("ready");
        vibrateLight();
      } else if (newY < threshold && state === "ready") {
        setState("pulling");
      }
    },
    [disabled, state, threshold, y, vibrateLight]
  );

  const handlePanEnd = useCallback(async () => {
    if (state === "ready") {
      setState("refreshing");
      vibrateRefresh();
      
      try {
        await onRefresh();
        setState("complete");
        vibrateSuccess();
        
        timeoutRef.current = setTimeout(() => {
          y.set(0);
          setState("idle");
        }, 500);
      } catch {
        y.set(0);
        setState("idle");
      }
    } else {
      y.set(0);
      setState("idle");
    }
  }, [state, onRefresh, y, vibrateRefresh, vibrateSuccess]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state === "idle" || state === "complete") {
      y.set(0);
    }
  }, [state, y]);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
        style={{
          y: indicatorY,
          opacity: indicatorOpacity,
          scale: indicatorScale,
        }}
      >
        <motion.div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            state === "ready" && "bg-primary text-primary-foreground",
            state === "pulling" && "bg-muted text-muted-foreground",
            state === "refreshing" && "bg-primary text-primary-foreground",
            state === "complete" && "bg-primary text-primary-foreground"
          )}
          style={{ rotate: indicatorRotation }}
        >
          {state === "refreshing" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : state === "complete" ? (
            <Check className="w-5 h-5" />
          ) : (
            <ArrowDown className="w-5 h-5" />
          )}
        </motion.div>
      </motion.div>

      <motion.div
        ref={containerRef}
        className="h-full overflow-auto touch-pan-y"
        style={{ y }}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        drag={false}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface SimplePullRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function SimplePullRefresh({
  onRefresh,
  children,
  className,
}: SimplePullRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { vibrateRefresh, vibrateSuccess } = useHaptic();

  const threshold = 100;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      vibrateRefresh();
      
      try {
        await onRefresh();
        vibrateSuccess();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, vibrateRefresh, vibrateSuccess]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none"
        animate={{ height: pullDistance, opacity: progress }}
      >
        <motion.div
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
          animate={{
            rotate: isRefreshing ? 360 : pullDistance * 2,
          }}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 text-primary" />
          ) : (
            <ArrowDown 
              className={cn(
                "w-4 h-4 transition-transform",
                progress >= 1 && "rotate-180"
              )} 
            />
          )}
        </motion.div>
      </motion.div>

      <div
        ref={containerRef}
        className="h-full overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? "transform 0.2s" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
