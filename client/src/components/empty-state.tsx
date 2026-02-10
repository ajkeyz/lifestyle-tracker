import { motion } from "framer-motion";
import { 
  Users, 
  Trophy, 
  MessageSquare, 
  Swords, 
  Shield,
  Sparkles,
  Target,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateType = 
  | "no-friends" 
  | "no-leagues" 
  | "no-challenges" 
  | "no-comments" 
  | "no-community"
  | "no-results"
  | "no-badges";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: typeof Users;
  defaultTitle: string;
  defaultDescription: string;
  gradient: string;
}> = {
  "no-friends": {
    icon: Users,
    defaultTitle: "No friends yet",
    defaultDescription: "Add friends to compete on leaderboards and challenge them to money duels!",
    gradient: "from-blue-500 to-cyan-500",
  },
  "no-leagues": {
    icon: Trophy,
    defaultTitle: "No leagues joined",
    defaultDescription: "Create or join a league to compete with friends in weekly challenges.",
    gradient: "from-yellow-500 to-orange-500",
  },
  "no-challenges": {
    icon: Swords,
    defaultTitle: "No challenges yet",
    defaultDescription: "Challenge your friends to compare Money Health, streaks, or accuracy!",
    gradient: "from-purple-500 to-pink-500",
  },
  "no-comments": {
    icon: MessageSquare,
    defaultTitle: "No comments yet",
    defaultDescription: "Be the first to share your thoughts on this scenario!",
    gradient: "from-green-500 to-emerald-500",
  },
  "no-community": {
    icon: Lightbulb,
    defaultTitle: "No scenarios yet",
    defaultDescription: "Be the first to share a real-life money dilemma with the community!",
    gradient: "from-amber-500 to-yellow-500",
  },
  "no-results": {
    icon: Target,
    defaultTitle: "No results yet",
    defaultDescription: "Play today's daily drop to see your results here!",
    gradient: "from-red-500 to-rose-500",
  },
  "no-badges": {
    icon: Shield,
    defaultTitle: "Earning badges...",
    defaultDescription: "Keep playing to unlock achievements and show off your financial wisdom!",
    gradient: "from-indigo-500 to-violet-500",
  },
};

export function EmptyState({
  type,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        className
      )}
      data-testid={`empty-state-${type}`}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn(
          "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-lg",
          config.gradient
        )}
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold tracking-[-0.02em] mb-2">
          {title || config.defaultTitle}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {description || config.defaultDescription}
        </p>
      </motion.div>

      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button onClick={onAction} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
