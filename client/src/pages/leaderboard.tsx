import { Button } from "@/components/ui/button";
import { LeaderboardTabs } from "@/components/leaderboard-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User, LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Leaderboard() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
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
          <AppLogo size="sm" />
          <span className="font-bold" data-testid="text-leaderboards-header">Leaderboards</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold tracking-tight" data-testid="text-leaderboards-title">Leaderboards</h1>
          <p className="text-muted-foreground" data-testid="text-leaderboards-subtitle">
            Compete with friends and climb the ranks
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <LeaderboardTabs entries={leaderboard} currentUserId={user?.id} />
        ) : (
          <div className="text-center py-12" data-testid="empty-leaderboard">
            <p className="text-muted-foreground">No leaderboard data yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Play more games to see rankings!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
