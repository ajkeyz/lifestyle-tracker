import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";

interface DailyStats {
  playersToday: number;
  totalPlayers: number;
}

export function SocialProofCounter() {
  const { data: stats } = useQuery<DailyStats>({
    queryKey: ["/api/daily-stats"],
    refetchInterval: 60000, // Refresh every minute
  });

  if (!stats || stats.playersToday === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 text-sm text-muted-foreground"
      data-testid="social-proof-counter"
    >
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">
          {stats.playersToday.toLocaleString()}
        </span>
        <span>played today</span>
      </div>
      {stats.totalPlayers > 100 && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span>{stats.totalPlayers.toLocaleString()} total</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
