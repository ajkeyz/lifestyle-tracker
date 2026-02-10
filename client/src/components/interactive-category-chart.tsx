/**
 * Interactive Category Chart
 *
 * Visualizes performance across different categories
 * Features: hover highlights, drill-down details, gradient bars, tooltips
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Heart,
  DollarSign,
  Users,
  Briefcase,
  Home,
  Sparkles,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const CATEGORY_ICONS: Record<string, typeof Heart> = {
  "Relationships": Heart,
  "Finance": DollarSign,
  "Social": Users,
  "Career": Briefcase,
  "Health": Heart,
  "Family": Home,
  "Personal Growth": Sparkles,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Relationships": "from-pink-500 to-rose-500",
  "Finance": "from-green-500 to-emerald-500",
  "Social": "from-blue-500 to-cyan-500",
  "Career": "from-purple-500 to-indigo-500",
  "Health": "from-red-500 to-orange-500",
  "Family": "from-amber-500 to-yellow-500",
  "Personal Growth": "from-violet-500 to-purple-500",
};

export interface CategoryData {
  name: string;
  score: number;
  maxScore: number;
  gamesPlayed: number;
  averageScore: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
  recentScores: number[];
  tips: string[];
  strengths: string[];
  improvements: string[];
}

interface InteractiveCategoryChartProps {
  categories: CategoryData[];
  onCategoryClick?: (category: CategoryData) => void;
}

export function InteractiveCategoryChart({
  categories,
  onCategoryClick,
}: InteractiveCategoryChartProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Sort categories by score
  const sortedCategories = [...categories].sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Performance by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCategories.map((category, index) => {
            const Icon = CATEGORY_ICONS[category.name] || Sparkles;
            const percentage = (category.averageScore / category.maxScore) * 100;
            const isHovered = hoveredCategory === category.name;
            const TrendIcon = category.trend === "up" ? TrendingUp : category.trend === "down" ? TrendingDown : Minus;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => {
                  setSelectedCategory(category);
                  onCategoryClick?.(category);
                }}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                  ${isHovered
                    ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                    : 'border-border bg-card/50 hover:border-primary/50'
                  }
                `}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[category.name]} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{category.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {category.gamesPlayed} games played
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Trend Badge */}
                      <Badge
                        variant={category.trend === "up" ? "default" : category.trend === "down" ? "destructive" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        <TrendIcon className="w-3 h-3" />
                        {category.trendPercent > 0 ? "+" : ""}{category.trendPercent}%
                      </Badge>

                      {/* Drill-down indicator */}
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <ChevronRight className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Average Score</span>
                      <span className="font-semibold">{category.averageScore}/{category.maxScore}</span>
                    </div>
                    <div className="relative">
                      <Progress
                        value={percentage}
                        className="h-2"
                        gradient
                        shimmer={isHovered}
                      />
                      {/* Milestone markers */}
                      {[25, 50, 75].map((milestone) => (
                        <div
                          key={milestone}
                          className="absolute top-0 h-2 w-0.5 bg-white/30"
                          style={{ left: `${milestone}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mini chart - Recent scores */}
                  {isHovered && category.recentScores.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-end gap-1 h-12"
                    >
                      {category.recentScores.slice(-7).map((score, i) => {
                        const barHeight = (score / category.maxScore) * 100;
                        return (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${barHeight}%` }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex-1 bg-gradient-to-t ${CATEGORY_COLORS[category.name]} rounded-t opacity-60 hover:opacity-100 transition-opacity`}
                            title={`${score}/${category.maxScore}`}
                          />
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Quick insight */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>
                        {percentage >= 80
                          ? "Excellent work in this category!"
                          : percentage >= 60
                          ? "Good progress, keep improving!"
                          : "Focus area - practice more scenarios here"}
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detailed Category Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <CategoryDetailModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface CategoryDetailModalProps {
  category: CategoryData;
  onClose: () => void;
}

function CategoryDetailModal({ category, onClose }: CategoryDetailModalProps) {
  const Icon = CATEGORY_ICONS[category.name] || Sparkles;
  const percentage = (category.averageScore / category.maxScore) * 100;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <Card className="border-2 border-primary">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[category.name]} flex items-center justify-center shadow-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{category.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {category.gamesPlayed} games • {category.averageScore}/{category.maxScore} avg
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
                  <span className="text-xl">×</span>
                </Button>
              </div>

              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Overall Performance</span>
                  <span className="text-muted-foreground">{Math.round(percentage)}%</span>
                </div>
                <Progress value={percentage} gradient shimmer className="h-3" />
              </div>

              {/* Recent Performance Chart */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recent Performance
                </h3>
                <div className="flex items-end justify-between gap-2 h-32 p-4 bg-muted/30 rounded-lg">
                  {category.recentScores.map((score, i) => {
                    const barHeight = (score / category.maxScore) * 100;
                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{ delay: i * 0.05 }}
                          className={`w-full bg-gradient-to-t ${CATEGORY_COLORS[category.name]} rounded-t shadow-lg hover:shadow-xl transition-shadow`}
                        />
                        <span className="text-xs text-muted-foreground">{score}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths */}
              {category.strengths.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-green-500 flex items-center gap-2">
                    ✓ Strengths
                  </h3>
                  <ul className="space-y-1">
                    {category.strengths.map((strength, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-green-500 mt-0.5">•</span>
                        {strength}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {category.improvements.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-orange-500 flex items-center gap-2">
                    📈 Areas for Improvement
                  </h3>
                  <ul className="space-y-1">
                    {category.improvements.map((improvement, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-orange-500 mt-0.5">•</span>
                        {improvement}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tips */}
              {category.tips.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Tips to Improve
                  </h3>
                  <div className="space-y-2">
                    {category.tips.map((tip, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm"
                      >
                        {tip}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button className="w-full" size="lg" onClick={onClose}>
                Practice {category.name} Scenarios
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
}
