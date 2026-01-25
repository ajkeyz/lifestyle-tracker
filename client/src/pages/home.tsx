import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FriendLeague } from "@/components/leaderboard-card";
import { StatBarGrid } from "@/components/stat-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Play, Flame, Trophy, TrendingUp, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User, DailyDrop, LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [, navigate] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: dailyDrop, isLoading: dropLoading } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
  });

  const { data: leaderboard } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const hasPlayedToday = user?.todayResult !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <div className="text-center py-8">
          {dropLoading ? (
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
          ) : (
            <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-daily-drop-title">
              Daily Drop #{dailyDrop?.dropNumber || "..."}
            </h1>
          )}
          <p className="text-muted-foreground" data-testid="text-tagline">
            Make real-life money decisions in 2-4 minutes
          </p>
        </div>

        {userLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : user ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center" data-testid="card-streak">
                <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                  <Flame className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-muted-foreground">Streak</span>
                </div>
                <div className="text-3xl font-bold" data-testid="text-user-streak">{user.streak}</div>
                <div className="text-xs text-muted-foreground mt-1">days</div>
              </Card>
              <Card className="p-4 text-center" data-testid="card-rank">
                <div className="flex items-center justify-center gap-1 mb-2 flex-wrap">
                  <Trophy className="w-5 h-5 text-accent" />
                  <span className="text-sm text-muted-foreground">Rank</span>
                </div>
                <div className="text-3xl font-bold" data-testid="text-user-rank">
                  #{leaderboard?.findIndex((e) => e.id === user.id) !== -1
                    ? (leaderboard?.findIndex((e) => e.id === user.id) ?? 0) + 1
                    : "?"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">in league</div>
              </Card>
            </div>

            <Card className="p-5" data-testid="card-money-health">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold" data-testid="text-money-health-value">Money Health: {user.moneyHealth}</h3>
              </div>
              <StatBarGrid {...user.stats} />
            </Card>

            {leaderboard && leaderboard.length > 0 && (
              <FriendLeague entries={leaderboard} currentUserId={user.id} />
            )}

            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              onClick={() => {
                if (hasPlayedToday) {
                  navigate("/results");
                } else if (!user.mode) {
                  navigate("/setup");
                } else {
                  navigate("/play");
                }
              }}
              data-testid="button-play-today"
            >
              {hasPlayedToday ? (
                <>
                  <Trophy className="w-5 h-5 mr-2" />
                  View Today's Results
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Play Today's Drop
                </>
              )}
            </Button>
          </>
        ) : (
          <Card className="p-6 text-center" data-testid="card-welcome">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2" data-testid="text-welcome-title">Welcome to Lifestyle Creep</h2>
            <p className="text-muted-foreground mb-6" data-testid="text-welcome-description">
              A daily money game that trains you to build wealth without falling
              into lifestyle inflation traps.
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/setup")}
              data-testid="button-start-playing"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Playing
            </Button>
          </Card>
        )}

        <div className="text-center text-sm text-muted-foreground py-4">
          <p data-testid="text-next-drop-info">New drop every day at midnight UTC</p>
        </div>
      </main>
    </div>
  );
}
