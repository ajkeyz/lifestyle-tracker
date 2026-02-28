import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Lock, ChevronRight, Eye } from "lucide-react";
import type { UnlockInfo } from "@shared/lib/progression";

interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor?: string;
  unlock: UnlockInfo & { previewOnly?: boolean };
  onClick: () => void;
  badge?: string;
  /** Compact grid variant — taller card with stacked icon/label */
  variant?: "default" | "compact";
}

export function ModeCard({
  title,
  description,
  icon,
  gradient,
  shadowColor,
  unlock,
  onClick,
  badge,
  variant = "default",
}: ModeCardProps) {
  const isLocked = !unlock.unlocked;

  if (variant === "compact") {
    return (
      <motion.div
        whileTap={isLocked ? undefined : { scale: 0.97 }}
        className="h-full"
      >
        <Card
          className={cn(
            "relative overflow-hidden rounded-xl h-full transition-all duration-200",
            isLocked
              ? "cursor-default border-border/40"
              : "cursor-pointer hover-elevate border border-transparent hover:border-primary/20"
          )}
          onClick={isLocked ? undefined : onClick}
          data-testid={`mode-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
        >
          {/* Subtle gradient accent at top */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-[3px] rounded-t-xl",
              gradient,
              isLocked && "opacity-20"
            )}
          />

          {/* Locked overlay */}
          {isLocked && (
            <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl gap-1.5 px-3">
              <div className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground text-center leading-tight">
                {unlock.condition}
              </p>
              {unlock.progress > 0 && unlock.progress < 1 && (
                <div className="w-full max-w-[100px] h-1 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${unlock.progress * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="p-3 pt-4 flex flex-col items-center text-center gap-2">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                gradient,
                isLocked && "opacity-40"
              )}
            >
              {icon}
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-1.5">
                <h3
                  className={cn(
                    "font-semibold text-[13px] leading-tight",
                    isLocked && "opacity-40"
                  )}
                >
                  {title}
                </h3>
                {badge && (
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded bg-accent/20 text-accent">
                    {badge}
                  </span>
                )}
                {unlock.previewOnly && (
                  <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded bg-blue-500/20 text-blue-400 flex items-center gap-0.5">
                    <Eye className="w-2 h-2" />
                    Preview
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "text-[11px] text-muted-foreground leading-snug",
                  isLocked && "opacity-40"
                )}
              >
                {description}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Default variant — horizontal row card
  return (
    <motion.div whileTap={isLocked ? undefined : { scale: 0.98 }}>
      <Card
        className={cn(
          "relative overflow-hidden rounded-xl transition-all duration-200",
          isLocked
            ? "cursor-default border-border/40"
            : "cursor-pointer hover-elevate border border-transparent hover:border-primary/20"
        )}
        onClick={isLocked ? undefined : onClick}
        data-testid={`mode-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                {unlock.condition}
              </p>
              {unlock.progress > 0 && unlock.progress < 1 && (
                <div className="w-full max-w-[140px] h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${unlock.progress * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-3.5 flex items-center gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0",
              gradient,
              shadowColor,
              isLocked && "opacity-40"
            )}
          >
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  "font-semibold text-sm",
                  isLocked && "opacity-40"
                )}
              >
                {title}
              </h3>
              {badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-accent/20 text-accent">
                  {badge}
                </span>
              )}
              {unlock.previewOnly && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" />
                  Preview
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-xs text-muted-foreground",
                isLocked && "opacity-40"
              )}
            >
              {description}
            </p>
          </div>
          {!isLocked && (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </Card>
    </motion.div>
  );
}
