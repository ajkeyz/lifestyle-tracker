import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import type { UnlockInfo, GameModeId } from "@shared/lib/progression";

interface NextUnlockCardProps {
  mode: GameModeId;
  label: string;
  info: UnlockInfo;
  level?: number;
}

export function NextUnlockCard({ label, info, level }: NextUnlockCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="p-3 rounded-xl border-primary/15 bg-gradient-to-r from-card to-primary/[0.03] overflow-hidden relative"
        data-testid="next-unlock-card"
      >
        {/* Subtle shimmer overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, hsl(var(--primary) / 0.04) 50%, transparent 60%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
        />

        <div className="flex items-center gap-3 relative">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Next Unlock
              </span>
              {level !== undefined && (
                <span className="text-[10px] text-muted-foreground ml-1">
                  Level {level}
                </span>
              )}
            </div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-[11px] text-muted-foreground">{info.condition}</p>
          </div>
          {/* Progress ring */}
          <div className="flex-shrink-0 w-10 h-10 relative">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
              />
              <motion.circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${info.progress * 97.4} 97.4`}
                initial={{ strokeDasharray: "0 97.4" }}
                animate={{ strokeDasharray: `${info.progress * 97.4} 97.4` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
              {Math.round(info.progress * 100)}%
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
