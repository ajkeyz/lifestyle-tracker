import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  TrendingUp, 
  Target, 
  Flame, 
  Trophy, 
  BarChart3,
  Calendar,
  Zap,
  Award
} from "lucide-react";
import type { User } from "@shared/schema";

const categoryColors: Record<string, string> = {
  tech: "from-blue-500 to-cyan-500",
  travel: "from-green-500 to-emerald-500",
  lifestyle: "from-purple-500 to-pink-500",
  scam: "from-red-500 to-orange-500",
  investing: "from-yellow-500 to-amber-500",
  debt: "from-gray-500 to-slate-500",
};

const categoryLabels: Record<string, string> = {
  tech: "Tech & Gadgets",
  travel: "Travel & Experiences",
  lifestyle: "Lifestyle Choices",
  scam: "Scam Detection",
  investing: "Investing",
  debt: "Debt Management",
};

export default function Stats() {
  const [, navigate] = useLocation();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const averageScore = user.gamesPlayed > 0 
    ? Math.round(user.totalScore / user.gamesPlayed) 
    : 0;

  const accuracyRate = user.gamesPlayed > 0 && user.gameHistory.length > 0
    ? Math.round(
        user.gameHistory.reduce((sum, g) => sum + (g.correctAnswers / g.totalQuestions) * 100, 0) / 
        user.gameHistory.length
      )
    : 0;

  const recentGames = user.gameHistory.slice(-7).reverse();
  const bestScore = user.gameHistory.length > 0 
    ? Math.max(...user.gameHistory.map(g => g.score)) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <h1 className="font-bold text-lg" data-testid="text-page-title">Your Statistics</h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card data-testid="card-games-played">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.gamesPlayed}</p>
                  <p className="text-xs text-muted-foreground">Games Played</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-current-streak">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{user.streak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-avg-score">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{averageScore}</p>
                  <p className="text-xs text-muted-foreground">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-best-score">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bestScore}</p>
                  <p className="text-xs text-muted-foreground">Best Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-accuracy">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Overall Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={accuracyRate} className="h-3" data-testid="progress-accuracy" />
              </div>
              <span className="text-2xl font-bold" data-testid="text-accuracy-rate">{accuracyRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {user.perfectGames > 0 && `${user.perfectGames} perfect game${user.perfectGames > 1 ? 's' : ''} achieved`}
            </p>
          </CardContent>
        </Card>

        {user.categoryStats.length > 0 && (
          <Card data-testid="card-category-breakdown">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-500" />
                Category Performance
              </CardTitle>
              <CardDescription>Your strengths and areas to improve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.categoryStats
                .sort((a, b) => b.accuracy - a.accuracy)
                .map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${categoryColors[cat.category] || 'from-gray-400 to-gray-500'}`} />
                        <span className="text-sm font-medium">
                          {categoryLabels[cat.category] || cat.category}
                        </span>
                      </div>
                      <span className="text-sm font-bold">{cat.accuracy}%</span>
                    </div>
                    <Progress value={cat.accuracy} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {cat.correctAnswers} / {cat.totalQuestions} correct
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {recentGames.length > 0 && (
          <Card data-testid="card-recent-games">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-500" />
                Recent Games
              </CardTitle>
              <CardDescription>Your last 7 games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGames.map((game, index) => (
                  <div 
                    key={`${game.date}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    data-testid={`row-game-${index}`}
                  >
                    <div>
                      <p className="font-medium text-sm" data-testid={`text-drop-number-${index}`}>Drop #{game.dropNumber}</p>
                      <p className="text-xs text-muted-foreground">{game.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold" data-testid={`text-game-score-${index}`}>{game.score} pts</p>
                      <p className="text-xs text-muted-foreground">
                        {game.correctAnswers}/{game.totalQuestions} correct
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {user.gamesPlayed === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No games yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Play your first daily drop to start tracking your progress!
              </p>
              <Button onClick={() => navigate("/play")} data-testid="button-play-first">
                Play Now
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
