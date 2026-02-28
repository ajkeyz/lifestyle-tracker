import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Snowflake, Check, X, Sparkles, Crown, Zap, ChevronDown, ChevronUp } from "lucide-react";
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

function getPreviousMilestone(streak: number): number {
  const prev = MILESTONES.filter(m => m <= streak);
  return prev.length > 0 ? prev[prev.length - 1] : 0;
}

interface StreakCalendarProps {
  user: User;
  showMilestoneAnimation?: boolean;
}

export function StreakCalendar({ user, showMilestoneAnimation = false }: StreakCalendarProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);

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
        description: error.message || "Try again later.",
        variant: "destructive",
      });
    },
  });

  const milestoneLabel = getMilestoneLabel(user.streak);
  const nextMilestone = getNextMilestone(user.streak);
  const previousMilestone = getPreviousMilestone(user.streak);
  const isMilestone = MILESTONES.includes(user.streak) && user.streak > 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const yesterdayEntry = calendar.find(d => d.date === yesterdayStr);
  const missedYesterday = yesterdayEntry && !yesterdayEntry.played && !yesterdayEntry.frozen;
  const canUseFreeze = missedYesterday && user.freezeTokens > 0 && !user.todayResult;

  return (
    <>
      {showMilestoneAnimation && isMilestone && (
        <StreakMilestoneAnimation streak={user.streak} />
      )}
      
      <Card className="p-4" data-testid="streak-calendar-card">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`relative ${isMilestone ? 'animate-pulse' : ''}`}>
              <Flame className={`h-8 w-8 ${user.streak > 0 ? 'text-orange-500 fire-animation' : 'text-muted-foreground'}`} />
              {isMilestone && (
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-bounce" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
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

          <div className="flex items-center gap-2 flex-wrap">
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
                className="border-blue-500/50 text-blue-400"
                data-testid="button-use-freeze"
              >
                <Snowflake className="h-4 w-4 mr-1" />
                Use Freeze
              </Button>
            )}
          </div>
        </div>

        {user.streak > 0 && (
          <div className="mb-4">
            <div className="flex justify-between gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
              <span>Progress to {nextMilestone} day milestone</span>
              <span>{nextMilestone - user.streak} days to go</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                style={{ width: `${Math.min(100, ((user.streak - previousMilestone) / (nextMilestone - previousMilestone)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* GitHub-style Heatmap */}
        <div className="space-y-2" data-testid="streak-calendar-grid">
          <div className="grid grid-cols-7 gap-1.5">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendar.slice(isExpanded ? -28 : -7).map((day, index) => {
              const date = new Date(day.date);
              const isToday = day.date === today;
              const isPast = day.date < today;
              const dayNum = date.getDate();
              const score = day.score || 0;

              // Determine intensity level (0-4) like GitHub
              let intensityLevel = 0;
              let bgColor = "bg-muted/20";
              let borderColor = "border-border/30";
              let tooltip = day.date;

              if (day.played) {
                // Intensity based on score
                if (score >= 450) intensityLevel = 4;
                else if (score >= 350) intensityLevel = 3;
                else if (score >= 250) intensityLevel = 2;
                else intensityLevel = 1;

                const colors = [
                  "",
                  "bg-emerald-300/30 border-emerald-400/40 dark:bg-emerald-900/30 dark:border-emerald-800/40",
                  "bg-emerald-400/50 border-emerald-500/60 dark:bg-emerald-700/40 dark:border-emerald-600/50",
                  "bg-emerald-500/70 border-emerald-600/80 dark:bg-emerald-600/55 dark:border-emerald-500/65",
                  "bg-emerald-600 border-emerald-700 dark:bg-emerald-500/80 dark:border-emerald-400/90"
                ];
                bgColor = colors[intensityLevel];
                tooltip = `${day.date}\nScore: ${score}/500`;
              } else if (day.frozen) {
                bgColor = "bg-sky-400/40 border-sky-500/60";
                borderColor = "border-sky-500/60";
                tooltip = `${day.date}\n❄️ Frozen`;
              } else if (isPast) {
                bgColor = "bg-red-500/10 border-red-500/20";
                borderColor = "border-red-500/20";
                tooltip = `${day.date}\n✗ Missed`;
              }

              // Check if this day is a milestone
              const consecutiveDaysFromThisDay = calendar
                .slice(0, index + 1)
                .reverse()
                .findIndex(d => !d.played && !d.frozen) + 1;
              const isMilestoneDay = MILESTONES.includes(consecutiveDaysFromThisDay) && day.played;

              return (
                <div
                  key={day.date}
                  className={`group relative aspect-square flex items-center justify-center rounded-md border-2 transition-all duration-200 ${bgColor} ${borderColor} ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''} ${isMilestoneDay ? 'border-yellow-500 shadow-lg shadow-yellow-500/30' : ''} hover:scale-110 hover:shadow-md cursor-pointer`}
                  title={tooltip}
                  data-testid={`calendar-day-${day.date}`}
                >
                  {/* Day number */}
                  <span className={`text-[9px] font-bold ${day.played ? 'text-white' : day.frozen ? 'text-sky-100' : 'text-muted-foreground'}`}>
                    {dayNum}
                  </span>

                  {/* Milestone crown */}
                  {isMilestoneDay && (
                    <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 drop-shadow-lg animate-pulse" />
                  )}

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border">
                    {day.played ? (
                      <div className="text-center">
                        <div className="font-semibold">{score}/500</div>
                        <div className="text-[10px] text-muted-foreground">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {score >= 450 ? "Exceptional choices" : score >= 350 ? "Strong decisions" : score >= 250 ? "Solid awareness" : "Learning moment"}
                        </div>
                      </div>
                    ) : day.frozen ? (
                      <div className="flex items-center gap-1">
                        <Snowflake className="h-3 w-3" />
                        <span>Streak protected</span>
                      </div>
                    ) : isPast ? (
                      <div className="flex items-center gap-1">
                        <X className="h-3 w-3" />
                        <span>Missed</span>
                      </div>
                    ) : (
                      <span>Not played yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
            <span>Less intentional</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/20 border border-border/30" title="No activity" />
              <div className="w-3 h-3 rounded-sm bg-emerald-300/30 border border-emerald-400/40 dark:bg-emerald-900/30 dark:border-emerald-800/40" title="Learning (<250)" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400/50 border border-emerald-500/60 dark:bg-emerald-700/40 dark:border-emerald-600/50" title="Solid (250-349)" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/70 border border-emerald-600/80 dark:bg-emerald-600/55 dark:border-emerald-500/65" title="Strong (350-449)" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600 border border-emerald-700 dark:bg-emerald-500/80 dark:border-emerald-400/90" title="Exceptional (450+)" />
            </div>
            <span>More intentional</span>
          </div>
        </div>

        {/* Expand/Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 mt-3 py-2 text-xs text-muted-foreground hover-elevate rounded-md transition-colors"
          data-testid="button-toggle-calendar"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show full month
            </>
          )}
        </button>

        {/* Legend - only show when expanded */}
        {isExpanded && (
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
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
        )}

        {missedYesterday && user.streak > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-start gap-2">
              <Zap className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
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
    </>
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
