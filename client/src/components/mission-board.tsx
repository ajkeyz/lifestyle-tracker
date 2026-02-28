import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check, Star, Zap, Shield, Gift, Gamepad2, Info } from "lucide-react";
import { REWARD_DESCRIPTIONS } from "@shared/lib/progression";
import type { MissionDef, MissionContext } from "@shared/lib/progression";

interface MissionBoardProps {
  missions: MissionDef[];
  context: MissionContext;
  completedIds: string[];
  onComplete: (missionId: string) => void;
}

const REWARD_ICONS: Record<string, typeof Star> = {
  xp: Zap,
  arcade_token: Gamepad2,
  streak_shield: Shield,
};

export function MissionBoard({
  missions,
  context,
  completedIds,
  onComplete,
}: MissionBoardProps) {
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [rewardTooltip, setRewardTooltip] = useState<string | null>(null);

  if (missions.length === 0) return null;

  const handleCheck = (mission: MissionDef) => {
    if (completedIds.includes(mission.id) || justCompleted === mission.id) return;
    if (!mission.check(context)) return;

    setJustCompleted(mission.id);
    onComplete(mission.id);
    setTimeout(() => setJustCompleted(null), 2000);
  };

  // Progress dots: show total slots (completed + active), capped at 3
  const totalSlots = Math.min(missions.length + completedIds.length, 3);
  const completedSlots = Math.min(completedIds.length, totalSlots);

  return (
    <Card className="p-4 rounded-xl" data-testid="mission-board">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
          <Gift className="w-3.5 h-3.5 text-white" />
        </div>
        <h3 className="font-semibold text-sm">Daily Missions</h3>

        {/* Progress dots ●●○ */}
        <div className="ml-auto flex items-center gap-1" data-testid="mission-progress-dots">
          {Array.from({ length: totalSlots }).map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                i < completedSlots ? "bg-primary" : "bg-muted-foreground/25"
              )}
              initial={i < completedSlots ? { scale: 0.5 } : undefined}
              animate={i < completedSlots ? { scale: 1 } : undefined}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {missions.map((mission, i) => {
            const done = completedIds.includes(mission.id);
            const completing = justCompleted === mission.id;
            const ready = mission.check(context) && !done;
            const RewardIcon = mission.reward ? REWARD_ICONS[mission.reward.type] || Star : Star;
            const showingTooltip = rewardTooltip === mission.id;

            return (
              <motion.div
                key={mission.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200",
                  done
                    ? "bg-primary/5 border border-primary/10"
                    : ready
                      ? "bg-accent/5 border border-accent/20 cursor-pointer"
                      : "bg-muted/30 border border-transparent"
                )}
                onClick={() => ready && handleCheck(mission)}
                data-testid={`mission-${mission.id}`}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    done || completing
                      ? "bg-primary border-primary"
                      : ready
                        ? "border-accent"
                        : "border-muted-foreground/30"
                  )}
                >
                  <AnimatePresence>
                    {(done || completing) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <Check className="w-3.5 h-3.5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      done && "line-through text-muted-foreground"
                    )}
                  >
                    {mission.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{mission.description}</p>
                </div>

                {/* Reward chip with tooltip */}
                {mission.reward && (
                  <div className="relative flex-shrink-0">
                    <motion.button
                      className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200",
                        done ? "bg-primary/10" : "bg-muted/50",
                        completing && "shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRewardTooltip(showingTooltip ? null : mission.id);
                      }}
                      animate={completing ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.35 }}
                    >
                      <RewardIcon
                        className={cn("w-3 h-3", done ? "text-primary/60" : "text-accent")}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold",
                          done ? "text-primary/60" : "text-accent"
                        )}
                      >
                        {done ? "Claimed" : `+${mission.reward.amount}`}
                      </span>
                      {!done && (
                        <Info className="w-2.5 h-2.5 text-muted-foreground/50" />
                      )}
                    </motion.button>

                    {/* Float-up reward animation */}
                    <AnimatePresence>
                      {completing && mission.reward && (
                        <motion.span
                          className={cn("absolute -top-1 right-0 text-xs font-bold pointer-events-none", "text-accent")}
                          initial={{ opacity: 1, y: 0 }}
                          animate={{ opacity: 0, y: -20 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                          +{mission.reward.amount}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Reward tooltip */}
                    <AnimatePresence>
                      {showingTooltip && mission.reward && (
                        <motion.div
                          className="absolute bottom-full right-0 mb-2 z-50 w-40"
                          initial={{ opacity: 0, y: 4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="bg-popover border rounded-lg px-2.5 py-1.5 shadow-lg text-center">
                            <p className="text-[10px] text-popover-foreground leading-snug">
                              {REWARD_DESCRIPTIONS[mission.reward.type] || "Earn rewards"}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Completion glow burst */}
                {completing && (
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-primary/10 pointer-events-none"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}
