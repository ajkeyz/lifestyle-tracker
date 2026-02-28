import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Mascot, getMascotDialogue, type MascotMood, type MascotContext } from "./mascot";

// ============================================================
// CLEO EDGE PRESENCE — Duolingo-style peek/pop/slide interactions
// ============================================================

type EdgePosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";
type EntryStyle = "peek" | "pop-up" | "slide-down";

interface CleoEdgePresenceProps {
  /** When to show Cleo (true = show, false = hide) */
  show: boolean;
  /** The message Cleo says */
  message?: string;
  /** Mood determines expression */
  mood?: MascotMood;
  /** Where Cleo appears from */
  position?: EdgePosition;
  /** How Cleo enters */
  entryStyle?: EntryStyle;
  /** Auto-dismiss after N milliseconds (0 = manual) */
  autoDismissMs?: number;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Optional action button */
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function CleoEdgePresence({
  show,
  message,
  mood = "encouraging",
  position = "bottom-right",
  entryStyle = "pop-up",
  autoDismissMs = 8000,
  onDismiss,
  action,
  className,
}: CleoEdgePresenceProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for natural feel
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [show]);

  useEffect(() => {
    if (visible && autoDismissMs > 0) {
      const readTime = Math.max(autoDismissMs, (message?.length || 0) * 60 + 3000);
      const t = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, readTime);
      return () => clearTimeout(t);
    }
  }, [visible, autoDismissMs, message, onDismiss]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  // Position styles
  const positionStyles: Record<EdgePosition, string> = {
    "bottom-right": "fixed bottom-24 right-4 z-50",
    "bottom-left": "fixed bottom-24 left-4 z-50",
    "top-right": "fixed top-20 right-4 z-50",
    "top-left": "fixed top-20 left-4 z-50",
  };

  // Entry animations based on style
  const getAnimation = () => {
    const isBottom = position.startsWith("bottom");
    const isRight = position.includes("right");

    switch (entryStyle) {
      case "peek":
        return {
          initial: { x: isRight ? 100 : -100, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: isRight ? 100 : -100, opacity: 0 },
        };
      case "pop-up":
        return {
          initial: { y: isBottom ? 80 : -80, opacity: 0, scale: 0.8 },
          animate: { y: 0, opacity: 1, scale: 1 },
          exit: { y: isBottom ? 80 : -80, opacity: 0, scale: 0.8 },
        };
      case "slide-down":
        return {
          initial: { y: -60, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: -60, opacity: 0 },
        };
    }
  };

  const anim = getAnimation();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(positionStyles[position], className)}
          initial={anim.initial}
          animate={anim.animate}
          exit={anim.exit}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div
            className="flex items-end gap-2 cursor-pointer max-w-[calc(100vw-32px)]"
            onClick={handleDismiss}
          >
            {/* Cleo character (small size for edge presence) */}
            <motion.div
              className="flex-shrink-0"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Mascot
                mood={mood}
                size="sm"
                showBubble={false}
                disableTapBubble={true}
                animate={true}
              />
            </motion.div>

            {/* Message bubble */}
            {message && (
              <motion.div
                className="rounded-2xl px-4 py-3 backdrop-blur-md max-w-[min(220px,calc(100vw-100px))] min-w-0"
                style={{
                  background: "hsl(var(--card) / 0.96)",
                  border: "1px solid hsl(var(--border) / 0.5)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
              >
                <p className="text-xs font-medium text-foreground leading-snug">
                  {message}
                </p>
                {action && (
                  <motion.button
                    className="mt-2 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {action.label} →
                  </motion.button>
                )}
              </motion.div>
            )}
          </div>

          {/* Dismiss hint */}
          <motion.p
            className="text-[9px] text-muted-foreground/50 text-center mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            tap to dismiss
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// PRE-BUILT NUDGE PATTERNS — common use cases
// ============================================================

/** Nudge when user hasn't played today — shows after idle time on home page */
export function CleoPlayNudge({
  hasPlayedToday,
  streak,
  onPlay,
}: {
  hasPlayedToday: boolean;
  streak: number;
  onPlay: () => void;
}) {
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    if (hasPlayedToday) return;
    // Show after 10 seconds of being on the page
    const t = setTimeout(() => setShowNudge(true), 10000);
    return () => clearTimeout(t);
  }, [hasPlayedToday]);

  if (hasPlayedToday) return null;

  const nudgeMessage = streak > 0
    ? `Your ${streak}-day streak is counting on you!`
    : "Quick game? Just 2 minutes.";

  return (
    <CleoEdgePresence
      show={showNudge}
      message={nudgeMessage}
      mood={streak > 0 ? "encouraging" : "waving"}
      position="bottom-right"
      entryStyle="pop-up"
      autoDismissMs={12000}
      onDismiss={() => setShowNudge(false)}
      action={{ label: "Play Now", onClick: onPlay }}
    />
  );
}


/** Congratulation peek after completing a challenge */
export function CleoCongratsPeek({
  trigger,
  message = "You crushed it!",
}: {
  trigger: boolean;
  message?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      const t = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  return (
    <CleoEdgePresence
      show={show}
      message={message}
      mood="celebrating"
      position="top-right"
      entryStyle="slide-down"
      autoDismissMs={6000}
      onDismiss={() => setShow(false)}
    />
  );
}
