import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, Smile } from "lucide-react";
import { useHaptic } from "@/hooks/use-haptic";

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  label: string;
}

interface EmojiReactionsProps {
  reactions: Reaction[];
  onReact: (emoji: string) => void;
  maxDisplay?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AVAILABLE_EMOJIS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Insightful" },
  { emoji: "😬", label: "Yikes" },
  { emoji: "🎯", label: "On point" },
  { emoji: "💰", label: "Money" },
  { emoji: "😅", label: "Relatable" },
  { emoji: "👀", label: "Watching" },
  { emoji: "🙌", label: "Praise" },
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

  const displayedReactions = reactions
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, maxDisplay);

  const handleReact = (emoji: string) => {
    vibrateSelection();
    onReact(emoji);
    setShowPicker(false);
  };

  return (
    <div className={cn("flex items-center flex-wrap", sizeClasses[size], className)}>
      <AnimatePresence mode="popLayout">
        {displayedReactions.map((reaction) => (
          <motion.button
            key={reaction.emoji}
            layout
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => handleReact(reaction.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border transition-colors",
              buttonSizes[size],
              reaction.userReacted
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/50 border-transparent hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{reaction.emoji}</span>
            <span className="tabular-nums font-medium">{reaction.count}</span>
          </motion.button>
        ))}
      </AnimatePresence>

      <div className="relative">
        <motion.button
          onClick={() => setShowPicker(!showPicker)}
          className={cn(
            "inline-flex items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted hover:border-muted-foreground/50 transition-colors",
            buttonSizes[size],
            size === "sm" ? "w-6" : size === "md" ? "w-7" : "w-8"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
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
                  {AVAILABLE_EMOJIS.map((item) => {
                    const existing = reactions.find((r) => r.emoji === item.emoji);
                    return (
                      <motion.button
                        key={item.emoji}
                        onClick={() => handleReact(item.emoji)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors",
                          existing?.userReacted
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        )}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title={item.label}
                      >
                        {item.emoji}
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
  onReact: (emoji: string) => void;
  className?: string;
}

export function QuickReactions({ reactions, onReact, className }: QuickReactionsProps) {
  const { vibrateSelection } = useHaptic();
  const quickEmojis = ["🔥", "💡", "😬", "🎯"];

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {quickEmojis.map((emoji) => {
        const reaction = reactions.find((r) => r.emoji === emoji);
        const count = reaction?.count || 0;
        const userReacted = reaction?.userReacted || false;

        return (
          <motion.button
            key={emoji}
            onClick={() => {
              vibrateSelection();
              onReact(emoji);
            }}
            className={cn(
              "relative flex items-center gap-0.5 px-2 py-1 rounded-full text-sm transition-colors",
              userReacted
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-base">{emoji}</span>
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
  topEmojis: string[];
  onClick?: () => void;
  className?: string;
}

export function ReactionBar({
  totalReactions,
  topEmojis,
  onClick,
  className,
}: ReactionBarProps) {
  if (totalReactions === 0) return null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors text-sm",
        className
      )}
    >
      <span className="flex -space-x-1">
        {topEmojis.slice(0, 3).map((emoji, i) => (
          <span key={i} className="relative" style={{ zIndex: 3 - i }}>
            {emoji}
          </span>
        ))}
      </span>
      <span className="text-muted-foreground tabular-nums">{totalReactions}</span>
    </button>
  );
}

interface FloatingReactionProps {
  emoji: string;
  x: number;
  y: number;
  onComplete: () => void;
}

export function FloatingReaction({ emoji, x, y, onComplete }: FloatingReactionProps) {
  return (
    <motion.div
      className="fixed pointer-events-none text-2xl z-50"
      initial={{ x, y, opacity: 1, scale: 0 }}
      animate={{
        y: y - 100,
        opacity: 0,
        scale: [0, 1.5, 1],
      }}
      transition={{ duration: 1, ease: "easeOut" }}
      onAnimationComplete={onComplete}
    >
      {emoji}
    </motion.div>
  );
}
