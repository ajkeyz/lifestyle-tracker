/**
 * Streak Celebration Modal
 *
 * Displays animated celebration when users hit streak milestones
 * Milestones: 7, 14, 30, 50, 100, 365 days
 * Features: confetti, gradient animations, badge visuals
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Trophy, Star, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientBorder } from "@/components/gradient-border";
import confetti from "canvas-confetti";

interface StreakCelebrationModalProps {
  streak: number;
  onClose: () => void;
  isOpen: boolean;
}

const MILESTONES = [
  { days: 7, title: "Week Warrior", icon: Flame, color: "from-orange-500 to-red-500", message: "One week strong! You're building a great habit." },
  { days: 14, title: "Fortnight Champion", icon: Zap, color: "from-yellow-500 to-orange-500", message: "Two weeks of consistency! You're unstoppable." },
  { days: 30, title: "Month Master", icon: Trophy, color: "from-green-500 to-emerald-500", message: "30 days! You've built a powerful routine." },
  { days: 50, title: "Halfway Hero", icon: Star, color: "from-blue-500 to-cyan-500", message: "50 days of dedication! Incredible progress." },
  { days: 100, title: "Century Crusher", icon: Sparkles, color: "from-purple-500 to-pink-500", message: "100 days! You're a habit-building legend!" },
  { days: 365, title: "Year Achiever", icon: Trophy, color: "from-yellow-500 via-orange-500 to-red-500", message: "One full year! You've achieved mastery!" },
];

export function StreakCelebrationModal({ streak, onClose, isOpen }: StreakCelebrationModalProps) {
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  // Find the milestone that matches current streak
  const milestone = MILESTONES.find(m => m.days === streak);

  useEffect(() => {
    if (isOpen && milestone && !hasShownConfetti) {
      // Celebrate with confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#f97316', '#eab308', '#7c3aed', '#3b82f6', '#8b5cf6'],
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#f97316', '#eab308', '#7c3aed', '#3b82f6', '#8b5cf6'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
      setHasShownConfetti(true);
    }
  }, [isOpen, milestone, hasShownConfetti]);

  if (!milestone) {
    return null;
  }

  const Icon = milestone.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto max-w-md w-full">
              <GradientBorder animated colors="premium" rounded="xl">
                <div className="bg-card p-8 space-y-6">
                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-4 right-4"
                    aria-label="Close celebration"
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  {/* Icon with animation */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center shadow-2xl animate-pulse-glow`}>
                      <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                  </motion.div>

                  {/* Streak count */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-2"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Flame className="w-6 h-6 text-orange-500 animate-bounce-subtle" />
                      <h2 className="text-5xl font-bold gradient-text-animated">
                        {streak}
                      </h2>
                      <Flame className="w-6 h-6 text-orange-500 animate-bounce-subtle" />
                    </div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-center space-y-2"
                  >
                    <h3 className={`text-2xl font-bold bg-gradient-to-r ${milestone.color} bg-clip-text text-transparent`}>
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {milestone.message}
                    </p>
                  </motion.div>

                  {/* Progress to next milestone */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-2"
                  >
                    {(() => {
                      const nextMilestone = MILESTONES.find(m => m.days > streak);
                      if (nextMilestone) {
                        const daysToGo = nextMilestone.days - streak;
                        return (
                          <div className="text-center p-4 rounded-lg bg-muted/50 border border-border">
                            <p className="text-xs text-muted-foreground">
                              Next milestone in <span className="font-bold text-foreground">{daysToGo} days</span>
                            </p>
                            <p className="text-xs font-semibold mt-1">{nextMilestone.title}</p>
                          </div>
                        );
                      }
                      return (
                        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                          <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                            🎉 You've reached the highest milestone!
                          </p>
                        </div>
                      );
                    })()}
                  </motion.div>

                  {/* Action button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      size="lg"
                    >
                      Continue Crushing It! 🚀
                    </Button>
                  </motion.div>
                </div>
              </GradientBorder>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hook to detect and trigger streak milestone celebrations
 */
export function useStreakCelebration(currentStreak: number) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastCelebratedStreak, setLastCelebratedStreak] = useState<number | null>(null);

  useEffect(() => {
    // Check if current streak matches a milestone
    const isMilestone = MILESTONES.some(m => m.days === currentStreak);

    // Only celebrate if this is a new milestone (not already celebrated)
    if (isMilestone && currentStreak !== lastCelebratedStreak) {
      setShowCelebration(true);
      setLastCelebratedStreak(currentStreak);
    }
  }, [currentStreak, lastCelebratedStreak]);

  const handleClose = () => {
    setShowCelebration(false);
  };

  return {
    showCelebration,
    setShowCelebration,
    handleClose,
  };
}
