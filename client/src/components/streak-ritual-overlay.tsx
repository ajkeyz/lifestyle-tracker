import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useEffect } from "react";

interface StreakRitualOverlayProps {
  streak: number;
  onComplete: () => void;
}

export function StreakRitualOverlay({ streak, onComplete }: StreakRitualOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      data-testid="streak-ritual-overlay"
    >
      {/* Radial glow background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1.2] }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>

      {/* Flame icon */}
      <motion.div
        className="relative"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
      >
        <Flame className="w-20 h-20 text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.8, repeat: 2, ease: "easeInOut" }}
        >
          <Flame className="w-20 h-20 text-orange-400/50" />
        </motion.div>
      </motion.div>

      {/* Streak count */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.p
          className="text-5xl font-bold text-orange-500"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
        >
          {streak}
        </motion.p>
        <motion.p
          className="text-lg font-medium text-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Day Streak
        </motion.p>
        <motion.p
          className="text-sm text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {streak >= 7
            ? "Unstoppable!"
            : streak >= 3
              ? "Keep it going!"
              : "Building momentum!"}
        </motion.p>
      </motion.div>

      {/* Particle sparks */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-orange-400"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((i * Math.PI * 2) / 8) * 120,
              y: Math.sin((i * Math.PI * 2) / 8) * 120,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 1.0, delay: 0.3 + i * 0.05, ease: "easeOut" }}
          />
        ))}
      </div>
    </motion.div>
  );
}
