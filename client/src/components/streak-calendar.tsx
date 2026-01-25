import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { StreakDay, User } from "@shared/schema";

const MILESTONES = [7, 14, 30, 60, 100];

function getMilestoneLabel(streak: number): string | null {
  if (streak >= 100) return "Legend";
  if (streak >= 60) return "Champion";
  if (streak >= 30) return "Master";
  if (streak >= 14) return "Dedicated";
  if (streak >= 7) return "Hot Streak";
  return null;
}

function getNextMilestone(streak: number): number {
  return MILESTONES.find(m => m > streak) || streak + 10;
}

interface StreakCalendarProps {
  user: User;
}

export function StreakCalendar({ user }: StreakCalendarProps) {
  const { toast } = useToast();
  const [showAnimation, setShowAnimation] = useState(false);

  const { data: calendar = [] } = useQuery<StreakDay[]>({
    queryKey: ["/api/streak-calendar"],
  });

  const freezeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/use-freeze");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak-calendar"] });
      toast({
        title: "Streak Protected!",
        description: "Your freeze token has been applied.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Could not use freeze",
        description: error.message || "Try again later",
        variant: "destructive",
      });
    },
  });

  const milestoneLabel = getMilestoneLabel(user.streak);
  const nextMilestone = getNextMilestone(user.streak);
  const progress = ((user.streak % (nextMilestone - (MILESTONES.find(m => m <= user.streak && MILESTONES[MILESTONES.indexOf(m) + 1] === nextMilestone) || 0))) / nextMilestone) * 100;
  const isMilestone = MILESTONES.includes(user.streak) && user.streak > 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const missedYesterday = user.lastPlayedDate !== yesterdayStr && user.lastPlayedDate !== today && !user.frozenDates.includes(yesterdayStr);
  const canUseFreeze = missedYesterday && user.freezeTokens > 0 && !user.todayResult;

  return (
    <Card className="p-4" data-testid="streak-calendar-card">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div className="flex items-center gap-2">
          <div className={`relative ${isMilestone ? 'animate-pulse' : ''}`}>
            <Flame className={`h-8 w-8 ${user.streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            {isMilestone && (
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-bounce" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" data-testid="text-streak-count">{user.streak}</span>
              <span className="text-muted-foreground">day streak</span>
              {milestoneLabel && (
                <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <Crown className="h-3 w-3 mr-1" />
                  {milestoneLabel}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Best: {user.highestStreak} days
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Snowflake className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium" data-testid="text-freeze-count">{user.freezeTokens}</span>
          </div>
          {canUseFreeze && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => freezeMutation.mutate()}
              disabled={freezeMutation.isPending}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              data-testid="button-use-freeze"
            >
              <Snowflake className="h-4 w-4 mr-1" />
              Use Freeze
            </Button>
          )}
        </div>
      </div>

      {nextMilestone && user.streak > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Progress to {nextMilestone} day milestone</span>
            <span>{nextMilestone - user.streak} days to go</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (user.streak / nextMilestone) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1" data-testid="streak-calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground py-1">
            {day}
          </div>
        ))}
        
        {calendar.slice(-28).map((day, i) => {
          const date = new Date(day.date);
          const isToday = day.date === today;
          const dayOfMonth = date.getDate();
          
          let bgColor = "bg-muted/30";
          let icon = null;

          if (day.played) {
            bgColor = "bg-green-500/20 border-green-500/50";
            icon = <Check className="h-3 w-3 text-green-500" />;
          } else if (day.frozen) {
            bgColor = "bg-blue-500/20 border-blue-500/50";
            icon = <Snowflake className="h-3 w-3 text-blue-400" />;
          } else if (day.date < today && day.date > (user.lastPlayedDate || "")) {
            bgColor = "bg-red-500/10 border-red-500/30";
            icon = <X className="h-3 w-3 text-red-400/50" />;
          }

          return (
            <div
              key={day.date}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-md border text-xs ${bgColor} ${isToday ? 'ring-2 ring-primary' : ''}`}
              title={day.date}
              data-testid={`calendar-day-${day.date}`}
            >
              <span className="text-[10px] text-muted-foreground">{dayOfMonth}</span>
              {icon}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
          <span>Played</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50" />
          <span>Frozen</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted/30 border" />
          <span>Missed</span>
        </div>
      </div>

      {missedYesterday && user.streak > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-start gap-2">
            <Zap className="h-5 w-5 text-orange-400 mt-0.5" />
            <div>
              <p className="font-medium text-orange-400">Streak at risk!</p>
              <p className="text-sm text-muted-foreground">
                You missed yesterday. {user.freezeTokens > 0 
                  ? "Use a freeze to protect your streak!" 
                  : "Play today to start fresh."}
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export function StreakMilestoneAnimation({ streak }: { streak: number }) {
  const isMilestone = MILESTONES.includes(streak);
  
  if (!isMilestone) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="relative">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ping"
            style={{
              transform: `rotate(${i * 30}deg) translateY(-60px)`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: "1.5s",
            }}
          >
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
        ))}
        <div className="relative z-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full p-8 animate-bounce">
          <Flame className="h-12 w-12 text-white" />
        </div>
        <div className="absolute inset-0 bg-orange-500/30 rounded-full animate-pulse blur-xl" />
      </div>
    </div>
  );
}
