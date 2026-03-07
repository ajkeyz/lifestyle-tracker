import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export function LivePlayerIndicator() {
  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/active-players"],
    refetchInterval: 30000,
  });

  const count = data?.count ?? 0;
  if (count <= 0) return null;

  return (
    <motion.div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 border border-border/30 text-xs text-muted-foreground"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      data-testid="live-player-indicator"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <Users className="w-3 h-3" />
      <span>{count} playing now</span>
    </motion.div>
  );
}
