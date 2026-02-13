import { useState } from "react";
import { Heart, Trophy, TrendingUp, ChevronDown, ChevronUp, Target, Shield, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { LiquidMoneyMeter } from "@/components/liquid-money-meter";
import { motion, AnimatePresence } from "framer-motion";

function AnimatedFlame({ className, active }: { className?: string; active?: boolean }) {
  if (!active) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    );
  }

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <motion.svg
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        animate={{
          scale: [1, 1.15, 1.05, 1.18, 1],
          rotate: [0, -3, 2, -2, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </motion.svg>
      <motion.span
        className="absolute inset-0 rounded-full bg-orange-500/20 blur-sm"
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </span>
  );
}

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
      icon: null as any,
      value: user.streak,
      label: "Streak",
      color: user.streak > 0 ? "text-orange-500" : "text-muted-foreground",
      isStreak: true,
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
                {"isStreak" in stat && stat.isStreak ? (
                  <AnimatedFlame className={cn("w-4 h-4", stat.color)} active={user.streak > 0} />
                ) : (
                  <stat.icon className={cn("w-4 h-4", stat.color)} />
                )}
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
