import { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  upLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  leftLabel,
  rightLabel,
  upLabel,
  disabled = false,
  className,
}: SwipeCardProps) {
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);

  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);
  const upOpacity = useTransform(y, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    const velocity = 500;

    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      setExitDirection("left");
      onSwipeLeft?.();
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      setExitDirection("right");
      onSwipeRight?.();
    } else if (info.offset.y < -threshold || info.velocity.y < -velocity) {
      setExitDirection("up");
      onSwipeUp?.();
    }
  };

  if (exitDirection) {
    const exitX = exitDirection === "left" ? -400 : exitDirection === "right" ? 400 : 0;
    const exitY = exitDirection === "up" ? -400 : 0;

    return (
      <motion.div
        className={cn("relative", className)}
        initial={{ x: 0, y: 0 }}
        animate={{ x: exitX, y: exitY, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={cn("relative touch-none", className)}
      style={{ x, y, rotate, opacity }}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      {leftLabel && (
        <motion.div
          className="absolute top-4 left-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-bold text-lg transform -rotate-12 z-10"
          style={{ opacity: leftOpacity }}
        >
          {leftLabel}
        </motion.div>
      )}

      {rightLabel && (
        <motion.div
          className="absolute top-4 right-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-lg transform rotate-12 z-10"
          style={{ opacity: rightOpacity }}
        >
          {rightLabel}
        </motion.div>
      )}

      {upLabel && (
        <motion.div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-accent text-accent-foreground rounded-lg font-bold text-lg z-10"
          style={{ opacity: upOpacity }}
        >
          {upLabel}
        </motion.div>
      )}

      {children}
    </motion.div>
  );
}

interface SwipeableChoicesProps {
  choices: { label: string; text: string }[];
  onSelect: (label: string) => void;
  selectedLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function SwipeableChoices({
  choices,
  onSelect,
  selectedLabel,
  disabled = false,
  className,
}: SwipeableChoicesProps) {
  const [swipeHint, setSwipeHint] = useState(true);

  return (
    <div className={cn("relative", className)}>
      {swipeHint && !selectedLabel && (
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            animate={{ x: [-5, 5, -5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ←
          </motion.span>
          <span>Swipe or tap to answer</span>
          <motion.span
            animate={{ x: [5, -5, 5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.div>
      )}

      <div className="space-y-3">
        {choices.map((choice, index) => (
          <motion.button
            key={choice.label}
            onClick={() => {
              if (!disabled && !selectedLabel) {
                setSwipeHint(false);
                onSelect(choice.label);
              }
            }}
            className={cn(
              "w-full p-4 rounded-xl border text-left transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              selectedLabel === choice.label && "border-primary bg-primary/10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
          >
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                {choice.label}
              </span>
              <span className="flex-1 text-sm">{choice.text}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
