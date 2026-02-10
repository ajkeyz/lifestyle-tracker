/**
 * Achievement System
 *
 * Displays badge grid with locked/unlocked states
 * Features: animated gradient borders, progress tracking, categories
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Flame,
  Target,
  Star,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Award,
  Lock,
  Check,
  Medal,
  Gem,
  Shield,
  Heart,
  Brain
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GradientBorder } from "@/components/gradient-border";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  category: "streak" | "performance" | "social" | "milestone" | "special";
  tier: "bronze" | "silver" | "gold" | "platinum";
  requirement: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const TIER_COLORS = {
  bronze: "from-orange-700 to-amber-700",
  silver: "from-gray-400 to-gray-500",
  gold: "from-yellow-500 to-amber-500",
  platinum: "from-cyan-400 to-blue-500",
};

const TIER_GLOW = {
  bronze: "shadow-orange-500/30",
  silver: "shadow-gray-400/30",
  gold: "shadow-yellow-500/40",
  platinum: "shadow-cyan-400/40",
};

const RARITY_BORDER = {
  common: "border-gray-500/30",
  rare: "border-blue-500/50",
  epic: "border-purple-500/60",
  legendary: "border-yellow-500/70",
};

const CATEGORY_ICONS = {
  streak: Flame,
  performance: TrendingUp,
  social: Heart,
  milestone: Trophy,
  special: Star,
};

const CATEGORY_COLORS = {
  streak: "from-orange-500 to-red-500",
  performance: "from-green-500 to-emerald-500",
  social: "from-pink-500 to-rose-500",
  milestone: "from-yellow-500 to-amber-500",
  special: "from-purple-500 to-pink-500",
};

// Sample achievements (in real app, this would come from API/database)
const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: Flame,
    category: "streak",
    tier: "bronze",
    requirement: 7,
    progress: 7,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "streak-30",
    name: "Month Master",
    description: "Maintain a 30-day streak",
    icon: Flame,
    category: "streak",
    tier: "silver",
    requirement: 30,
    progress: 15,
    unlocked: false,
    rarity: "rare",
  },
  {
    id: "streak-100",
    name: "Century Champion",
    description: "Maintain a 100-day streak",
    icon: Crown,
    category: "streak",
    tier: "gold",
    requirement: 100,
    progress: 15,
    unlocked: false,
    rarity: "epic",
  },
  {
    id: "perfect-10",
    name: "Perfect Score",
    description: "Achieve 10 perfect scores",
    icon: Star,
    category: "performance",
    tier: "silver",
    requirement: 10,
    progress: 3,
    unlocked: false,
    rarity: "rare",
  },
  {
    id: "games-100",
    name: "Dedicated Player",
    description: "Complete 100 games",
    icon: Target,
    category: "milestone",
    tier: "bronze",
    requirement: 100,
    progress: 45,
    unlocked: false,
    rarity: "common",
  },
  {
    id: "social-10",
    name: "Team Player",
    description: "Win 10 co-op games",
    icon: Heart,
    category: "social",
    tier: "bronze",
    requirement: 10,
    progress: 10,
    unlocked: true,
    rarity: "common",
  },
  {
    id: "legend",
    name: "Living Legend",
    description: "Reach 365-day streak",
    icon: Gem,
    category: "special",
    tier: "platinum",
    requirement: 365,
    progress: 15,
    unlocked: false,
    rarity: "legendary",
  },
];

interface AchievementSystemProps {
  achievements?: Achievement[];
  onAchievementClick?: (achievement: Achievement) => void;
}

export function AchievementSystem({
  achievements = SAMPLE_ACHIEVEMENTS,
  onAchievementClick,
}: AchievementSystemProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Filter achievements by category
  const filteredAchievements = selectedCategory === "all"
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  // Calculate stats
  const totalAchievements = achievements.length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const completionRate = Math.round((unlockedCount / totalAchievements) * 100);

  // Group by category
  const byCategory = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text-animated">{unlockedCount}</div>
              <div className="text-xs text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{totalAchievements}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{completionRate}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={completionRate} className="mt-4 h-2" gradient shimmer />
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="streak">Streak</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="milestone">Milestone</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {/* Achievement Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAchievements.map((achievement, index) => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                index={index}
                onClick={() => {
                  setSelectedAchievement(achievement);
                  onAchievementClick?.(achievement);
                }}
              />
            ))}
          </div>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No achievements in this category yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailModal
            achievement={selectedAchievement}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface AchievementBadgeProps {
  achievement: Achievement;
  index: number;
  onClick: () => void;
}

function AchievementBadge({ achievement, index, onClick }: AchievementBadgeProps) {
  const Icon = achievement.icon;
  const CategoryIcon = CATEGORY_ICONS[achievement.category];
  const isUnlocked = achievement.unlocked;
  const progressPercent = Math.min(100, (achievement.progress / achievement.requirement) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      {isUnlocked ? (
        <GradientBorder
          animated
          colors={achievement.tier === "platinum" ? "premium" : "primary"}
          rounded="lg"
        >
          <Card className={`relative overflow-hidden border-0 ${TIER_GLOW[achievement.tier]}`}>
            <CardContent className="p-4 space-y-3">
              {/* Icon */}
              <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-br ${TIER_COLORS[achievement.tier]} flex items-center justify-center shadow-xl animate-pulse-glow`}>
                <Icon className="w-8 h-8 text-white drop-shadow-lg" />
              </div>

              {/* Name */}
              <div className="text-center">
                <h3 className="font-bold text-sm line-clamp-1">{achievement.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {achievement.description}
                </p>
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center gap-1 flex-wrap">
                <Badge variant="secondary" className="text-xs capitalize">
                  {achievement.tier}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {achievement.rarity}
                </Badge>
              </div>

              {/* Unlocked indicator */}
              <div className="flex items-center justify-center gap-1 text-xs text-green-500 font-medium">
                <Check className="w-3 h-3" />
                <span>Unlocked</span>
              </div>
            </CardContent>
          </Card>
        </GradientBorder>
      ) : (
        <Card className={`relative overflow-hidden border-2 ${RARITY_BORDER[achievement.rarity]} opacity-60 hover:opacity-80 transition-opacity`}>
          <CardContent className="p-4 space-y-3">
            {/* Locked Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center relative">
              <Icon className="w-8 h-8 text-muted-foreground/40" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                <Lock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <h3 className="font-bold text-sm text-muted-foreground line-clamp-1">
                {achievement.name}
              </h3>
              <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-1">
                {achievement.description}
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{achievement.progress}/{achievement.requirement}</span>
              </div>
              <Progress value={progressPercent} className="h-1" />
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

interface AchievementDetailModalProps {
  achievement: Achievement;
  onClose: () => void;
}

function AchievementDetailModal({ achievement, onClose }: AchievementDetailModalProps) {
  const Icon = achievement.icon;

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
        <div className="pointer-events-auto max-w-md w-full">
          <GradientBorder animated colors="premium" rounded="xl">
            <Card className="border-0">
              <CardContent className="p-8 space-y-6">
                {/* Icon */}
                <div className={`mx-auto w-24 h-24 rounded-full bg-gradient-to-br ${TIER_COLORS[achievement.tier]} flex items-center justify-center shadow-2xl animate-pulse-glow`}>
                  <Icon className="w-12 h-12 text-white drop-shadow-lg" />
                </div>

                {/* Title */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">{achievement.name}</h2>
                  <p className="text-muted-foreground">{achievement.description}</p>
                </div>

                {/* Badges */}
                <div className="flex items-center justify-center gap-2">
                  <Badge className={`bg-gradient-to-r ${CATEGORY_COLORS[achievement.category]}`}>
                    {achievement.category}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {achievement.tier} Tier
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {achievement.rarity}
                  </Badge>
                </div>

                {/* Progress or Unlocked */}
                {achievement.unlocked ? (
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center justify-center gap-2 text-green-500 font-semibold">
                      <Check className="w-5 h-5" />
                      <span>Achievement Unlocked!</span>
                    </div>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {achievement.progress} / {achievement.requirement}
                      </span>
                    </div>
                    <Progress
                      value={(achievement.progress / achievement.requirement) * 100}
                      gradient
                      shimmer
                      className="h-3"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </GradientBorder>
        </div>
      </motion.div>
    </>
  );
}
