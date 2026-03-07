import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Zap, Shield, Gamepad2 } from "lucide-react";
import { REWARD_DESCRIPTIONS } from "@shared/lib/progression";

interface ResourceBarProps {
  totalScore: number;
  freezeTokens: number;
  bonusArcadePlays: number;
  className?: string;
}

const RESOURCES = [
  {
    key: "xp",
    icon: Zap,
    label: "XP",
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10",
    glowColor: "shadow-yellow-400/20",
    field: "totalScore" as const,
  },
  {
    key: "streak_shield",
    icon: Shield,
    label: "Shields",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    glowColor: "shadow-blue-400/20",
    field: "freezeTokens" as const,
  },
  {
    key: "arcade_token",
    icon: Gamepad2,
    label: "Plays",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    glowColor: "shadow-purple-400/20",
    field: "bonusArcadePlays" as const,
  },
] as const;

export function ResourceBar({ totalScore, freezeTokens, bonusArcadePlays, className }: ResourceBarProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const values: Record<string, number> = {
    totalScore,
    freezeTokens,
    bonusArcadePlays,
  };

  const toggleTooltip = (key: string) => {
    setActiveTooltip(activeTooltip === key ? null : key);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
    >
      <Card className={cn("p-3 rounded-xl", className)} data-testid="resource-bar">
        <div className="flex items-center justify-between gap-2">
          {RESOURCES.map((resource, i) => {
            const Icon = resource.icon;
            const value = values[resource.field];
            const isActive = activeTooltip === resource.key;
            const description = REWARD_DESCRIPTIONS[resource.key];

            return (
              <div key={resource.key} className="relative flex-1">
                <motion.button
                  className={cn(
                    "w-full flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200",
                    resource.bgColor,
                    isActive && `ring-1 ring-current ${resource.color} shadow-sm ${resource.glowColor}`
                  )}
                  onClick={() => toggleTooltip(resource.key)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 + 0.15 }}
                  data-testid={`resource-${resource.key}`}
                >
                  <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", resource.color)} />
                  <div className="flex flex-col items-start leading-none min-w-0">
                    <motion.span
                      key={value}
                      className={cn("text-xs font-bold tabular-nums", resource.color)}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {value}
                    </motion.span>
                    <span className="text-[9px] text-muted-foreground">{resource.label}</span>
                  </div>
                </motion.button>

                {/* Tooltip */}
                <AnimatePresence>
                  {isActive && description && (
                    <motion.div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44"
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="bg-popover border rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm text-center">
                        <p className="text-[11px] text-popover-foreground leading-snug">{description}</p>
                      </div>
                      {/* Arrow */}
                      <div className="flex justify-center">
                        <div className="w-2 h-2 bg-popover border-b border-r rotate-45 -mt-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
