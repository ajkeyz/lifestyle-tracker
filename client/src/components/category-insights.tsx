import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Lightbulb, Target, AlertCircle } from "lucide-react";
import type { CategoryStats, GameHistoryEntry } from "@shared/schema";

// Tips database for each category
const CATEGORY_TIPS: Record<string, string> = {
  tech: "Set a 24-hour rule before purchasing tech gadgets to avoid impulse buys.",
  travel: "Book flights 6-8 weeks in advance for the best deals on domestic travel.",
  lifestyle: "Track your discretionary spending for a month to identify patterns.",
  scam: "Always verify sender URLs before clicking links. Hover to preview first.",
  investing: "Start with low-cost index funds before picking individual stocks.",
  debt: "Focus on high-interest debt first using the avalanche method.",
  career: "Negotiate salary at job offers - most employers expect it and have room.",
  relationships: "Set clear financial boundaries early in relationships to avoid conflicts.",
  housing: "Aim for housing costs below 30% of gross income for financial flexibility.",
  insurance: "Review insurance policies annually to ensure adequate coverage and competitive rates.",
  tax: "Maximize retirement contributions to reduce taxable income legally.",
  credit: "Keep credit utilization below 30% and always pay bills on time.",
  emergency: "Build 3-6 months of expenses in a high-yield savings account.",
  budgeting: "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
  health: "Invest in preventive care - it's always cheaper than treating problems later.",
  giving: "Give intentionally with a budget rather than impulsively.",
  saving: "Automate savings transfers right after payday to 'pay yourself first'.",
  family: "Discuss financial expectations with family members before major decisions.",
  windfall: "Wait 30 days before spending windfalls to make thoughtful decisions.",
};

interface CategoryInsightsProps {
  categoryStats: CategoryStats[];
  gameHistory: GameHistoryEntry[];
}

type TrendDirection = "improving" | "declining" | "stable";

function calculateTrend(category: string, gameHistory: GameHistoryEntry[]): TrendDirection {
  // Look at last 5 games for this category
  const recentGames = gameHistory.slice(-5);
  const categoryQuestions = recentGames.flatMap(game =>
    game.categoryBreakdown
      .filter(cat => cat.category === category)
      .map(cat => cat.correct / cat.total)
  );

  if (categoryQuestions.length < 3) return "stable";

  const firstHalf = categoryQuestions.slice(0, Math.floor(categoryQuestions.length / 2));
  const secondHalf = categoryQuestions.slice(Math.floor(categoryQuestions.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const diff = avgSecond - avgFirst;

  if (diff > 0.1) return "improving";
  if (diff < -0.1) return "declining";
  return "stable";
}

function TrendIndicator({ trend }: { trend: TrendDirection }) {
  if (trend === "improving") {
    return (
      <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
        <TrendingUp className="w-3 h-3" />
        Improving
      </Badge>
    );
  }

  if (trend === "declining") {
    return (
      <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-700 dark:text-red-400">
        <TrendingDown className="w-3 h-3" />
        Declining
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1">
      <Minus className="w-3 h-3" />
      Stable
    </Badge>
  );
}

const categoryLabels: Record<string, string> = {
  tech: "Tech & Gadgets",
  travel: "Travel & Experiences",
  lifestyle: "Lifestyle Choices",
  scam: "Scam Detection",
  investing: "Investing",
  debt: "Debt Management",
  relationships: "Relationships",
  housing: "Housing",
  insurance: "Insurance",
  tax: "Tax & Filing",
  credit: "Credit",
  emergency: "Emergency Fund",
  budgeting: "Budgeting",
  health: "Health",
  giving: "Giving",
  saving: "Saving",
  family: "Family",
  windfall: "Windfall",
  career: "Career",
};

export function CategoryInsights({ categoryStats, gameHistory }: CategoryInsightsProps) {
  if (categoryStats.length === 0 || gameHistory.length < 10) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            Category Insights
          </CardTitle>
          <CardDescription>Detailed analysis of your strengths and areas to improve</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Play at least 10 games to unlock category insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by accuracy
  const sortedStats = [...categoryStats].sort((a, b) => b.accuracy - a.accuracy);

  // Top 3 strengths
  const strengths = sortedStats.slice(0, 3);

  // Bottom 3 opportunities
  const opportunities = sortedStats.slice(-3).reverse();

  return (
    <div className="space-y-4">
      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            Your Strengths
          </CardTitle>
          <CardDescription>Categories where you excel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {strengths.map((cat, index) => {
            const trend = calculateTrend(cat.category, gameHistory);
            return (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">
                      {categoryLabels[cat.category] || cat.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendIndicator trend={trend} />
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {cat.accuracy}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  {cat.correctAnswers} / {cat.totalQuestions} correct • Keep up the great work!
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Improvement Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Improvement Opportunities
          </CardTitle>
          <CardDescription>Areas where you can level up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {opportunities.map((cat) => {
            const trend = calculateTrend(cat.category, gameHistory);
            const tip = CATEGORY_TIPS[cat.category] || "Practice makes perfect! Keep playing to improve.";

            return (
              <div key={cat.category} className="space-y-2 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {categoryLabels[cat.category] || cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <TrendIndicator trend={trend} />
                    <span className="text-sm font-bold">
                      {cat.accuracy}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {cat.correctAnswers} / {cat.totalQuestions} correct
                </p>
                <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border/50">
                  <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">
                    {tip}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
