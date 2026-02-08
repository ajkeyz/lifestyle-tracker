import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Crown, Award, CheckCircle2, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface Creator {
  id: string;
  username: string;
  avatar: string;
  totalUpvotes: number;
  scenarioCount: number;
  rank: number;
}

interface CreatorLeaderboardProps {
  limit?: number;
  showTitle?: boolean;
}

function getCreatorBadge(upvotes: number, scenarioCount: number) {
  if (upvotes >= 100) {
    return { label: "Verified", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" };
  }
  if (upvotes >= 50 || scenarioCount >= 20) {
    return { label: "Gold", icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/10" };
  }
  if (upvotes >= 20 || scenarioCount >= 10) {
    return { label: "Silver", icon: Award, color: "text-gray-400", bg: "bg-gray-400/10" };
  }
  if (upvotes >= 5 || scenarioCount >= 5) {
    return { label: "Bronze", icon: Trophy, color: "text-orange-600", bg: "bg-orange-600/10" };
  }
  return null;
}

function getRankMedal(rank: number) {
  if (rank === 1) return { icon: Trophy, color: "text-yellow-500", label: "🥇" };
  if (rank === 2) return { icon: Trophy, color: "text-gray-400", label: "🥈" };
  if (rank === 3) return { icon: Trophy, color: "text-orange-600", label: "🥉" };
  return null;
}

export function CreatorLeaderboard({ limit = 5, showTitle = true }: CreatorLeaderboardProps) {
  const { data: creators, isLoading } = useQuery<Creator[]>({
    queryKey: ["/api/community/top-creators", { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/community/top-creators?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch creators");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Creators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!creators || creators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Top Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No creators yet. Be the first to submit a scenario!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Creators
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Most upvoted scenario authors this month
          </p>
        </CardHeader>
      )}
      <CardContent className="space-y-2">
        {creators.map((creator, index) => {
          const badge = getCreatorBadge(creator.totalUpvotes, creator.scenarioCount);
          const medal = getRankMedal(creator.rank);
          const BadgeIcon = badge?.icon;

          return (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              {/* Rank */}
              <div className="w-6 text-center font-bold text-lg">
                {medal ? medal.label : creator.rank}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10">
                <AvatarFallback className={badge ? badge.bg : ""}>
                  {creator.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{creator.username}</p>
                  {badge && BadgeIcon && (
                    <BadgeIcon className={`w-4 h-4 ${badge.color}`} />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{creator.scenarioCount} scenarios</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {creator.totalUpvotes} upvotes
                  </span>
                </div>
              </div>

              {/* Badge Label */}
              {badge && (
                <Badge variant="secondary" className={`${badge.bg} ${badge.color} border-0`}>
                  {badge.label}
                </Badge>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
