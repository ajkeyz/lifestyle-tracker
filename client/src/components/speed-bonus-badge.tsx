import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface SpeedBonusBadgeProps {
  answerTimeSeconds: number;
  timerDuration: number;
  show: boolean;
}

export function SpeedBonusBadge({ answerTimeSeconds, timerDuration, show }: SpeedBonusBadgeProps) {
  const isFast = answerTimeSeconds <= 5;

  return (
    <AnimatePresence>
      {show && isFast && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20"
          data-testid="speed-bonus-badge"
        >
          <motion.div
            animate={{ rotate: [0, -15, 15, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
          </motion.div>
          <span className="text-xs font-bold text-amber-500">
            Fast!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
