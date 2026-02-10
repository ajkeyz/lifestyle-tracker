/**
 * Social Comparison Widget
 *
 * Shows how user compares to friends and global averages
 * Features: percentile rankings, friend comparisons, motivational insights
 */

import { motion } from "framer-motion";
import {
  Users,
  Trophy,
  TrendingUp,
  Crown,
  Target,
  Zap,
  Award,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";

export interface ComparisonData {
  userScore: number;
  userRank: number;
  totalUsers: number;
  percentile: number;
  globalAverage: number;
  friendsAverage: number;
  topFriends: Array<{
    id: string;
    name: string;
    avatar?: string;
    score: number;
    rank: number;
  }>;
  insights: {
    betterThanPercent: number;
    closeToTopPercent: number;
    gapToFirst: number;
  };
}

interface SocialComparisonWidgetProps {
  data: ComparisonData;
  metric?: "score" | "streak" | "accuracy";
  title?: string;
}

export function SocialComparisonWidget({
  data,
  metric = "score",
  title = "Your Standing"
}: SocialComparisonWidgetProps) {
  const metricLabels = {
    score: "Points",
    streak: "Days",
    accuracy: "%"
  };

  const label = metricLabels[metric];
  const isAboveAverage = data.userScore > data.globalAverage;
  const isAboveFriends = data.userScore > data.friendsAverage;

  // Calculate percentile tier
  const getTier = (percentile: number) => {
    if (percentile >= 95) return { name: "Elite", color: "from-yellow-500 to-amber-500", icon: Crown };
    if (percentile >= 75) return { name: "Advanced", color: "from-purple-500 to-pink-500", icon: Trophy };
    if (percentile >= 50) return { name: "Intermediate", color: "from-blue-500 to-cyan-500", icon: Target };
    return { name: "Growing", color: "from-green-500 to-emerald-500", icon: TrendingUp };
  };

  const tier = getTier(data.percentile);
  const TierIcon = tier.icon;

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {title}
          </span>
          <Badge className={`bg-gradient-to-r ${tier.color}`}>
            <TierIcon className="w-3 h-3 mr-1" />
            {tier.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rank & Percentile */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <div className="text-3xl font-bold gradient-text-animated">
              #{data.userRank}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of {data.totalUsers.toLocaleString()}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <div className="text-3xl font-bold gradient-text-animated">
              {Math.round(data.percentile)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Percentile
            </div>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-4">
          {/* You vs Global */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">You</span>
              <span className="font-bold">{data.userScore} {label}</span>
            </div>
            <div className="relative">
              <Progress value={100} gradient shimmer className="h-2" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 right-0 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Global Average
              </span>
              <span className="font-semibold text-muted-foreground">{data.globalAverage} {label}</span>
            </div>
            <div className="relative">
              <Progress
                value={(data.globalAverage / data.userScore) * 100}
                className="h-2 opacity-60"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className="absolute -top-1 bg-muted-foreground/50 rounded-full border-2 border-background shadow w-4 h-4"
                style={{ left: `${(data.globalAverage / data.userScore) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Friends Average
              </span>
              <span className="font-semibold text-muted-foreground">{data.friendsAverage} {label}</span>
            </div>
            <div className="relative">
              <Progress
                value={(data.friendsAverage / data.userScore) * 100}
                className="h-2 opacity-60"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute -top-1 bg-blue-500/70 rounded-full border-2 border-background shadow w-4 h-4"
                style={{ left: `${(data.friendsAverage / data.userScore) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg border-2 ${isAboveAverage ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
            <div className="flex items-center gap-2">
              {isAboveAverage ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-orange-500" />
              )}
              <span className="text-xs font-medium">vs Global</span>
            </div>
            <div className={`text-lg font-bold mt-1 ${isAboveAverage ? 'text-green-500' : 'text-orange-500'}`}>
              {isAboveAverage ? '+' : ''}{data.userScore - data.globalAverage} {label}
            </div>
          </div>

          <div className={`p-3 rounded-lg border-2 ${isAboveFriends ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
            <div className="flex items-center gap-2">
              {isAboveFriends ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-orange-500" />
              )}
              <span className="text-xs font-medium">vs Friends</span>
            </div>
            <div className={`text-lg font-bold mt-1 ${isAboveFriends ? 'text-green-500' : 'text-orange-500'}`}>
              {isAboveFriends ? '+' : ''}{data.userScore - data.friendsAverage} {label}
            </div>
          </div>
        </div>

        {/* Top Friends Leaderboard */}
        {data.topFriends.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Top Friends
            </h4>
            <div className="space-y-2">
              {data.topFriends.slice(0, 3).map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Rank Badge */}
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                      'bg-gradient-to-br from-orange-700 to-amber-700 text-white'}
                  `}>
                    {friend.rank}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-8 h-8">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                        {friend.name[0]}
                      </div>
                    )}
                  </Avatar>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium">{friend.name}</span>

                  {/* Score */}
                  <span className="text-sm font-bold">{friend.score} {label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Insight */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">
                {data.percentile >= 90
                  ? "Outstanding Performance! 🌟"
                  : data.percentile >= 75
                  ? "Keep Up the Great Work! 💪"
                  : data.percentile >= 50
                  ? "You're Making Progress! 📈"
                  : "Every Day is a Chance to Improve! 🚀"}
              </p>
              <p className="text-muted-foreground">
                {data.percentile >= 90
                  ? `You're in the top ${100 - data.percentile}% of all users!`
                  : data.percentile >= 75
                  ? `Just ${data.insights.closeToTopPercent}% away from the top tier!`
                  : data.percentile >= 50
                  ? `You're performing better than ${Math.round(data.insights.betterThanPercent)}% of users.`
                  : `Gain ${data.insights.gapToFirst} more ${label.toLowerCase()} to reach #1 among friends!`}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for dashboards
 */
export function CompactComparisonWidget({ data }: { data: ComparisonData }) {
  const tier = data.percentile >= 95 ? "Elite" :
               data.percentile >= 75 ? "Advanced" :
               data.percentile >= 50 ? "Intermediate" : "Growing";

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
      <div>
        <div className="text-xs text-muted-foreground">Your Rank</div>
        <div className="text-2xl font-bold gradient-text-animated">#{data.userRank}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground">Percentile</div>
        <div className="text-2xl font-bold">{Math.round(data.percentile)}%</div>
      </div>
      <Badge variant="secondary" className="capitalize">{tier}</Badge>
    </div>
  );
}
