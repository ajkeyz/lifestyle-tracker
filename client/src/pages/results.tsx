import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareCard } from "@/components/share-card";
import { FriendLeague } from "@/components/leaderboard-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Home, Trophy, TrendingUp, Calendar, Share2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User, DailyDrop, LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Results() {
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

  useEffect(() => {
    if (!userLoading && user && !user.todayResult) {
      navigate("/");
    }
  }, [user, userLoading, navigate]);

  if (!user?.todayResult) {
    return null;
  }

  const result = user.todayResult;
  const scenarios = dailyDrop?.scenarios || [];
  const correctAnswers = result.answers.map((answer, index) => {
    const scenario = scenarios[index];
    if (!scenario) return false;
    const choice = scenario.choices.find((c) => c.label === answer);
    return choice?.isCorrect || false;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold" data-testid="text-results-header">Results</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        {userLoading || dropLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-primary mb-2">
                <Trophy className="w-6 h-6" />
                <span className="text-sm font-medium" data-testid="text-drop-complete">Drop Complete</span>
              </div>
              <h1 className="text-2xl font-bold" data-testid="text-great-job">Great job!</h1>
              <p className="text-muted-foreground text-sm mt-1" data-testid="text-come-back">
                Come back tomorrow for a new challenge
              </p>
            </div>

            <ShareCard
              dropNumber={dailyDrop?.dropNumber || 0}
              result={result}
              answers={correctAnswers}
              streak={user.streak}
            />

            <Button
              onClick={() => navigate("/share")}
              className="w-full"
              data-testid="button-customize-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Customize Share Card
            </Button>

            {leaderboard && leaderboard.length > 0 && (
              <FriendLeague entries={leaderboard} currentUserId={user.id} />
            )}

            <Card className="p-4 bg-muted/50" data-testid="card-next-drop">
              <div className="flex items-center gap-3 flex-wrap">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium" data-testid="text-next-drop-label">Next Drop</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-next-drop-time">
                    Tomorrow at midnight UTC
                  </p>
                </div>
              </div>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/")}
              data-testid="button-go-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
