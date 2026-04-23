import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Gift, ChevronDown } from "lucide-react";
import { MissionBoard } from "@/components/mission-board";
import type { MissionDef, MissionContext } from "@shared/lib/progression";

interface DailyProgressCardProps {
  missions: MissionDef[];
  context: MissionContext;
  completedIds: string[];
  onComplete: (missionId: string) => void;
  /** When true, card defaults to expanded (first 7 days of account) */
  isInFirstWeek: boolean;
  className?: string;
}

const STORAGE_KEY = "dailyProgressCollapsed";

export function DailyProgressCard({
  missions,
  context,
  completedIds,
  onComplete,
  isInFirstWeek,
  className,
}: DailyProgressCardProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // First week: default expanded. After: respect persisted state.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return isInFirstWeek;
    return stored !== "true";
  });

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(!isExpanded));
  }, [isExpanded]);

  if (missions.length === 0) return null;

  // Progress calculations — only count completions among displayed missions
  const completedSlots = missions.filter((m) => completedIds.includes(m.id)).length;
  const totalSlots = missions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 }}
    >
      <Card
        className={cn("rounded-xl overflow-hidden", className)}
        data-testid="daily-progress-card"
      >
        {/* Collapsible Header */}
        <button
          className="w-full flex items-center gap-2.5 p-4 text-left hover:bg-muted/30 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="daily-progress-toggle"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Gift className="w-4 h-4 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold leading-tight">Today's Goals</h3>
            <p className="text-[11px] text-muted-foreground">
              {completedSlots} of {totalSlots} missions complete
            </p>
          </div>

          {/* Progress dots ●●○ */}
          <div className="flex items-center gap-1 mr-1" data-testid="daily-progress-dots">
            {Array.from({ length: totalSlots }).map((_, i) => (
              <motion.div
                key={i}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                  i < completedSlots ? "bg-primary" : "bg-muted-foreground/25"
                )}
                initial={i < completedSlots ? { scale: 0.5 } : undefined}
                animate={i < completedSlots ? { scale: 1 } : undefined}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              />
            ))}
          </div>

          {/* Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </button>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <MissionBoard
                  missions={missions}
                  context={context}
                  completedIds={completedIds}
                  onComplete={onComplete}
                  embedded
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
