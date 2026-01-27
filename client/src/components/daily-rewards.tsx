import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Star, Zap, Crown, Check, Lock } from "lucide-react";
import { useState } from "react";

interface DailyReward {
  day: number;
  reward: string;
  value: number;
  icon: "gift" | "star" | "zap" | "crown";
  claimed: boolean;
  available: boolean;
  isMilestone?: boolean;
}

interface DailyRewardsProps {
  rewards: DailyReward[];
  currentDay: number;
  onClaim: (day: number) => void;
  className?: string;
}

export function DailyRewards({ rewards, currentDay, onClaim, className }: DailyRewardsProps) {
  const [claimingDay, setClaimingDay] = useState<number | null>(null);

  const getIcon = (icon: string) => {
    switch (icon) {
      case "gift":
        return Gift;
      case "star":
        return Star;
      case "zap":
        return Zap;
      case "crown":
        return Crown;
      default:
        return Gift;
    }
  };

  const handleClaim = async (day: number) => {
    setClaimingDay(day);
    await new Promise(resolve => setTimeout(resolve, 500));
    onClaim(day);
    setClaimingDay(null);
  };

  return (
    <Card className={cn("p-4", className)} data-testid="card-daily-rewards">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Daily Rewards</h3>
        </div>
        <span className="text-sm text-muted-foreground">Day {currentDay}</span>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {rewards.map((reward, index) => {
          const Icon = getIcon(reward.icon);
          const isToday = reward.day === currentDay;
          const isPast = reward.day < currentDay;
          const isClaiming = claimingDay === reward.day;

          return (
            <motion.div
              key={reward.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "relative flex flex-col items-center p-2 rounded-lg border-2",
                reward.claimed && "bg-primary/10 border-primary/30",
                reward.available && !reward.claimed && "border-primary bg-primary/5",
                !reward.available && !reward.claimed && "border-border bg-muted/50",
                reward.isMilestone && "ring-2 ring-chart-5/30"
              )}
              data-testid={`reward-day-${reward.day}`}
            >
              <span className="text-xs text-muted-foreground mb-1">Day {reward.day}</span>
              
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-1",
                  reward.claimed ? "bg-primary" : 
                  reward.available ? "bg-primary/20" : "bg-muted"
                )}
                animate={reward.available && !reward.claimed ? {
                  scale: [1, 1.1, 1]
                } : {}}
                transition={{ duration: 1, repeat: reward.available && !reward.claimed ? Infinity : 0 }}
              >
                {reward.claimed ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : reward.available ? (
                  <Icon className={cn(
                    "w-5 h-5",
                    reward.isMilestone ? "text-chart-5" : "text-primary"
                  )} />
                ) : (
                  <Lock className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>

              <span className={cn(
                "text-xs font-medium",
                reward.claimed ? "text-primary" : "text-muted-foreground"
              )}>
                +{reward.value}
              </span>

              {reward.available && !reward.claimed && (
                <motion.div
                  className="absolute -inset-px rounded-lg"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 hsl(var(--primary) / 0)",
                      "0 0 0 4px hsl(var(--primary) / 0.3)",
                      "0 0 0 0 hsl(var(--primary) / 0)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {rewards.find(r => r.available && !r.claimed) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <Button
              className="w-full"
              onClick={() => {
                const claimable = rewards.find(r => r.available && !r.claimed);
                if (claimable) handleClaim(claimable.day);
              }}
              disabled={claimingDay !== null}
              data-testid="button-claim-daily-reward"
            >
              {claimingDay !== null ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Gift className="w-4 h-4" />
                </motion.div>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Today's Reward
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface RewardClaimAnimationProps {
  reward: {
    reward: string;
    value: number;
    icon: "gift" | "star" | "zap" | "crown";
    isMilestone?: boolean;
  };
  onComplete: () => void;
}

export function RewardClaimAnimation({ reward, onComplete }: RewardClaimAnimationProps) {
  const getIcon = () => {
    switch (reward.icon) {
      case "gift":
        return Gift;
      case "star":
        return Star;
      case "zap":
        return Zap;
      case "crown":
        return Crown;
      default:
        return Gift;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onComplete}
    >
      <motion.div
        className="bg-card rounded-xl p-8 max-w-sm text-center"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 20 }}
        transition={{ type: "spring", stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="mb-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className={cn(
              "w-20 h-20 rounded-full mx-auto flex items-center justify-center",
              reward.isMilestone 
                ? "bg-gradient-to-br from-yellow-400 to-amber-600" 
                : "bg-gradient-to-br from-primary to-chart-4"
            )}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Icon className="w-10 h-10 text-white" />
          </motion.div>
        </motion.div>

        <motion.h3
          className="text-xl font-bold mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Reward Claimed!
        </motion.h3>

        <motion.p
          className="text-3xl font-bold text-primary mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          +{reward.value}
        </motion.p>

        <motion.p
          className="text-muted-foreground mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {reward.reward}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button onClick={onComplete}>Continue</Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
