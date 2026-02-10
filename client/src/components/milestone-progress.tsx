/**
 * Milestone Progress Bar
 *
 * Enhanced progress bar with animated milestone markers
 * Features: milestone celebrations, gradient fills, tooltips
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Crown, Sparkles, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface Milestone {
  value: number;
  label: string;
  icon?: typeof Trophy;
  color?: string;
  reached?: boolean;
  reward?: string;
}

interface MilestoneProgressProps {
  value: number;
  max?: number;
  milestones: Milestone[];
  showLabels?: boolean;
  showTooltips?: boolean;
  className?: string;
  gradient?: boolean;
  shimmer?: boolean;
  animated?: boolean;
}

const DEFAULT_MILESTONE_ICONS = [Star, Zap, Trophy, Crown, Sparkles];

export function MilestoneProgress({
  value,
  max = 100,
  milestones,
  showLabels = true,
  showTooltips = true,
  className,
  gradient = true,
  shimmer = false,
  animated = true,
}: MilestoneProgressProps) {
  const [hoveredMilestone, setHoveredMilestone] = useState<number | null>(null);
  const percentage = Math.min(100, (value / max) * 100);

  // Sort milestones by value
  const sortedMilestones = [...milestones].sort((a, b) => a.value - b.value);

  // Determine which milestones are reached
  const milestonesWithStatus = sortedMilestones.map((milestone, index) => ({
    ...milestone,
    reached: value >= milestone.value,
    icon: milestone.icon || DEFAULT_MILESTONE_ICONS[index % DEFAULT_MILESTONE_ICONS.length],
    color: milestone.color || getMilestoneColor(index),
  }));

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress bar with markers */}
      <div className="relative">
        <Progress
          value={percentage}
          className="h-3"
          gradient={gradient}
          shimmer={shimmer}
        />

        {/* Milestone markers */}
        <div className="absolute inset-0 pointer-events-none">
          {milestonesWithStatus.map((milestone, index) => {
            const milestonePercent = (milestone.value / max) * 100;
            const Icon = milestone.icon!;
            const isReached = milestone.reached;
            const isHovered = hoveredMilestone === index;

            return (
              <motion.div
                key={index}
                initial={animated ? { scale: 0, opacity: 0 } : {}}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: "spring", bounce: 0.5 }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-auto"
                style={{ left: `${milestonePercent}%` }}
                onMouseEnter={() => setHoveredMilestone(index)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Marker Circle */}
                <motion.div
                  animate={isReached ? {
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  } : {}}
                  transition={{
                    scale: { repeat: Infinity, duration: 2, repeatDelay: 3 },
                    rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  }}
                  className={cn(
                    "relative w-6 h-6 rounded-full flex items-center justify-center",
                    "border-2 border-background shadow-lg cursor-pointer",
                    "transition-all duration-200",
                    isReached
                      ? `bg-gradient-to-br ${milestone.color} shadow-${milestone.color}`
                      : "bg-muted border-muted-foreground/30",
                    isHovered && "scale-125"
                  )}
                >
                  {isReached ? (
                    <Icon className="w-3 h-3 text-white drop-shadow" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                  )}

                  {/* Glow effect for reached milestones */}
                  {isReached && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-full",
                        `bg-gradient-to-br ${milestone.color}`,
                        "opacity-30 blur-md"
                      )}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Check mark overlay */}
                  {isReached && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Check className="w-2 h-2 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Tooltip */}
                {showTooltips && isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-popover border border-border rounded-lg shadow-xl whitespace-nowrap z-50"
                  >
                    <div className="text-xs font-semibold">{milestone.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {milestone.value} / {max}
                    </div>
                    {milestone.reward && (
                      <div className="text-xs text-primary mt-1">
                        🎁 {milestone.reward}
                      </div>
                    )}
                    {isReached && (
                      <div className="text-xs text-green-500 font-medium mt-1">
                        ✓ Completed
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current value indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full shadow-lg"
          style={{ left: `${percentage}%` }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-primary opacity-50 blur-sm"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Labels below progress */}
      {showLabels && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">0</span>
          {milestonesWithStatus.map((milestone, index) => {
            const milestonePercent = (milestone.value / max) * 100;
            return (
              <span
                key={index}
                className={cn(
                  "font-medium transition-colors",
                  milestone.reached ? "text-primary" : "text-muted-foreground"
                )}
                style={{
                  position: "absolute",
                  left: `${milestonePercent}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {milestone.value}
              </span>
            );
          })}
          <span className="text-muted-foreground">{max}</span>
        </div>
      )}

      {/* Milestone summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {milestonesWithStatus.filter(m => m.reached).length} / {milestonesWithStatus.length} milestones reached
        </span>
        <span className="font-bold text-foreground">
          {value} / {max}
        </span>
      </div>

      {/* Next milestone info */}
      {(() => {
        const nextMilestone = milestonesWithStatus.find(m => !m.reached);
        if (nextMilestone) {
          const remaining = nextMilestone.value - value;
          return (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <div>
                  <span className="font-semibold">Next: {nextMilestone.label}</span>
                  <span className="text-muted-foreground ml-2">
                    ({remaining} more to go!)
                  </span>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-500">
                All milestones completed! 🎉
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/**
 * Helper function to get milestone colors
 */
function getMilestoneColor(index: number): string {
  const colors = [
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-yellow-500 to-amber-500",
    "from-orange-500 to-red-500",
    "from-purple-500 to-pink-500",
    "from-indigo-500 to-violet-500",
  ];
  return colors[index % colors.length];
}

/**
 * Compact version for smaller spaces
 */
export function CompactMilestoneProgress({
  value,
  max = 100,
  milestones,
  className,
}: Omit<MilestoneProgressProps, "showLabels" | "showTooltips">) {
  return (
    <MilestoneProgress
      value={value}
      max={max}
      milestones={milestones}
      showLabels={false}
      showTooltips={true}
      className={className}
      gradient={true}
      shimmer={false}
      animated={false}
    />
  );
}
