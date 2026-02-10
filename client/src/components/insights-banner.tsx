/**
 * Personalized Insights Banner
 *
 * Displays rotating AI-generated tips based on user performance
 * Features: actionable recommendations, performance analysis, motivational messages
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  TrendingUp,
  Target,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  Brain,
  Zap
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Insight {
  id: string;
  type: "tip" | "achievement" | "improvement" | "streak" | "category";
  icon: typeof Lightbulb;
  title: string;
  message: string;
  action?: string;
  actionLabel?: string;
  color: string;
  badge?: string;
}

interface InsightsBannerProps {
  /** User statistics for generating insights */
  stats: {
    gamesPlayed: number;
    averageScore: number;
    bestScore: number;
    streak: number;
    accuracyRate: number;
    categoryScores?: Record<string, number>;
    recentGames?: Array<{ score: number; timestamp: Date }>;
  };
  /** Auto-rotate interval in ms (0 = manual only) */
  autoRotateInterval?: number;
  /** Allow dismissing the banner */
  dismissible?: boolean;
  /** Callback when user takes action */
  onAction?: (insight: Insight) => void;
}

/**
 * Generate personalized insights based on user stats
 */
function generateInsights(stats: InsightsBannerProps['stats']): Insight[] {
  const insights: Insight[] = [];

  // Streak insights
  if (stats.streak >= 7) {
    insights.push({
      id: 'streak-hot',
      type: 'streak',
      icon: Sparkles,
      title: 'Hot Streak!',
      message: `You're on a ${stats.streak}-day streak! Keep the momentum going.`,
      color: 'from-orange-500 to-red-500',
      badge: 'Motivation',
    });
  } else if (stats.streak === 0 && stats.gamesPlayed > 0) {
    insights.push({
      id: 'streak-start',
      type: 'improvement',
      icon: Target,
      title: 'Start Your Streak',
      message: 'Build consistency with a daily practice routine.',
      action: '/stats',
      actionLabel: 'View Stats',
      color: 'from-blue-500 to-cyan-500',
      badge: 'Growth',
    });
  }

  // Performance insights
  if (stats.averageScore >= 400) {
    insights.push({
      id: 'high-performer',
      type: 'achievement',
      icon: TrendingUp,
      title: 'Excellent Performance',
      message: `Your average score of ${stats.averageScore} shows strong decision-making skills!`,
      color: 'from-green-500 to-emerald-500',
      badge: 'Achievement',
    });
  } else if (stats.averageScore < 300 && stats.gamesPlayed > 5) {
    insights.push({
      id: 'room-for-growth',
      type: 'improvement',
      icon: Brain,
      title: 'Room for Growth',
      message: 'Focus on understanding each scenario deeply before choosing.',
      action: '/deep-dive',
      actionLabel: 'Learn More',
      color: 'from-purple-500 to-pink-500',
      badge: 'Tip',
    });
  }

  // Accuracy insights
  if (stats.accuracyRate >= 90) {
    insights.push({
      id: 'accuracy-master',
      type: 'achievement',
      icon: Zap,
      title: 'Accuracy Master',
      message: `${stats.accuracyRate}% accuracy rate! Your consistency is impressive.`,
      color: 'from-yellow-500 to-orange-500',
      badge: 'Mastery',
    });
  } else if (stats.accuracyRate < 70) {
    insights.push({
      id: 'accuracy-improve',
      type: 'tip',
      icon: Target,
      title: 'Boost Your Accuracy',
      message: 'Take your time with each decision. Quality over speed wins.',
      color: 'from-blue-500 to-indigo-500',
      badge: 'Tip',
    });
  }

  // Recent trends
  if (stats.recentGames && stats.recentGames.length >= 3) {
    const recentScores = stats.recentGames.slice(0, 3).map(g => g.score);
    const isImproving = recentScores[0] > recentScores[2];

    if (isImproving) {
      insights.push({
        id: 'trending-up',
        type: 'achievement',
        icon: TrendingUp,
        title: 'Upward Trend',
        message: 'Your recent scores are improving! You\'re getting better.',
        color: 'from-green-500 to-teal-500',
        badge: 'Progress',
      });
    }
  }

  // Category-specific insights
  if (stats.categoryScores) {
    const sortedCategories = Object.entries(stats.categoryScores)
      .sort(([, a], [, b]) => b - a);

    if (sortedCategories.length > 0) {
      const [strongestCategory, strongestScore] = sortedCategories[0];
      const [weakestCategory] = sortedCategories[sortedCategories.length - 1];

      if (strongestScore >= 400) {
        insights.push({
          id: 'category-strength',
          type: 'achievement',
          icon: Sparkles,
          title: 'Category Strength',
          message: `You excel at ${strongestCategory} scenarios! Keep it up.`,
          color: 'from-purple-500 to-pink-500',
          badge: 'Strength',
        });
      }

      if (sortedCategories.length > 2) {
        insights.push({
          id: 'category-focus',
          type: 'tip',
          icon: Lightbulb,
          title: 'Focus Area',
          message: `Consider practicing more ${weakestCategory} scenarios to build well-rounded skills.`,
          action: '/arcade',
          actionLabel: 'Practice Now',
          color: 'from-indigo-500 to-purple-500',
          badge: 'Tip',
        });
      }
    }
  }

  // Games played milestones
  if (stats.gamesPlayed === 10 || stats.gamesPlayed === 50 || stats.gamesPlayed === 100) {
    insights.push({
      id: 'games-milestone',
      type: 'achievement',
      icon: Trophy,
      title: 'Milestone Reached!',
      message: `${stats.gamesPlayed} games completed! Your commitment is paying off.`,
      color: 'from-yellow-500 to-amber-500',
      badge: 'Milestone',
    });
  }

  // Default fallback insights
  if (insights.length === 0) {
    insights.push({
      id: 'welcome',
      type: 'tip',
      icon: Lightbulb,
      title: 'Welcome to Your Journey',
      message: 'Each scenario helps you build better decision-making skills.',
      action: '/arcade',
      actionLabel: 'Start Playing',
      color: 'from-primary to-accent',
      badge: 'Getting Started',
    });
  }

  return insights;
}

export function InsightsBanner({
  stats,
  autoRotateInterval = 8000,
  dismissible = true,
  onAction,
}: InsightsBannerProps) {
  const [insights] = useState<Insight[]>(() => generateInsights(stats));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentInsight = insights[currentIndex];

  // Auto-rotate
  useEffect(() => {
    if (autoRotateInterval > 0 && !isPaused && insights.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % insights.length);
      }, autoRotateInterval);

      return () => clearInterval(timer);
    }
  }, [autoRotateInterval, isPaused, insights.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % insights.length);
    setIsPaused(true);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + insights.length) % insights.length);
    setIsPaused(true);
  };

  const handleAction = () => {
    if (currentInsight.action) {
      onAction?.(currentInsight);
      window.location.href = currentInsight.action;
    }
  };

  if (isDismissed) {
    return null;
  }

  const Icon = currentInsight.icon;

  return (
    <Card className="overflow-hidden">
      <div className={`relative bg-gradient-to-r ${currentInsight.color} p-[2px]`}>
        <div className="bg-card p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <motion.div
              key={`icon-${currentInsight.id}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${currentInsight.color} flex items-center justify-center shadow-lg`}
            >
              <Icon className="w-6 h-6 text-white" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base">{currentInsight.title}</h3>
                  {currentInsight.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {currentInsight.badge}
                    </Badge>
                  )}
                </div>

                {/* Dismiss button */}
                {dismissible && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDismissed(true)}
                    className="h-6 w-6 flex-shrink-0"
                    aria-label="Dismiss insight"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={currentInsight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-muted-foreground mb-3"
                >
                  {currentInsight.message}
                </motion.p>
              </AnimatePresence>

              {/* Action button */}
              {currentInsight.action && currentInsight.actionLabel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                  className="gap-2"
                >
                  {currentInsight.actionLabel}
                  <TrendingUp className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            {insights.length > 1 && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevious}
                  className="h-7 w-7"
                  aria-label="Previous insight"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex gap-1">
                  {insights.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index);
                        setIsPaused(true);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentIndex
                          ? 'bg-primary w-4'
                          : 'bg-muted-foreground/30'
                      }`}
                      aria-label={`Go to insight ${index + 1}`}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  className="h-7 w-7"
                  aria-label="Next insight"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
