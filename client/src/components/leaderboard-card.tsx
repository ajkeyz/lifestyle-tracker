import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, Zap, Target, Skull, Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@shared/schema";

const leaderboardCategories = [
  { id: "wealth", label: "Wealth Builder", icon: Crown, color: "text-accent" },
  { id: "stability", label: "Stability King", icon: Shield, color: "text-primary" },
  { id: "clutch", label: "Clutch Genius", icon: Zap, color: "text-chart-4" },
  { id: "accuracy", label: "Accuracy Beast", icon: Target, color: "text-chart-5" },
  { id: "debt", label: "Debt Demon", icon: Skull, color: "text-destructive" },
];

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  category?: string;
}

export function LeaderboardCard({ entries, currentUserId, category = "wealth" }: LeaderboardCardProps) {
  const categoryInfo = leaderboardCategories.find((c) => c.id === category) || leaderboardCategories[0];
  const Icon = categoryInfo.icon;

  return (
    <Card className="p-4" data-testid={`card-leaderboard-${category}`}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Icon className={`w-5 h-5 ${categoryInfo.color}`} />
        <h3 className="font-semibold" data-testid={`text-leaderboard-title-${category}`}>{categoryInfo.label}</h3>
      </div>
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
              entry.id === currentUserId
                ? "bg-primary/10 border border-primary/20"
                : "hover-elevate"
            }`}
            data-testid={`leaderboard-entry-${entry.id}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                index === 0
                  ? "bg-accent text-accent-foreground"
                  : index === 1
                  ? "bg-muted text-muted-foreground"
                  : index === 2
                  ? "bg-orange-200 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  : "bg-secondary text-secondary-foreground"
              }`}
              data-testid={`rank-${entry.id}`}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate" data-testid={`username-${entry.id}`}>{entry.username}</div>
              <div className="text-xs text-muted-foreground" data-testid={`health-${entry.id}`}>
                Money Health: {entry.moneyHealth}
              </div>
            </div>
            {entry.streak > 0 && (
              <Badge variant="secondary" className="text-xs" data-testid={`streak-badge-${entry.id}`}>
                {entry.streak}d
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
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
      {leaderboardCategories.slice(0, 4).map((category) => (
        <LeaderboardCard
          key={category.id}
          entries={entries}
          currentUserId={currentUserId}
          category={category.id}
        />
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
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 p-2.5 rounded-md ${
                isCurrentUser
                  ? "bg-primary/10 border border-primary/20"
                  : ""
              }`}
              data-testid={`friend-league-entry-${entry.id}`}
            >
              <span className="w-6 text-center font-bold text-muted-foreground" data-testid={`friend-rank-${entry.id}`}>
                {index + 1}.
              </span>
              <span className={`flex-1 ${isCurrentUser ? "font-semibold" : ""}`} data-testid={`friend-username-${entry.id}`}>
                {isCurrentUser ? "You" : entry.username}
              </span>
              <Badge variant={isCurrentUser ? "default" : "secondary"} data-testid={`friend-health-${entry.id}`}>
                {entry.moneyHealth}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
