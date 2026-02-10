/**
 * Quick Actions Floating Panel
 *
 * Floating action button with expandable quick actions
 * Features: smooth animations, contextual actions, keyboard shortcuts
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Play,
  BarChart3,
  Users,
  Trophy,
  Target,
  Sparkles,
  Zap,
  Settings,
  Calendar
} from "lucide-react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface QuickAction {
  id: string;
  label: string;
  icon: typeof Play;
  color: string;
  path: string;
  shortcut?: string;
  badge?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    id: "play",
    label: "Play Game",
    icon: Play,
    color: "from-green-500 to-emerald-500",
    path: "/arcade",
    shortcut: "P",
  },
  {
    id: "stats",
    label: "View Stats",
    icon: BarChart3,
    color: "from-blue-500 to-cyan-500",
    path: "/stats",
    shortcut: "S",
  },
  {
    id: "friends",
    label: "Friends",
    icon: Users,
    color: "from-pink-500 to-rose-500",
    path: "/friends",
    shortcut: "F",
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: Trophy,
    color: "from-yellow-500 to-amber-500",
    path: "/achievements",
    shortcut: "A",
  },
  {
    id: "challenges",
    label: "Challenges",
    icon: Target,
    color: "from-purple-500 to-indigo-500",
    path: "/challenges",
    shortcut: "C",
  },
  {
    id: "weekly",
    label: "Weekly Recap",
    icon: Calendar,
    color: "from-orange-500 to-red-500",
    path: "/weekly-recap",
    shortcut: "W",
  },
];

interface QuickActionsPanelProps {
  actions?: QuickAction[];
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  size?: "sm" | "md" | "lg";
  onActionClick?: (action: QuickAction) => void;
}

export function QuickActionsPanel({
  actions = DEFAULT_ACTIONS,
  position = "bottom-right",
  size = "md",
  onActionClick,
}: QuickActionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleActionClick = (action: QuickAction) => {
    onActionClick?.(action);
    navigate(action.path);
    setIsOpen(false);
  };

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  // Size classes
  const sizeClasses = {
    sm: { fab: "w-12 h-12", icon: "w-5 h-5", action: "w-10 h-10", actionIcon: "w-4 h-4" },
    md: { fab: "w-14 h-14", icon: "w-6 h-6", action: "w-12 h-12", actionIcon: "w-5 h-5" },
    lg: { fab: "w-16 h-16", icon: "w-7 h-7", action: "w-14 h-14", actionIcon: "w-6 h-6" },
  };

  const sizes = sizeClasses[size];

  // Animation variants
  const fabVariants = {
    closed: { rotate: 0 },
    open: { rotate: 45 },
  };

  const actionVariants = {
    closed: { scale: 0, opacity: 0 },
    open: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    }),
  };

  // Calculate action positions in a circular arc
  const getActionPosition = (index: number, total: number) => {
    const radius = 80; // Distance from FAB
    const startAngle = position.includes("right") ? 180 : 0;
    const angleStep = 90 / (total - 1 || 1); // Spread across 90 degrees
    const angle = startAngle + angleStep * index;
    const radian = (angle * Math.PI) / 180;

    return {
      x: Math.cos(radian) * radius * (position.includes("right") ? -1 : 1),
      y: Math.sin(radian) * radius * (position.includes("bottom") ? -1 : 1),
    };
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        {/* Action Buttons */}
        <AnimatePresence>
          {isOpen && (
            <div className="absolute bottom-0 right-0">
              {actions.map((action, index) => {
                const pos = getActionPosition(index, actions.length);
                const Icon = action.icon;

                return (
                  <motion.div
                    key={action.id}
                    custom={index}
                    variants={actionVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    style={{
                      position: "absolute",
                      x: pos.x,
                      y: pos.y,
                    }}
                    className="group relative"
                  >
                    {/* Label Tooltip */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 + 0.1 }}
                      className={`
                        absolute whitespace-nowrap px-3 py-1.5 rounded-lg
                        bg-popover border border-border shadow-xl
                        text-xs font-medium
                        opacity-0 group-hover:opacity-100 transition-opacity
                        ${position.includes("right") ? "right-full mr-3" : "left-full ml-3"}
                        ${position.includes("bottom") ? "bottom-0" : "top-0"}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span>{action.label}</span>
                        {action.shortcut && (
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {action.shortcut}
                          </Badge>
                        )}
                      </div>
                    </motion.div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleActionClick(action)}
                      className={`
                        ${sizes.action}
                        rounded-full
                        bg-gradient-to-br ${action.color}
                        shadow-lg hover:shadow-xl
                        flex items-center justify-center
                        transition-all duration-200
                        hover:scale-110 active:scale-95
                        relative
                      `}
                    >
                      <Icon className={`${sizes.actionIcon} text-white`} />

                      {/* Badge */}
                      {action.badge && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                          {action.badge}
                        </span>
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          variants={fabVariants}
          animate={isOpen ? "open" : "closed"}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            ${sizes.fab}
            rounded-full
            bg-gradient-to-br from-primary to-accent
            shadow-2xl hover:shadow-primary/50
            flex items-center justify-center
            transition-all duration-200
            hover:scale-110 active:scale-95
            relative
            group
          `}
          aria-label={isOpen ? "Close quick actions" : "Open quick actions"}
        >
          <motion.div
            variants={fabVariants}
            animate={isOpen ? "open" : "closed"}
          >
            {isOpen ? (
              <X className={sizes.icon + " text-white"} />
            ) : (
              <Plus className={sizes.icon + " text-white"} />
            )}
          </motion.div>

          {/* Pulse Ring */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
          )}

          {/* Tooltip for main button */}
          {!isOpen && (
            <span className={`
              absolute whitespace-nowrap px-3 py-1.5 rounded-lg
              bg-popover border border-border shadow-xl
              text-xs font-medium
              opacity-0 group-hover:opacity-100 transition-opacity
              ${position.includes("right") ? "right-full mr-3" : "left-full ml-3"}
              ${position.includes("bottom") ? "bottom-2" : "top-2"}
            `}>
              Quick Actions
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
}

/**
 * Keyboard shortcut handler hook
 */
export function useQuickActionShortcuts(actions: QuickAction[]) {
  const navigate = useNavigate();

  useState(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if Ctrl/Cmd + Shift is pressed
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const action = actions.find(a => a.shortcut?.toLowerCase() === e.key.toLowerCase());
        if (action) {
          e.preventDefault();
          navigate(action.path);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  });
}
