import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Zap, Target, Skull, Trophy, Medal, Award, Flame } from "lucide-react";
import { RankBadge, TierProgressBar } from "@/components/rank-badge";
import type { LeaderboardEntry } from "@shared/schema";

const leaderboardCategories = [
  { id: "wealth", label: "Wealth Builder", icon: Crown, color: "text-accent", bg: "from-accent/10 to-accent/5" },
  { id: "stability", label: "Stability King", icon: Shield, color: "text-primary", bg: "from-primary/10 to-primary/5" },
  { id: "clutch", label: "Clutch Genius", icon: Zap, color: "text-chart-4", bg: "from-yellow-500/10 to-yellow-500/5" },
  { id: "accuracy", label: "Accuracy Beast", icon: Target, color: "text-chart-5", bg: "from-pink-500/10 to-pink-500/5" },
  { id: "debt", label: "Debt Demon", icon: Skull, color: "text-destructive", bg: "from-destructive/10 to-destructive/5" },
];

function getRankIcon(index: number) {
  if (index === 0) return <Crown className="w-3.5 h-3.5 text-accent" />;
  if (index === 1) return <Medal className="w-3.5 h-3.5 text-slate-400" />;
  if (index === 2) return <Award className="w-3.5 h-3.5 text-orange-500" />;
  return null;
}

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  category?: string;
}

export function LeaderboardCard({ entries, currentUserId, category = "wealth" }: LeaderboardCardProps) {
  const categoryInfo = leaderboardCategories.find((c) => c.id === category) || leaderboardCategories[0];
  const Icon = categoryInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden" data-testid={`card-leaderboard-${category}`}>
        {/* Category Header with gradient */}
        <div className={`p-4 pb-3 bg-gradient-to-r ${categoryInfo.bg}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${categoryInfo.color}`} />
            </div>
            <h3 className="font-semibold" data-testid={`text-leaderboard-title-${category}`}>
              {categoryInfo.label}
            </h3>
          </div>
        </div>

        {/* Entries */}
        <div className="p-3 space-y-1">
          {entries.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId;
            const rankIcon = getRankIcon(index);

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isCurrentUser
                    ? "bg-primary/10 border border-primary/20 shadow-sm shadow-primary/10"
                    : "hover:bg-muted/50"
                }`}
                data-testid={`leaderboard-entry-${entry.id}`}
              >
                {/* Rank number with medal for top 3 */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    index === 0
                      ? "bg-accent/20 text-accent"
                      : index === 1
                      ? "bg-slate-200/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                      : index === 2
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`rank-${entry.id}`}
                >
                  {rankIcon || (index + 1)}
                </div>

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-medium truncate ${isCurrentUser ? "text-primary" : ""}`} data-testid={`username-${entry.id}`}>
                      {isCurrentUser ? "You" : entry.username}
                    </span>
                    <RankBadge moneyHealth={entry.moneyHealth} size="sm" />
                  </div>
                  <div className="text-xs text-muted-foreground" data-testid={`health-${entry.id}`}>
                    Money Health: {entry.moneyHealth}
                  </div>
                  {isCurrentUser && (
                    <TierProgressBar moneyHealth={entry.moneyHealth} className="mt-1" />
                  )}
                </div>

                {/* Streak badge */}
                {entry.streak > 0 && (
                  <Badge variant="secondary" className="text-xs gap-1 shrink-0" data-testid={`streak-badge-${entry.id}`}>
                    <Flame className="w-3 h-3 text-orange-500" />
                    {entry.streak}d
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}

export function LeaderboardTabs({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {leaderboardCategories.slice(0, 4).map((category, i) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.08 }}
        >
          <LeaderboardCard
            entries={entries}
            currentUserId={currentUserId}
            category={category.id}
          />
        </motion.div>
      ))}
    </div>
  );
}

export function FriendLeague({
  entries,
  currentUserId,
}: {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}) {
  return (
    <Card className="p-5" data-testid="card-friend-league">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-semibold" data-testid="text-friend-league-title">Friend League</h3>
      </div>
      <div className="space-y-1">
        {entries.slice(0, 5).map((entry, index) => {
          const isCurrentUser = entry.id === currentUserId;
          const rankIcon = getRankIcon(index);
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg ${
                isCurrentUser
                  ? "bg-primary/10 border border-primary/20 shadow-sm shadow-primary/10"
                  : ""
              }`}
              data-testid={`friend-league-entry-${entry.id}`}
            >
              <div className="w-6 flex items-center justify-center" data-testid={`friend-rank-${entry.id}`}>
                {rankIcon || <span className="font-bold text-muted-foreground">{index + 1}.</span>}
              </div>
              <span className={`flex-1 flex items-center gap-1.5 ${isCurrentUser ? "font-semibold" : ""}`} data-testid={`friend-username-${entry.id}`}>
                {isCurrentUser ? "You" : entry.username}
                <RankBadge moneyHealth={entry.moneyHealth} size="sm" />
              </span>
              <Badge variant={isCurrentUser ? "default" : "secondary"} data-testid={`friend-health-${entry.id}`}>
                {entry.moneyHealth}
              </Badge>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
