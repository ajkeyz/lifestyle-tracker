import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwipeDotIndicatorsProps {
  total: number;
  current: number;
  onDotClick?: (index: number) => void;
}

export function SwipeDotIndicators({ total, current, onDotClick }: SwipeDotIndicatorsProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 py-2" data-testid="swipe-dots">
      {Array.from({ length: total }).map((_, i) => (
        <motion.button
          key={i}
          onClick={() => onDotClick?.(i)}
          className={cn(
            "rounded-full transition-all duration-200",
            i === current
              ? "w-6 h-2 bg-primary"
              : "w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40"
          )}
          whileTap={{ scale: 0.9 }}
          aria-label={`Go to question ${i + 1}`}
          data-testid={`swipe-dot-${i}`}
        />
      ))}
    </div>
  );
}
