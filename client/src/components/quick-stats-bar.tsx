import { useState } from "react";
import { Flame, Heart, Trophy, TrendingUp, ChevronDown, ChevronUp, Target, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { LiquidMoneyMeter } from "@/components/liquid-money-meter";
import { motion, AnimatePresence } from "framer-motion";

interface QuickStatsBarProps {
  user: User;
  rank?: number | null;
  className?: string;
}

function getHealthLevel(value: number): "high" | "mid" | "low" {
  if (value >= 70) return "high";
  if (value >= 40) return "mid";
  return "low";
}

const HEALTH_INDICATORS = [
  {
    label: "Consistency",
    icon: Target,
    getLevel: (user: User) => {
      if (user.streak >= 7) return "high";
      if (user.streak >= 3) return "mid";
      return "low";
    },
  },
  {
    label: "Risk awareness",
    icon: Shield,
    getLevel: (user: User) => {
      const health = user.moneyHealth;
      if (health >= 65) return "high";
      if (health >= 40) return "mid";
      return "low";
    },
  },
  {
    label: "Delay discipline",
    icon: Clock,
    getLevel: (user: User) => {
      if (user.gamesPlayed >= 14) return "high";
      if (user.gamesPlayed >= 5) return "mid";
      return "low";
    },
  },
];

export function QuickStatsBar({ user, rank, className }: QuickStatsBarProps) {
  const [healthExpanded, setHealthExpanded] = useState(false);

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
    <div className={cn("rounded-lg bg-card border", className)}>
      <div className="flex items-center justify-between gap-3 p-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "flex items-center gap-1.5 flex-1 justify-center",
              stat.label === "Health" && "cursor-pointer"
            )}
            onClick={stat.label === "Health" ? () => setHealthExpanded(!healthExpanded) : undefined}
            data-testid={stat.label === "Health" ? "button-health-expand" : undefined}
          >
            {stat.label === "Health" ? (
              <LiquidMoneyMeter value={user.moneyHealth} size="sm" animated={true} />
            ) : (
              <>
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <div className="text-center">
                  <div className="font-bold text-sm leading-none" data-testid={`stat-${stat.label.toLowerCase()}`}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {stat.label}
                  </div>
                </div>
              </>
            )}
            {index < stats.length - 1 && (
              <div className="w-px h-6 bg-border ml-2" />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {healthExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t" data-testid="health-breakdown">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">What shapes your Health Score</p>
              <div className="flex items-center justify-between gap-2">
                {HEALTH_INDICATORS.map((indicator) => {
                  const level = indicator.getLevel(user);
                  const Icon = indicator.icon;
                  return (
                    <div key={indicator.label} className="flex flex-col items-center gap-1 flex-1">
                      <Icon className={cn(
                        "w-4 h-4",
                        level === "high" ? "text-green-500" : level === "mid" ? "text-yellow-500" : "text-muted-foreground"
                      )} />
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              i === 0 ? (level !== "low" ? "bg-green-500" : "bg-muted") : "",
                              i === 1 ? (level === "high" || level === "mid" ? "bg-green-500" : "bg-muted") : "",
                              i === 2 ? (level === "high" ? "bg-green-500" : "bg-muted") : ""
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{indicator.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
