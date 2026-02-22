import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, TrendingUp } from "lucide-react";

interface FriendsActivity {
  friendsPlayedToday: number;
  totalFriends: number;
  recentActivity: unknown[];
}

export function SocialProofCounter() {
  const { data: stats } = useQuery<FriendsActivity>({
    queryKey: ["/api/friends/activity"],
    refetchInterval: 60000,
  });

  if (!stats || stats.friendsPlayedToday === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 text-sm text-muted-foreground"
      data-testid="social-proof-counter"
    >
      <div className="flex items-center gap-1">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {stats.friendsPlayedToday}
        </span>
        <span>{stats.friendsPlayedToday === 1 ? "friend" : "friends"} played today</span>
      </div>
      {stats.totalFriends > 3 && (
        <>
          <span className="text-muted-foreground/50">|</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
            <span>{stats.totalFriends} friends</span>
          </div>
        </>
      )}
    </motion.div>
  );
}
