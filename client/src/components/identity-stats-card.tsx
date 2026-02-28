import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { QuickStatsBar } from "@/components/quick-stats-bar";
import type { User } from "@shared/schema";

interface IdentityStatsCardProps {
  user: User;
  rank?: number | null;
  streakContext?: string | null;
  className?: string;
}

export function IdentityStatsCard({
  user,
  rank,
  streakContext,
  className,
}: IdentityStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className={cn("space-y-1.5", className)}
      data-testid="identity-stats-card"
    >
      {/* Section label */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Identity Stats
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          Your recent decision quality
        </p>
      </div>

      {/* Stats bar */}
      <QuickStatsBar
        user={user}
        rank={rank}
        streakContext={streakContext}
      />

      {/* Connection text */}
      <p
        className="text-[11px] text-muted-foreground text-center px-4 leading-relaxed"
        data-testid="identity-connection-text"
      >
        Better decisions improve your Fitness and earn IQ XP.
      </p>
    </motion.div>
  );
}
