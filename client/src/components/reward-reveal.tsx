import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Gift, Star, Coins, Sparkles, Zap, Trophy } from "lucide-react";
import { useSound } from "@/hooks/use-sound";
import { useConfetti } from "@/components/confetti";

interface RewardItem {
  type: "coins" | "xp" | "freeze" | "badge" | "streak_bonus";
  value: number;
  label: string;
}

interface RewardRevealProps {
  rewards: RewardItem[];
  onComplete?: () => void;
  className?: string;
}

export function RewardReveal({
  rewards,
  onComplete,
  className,
}: RewardRevealProps) {
  const [stage, setStage] = useState<"closed" | "opening" | "revealed">("closed");
  const [currentRewardIndex, setCurrentRewardIndex] = useState(-1);
  const { play } = useSound();
  const { fireAchievement } = useConfetti();

  const handleOpen = () => {
    setStage("opening");
    play("click");
  };

  useEffect(() => {
    if (stage === "opening") {
      const timer = setTimeout(() => {
        setStage("revealed");
        setCurrentRewardIndex(0);
        play("achievement");
        fireAchievement();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [stage, play, fireAchievement]);

  useEffect(() => {
    if (stage === "revealed" && currentRewardIndex >= 0 && currentRewardIndex < rewards.length - 1) {
      const timer = setTimeout(() => {
        setCurrentRewardIndex((prev) => prev + 1);
        play("correct");
      }, 600);
      return () => clearTimeout(timer);
    } else if (stage === "revealed" && currentRewardIndex === rewards.length - 1) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentRewardIndex, rewards.length, stage, onComplete, play]);

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "coins": return Coins;
      case "xp": return Star;
      case "freeze": return Zap;
      case "badge": return Trophy;
      case "streak_bonus": return Sparkles;
      default: return Gift;
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case "coins": return "text-yellow-500 bg-yellow-500/20";
      case "xp": return "text-purple-500 bg-purple-500/20";
      case "freeze": return "text-cyan-500 bg-cyan-500/20";
      case "badge": return "text-amber-500 bg-amber-500/20";
      case "streak_bonus": return "text-primary bg-primary/20";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px]", className)}>
      <AnimatePresence mode="wait">
        {stage === "closed" && (
          <motion.button
            key="closed"
            onClick={handleOpen}
            className="relative"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, rotate: 180 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                  "0 0 40px rgba(16, 185, 129, 0.5)",
                  "0 0 20px rgba(16, 185, 129, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gift className="w-16 h-16 text-white" />
            </motion.div>
            <motion.div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              !
            </motion.div>
          </motion.button>
        )}

        {stage === "opening" && (
          <motion.div
            key="opening"
            className="relative"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 0.8, 1.5], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5 }}
          >
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>
            </div>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-accent"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i * 30 * Math.PI) / 180) * 100,
                  y: Math.sin((i * 30 * Math.PI) / 180) * 100,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{ left: "50%", top: "50%", marginLeft: -6, marginTop: -6 }}
              />
            ))}
          </motion.div>
        )}

        {stage === "revealed" && (
          <motion.div
            key="revealed"
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.h2
              className="text-2xl font-bold text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Daily Reward!
            </motion.h2>

            <div className="flex flex-wrap items-center justify-center gap-4">
              {rewards.map((reward, index) => {
                const Icon = getRewardIcon(reward.type);
                const colorClass = getRewardColor(reward.type);
                const isVisible = index <= currentRewardIndex;

                return (
                  <motion.div
                    key={index}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border",
                      colorClass.split(" ")[1],
                      !isVisible && "opacity-0"
                    )}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={isVisible ? { scale: 1, rotate: 0 } : {}}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", colorClass)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">+{reward.value}</p>
                      <p className="text-xs text-muted-foreground">{reward.label}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SlotMachineRewardProps {
  finalValue: number;
  label: string;
  onComplete?: () => void;
  className?: string;
}

export function SlotMachineReward({
  finalValue,
  label,
  onComplete,
  className,
}: SlotMachineRewardProps) {
  const [spinning, setSpinning] = useState(true);
  const [displayValue, setDisplayValue] = useState(0);
  const { play } = useSound();

  useEffect(() => {
    const spinDuration = 2000;
    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < spinDuration) {
        setDisplayValue(Math.floor(Math.random() * 1000));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setDisplayValue(finalValue);
        play("achievement");
        onComplete?.();
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [finalValue, onComplete, play]);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        className="relative overflow-hidden bg-gradient-to-b from-muted to-background rounded-xl border-2 border-primary/50 px-8 py-4"
        animate={spinning ? { y: [0, -5, 0] } : {}}
        transition={{ duration: 0.1, repeat: spinning ? Infinity : 0 }}
      >
        <motion.span
          className="text-4xl font-bold tabular-nums text-primary"
          animate={!spinning ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {displayValue}
        </motion.span>
      </motion.div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
