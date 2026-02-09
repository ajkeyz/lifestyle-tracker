import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { GameHistoryEntry } from "@shared/schema";

interface TrendChartProps {
  gameHistory: GameHistoryEntry[];
  title?: string;
  description?: string;
}

export function ScoreTrendChart({ gameHistory, title = "Score Trends", description = "Your performance over time" }: TrendChartProps) {
  if (gameHistory.length < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Play at least 3 games to see your trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart (last 30 games max)
  const data = gameHistory
    .slice(-30)
    .map((game) => ({
      date: new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: game.score,
      accuracy: Math.round((game.correctAnswers / game.totalQuestions) * 100),
      moneyHealth: game.moneyHealth,
    }));

  const avgScore = Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  const maxScore = Math.max(...data.map(d => d.score));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          {title}
        </CardTitle>
        <CardDescription>
          {description} • Avg: {avgScore} pts • Best: {maxScore} pts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              domain={[0, 500]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function AccuracyTrendChart({ gameHistory }: { gameHistory: GameHistoryEntry[] }) {
  if (gameHistory.length < 3) {
    return null;
  }

  const data = gameHistory
    .slice(-30)
    .map((game) => ({
      date: new Date(game.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      accuracy: Math.round((game.correctAnswers / game.totalQuestions) * 100),
    }));

  const avgAccuracy = Math.round(data.reduce((sum, d) => sum + d.accuracy, 0) / data.length);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          Accuracy Trends
        </CardTitle>
        <CardDescription>
          Your answer accuracy over time • Avg: {avgAccuracy}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              domain={[0, 100]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
