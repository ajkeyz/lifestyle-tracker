import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfetti } from "@/components/confetti";
import { useSound } from "@/hooks/use-sound";

interface AchievementData {
  id: string;
  name: string;
  description: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

interface AchievementOverlayContextType {
  showAchievement: (data: AchievementData) => void;
}

const AchievementOverlayContext = createContext<AchievementOverlayContextType>({
  showAchievement: () => {},
});

export function useAchievementOverlay() {
  return useContext(AchievementOverlayContext);
}

const rarityColors = {
  common: { gradient: "from-gray-400 to-gray-600", glow: "shadow-gray-400/30", text: "text-gray-400" },
  rare: { gradient: "from-blue-400 to-blue-600", glow: "shadow-blue-500/40", text: "text-blue-400" },
  epic: { gradient: "from-purple-400 to-purple-600", glow: "shadow-purple-500/40", text: "text-purple-400" },
  legendary: { gradient: "from-yellow-400 to-amber-600", glow: "shadow-yellow-500/50", text: "text-yellow-400" },
};

export function AchievementOverlayProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<AchievementData[]>([]);
  const current = queue[0] ?? null;
  const { fireConfetti } = useConfetti();
  const { play } = useSound();

  const showAchievement = useCallback((data: AchievementData) => {
    setQueue((q) => [...q, data]);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  // Auto-dismiss after 4s
  const handleAnimationComplete = useCallback(() => {
    const timer = setTimeout(dismiss, 4000);
    // Fire confetti + fanfare when overlay appears
    try { fireConfetti(); } catch {}
    play("achievementReveal");
    return () => clearTimeout(timer);
  }, [dismiss, fireConfetti, play]);

  return (
    <AchievementOverlayContext.Provider value={{ showAchievement }}>
      {children}
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={dismiss}
            onAnimationComplete={handleAnimationComplete}
            data-testid="achievement-cinematic"
          >
            {/* Dark backdrop with blur */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

            {/* Radial glow */}
            <motion.div
              className={cn(
                "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-20",
                `bg-gradient-to-br ${rarityColors[current.rarity ?? "common"].gradient}`
              )}
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 1.2] }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Achievement card */}
            <motion.div
              className="relative text-center max-w-sm w-full"
              initial={{ scale: 0, rotate: -10, y: 50 }}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Badge icon */}
              <motion.div
                className="mb-6 flex justify-center"
                initial={{ scale: 0, y: -30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              >
                <div
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center",
                    "bg-gradient-to-br shadow-2xl",
                    rarityColors[current.rarity ?? "common"].gradient,
                    rarityColors[current.rarity ?? "common"].glow
                  )}
                >
                  <Award className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </motion.div>

              {/* Orbiting sparkles */}
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/3 left-1/2"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 6) * 100 - 4,
                    y: Math.sin((i * Math.PI * 2) / 6) * 80 - 4,
                  }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 1.2, ease: "easeOut" }}
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}

              {/* Label */}
              <motion.p
                className="text-xs uppercase tracking-[0.2em] text-white/60 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Achievement Unlocked
              </motion.p>

              {/* Title */}
              <motion.h2
                className={cn(
                  "text-2xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent",
                  rarityColors[current.rarity ?? "common"].gradient
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {current.name}
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-sm text-white/70 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {current.description}
              </motion.p>

              {/* Dismiss button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={dismiss}
                  className={cn(
                    "bg-gradient-to-r text-white border-0",
                    rarityColors[current.rarity ?? "common"].gradient
                  )}
                  size="lg"
                >
                  Awesome!
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AchievementOverlayContext.Provider>
  );
}
