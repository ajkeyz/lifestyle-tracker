import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, Smile, Flame, Lightbulb, AlertTriangle, Target, Coins, Heart, Eye, ThumbsUp } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface Reaction {
  id: string;
  count: number;
  userReacted: boolean;
  label: string;
}

interface EmojiReactionsProps {
  reactions: Reaction[];
  onReact: (id: string) => void;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AVAILABLE_REACTIONS = [
  { id: "fire", label: "Fire", icon: Flame, color: "text-orange-500" },
  { id: "insightful", label: "Insightful", icon: Lightbulb, color: "text-yellow-500" },
  { id: "yikes", label: "Yikes", icon: AlertTriangle, color: "text-red-500" },
  { id: "on_point", label: "On point", icon: Target, color: "text-green-500" },
  { id: "money", label: "Money", icon: Coins, color: "text-amber-500" },
  { id: "relatable", label: "Relatable", icon: Heart, color: "text-pink-500" },
  { id: "watching", label: "Watching", icon: Eye, color: "text-blue-500" },
  { id: "praise", label: "Praise", icon: ThumbsUp, color: "text-primary" },
];

export function EmojiReactions({
  reactions,
  onReact,
  maxDisplay = 5,
  size = "md",
  className,
}: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { vibrateSelection } = useHaptic();

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const buttonSizes = {
    sm: "h-6 px-1.5",
    md: "h-7 px-2",
    lg: "h-8 px-2.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const displayedReactions = reactions
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay);

  const handleReact = (id: string) => {
    vibrateSelection();
    onReact(id);
    setShowPicker(false);
  };

  const getReactionConfig = (id: string) => 
    AVAILABLE_REACTIONS.find((r) => r.id === id) || AVAILABLE_REACTIONS[0];

  return (
    <div className={cn("flex items-center flex-wrap", sizeClasses[size], className)}>
      <AnimatePresence mode="popLayout">
        {displayedReactions.map((reaction) => {
          const config = getReactionConfig(reaction.id);
          const Icon = config.icon;
          return (
            <motion.button
              key={reaction.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => handleReact(reaction.id)}
              aria-label={`React with ${config.label}, ${reaction.count} reactions`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border transition-colors",
                buttonSizes[size],
                reaction.userReacted
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-muted/50 border-transparent hover:bg-muted"
              )}
            >
              <Icon className={cn(iconSizes[size], config.color)} />
              <span className="tabular-nums font-medium">{reaction.count}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      <div className="relative">
        <motion.button
          onClick={() => setShowPicker(!showPicker)}
          aria-label={showPicker ? "Close reaction picker" : "Add reaction"}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted hover:border-muted-foreground/50 transition-colors",
            buttonSizes[size],
            size === "sm" ? "w-6" : size === "md" ? "w-7" : "w-8"
          )}
        >
          {showPicker ? <Smile className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </motion.button>

        <AnimatePresence>
          {showPicker && (
            <>
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPicker(false)}
              />
              <motion.div
                className="absolute bottom-full left-0 mb-2 z-50 bg-popover border rounded-xl shadow-lg p-2 min-w-[200px]"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="grid grid-cols-4 gap-1">
                  {AVAILABLE_REACTIONS.map((item) => {
                    const existing = reactions.find((r) => r.id === item.id);
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => handleReact(item.id)}
                        aria-label={`React with ${item.label}`}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          existing?.userReacted
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                        title={item.label}
                      >
                        <Icon className={cn("w-5 h-5", item.color)} />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface QuickReactionsProps {
  reactions: Reaction[];
  onReact: (id: string) => void;
  className?: string;
}

export function QuickReactions({ reactions, onReact, className }: QuickReactionsProps) {
  const { vibrateSelection } = useHaptic();
  const quickReactionIds = ["fire", "insightful", "yikes", "on_point"];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {quickReactionIds.map((id) => {
        const config = AVAILABLE_REACTIONS.find((r) => r.id === id);
        if (!config) return null;
        const Icon = config.icon;
        const reaction = reactions.find((r) => r.id === id);
        const count = reaction?.count || 0;
        const userReacted = reaction?.userReacted || false;

        return (
          <motion.button
            key={id}
            onClick={() => {
              vibrateSelection();
              onReact(id);
            }}
            aria-label={`React with ${config.label}${count > 0 ? `, ${count} reactions` : ''}`}
            className={cn(
              "relative flex items-center gap-0.5 px-2 py-1 rounded-full text-sm transition-colors",
              userReacted
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
          >
            <Icon className={cn("w-4 h-4", config.color)} />
            {count > 0 && (
              <motion.span
                className="tabular-nums text-xs font-medium"
                key={count}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
              >
                {count}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

interface ReactionBarProps {
  totalReactions: number;
  topReactionIds: string[];
  onClick?: () => void;
  className?: string;
}

export function ReactionBar({
  totalReactions,
  topReactionIds,
  onClick,
  className,
}: ReactionBarProps) {
  if (totalReactions === 0) return null;

  return (
    <button
      onClick={onClick}
      aria-label={`${totalReactions} reactions, click to view`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors text-sm",
        className
      )}
    >
      <span className="flex -space-x-1">
        {topReactionIds.slice(0, 3).map((id, i) => {
          const config = AVAILABLE_REACTIONS.find((r) => r.id === id);
          if (!config) return null;
          const Icon = config.icon;
          return (
            <span key={i} className="relative w-4 h-4" style={{ zIndex: 3 - i }}>
              <Icon className={cn("w-4 h-4", config.color)} />
            </span>
          );
        })}
      </span>
      <span className="text-muted-foreground tabular-nums">{totalReactions}</span>
    </button>
  );
}

interface FloatingReactionProps {
  reactionId: string;
  x: number;
  y: number;
  onComplete: () => void;
}

export function FloatingReaction({ reactionId, x, y, onComplete }: FloatingReactionProps) {
  const config = AVAILABLE_REACTIONS.find((r) => r.id === reactionId);
  if (!config) return null;
  const Icon = config.icon;
  
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      initial={{ x, y, opacity: 1, scale: 0 }}
      animate={{
        y: y - 100,
        opacity: 0,
        scale: [0, 1.5, 1],
      }}
      transition={{ duration: 1, ease: "easeOut" }}
      onAnimationComplete={onComplete}
    >
      <Icon className={cn("w-6 h-6", config.color)} />
    </motion.div>
  );
}
