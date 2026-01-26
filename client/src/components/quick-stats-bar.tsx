import { Flame, Heart, Trophy, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface QuickStatsBarProps {
  user: User;
  rank?: number | null;
  className?: string;
}

export function QuickStatsBar({ user, rank, className }: QuickStatsBarProps) {
  const stats = [
    {
      icon: Flame,
      value: user.streak,
      label: "Streak",
      color: user.streak > 0 ? "text-orange-500" : "text-muted-foreground",
    },
    {
      icon: Heart,
      value: user.moneyHealth,
      label: "Health",
      color: user.moneyHealth >= 70 ? "text-green-500" : user.moneyHealth >= 40 ? "text-yellow-500" : "text-red-500",
    },
    {
      icon: Trophy,
      value: rank ?? "-",
      label: "Rank",
      color: rank && rank <= 3 ? "text-yellow-500" : "text-muted-foreground",
    },
    {
      icon: TrendingUp,
      value: user.gamesPlayed,
      label: "Games",
      color: "text-blue-500",
    },
  ];

  return (
    <div className={cn("flex items-center justify-between gap-2 p-3 rounded-lg bg-card border", className)}>
      {stats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-1.5 flex-1 justify-center">
          <stat.icon className={cn("w-4 h-4", stat.color)} />
          <div className="text-center">
            <div className="font-bold text-sm leading-none" data-testid={`stat-${stat.label.toLowerCase()}`}>
              {stat.value}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              {stat.label}
            </div>
          </div>
          {index < stats.length - 1 && (
            <div className="w-px h-6 bg-border ml-2" />
          )}
        </div>
      ))}
    </div>
  );
}
