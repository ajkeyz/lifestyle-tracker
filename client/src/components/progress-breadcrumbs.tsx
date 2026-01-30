import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, Circle } from "lucide-react";

interface ProgressBreadcrumbsProps {
  total: number;
  current: number;
  answers?: (boolean | null)[];
  className?: string;
}

export function ProgressBreadcrumbs({
  total,
  current,
  answers = [],
  className,
}: ProgressBreadcrumbsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;
        const isCorrect = answers[index] === true;
        const isWrong = answers[index] === false;
        const isSkipped = isCompleted && answers[index] === null;

        return (
          <div key={index} className="flex items-center">
            <motion.div
              className={cn(
                "relative flex items-center justify-center",
                "w-8 h-8 rounded-full border-2 transition-colors",
                isCurrent && "border-primary bg-primary/10",
                isCompleted && isCorrect && "border-primary bg-primary",
                isCompleted && isWrong && "border-destructive bg-destructive",
                isCompleted && isSkipped && "border-muted-foreground bg-muted-foreground",
                !isCompleted && !isCurrent && "border-muted bg-muted/30"
              )}
              initial={isCurrent ? { scale: 0.8 } : false}
              animate={isCurrent ? { scale: [1, 1.1, 1] } : { scale: 1 }}
              transition={isCurrent ? { duration: 1, repeat: Infinity } : {}}
            >
              {isCompleted && isCorrect && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
              {isCompleted && isWrong && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <X className="w-4 h-4 text-white" />
                </motion.div>
              )}
              {isCompleted && isSkipped && (
                <span className="text-xs text-white font-medium">-</span>
              )}
              {isCurrent && (
                <span className="text-xs font-bold text-primary">{index + 1}</span>
              )}
              {!isCompleted && !isCurrent && (
                <span className="text-xs text-muted-foreground">{index + 1}</span>
              )}
              
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
            
            {index < total - 1 && (
              <motion.div
                className={cn(
                  "w-6 h-0.5 mx-1",
                  index < current ? "bg-primary" : "bg-muted"
                )}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MinimalProgressDotsProps {
  total: number;
  current: number;
  className?: string;
}

export function MinimalProgressDots({
  total,
  current,
  className,
}: MinimalProgressDotsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < current;
        const isCurrent = index === current;

        return (
          <motion.div
            key={index}
            className={cn(
              "rounded-full transition-all duration-300",
              isCurrent && "w-6 h-2 bg-primary",
              isCompleted && "w-2 h-2 bg-primary",
              !isCompleted && !isCurrent && "w-2 h-2 bg-muted"
            )}
            layout
          />
        );
      })}
    </div>
  );
}

interface StepIndicatorProps {
  current: number;
  total: number;
  className?: string;
}

export function StepIndicator({ current, total, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-primary">{current}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm text-muted-foreground">{total}</span>
    </div>
  );
}
