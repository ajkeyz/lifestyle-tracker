import { useState } from "react";
import { Target, Shield, Clock, Medal, Crown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { LiquidMoneyMeter } from "@/components/liquid-money-meter";
import { StreakCalendar } from "@/components/streak-calendar";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedCounter } from "@/components/animated-counter";
import { useQuery } from "@tanstack/react-query";

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
  streakContext?: string | null;
  className?: string;
}

const HEALTH_INDICATORS = [
  {
    label: "Consistency",
    icon: Target,
    description: "Based on your daily streak. 7+ days = high, 3+ = medium. Play every day to keep it green!",
    getLevel: (user: User) => {
      if (user.streak >= 7) return "high" as const;
      if (user.streak >= 3) return "mid" as const;
      return "low" as const;
    },
    getStat: (user: User) => `${user.streak} day streak`,
  },
  {
    label: "Risk awareness",
    icon: Shield,
    description: "Tracks your Financial Fitness score over time. Score 65+ = high, 40+ = medium. Make smart choices in quizzes!",
    getLevel: (user: User) => {
      const health = user.moneyHealth;
      if (health >= 65) return "high" as const;
      if (health >= 40) return "mid" as const;
      return "low" as const;
    },
    getStat: (user: User) => `${user.moneyHealth} fitness`,
  },
  {
    label: "Delay discipline",
    icon: Clock,
    description: "Based on games played. 14+ games = high, 5+ = medium. The more you play, the sharper your instincts!",
    getLevel: (user: User) => {
      if (user.gamesPlayed >= 14) return "high" as const;
      if (user.gamesPlayed >= 5) return "mid" as const;
      return "low" as const;
    },
    getStat: (user: User) => `${user.gamesPlayed} games`,
  },
];

type ExpandedSection = "health" | "streak" | "rank" | null;

export function QuickStatsBar({ user, rank, streakContext, className }: QuickStatsBarProps) {
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
  const [activeIndicator, setActiveIndicator] = useState<string | null>(null);
  const [streakSeen, setStreakSeen] = useState(false);

  // Fetch friends for rank comparison (only when rank dropdown is open)
  const { data: friends } = useQuery<
    { id: string; username: string; avatar: string; moneyHealth: number; streak: number }[]
  >({
    queryKey: ["/api/friends"],
    enabled: expandedSection === "rank",
  });

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Rank comparison with friends
  const friendsAbove = friends ? friends.filter(f => f.moneyHealth > user.moneyHealth).length : 0;
  const friendsBelow = friends ? friends.filter(f => f.moneyHealth < user.moneyHealth).length : 0;
  const friendsEqual = friends ? friends.filter(f => f.moneyHealth === user.moneyHealth).length : 0;
  const totalFriends = friends?.length || 0;
  const percentile = totalFriends > 0
    ? Math.round(((friendsBelow + friendsEqual * 0.5) / totalFriends) * 100)
    : null;

  // Games quick stats for rank dropdown
  const categoryStats = user.categoryStats || [];
  const totalGamesFromHistory = (user.gameHistory || []).length;
  const avgAccuracy = totalGamesFromHistory > 0
    ? Math.round((user.gameHistory || []).reduce((sum, g) => sum + (g.correctAnswers / g.totalQuestions) * 100, 0) / totalGamesFromHistory)
    : 0;

  return (
    <div className={cn("rounded-lg bg-card border", className)}>
      {/* 3 stats: Money Health | Streak | Rank */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 p-3">
        {/* Money Health */}
        <div
          className="flex items-center gap-1.5 flex-1 justify-center cursor-pointer"
          onClick={() => toggleSection("health")}
          data-testid="button-health-expand"
        >
          <LiquidMoneyMeter value={user.moneyHealth} size="sm" animated={true} />
          <div className="w-px h-6 bg-border ml-2" />
        </div>

        {/* Streak */}
        <div
          className="flex items-center gap-2 flex-1 justify-center cursor-pointer"
          onClick={() => {
            toggleSection("streak");
            setStreakSeen(true);
          }}
        >
          <span className="relative">
            <AnimatedFlame
              className={cn("w-5 h-5", user.streak > 0 ? "text-orange-500" : "text-muted-foreground")}
              active={user.streak > 0}
            />
            {streakContext && !streakSeen && (
              <motion.span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </span>
          <div className="text-center">
            <div className="font-bold text-sm leading-none" data-testid="stat-streak">
              <AnimatedCounter value={user.streak} duration={1.0} delay={0.2} />
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">Streak</div>
          </div>
          <div className="w-px h-6 bg-border ml-2" />
        </div>

        {/* Rank */}
        <div
          className="flex items-center gap-2 flex-1 justify-center cursor-pointer"
          onClick={() => toggleSection("rank")}
        >
          <Crown className={cn(
            "w-5 h-5",
            rank && rank <= 3 ? "text-yellow-500" : rank && rank <= 10 ? "text-amber-400" : "text-muted-foreground"
          )} />
          <div className="text-center">
            <div className="font-bold text-sm leading-none" data-testid="stat-rank">
              {rank ? <AnimatedCounter value={rank} duration={1.0} delay={0.2} /> : "-"}
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">Rank</div>
          </div>
        </div>
      </div>

      {/* Streak dropdown with calendar */}
      <AnimatePresence>
        {expandedSection === "streak" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t space-y-2">
              {streakContext && (
                <div className="flex items-center gap-2 px-2.5 py-2 rounded-md bg-orange-500/5">
                  <AnimatedFlame className="w-4 h-4 text-orange-500 flex-shrink-0" active />
                  <span className="text-xs text-muted-foreground">{streakContext}</span>
                </div>
              )}
              <StreakCalendar user={user} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health breakdown dropdown */}
      <AnimatePresence>
        {expandedSection === "health" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t" data-testid="health-breakdown">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">What shapes your Financial Fitness</p>
              <div className="flex items-center justify-between gap-2">
                {HEALTH_INDICATORS.map((indicator) => {
                  const level = indicator.getLevel(user);
                  const Icon = indicator.icon;
                  const isActive = activeIndicator === indicator.label;
                  return (
                    <div
                      key={indicator.label}
                      className="flex flex-col items-center gap-1 flex-1 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); setActiveIndicator(isActive ? null : indicator.label); }}
                    >
                      <Icon className={cn(
                        "w-4 h-4 transition-transform",
                        level === "high" ? "text-green-500" : level === "mid" ? "text-yellow-500" : "text-muted-foreground",
                        isActive && "scale-125"
                      )} />
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all",
                              i === 0 ? (level !== "low" ? "bg-green-500" : "bg-muted") : "",
                              i === 1 ? (level === "high" || level === "mid" ? "bg-green-500" : "bg-muted") : "",
                              i === 2 ? (level === "high" ? "bg-green-500" : "bg-muted") : ""
                            )}
                          />
                        ))}
                      </div>
                      <span className={cn(
                        "text-[10px] transition-colors",
                        isActive ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>{indicator.label}</span>
                    </div>
                  );
                })}
              </div>

              <AnimatePresence>
                {activeIndicator && (() => {
                  const indicator = HEALTH_INDICATORS.find(h => h.label === activeIndicator);
                  if (!indicator) return null;
                  const level = indicator.getLevel(user);
                  return (
                    <motion.div
                      key={activeIndicator}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2.5 rounded-md bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <indicator.icon className={cn(
                            "w-3.5 h-3.5",
                            level === "high" ? "text-green-500" : level === "mid" ? "text-yellow-500" : "text-muted-foreground"
                          )} />
                          <span className="text-xs font-medium">{indicator.label}</span>
                          <span className={cn(
                            "text-[10px] ml-auto px-1.5 py-0.5 rounded-full",
                            level === "high" ? "bg-green-500/15 text-green-500" : level === "mid" ? "bg-yellow-500/15 text-yellow-500" : "bg-muted text-muted-foreground"
                          )}>
                            {indicator.getStat(user)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{indicator.description}</p>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rank & Activity dropdown */}
      <AnimatePresence>
        {expandedSection === "rank" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 border-t" data-testid="rank-breakdown">
              {/* Friends comparison */}
              {totalFriends > 0 ? (
                <div className="space-y-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Medal className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Among Friends</span>
                    {percentile !== null && (
                      <span className={cn(
                        "text-[10px] ml-auto px-1.5 py-0.5 rounded-full font-medium",
                        percentile >= 70 ? "bg-green-500/15 text-green-500" :
                        percentile >= 40 ? "bg-yellow-500/15 text-yellow-500" :
                        "bg-muted text-muted-foreground"
                      )}>
                        Top {100 - percentile}%
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{friendsAbove} above you</span>
                    <span className="font-medium text-foreground">You: {user.moneyHealth}</span>
                    <span>{friendsBelow} below you</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground text-center py-1.5 mb-2">Add friends to see how you compare!</p>
              )}

              {/* Activity summary */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Activity</span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-muted-foreground"><span className="font-semibold text-foreground">{user.gamesPlayed}</span> games</span>
                <span className="text-muted-foreground"><span className="font-semibold text-foreground">{avgAccuracy}%</span> accuracy</span>
                {user.perfectGames > 0 && (
                  <span className="text-muted-foreground"><span className="font-semibold text-yellow-500">{user.perfectGames}</span> perfect</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
