import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

interface AnswerStreakIndicatorProps {
  streak: number;
  mode?: "daily" | "arcade" | "coop";
}

export function AnswerStreakIndicator({ streak, mode = "daily" }: AnswerStreakIndicatorProps) {
  return (
    <AnimatePresence>
      {streak >= 2 && (
        <motion.div
          key={streak}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/25"
          data-testid="answer-streak-indicator"
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          >
            <Flame className="w-4 h-4 text-orange-500" />
          </motion.div>
          <span className="text-sm font-bold text-orange-500">
            {streak}x Streak!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
