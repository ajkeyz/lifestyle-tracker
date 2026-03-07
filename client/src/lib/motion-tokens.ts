/**
 * Shared motion design tokens for consistent animation across the app.
 * Use these instead of ad-hoc spring/duration values.
 */

/** Named spring presets for framer-motion `transition` prop */
export const springs = {
  /** Fast, snappy interactions (buttons, toggles, small UI) */
  snappy: { type: "spring" as const, stiffness: 400, damping: 25 },
  /** Default entrance/exit for cards and sections */
  gentle: { type: "spring" as const, stiffness: 260, damping: 20 },
  /** Playful overshoot (mascot, celebrations, badges) */
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
  /** Rigid, no-overshoot (progress bars, counters) */
  stiff: { type: "spring" as const, stiffness: 500, damping: 30 },
} as const;

/** Duration-based transition presets (when springs are not appropriate) */
export const durations = {
  instant: 0.15,
  fast: 0.25,
  normal: 0.4,
  slow: 0.6,
} as const;

/** Stagger delay helpers */
export const stagger = {
  /** Delay between sibling items in a list */
  item: 0.06,
  /** Delay between major page sections */
  section: 0.1,
} as const;

/** Standard entrance animation initial state */
export const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
} as const;

/** Standard entrance with scale */
export const fadeScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
} as const;

/** Standard exit animation */
export const fadeOut = {
  exit: { opacity: 0, y: -10 },
} as const;

/**
 * Per-game-mode gradient definitions.
 * Usage: `bg-gradient-to-r ${modeGradients.survival}`
 */
export const modeGradients = {
  survival: "from-amber-400 via-orange-500 to-red-600",
  coop: "from-indigo-400 via-purple-500 to-indigo-600",
  arcade: "from-cyan-400 via-blue-500 to-indigo-600",
  daily: "from-emerald-400 via-primary to-emerald-600",
  primary: "from-primary via-primary/80 to-accent",
} as const;
