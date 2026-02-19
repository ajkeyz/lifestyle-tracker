import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Crown,
  Target
} from "lucide-react";
import type { User } from "@shared/schema";
import { analyzePersonality } from "@/lib/personality-analyzer";
import { usePremium } from "@/hooks/use-premium";
import { PremiumGate } from "@/components/premium-gate";

function DimensionBar({ label, value, description }: { label: string; value: number; description: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="h-2" />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export default function Insights() {
  const [, navigate] = useLocation();
  const { canAccess } = usePremium();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  // Check if user has Pro access
  if (!canAccess("pro")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
        <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/stats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="font-bold text-lg">Money Personality</h1>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto p-4">
          <PremiumGate
            tier="pro"
            feature="What Your Choices Say About You"
            description="Discover your money personality type and get personalized insights based on your decision patterns"
            showPreview={false}
            ctaText="Unlock with Pro"
          >
            <div />
          </PremiumGate>
        </main>
      </div>
    );
  }

  // Check if user has enough data
  if (user.gameHistory.length < 20) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
        <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/stats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="font-bold text-lg">Money Personality</h1>
          </div>
        </header>

        <main className="container max-w-2xl mx-auto p-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Not Enough Data Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Play at least 20 games to unlock your personality insights
              </p>
              <p className="text-2xl font-bold text-primary mb-4">
                {user.gameHistory.length} / 20
              </p>
              <Button onClick={() => navigate("/play")}>
                Play Now
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Analyze personality (memoized to avoid re-running ~500 array operations on every render)
  const analysis = useMemo(
    () => analyzePersonality(user.gameHistory, user.categoryStats),
    [user.gameHistory, user.categoryStats]
  );
  const { archetype, dimensions, strengths, blindSpots, recommendations } = analysis;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/stats")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h1 className="font-bold text-lg">Money Personality</h1>
        </div>
        <Badge variant="secondary" className="ml-auto gap-1">
          <Crown className="w-3 h-3" />
          Pro
        </Badge>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* Archetype Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-accent/5">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="text-6xl mb-2">{archetype.emoji}</div>
              <h2 className="text-2xl font-bold">{archetype.name}</h2>
              <p className="text-muted-foreground">{archetype.description}</p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {archetype.traits.map((trait) => (
                  <Badge key={trait} variant="secondary">
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Your Money Personality Dimensions
            </CardTitle>
            <CardDescription>
              Based on your choices across {user.gameHistory.length} games
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DimensionBar
              label="Risk Tolerance"
              value={dimensions.riskTolerance}
              description={
                dimensions.riskTolerance > 60
                  ? "You're comfortable taking calculated risks for potential rewards"
                  : dimensions.riskTolerance < 40
                  ? "You prefer safety and security over high-risk opportunities"
                  : "You balance risk and safety based on the situation"
              }
            />

            <DimensionBar
              label="Spending Style"
              value={dimensions.spendingStyle}
              description={
                dimensions.spendingStyle > 60
                  ? "You enjoy spending on experiences and quality of life"
                  : dimensions.spendingStyle < 40
                  ? "You're disciplined with money and prioritize saving"
                  : "You balance enjoying today with saving for tomorrow"
              }
            />

            <DimensionBar
              label="Scam Awareness"
              value={dimensions.scamAwareness}
              description={
                dimensions.scamAwareness > 70
                  ? "You have excellent instincts for spotting financial scams"
                  : dimensions.scamAwareness < 50
                  ? "Consider being more cautious with too-good-to-be-true offers"
                  : "You have decent awareness but can improve"
              }
            />

            <DimensionBar
              label="Time Horizon"
              value={dimensions.timeHorizon}
              description={
                dimensions.timeHorizon > 60
                  ? "You think long-term and plan for the future"
                  : dimensions.timeHorizon < 40
                  ? "You focus more on immediate needs and wants"
                  : "You balance short-term and long-term thinking"
              }
            />
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Your Financial Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Blind Spots */}
        {blindSpots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Potential Blind Spots
              </CardTitle>
              <CardDescription>
                Areas where a little attention could go a long way
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {blindSpots.map((blindSpot, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠</span>
                    <span className="text-sm">{blindSpot}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>
              Actions tailored to your money personality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10">
          <CardContent className="p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-sm text-muted-foreground mb-4">
              Your personality insights update as you play more games!
            </p>
            <Button onClick={() => navigate("/play")} variant="outline">
              Play Today's Drop
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
