import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank?: number;
  username: string;
  avatar?: string;
  score: number;
  isCurrentUser?: boolean;
}

interface AnimatedLeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
  showRankChange?: boolean;
}

export function AnimatedLeaderboard({ entries, className, showRankChange = true }: AnimatedLeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-chart-5" />;
      case 2:
        return <Medal className="w-5 h-5 text-muted-foreground" />;
      case 3:
        return <Award className="w-5 h-5 text-chart-4" />;
      default:
        return null;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = previous - current;
    
    if (diff > 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-primary"
        >
          <TrendingUp className="w-3 h-3" />
          <span className="text-xs ml-0.5">+{diff}</span>
        </motion.div>
      );
    } else if (diff < 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center text-destructive"
        >
          <TrendingDown className="w-3 h-3" />
          <span className="text-xs ml-0.5">{diff}</span>
        </motion.div>
      );
    }
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <AnimatePresence mode="popLayout">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ 
              layout: { type: "spring", stiffness: 300, damping: 30 },
              delay: index * 0.05
            }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              "border transition-colors",
              entry.isCurrentUser 
                ? "bg-primary/5 border-primary/30" 
                : "bg-card border-border hover-elevate"
            )}
            data-testid={`leaderboard-entry-${entry.id}`}
          >
            <div className="w-8 flex items-center justify-center">
              {getRankIcon(entry.rank) || (
                <span className={cn(
                  "font-bold",
                  entry.rank <= 3 ? "text-lg" : "text-sm text-muted-foreground"
                )}>
                  {entry.rank}
                </span>
              )}
            </div>

            <Avatar className="h-8 w-8">
              {entry.avatar && <AvatarImage src={entry.avatar} />}
              <AvatarFallback className="text-xs">
                {entry.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium truncate",
                entry.isCurrentUser && "text-primary"
              )}>
                {entry.username}
                {entry.isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
              </p>
            </div>

            {showRankChange && (
              <div className="w-10 flex justify-center">
                {getRankChange(entry.rank, entry.previousRank)}
              </div>
            )}

            <motion.div
              className="font-bold text-primary"
              key={entry.score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              data-testid={`score-${entry.id}`}
            >
              {entry.score}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface LeaderboardPodiumProps {
  first: LeaderboardEntry;
  second: LeaderboardEntry;
  third: LeaderboardEntry;
  className?: string;
}

export function LeaderboardPodium({ first, second, third, className }: LeaderboardPodiumProps) {
  const podiumEntries = [
    { entry: second, position: 2, height: "h-20", delay: 0.2 },
    { entry: first, position: 1, height: "h-28", delay: 0 },
    { entry: third, position: 3, height: "h-16", delay: 0.4 },
  ];

  return (
    <div className={cn("flex items-end justify-center gap-2", className)}>
      {podiumEntries.map(({ entry, position, height, delay }) => (
        <motion.div
          key={position}
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, type: "spring", stiffness: 100 }}
          data-testid={`podium-position-${position}`}
        >
          <motion.div
            animate={position === 1 ? {
              y: [0, -5, 0]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Avatar className={cn(
              "border-2",
              position === 1 ? "h-16 w-16 border-yellow-500" : "h-12 w-12 border-border"
            )}>
              {entry.avatar && <AvatarImage src={entry.avatar} />}
              <AvatarFallback>
                {entry.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </motion.div>
          
          <p className="font-medium text-sm mt-2 truncate max-w-20">
            {entry.username}
          </p>
          
          <motion.div
            className={cn(
              "w-20 rounded-t-lg flex items-center justify-center",
              height,
              position === 1 ? "bg-chart-5/20" : 
              position === 2 ? "bg-muted" : "bg-chart-4/20"
            )}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
            style={{ originY: 1 }}
          >
            <span className="font-bold text-2xl">
              {position}
            </span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
