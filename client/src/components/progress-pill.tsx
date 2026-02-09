import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressPillProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressPill({ current, total, className }: ProgressPillProps) {
  return (
    <motion.div
      key={`progress-${current}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-secondary/80 backdrop-blur-sm border border-border/50",
        "text-sm font-medium text-foreground",
        "shadow-sm",
        className
      )}
      role="status"
      aria-label={`Question ${current} of ${total}`}
      data-testid="progress-pill"
    >
      <span className="font-display font-bold text-primary">Q{current}</span>
      <span className="text-muted-foreground text-xs">of</span>
      <span className="font-display font-semibold">{total}</span>
    </motion.div>
  );
}
