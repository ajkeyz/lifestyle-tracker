import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { QuickReactions } from "@/components/emoji-reactions";
import type { Reaction } from "@/components/emoji-reactions";
import {
  Trophy,
  Flame,
  TrendingUp,
  Sparkles,
  Gamepad2,
  Shield,
  ChevronDown,
} from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "score" | "streak" | "level_up" | "game_played" | "achievement";
  username: string;
  avatar?: string;
  value?: number;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
  className?: string;
}

const EVENT_CONFIG: Record<
  string,
  { icon: typeof Trophy; color: string; getText: (item: ActivityItem) => string }
> = {
  score: {
    icon: Trophy,
    color: "text-yellow-500",
    getText: (item) => `scored ${item.value ?? 0} on today's Drop`,
  },
  streak: {
    icon: Flame,
    color: "text-orange-500",
    getText: (item) => `is on a ${item.value ?? 0}-day streak`,
  },
  level_up: {
    icon: TrendingUp,
    color: "text-green-500",
    getText: (item) => `reached ${item.value ?? 0} Financial Fitness`,
  },
  game_played: {
    icon: Gamepad2,
    color: "text-purple-500",
    getText: () => `played a game mode`,
  },
  achievement: {
    icon: Shield,
    color: "text-blue-500",
    getText: () => `unlocked a new achievement`,
  },
};

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

const PAGE_SIZE = 8;

const DEFAULT_REACTIONS: Reaction[] = [
  { id: "fire", count: 0, userReacted: false, label: "Fire" },
  { id: "insightful", count: 0, userReacted: false, label: "Insightful" },
  { id: "yikes", count: 0, userReacted: false, label: "Yikes" },
  { id: "on_point", count: 0, userReacted: false, label: "On point" },
];

export function ActivityFeed({ activities, isLoading, className }: ActivityFeedProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [reactionsMap, setReactionsMap] = useState<Record<string, Reaction[]>>({});

  const handleReact = useCallback((activityId: string, reactionId: string) => {
    setReactionsMap((prev) => {
      const current = prev[activityId] || DEFAULT_REACTIONS.map((r) => ({ ...r }));
      return {
        ...prev,
        [activityId]: current.map((r) =>
          r.id === reactionId
            ? {
                ...r,
                count: r.userReacted ? Math.max(0, r.count - 1) : r.count + 1,
                userReacted: !r.userReacted,
              }
            : r
        ),
      };
    });
  }, []);

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className={cn("flex flex-col items-center py-8 px-4", className)}>
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground/70 text-center mt-1">
          When your friends play, their activity will show up here
        </p>
      </div>
    );
  }

  const visibleItems = activities.slice(0, visibleCount);
  const hasMore = activities.length > visibleCount;

  return (
    <div className={cn("space-y-1", className)}>
      <AnimatePresence initial={false}>
        {visibleItems.map((item, i) => {
          const config = EVENT_CONFIG[item.type] || EVENT_CONFIG.score;
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors"
              data-testid={`activity-item-${item.id}`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <AnimatedAvatar
                  avatarId={item.avatar || "cosmic-cat"}
                  size="xs"
                  isAnimated={false}
                  className="w-9 h-9 [&>div]:w-9 [&>div]:h-9"
                />
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card flex items-center justify-center border border-border",
                  )}
                >
                  <Icon className={cn("w-2.5 h-2.5", config.color)} />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-tight">
                  <span className="font-semibold">{item.username}</span>{" "}
                  <span className="text-muted-foreground">{config.getText(item)}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-muted-foreground/60">
                    {getRelativeTime(item.timestamp)}
                  </p>
                  <QuickReactions
                    reactions={reactionsMap[item.id] || DEFAULT_REACTIONS}
                    onReact={(reactionId) => handleReact(item.id, reactionId)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs text-muted-foreground"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            Show more
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
