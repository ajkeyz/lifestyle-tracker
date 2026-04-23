import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHaptic } from "@/hooks/use-haptic";

// ============================================================
// CLEO — Financial Mascot for Lifestyle Creep
// Personality: Snarky, Gen-Z, unapologetically smart.
// Knows money, knows people, knows when to chirp.
// ============================================================

export type MascotMood =
  | "idle"
  | "happy"
  | "celebrating"
  | "thinking"
  | "sad"
  | "encouraging"
  | "sleeping"
  | "shocked"
  | "proud"
  | "waving"
  | "fire"       // Streak on fire (30+ days)
  | "smug"       // Nailed a hard question
  | "hyped";     // XP multiplier / milestone

// Rich context passed to mascot for context-aware dialogue
export interface MascotContext {
  screen?: "home" | "game" | "results" | "coop-lobby" | "survival-lobby" | "arcade" | "play-hub";
  // Game context
  wasCorrect?: boolean;
  wasTimeout?: boolean;
  timeRemainingOnAnswer?: number; // seconds left when answered
  questionIndex?: number;
  // Results context
  score?: number;
  iq?: number;
  moneyHealth?: number;
  streakGained?: boolean;     // streak increased this session
  streakBroken?: boolean;     // streak dropped to 0
  isStreakMilestone?: boolean; // 7, 14, 30, 60, 100
  percentile?: number;         // 0-100, % of players beaten
  // User personalization
  username?: string;
  streak?: number;
  daysInactive?: number;
}

interface MascotProps {
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  showBubble?: boolean;
  /** Delay in ms before the speech bubble first appears (default 1200) */
  speechDelay?: number;
  disableTapBubble?: boolean;
  /** Force the speech bubble to a specific side (bypasses auto-detection) */
  forceBubbleSide?: "right" | "left" | "top" | "bottom";
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  streakCount?: number;
  showStreakFlame?: boolean;
  context?: MascotContext;
}

const SIZE_MAP = { xs: 48, sm: 64, md: 96, lg: 128, xl: 160 };

export const BODY_COLORS: Record<MascotMood, { main: string; highlight: string; shadow: string; glow: string }> = {
  idle:        { main: "#7c5cbf", highlight: "#9b7ed8", shadow: "#6a4dab", glow: "#7c5cbf33" },
  happy:       { main: "#14b8a6", highlight: "#5eead4", shadow: "#0d9488", glow: "#14b8a655" },
  celebrating: { main: "#f59e0b", highlight: "#fcd34d", shadow: "#d97706", glow: "#f59e0b88" },
  thinking:    { main: "#6366f1", highlight: "#818cf8", shadow: "#4f46e5", glow: "#6366f155" },
  sad:         { main: "#6b7280", highlight: "#9ca3af", shadow: "#4b5563", glow: "#6b728033" },
  encouraging: { main: "#7c5cbf", highlight: "#9b7ed8", shadow: "#6a4dab", glow: "#7c5cbf44" },
  sleeping:    { main: "#1e3a5f", highlight: "#2d5a8e", shadow: "#0f2640", glow: "#1e3a5f44" },
  shocked:     { main: "#ef4444", highlight: "#f87171", shadow: "#dc2626", glow: "#ef444466" },
  proud:       { main: "#8b5cf6", highlight: "#a78bfa", shadow: "#7c3aed", glow: "#8b5cf666" },
  waving:      { main: "#7c5cbf", highlight: "#9b7ed8", shadow: "#6a4dab", glow: "#7c5cbf44" },
  fire:        { main: "#f97316", highlight: "#fb923c", shadow: "#ea580c", glow: "#f97316aa" },
  smug:        { main: "#14b8a6", highlight: "#5eead4", shadow: "#0d9488", glow: "#14b8a655" },
  hyped:       { main: "#ec4899", highlight: "#f472b6", shadow: "#db2777", glow: "#ec489988" },
};

const MOUTH_PATHS: Record<MascotMood, string> = {
  idle:        "M 38 62 Q 50 68 62 62",
  happy:       "M 35 60 Q 50 72 65 60",
  celebrating: "M 35 58 Q 50 75 65 58",
  thinking:    "M 42 63 Q 50 60 58 63",
  sad:         "M 38 66 Q 50 60 62 66",
  encouraging: "M 36 60 Q 50 70 64 60",
  sleeping:    "M 42 64 Q 50 66 58 64",
  shocked:     "M 44 62 Q 50 70 56 62",
  proud:       "M 36 59 Q 50 72 64 59",
  waving:      "M 36 60 Q 50 70 64 60",
  fire:        "M 34 58 Q 50 76 66 58",
  smug:        "M 38 62 Q 52 58 62 64",
  hyped:       "M 34 57 Q 50 76 66 57",
};

// ============================================================
// EYE RENDERING
// ============================================================

type EyeType = "open" | "happy" | "star" | "wink" | "sad" | "wide" | "look-up" | "smug" | "closed" | "fire" | "smug-left";

function MascotEye({ type, x, y }: { type: EyeType; x: number; y: number }) {
  if (type === "closed") {
    return (
      <motion.path
        d={`M ${x - 5} ${y} Q ${x} ${y + 3} ${x + 5} ${y}`}
        stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"
      />
    );
  }
  if (type === "happy") {
    return (
      <motion.path
        d={`M ${x - 5} ${y + 2} Q ${x} ${y - 4} ${x + 5} ${y + 2}`}
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
    );
  }
  if (type === "star") {
    const s = 6;
    const starD = `M ${x} ${y - s} L ${x + s * 0.22} ${y - s * 0.31} L ${x + s} ${y - s * 0.05} L ${x + s * 0.36} ${y + s * 0.25} L ${x + s * 0.59} ${y + s} L ${x} ${y + s * 0.55} L ${x - s * 0.59} ${y + s} L ${x - s * 0.36} ${y + s * 0.25} L ${x - s} ${y - s * 0.05} L ${x - s * 0.22} ${y - s * 0.31} Z`;
    return (
      <motion.g
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      >
        <path d={starD} fill="white" stroke="none" />
        <motion.path d={starD} fill="white" stroke="none"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      </motion.g>
    );
  }
  if (type === "wink") {
    return (
      <motion.path
        d={`M ${x - 5} ${y + 1} Q ${x} ${y - 3} ${x + 5} ${y + 1}`}
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ duration: 0.3, delay: 0.5 }}
      />
    );
  }
  if (type === "sad") {
    return (
      <g>
        <motion.path
          d={`M ${x - 5} ${y - 2} Q ${x} ${y + 4} ${x + 5} ${y - 2}`}
          stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"
        />
        <motion.circle cx={x} cy={y + 7} r={1.5} fill="white" opacity={0.5}
          animate={{ y: [0, 6], opacity: [0.5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeIn" }}
        />
      </g>
    );
  }
  if (type === "wide") {
    return (
      <g>
        <circle cx={x} cy={y} r={6.5} fill="white" />
        <circle cx={x} cy={y} r={3.8} fill="#1a1a2e" />
        <circle cx={x + 1.5} cy={y - 1.5} r={1.3} fill="white" />
      </g>
    );
  }
  if (type === "look-up") {
    return (
      <g>
        <circle cx={x} cy={y} r={5.5} fill="white" opacity={0.9} />
        <circle cx={x} cy={y - 2} r={3.2} fill="#1a1a2e" />
        <circle cx={x + 1} cy={y - 3} r={1.1} fill="white" />
      </g>
    );
  }
  if (type === "smug") {
    return (
      <motion.path
        d={`M ${x - 5} ${y + 1} Q ${x} ${y - 5} ${x + 5} ${y + 1}`}
        stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"
      />
    );
  }
  if (type === "fire") {
    return (
      <g>
        <circle cx={x} cy={y} r={6} fill="white" opacity={0.95} />
        <circle cx={x} cy={y} r={3.8} fill="#7c2d12" />
        <motion.circle cx={x} cy={y} r={2.2}
          fill="#f97316"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </g>
    );
  }
  // Default open eye — monster-sized
  return (
    <g>
      <circle cx={x} cy={y} r={5.5} fill="white" opacity={0.9} />
      <circle cx={x} cy={y} r={3.2} fill="#1a1a2e" />
      <circle cx={x + 1} cy={y - 1} r={1.1} fill="white" />
    </g>
  );
}

const EYE_CONFIGS: Record<MascotMood, { left: EyeType; right: EyeType }> = {
  idle:        { left: "open",   right: "open"  },
  happy:       { left: "happy",  right: "happy" },
  celebrating: { left: "star",   right: "star"  },
  thinking:    { left: "look-up",right: "look-up"},
  sad:         { left: "sad",    right: "sad"   },
  encouraging: { left: "wink",   right: "open"  },
  sleeping:    { left: "closed", right: "closed"},
  shocked:     { left: "wide",   right: "wide"  },
  proud:       { left: "smug",   right: "smug"  },
  waving:      { left: "open",   right: "happy" },
  fire:        { left: "fire",   right: "fire"  },
  smug:        { left: "smug",   right: "wink"  },
  hyped:       { left: "star",   right: "star"  },
};

// ============================================================
// IDLE BEHAVIORS — bring Cleo to life when not active
// ============================================================

type IdleAction = "none" | "look-left" | "look-right" | "look-up" | "yawn" | "bounce" | "wiggle";

function useIdleBehavior(mood: MascotMood): { eyeOffset: { x: number; y: number }; idleAction: IdleAction } {
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [idleAction, setIdleAction] = useState<IdleAction>("none");
  const activeMoods: MascotMood[] = ["celebrating", "hyped", "shocked", "fire", "sleeping"];

  useEffect(() => {
    if (activeMoods.includes(mood)) {
      setEyeOffset({ x: 0, y: 0 });
      setIdleAction("none");
      return;
    }

    // Wandering eyes — random gaze every 3-6 seconds
    const eyeTimer = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) {
        setEyeOffset({ x: -2, y: 0 }); // Look left
      } else if (rand < 0.6) {
        setEyeOffset({ x: 2, y: 0 }); // Look right
      } else if (rand < 0.8) {
        setEyeOffset({ x: 0, y: -1.5 }); // Look up
      } else {
        setEyeOffset({ x: 0, y: 0 }); // Center (look at user)
      }
    }, 3000 + Math.random() * 3000);

    // Fidget behaviors — random action every 5-10 seconds
    const fidgetTimer = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.15) {
        setIdleAction("bounce");
        setTimeout(() => setIdleAction("none"), 800);
      } else if (rand < 0.25) {
        setIdleAction("wiggle");
        setTimeout(() => setIdleAction("none"), 600);
      } else if (rand < 0.35 && mood === "idle") {
        setIdleAction("yawn");
        setTimeout(() => setIdleAction("none"), 1500);
      }
    }, 5000 + Math.random() * 5000);

    return () => {
      clearInterval(eyeTimer);
      clearInterval(fidgetTimer);
    };
  }, [mood]);

  return { eyeOffset, idleAction };
}

// Breathing animation wrapper — gentle scale pulse like Duolingo's idle
function BreathingWrapper({ children, mood }: { children: React.ReactNode; mood: MascotMood }) {
  const noBreathMoods: MascotMood[] = ["celebrating", "hyped", "shocked"];
  if (noBreathMoods.includes(mood)) return <>{children}</>;

  const speed = mood === "sleeping" ? 4 : 3;
  return (
    <motion.g
      animate={{ scaleY: [1, 1.015, 1], scaleX: [1, 0.99, 1] }}
      transition={{ duration: speed, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50px 55px" }}
    >
      {children}
    </motion.g>
  );
}

// ============================================================
// AUTO BLINK
// ============================================================

function AutoBlink({ mood, children }: { mood: MascotMood; children: React.ReactNode }) {
  const [blinking, setBlinking] = useState(false);
  const noBlinkMoods: MascotMood[] = ["sleeping", "celebrating", "shocked", "hyped"];

  useEffect(() => {
    if (noBlinkMoods.includes(mood)) return;
    const schedule = () => {
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 120);
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, [mood]);

  if (blinking) {
    return (
      <g>
        <line x1="33" y1="46" x2="43" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="57" y1="46" x2="67" y2="46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  }
  return <>{children}</>;
}

// ============================================================
// MONSTER HORNS (head decoration — replaces old Sprout)
// ============================================================

function MonsterHorns({ mood, colors }: { mood: MascotMood; colors: { main: string; highlight: string; shadow: string } }) {
  const isHappy = ["happy", "celebrating", "proud", "waving", "fire", "hyped"].includes(mood);
  const isSad = mood === "sad";
  const isSleeping = mood === "sleeping";

  const hornColor = colors.shadow;
  const hornTip = colors.highlight;

  return (
    <motion.g
      animate={isHappy
        ? { rotate: [-3, 3, -3], y: [0, -1, 0] }
        : isSad
        ? { rotate: [0], y: [1, 2, 1] }
        : isSleeping
        ? { y: [0, 1, 0] }
        : { rotate: [0, 1, 0] }
      }
      transition={{ duration: isHappy ? 1.0 : 2.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "50px 24px" }}
    >
      {/* Left horn — thick, curved outward, friendly rounded tip */}
      <path
        d="M 36 27 C 34 24 28 18 26 12 C 25 9 28 8 30 10 C 34 14 38 22 40 27 Z"
        fill={hornColor}
      />
      {/* Left horn inner highlight */}
      <path
        d="M 37 25 C 35 22 31 17 29 12 C 29 11 30 10 31 12 C 34 17 37 22 38 25 Z"
        fill={hornTip}
        opacity={0.3}
      />

      {/* Right horn — thick, curved outward (mirrored) */}
      <path
        d="M 64 27 C 66 24 72 18 74 12 C 75 9 72 8 70 10 C 66 14 62 22 60 27 Z"
        fill={hornColor}
      />
      {/* Right horn inner highlight */}
      <path
        d="M 63 25 C 65 22 69 17 71 12 C 71 11 70 10 69 12 C 66 17 63 22 62 25 Z"
        fill={hornTip}
        opacity={0.3}
      />

      {/* Horn tip rounds */}
      <circle cx={27} cy={11} r={2.5} fill={hornTip} opacity={0.5} />
      <circle cx={73} cy={11} r={2.5} fill={hornTip} opacity={0.5} />

      {/* Horn shine highlights */}
      <ellipse cx={33} cy={18} rx={1.5} ry={3} fill="white" opacity={0.18} transform="rotate(-20,33,18)" />
      <ellipse cx={67} cy={18} rx={1.5} ry={3} fill="white" opacity={0.18} transform="rotate(20,67,18)" />

      {/* Fire mode — horn tips glow with flame */}
      {mood === "fire" && (
        <>
          <motion.circle cx={27} cy={10} r={4} fill="#f97316" opacity={0.6}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.3, 0.9] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.circle cx={27} cy={7} r={2.5} fill="#fbbf24" opacity={0.5}
            animate={{ opacity: [0.2, 0.6, 0.2], y: [-1, -3, -1] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          <motion.circle cx={73} cy={10} r={4} fill="#f97316" opacity={0.6}
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.3, 0.9] }}
            transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
          />
          <motion.circle cx={73} cy={7} r={2.5} fill="#fbbf24" opacity={0.5}
            animate={{ opacity: [0.2, 0.6, 0.2], y: [-1, -3, -1] }}
            transition={{ duration: 0.4, repeat: Infinity, delay: 0.15 }}
          />
        </>
      )}

      {/* Hyped mode — sparkles between horns */}
      {mood === "hyped" && (
        <>
          <motion.circle cx={48} cy={14} r={1.5} fill="#fbbf24"
            animate={{ y: [-2, -6, -2], opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
          <motion.circle cx={52} cy={12} r={1} fill="#f472b6"
            animate={{ y: [-2, -5, -2], opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle cx={50} cy={16} r={1.2} fill="#a78bfa"
            animate={{ y: [-1, -4, -1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 0.7, repeat: Infinity, delay: 0.4 }}
          />
        </>
      )}
    </motion.g>
  );
}

// ============================================================
// ACCESSORIES — earned visual rewards on Cleo's head
// ============================================================

type AccessoryType = "crown" | "sunglasses" | "party-hat" | "headband" | "none";

function getAccessory(mood: MascotMood, streakCount?: number, score?: number): AccessoryType {
  if (mood === "celebrating" || mood === "hyped") return "party-hat";
  if (mood === "fire" && (streakCount ?? 0) >= 30) return "crown";
  if (mood === "proud" || mood === "smug") return "sunglasses";
  if ((streakCount ?? 0) >= 14) return "headband";
  return "none";
}

function MascotAccessory({ type, mood }: { type: AccessoryType; mood: MascotMood }) {
  if (type === "none") return null;

  if (type === "crown") {
    return (
      <motion.g
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Crown base — sits between monster horns */}
        <path d="M 38 22 L 40 14 L 45 19 L 50 11 L 55 19 L 60 14 L 62 22 Z" fill="#fbbf24" />
        <path d="M 38 22 L 62 22 L 62 25 L 38 25 Z" fill="#f59e0b" />
        {/* Jewels */}
        <circle cx={50} cy={16} r={1.5} fill="#ef4444" />
        <circle cx={44} cy={19} r={1.2} fill="#3b82f6" />
        <circle cx={56} cy={19} r={1.2} fill="#7c3aed" />
        {/* Sparkle */}
        <motion.circle cx={50} cy={12} r={1} fill="white"
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.g>
    );
  }

  if (type === "sunglasses") {
    return (
      <motion.g
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.2 }}
      >
        {/* Left lens */}
        <rect x={30} y={42} width={14} height={10} rx={3} fill="#1a1a2e" opacity={0.85} />
        {/* Right lens */}
        <rect x={56} y={42} width={14} height={10} rx={3} fill="#1a1a2e" opacity={0.85} />
        {/* Bridge */}
        <path d="M 44 46 Q 50 44 56 46" stroke="#1a1a2e" strokeWidth="2" fill="none" />
        {/* Frame */}
        <rect x={30} y={42} width={14} height={10} rx={3} fill="none" stroke="#333" strokeWidth="1.5" />
        <rect x={56} y={42} width={14} height={10} rx={3} fill="none" stroke="#333" strokeWidth="1.5" />
        {/* Lens shine */}
        <motion.ellipse cx={35} cy={45} rx={3} ry={1.5} fill="white" opacity={0.25}
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.g>
    );
  }

  if (type === "party-hat") {
    return (
      <motion.g
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        style={{ transformOrigin: "50px 20px" }}
      >
        {/* Cone — sits on top of horns */}
        <path d="M 42 24 L 50 4 L 58 24" fill="#ec4899" />
        <path d="M 44 24 L 50 8 L 56 24" fill="#f472b6" opacity={0.5} />
        {/* Stripes */}
        <path d="M 45 18 L 55 18" stroke="#fbbf24" strokeWidth="1.5" />
        <path d="M 43 22 L 57 22" stroke="#a78bfa" strokeWidth="1.5" />
        {/* Pom-pom on top */}
        <motion.circle cx={50} cy={4} r={3} fill="#fbbf24"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        {/* Confetti strings */}
        <motion.path d="M 50 4 Q 55 0 58 2" stroke="#a78bfa" strokeWidth="1" fill="none"
          animate={{ d: ["M 50 4 Q 55 0 58 2", "M 50 4 Q 56 -1 59 3", "M 50 4 Q 55 0 58 2"] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.path d="M 50 4 Q 45 0 42 2" stroke="#60a5fa" strokeWidth="1" fill="none"
          animate={{ d: ["M 50 4 Q 45 0 42 2", "M 50 4 Q 44 -1 41 3", "M 50 4 Q 45 0 42 2"] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </motion.g>
    );
  }

  if (type === "headband") {
    return (
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Headband */}
        <path d="M 30 34 Q 50 28 70 34" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Star emblem */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50px 30px" }}
        >
          <path d="M 50 27 L 51.5 29.5 L 54 30 L 52 32 L 52.5 34.5 L 50 33.5 L 47.5 34.5 L 48 32 L 46 30 L 48.5 29.5 Z" fill="#fbbf24" />
        </motion.g>
      </motion.g>
    );
  }

  return null;
}

// ============================================================
// CELEBRATION PARTICLES (SVG-level)
// ============================================================

const PARTICLE_COLORS = ["#fbbf24", "#f472b6", "#a78bfa", "#60a5fa", "#7c3aed", "#fb7185"];

function CelebrationParticles() {
  return (
    <g>
      {PARTICLE_COLORS.map((color, i) => {
        const angle = (i / PARTICLE_COLORS.length) * 360;
        const rad = (angle * Math.PI) / 180;
        const tx = 50 + Math.cos(rad) * 40;
        const ty = 50 + Math.sin(rad) * 40;
        return (
          <motion.circle
            key={i}
            cx={50} cy={50} r={3}
            fill={color}
            animate={{ cx: [50, tx, tx + Math.cos(rad) * 10], cy: [50, ty, ty + Math.sin(rad) * 10], opacity: [1, 0.8, 0], scale: [1, 1.5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08, ease: "easeOut" }}
          />
        );
      })}
    </g>
  );
}

// ============================================================
// SLEEP ZZZs
// ============================================================

function SleepZzz() {
  return (
    <g>
      {["z", "Z", "z"].map((z, i) => (
        <motion.text
          key={i}
          x={65 + i * 6} y={30 - i * 6}
          fontSize={8 + i * 3}
          fill="#93c5fd"
          opacity={0}
          fontWeight="bold"
          animate={{ y: [30 - i * 6, 10 - i * 6], opacity: [0, 0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        >
          {z}
        </motion.text>
      ))}
    </g>
  );
}

// ============================================================
// ARMS — mood-specific gestures (Duolingo-style expressiveness)
// ============================================================

function MascotArms({ mood, colors }: { mood: MascotMood; colors: { main: string; shadow: string } }) {
  const armColor = colors.shadow;
  const handColor = colors.main;

  // Waving: right arm waves enthusiastically
  if (mood === "waving") {
    return (
      <g>
        {/* Left arm resting */}
        <ellipse cx={26} cy={62} rx={6} ry={4} fill={armColor} opacity={0.9} />
        {/* Right arm waving */}
        <motion.g
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "74px 55px" }}
        >
          <ellipse cx={76} cy={52} rx={6} ry={4} fill={armColor} opacity={0.9} transform="rotate(-30,76,52)" />
          {/* Hand */}
          <circle cx={82} cy={48} r={4} fill={handColor} />
          {/* Fingers */}
          <circle cx={84} cy={45} r={1.5} fill={handColor} />
          <circle cx={86} cy={47} r={1.5} fill={handColor} />
        </motion.g>
      </g>
    );
  }

  // Celebrating/Hyped: both arms up in victory
  if (mood === "celebrating" || mood === "hyped") {
    return (
      <g>
        <motion.g
          animate={{ rotate: [-5, 5, -5], y: [0, -2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "26px 55px" }}
        >
          <ellipse cx={22} cy={46} rx={5.5} ry={4} fill={armColor} opacity={0.9} transform="rotate(30,22,46)" />
          <circle cx={18} cy={42} r={3.5} fill={handColor} />
        </motion.g>
        <motion.g
          animate={{ rotate: [5, -5, 5], y: [0, -2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
          style={{ transformOrigin: "74px 55px" }}
        >
          <ellipse cx={78} cy={46} rx={5.5} ry={4} fill={armColor} opacity={0.9} transform="rotate(-30,78,46)" />
          <circle cx={82} cy={42} r={3.5} fill={handColor} />
        </motion.g>
      </g>
    );
  }

  // Thinking: one hand on chin
  if (mood === "thinking") {
    return (
      <g>
        <ellipse cx={26} cy={62} rx={6} ry={4} fill={armColor} opacity={0.9} />
        <motion.g
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "68px 60px" }}
        >
          <ellipse cx={68} cy={58} rx={5.5} ry={4} fill={armColor} opacity={0.9} transform="rotate(-15,68,58)" />
          <circle cx={64} cy={62} r={3.5} fill={handColor} />
        </motion.g>
      </g>
    );
  }

  // Proud/Smug: arms crossed (overlapping in front)
  if (mood === "proud" || mood === "smug") {
    return (
      <g>
        <ellipse cx={38} cy={66} rx={8} ry={3.5} fill={armColor} opacity={0.85} transform="rotate(10,38,66)" />
        <ellipse cx={62} cy={66} rx={8} ry={3.5} fill={armColor} opacity={0.85} transform="rotate(-10,62,66)" />
      </g>
    );
  }

  // Fire: fist pump
  if (mood === "fire") {
    return (
      <g>
        <ellipse cx={26} cy={62} rx={6} ry={4} fill={armColor} opacity={0.9} />
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "76px 50px" }}
        >
          <ellipse cx={76} cy={50} rx={5.5} ry={4} fill={armColor} opacity={0.9} transform="rotate(-25,76,50)" />
          <circle cx={80} cy={45} r={4} fill={handColor} />
        </motion.g>
      </g>
    );
  }

  // Sad: arms drooping
  if (mood === "sad") {
    return (
      <g>
        <motion.g
          animate={{ y: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx={24} cy={68} rx={6} ry={3.5} fill={armColor} opacity={0.7} transform="rotate(15,24,68)" />
          <ellipse cx={76} cy={68} rx={6} ry={3.5} fill={armColor} opacity={0.7} transform="rotate(-15,76,68)" />
        </motion.g>
      </g>
    );
  }

  // Shocked: arms out wide
  if (mood === "shocked") {
    return (
      <g>
        <motion.g
          animate={{ x: [-1, 1, -1] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        >
          <ellipse cx={18} cy={55} rx={6} ry={4} fill={armColor} opacity={0.9} transform="rotate(20,18,55)" />
          <circle cx={14} cy={52} r={3.5} fill={handColor} />
          <ellipse cx={82} cy={55} rx={6} ry={4} fill={armColor} opacity={0.9} transform="rotate(-20,82,55)" />
          <circle cx={86} cy={52} r={3.5} fill={handColor} />
        </motion.g>
      </g>
    );
  }

  // Encouraging: thumbs up with right hand
  if (mood === "encouraging") {
    return (
      <g>
        <ellipse cx={26} cy={62} rx={6} ry={4} fill={armColor} opacity={0.9} />
        <motion.g
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "76px 55px" }}
        >
          <ellipse cx={76} cy={54} rx={5.5} ry={4} fill={armColor} opacity={0.9} transform="rotate(-20,76,54)" />
          <circle cx={80} cy={49} r={3.5} fill={handColor} />
          {/* Thumb up */}
          <ellipse cx={80} cy={44} rx={1.8} ry={3} fill={handColor} />
        </motion.g>
      </g>
    );
  }

  // Default: relaxed arms at sides
  return (
    <g>
      <motion.g
        animate={{ y: [0, 1, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx={25} cy={63} rx={6} ry={3.5} fill={armColor} opacity={0.8} />
        <ellipse cx={75} cy={63} rx={6} ry={3.5} fill={armColor} opacity={0.8} />
      </motion.g>
    </g>
  );
}

// ============================================================
// STREAK FLAME BADGE
// ============================================================

function StreakFlame({ count, size }: { count: number; size: number }) {
  const intensity = Math.min(count / 30, 1);
  const flameColor = intensity > 0.7 ? "#ef4444" : intensity > 0.4 ? "#f97316" : "#f59e0b";
  const badgeSize = size * 0.32;

  return (
    <motion.div
      className="absolute -top-1 -right-1 flex flex-col items-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      <motion.div
        className="rounded-full flex items-center justify-center shadow-lg"
        style={{
          width: badgeSize,
          height: badgeSize,
          background: `radial-gradient(circle, ${flameColor}dd, ${flameColor}88)`,
          boxShadow: `0 0 ${6 + intensity * 8}px ${flameColor}`,
        }}
        animate={{ scale: [1, 1.08, 1], boxShadow: [`0 0 ${6}px ${flameColor}`, `0 0 ${12}px ${flameColor}`, `0 0 ${6}px ${flameColor}`] }}
        transition={{ duration: 0.8 + intensity * 0.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <span style={{ fontSize: badgeSize * 0.45 }}>🔥</span>
      </motion.div>
      {count >= 3 && (
        <motion.span
          className="text-center font-black leading-none"
          style={{ fontSize: badgeSize * 0.35, color: flameColor }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {count}
        </motion.span>
      )}
    </motion.div>
  );
}

// ============================================================
// MAIN MASCOT SVG
// ============================================================

function MascotSVG({ mood, size, streakCount, score, eyeOffset }: { mood: MascotMood; size: number; streakCount?: number; score?: number; eyeOffset?: { x: number; y: number } }) {
  const eyes = EYE_CONFIGS[mood];
  const mouthPath = MOUTH_PATHS[mood] || MOUTH_PATHS.idle;
  const colors = BODY_COLORS[mood];
  const accessory = getAccessory(mood, streakCount, score);
  const ex = eyeOffset?.x ?? 0;
  const ey = eyeOffset?.y ?? 0;

  // Track previous mood for smooth color transition
  const [prevColors, setPrevColors] = useState(colors);
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    setTransitioning(true);
    const t = setTimeout(() => {
      setPrevColors(colors);
      setTransitioning(false);
    }, 400);
    return () => clearTimeout(t);
  }, [mood]);

  const bodyAnimation = useMemo(() => {
    switch (mood) {
      case "celebrating":
      case "hyped":
        return { y: [0, -8, 2, -8, 0], scale: [1, 1.06, 0.98, 1.06, 1], rotate: [0, -4, 4, -4, 0] };
      case "happy":
      case "proud":
        return { y: [0, -4, 0], scale: [1, 1.02, 1] };
      case "fire":
        return { y: [0, -5, 0], scale: [1, 1.03, 1], rotate: [0, -2, 2, 0] };
      case "sad":
        return { y: [0, 3, 0], scale: [1, 0.97, 1] };
      case "sleeping":
        return { y: [0, 3, 0], scale: [1, 1.02, 1], rotate: [0, 1, 0] };
      case "shocked":
        return { y: [0, -5, 1, -5, 0], scale: [1, 1.05, 0.98, 1.05, 1] };
      case "smug":
        return { y: [0, -2, 0], rotate: [0, -3, 0] };
      default:
        return { y: [0, -3, 0], scale: [1, 1.01, 1] };
    }
  }, [mood]);

  const bodySpeed = mood === "celebrating" || mood === "hyped" ? 0.5 : mood === "sleeping" ? 3.5 : mood === "shocked" ? 0.4 : 2;

  const glowId = `glow-${mood}`;
  const gradId = `grad-${mood}`;
  const prevGradId = `grad-prev-${mood}`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="65%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>
        {/* Previous mood gradient for crossfade */}
        <radialGradient id={prevGradId} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor={prevColors.highlight} />
          <stop offset="65%" stopColor={prevColors.main} />
          <stop offset="100%" stopColor={prevColors.shadow} />
        </radialGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feColorMatrix in="blur" type="matrix"
            values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${mood === "fire" || mood === "hyped" ? "2" : "1.2"} 0`}
            result="coloredBlur"
          />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {(mood === "celebrating" || mood === "hyped") && <CelebrationParticles />}
      {mood === "sleeping" && <SleepZzz />}

      <MonsterHorns mood={mood} colors={colors} />

      {/* Accessory (earned visual reward) */}
      {accessory !== "none" && <MascotAccessory type={accessory} mood={mood} />}

      {/* Drop shadow */}
      <motion.ellipse
        cx={50} cy={84} rx={18} ry={4}
        fill="black" opacity={0.12}
        animate={{ scaleX: bodyAnimation.scale ? [1, 1.05, 1] : [1] }}
        transition={{ duration: bodySpeed, repeat: Infinity, ease: "easeInOut" }}
      />

      <BreathingWrapper mood={mood}>
      <motion.g
        animate={bodyAnimation}
        transition={{ duration: bodySpeed, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Monster tail — curved, poking from right side */}
        <motion.path
          d="M 74 62 C 80 58 86 56 88 50 C 89 48 88 46 86 48 C 84 52 80 56 74 60"
          fill={colors.shadow}
          opacity={0.85}
          animate={{ d: [
            "M 74 62 C 80 58 86 56 88 50 C 89 48 88 46 86 48 C 84 52 80 56 74 60",
            "M 74 62 C 80 58 87 54 90 49 C 91 47 89 45 87 47 C 84 51 80 56 74 60",
            "M 74 62 C 80 58 86 56 88 50 C 89 48 88 46 86 48 C 84 52 80 56 74 60",
          ] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Tail tip highlight */}
        <motion.circle cx={87} cy={49} r={2.5} fill={colors.main} opacity={0.5}
          animate={{ cx: [87, 89, 87], cy: [49, 48, 49] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Feet — chunky monster feet with toe bumps */}
        <ellipse cx={38} cy={78} rx={7.5} ry={4} fill={colors.shadow} opacity={0.9} />
        <ellipse cx={62} cy={78} rx={7.5} ry={4} fill={colors.shadow} opacity={0.9} />
        {/* Toe bumps */}
        <circle cx={33} cy={78} r={2.2} fill={colors.shadow} opacity={0.75} />
        <circle cx={43} cy={78} r={2.2} fill={colors.shadow} opacity={0.75} />
        <circle cx={57} cy={78} r={2.2} fill={colors.shadow} opacity={0.75} />
        <circle cx={67} cy={78} r={2.2} fill={colors.shadow} opacity={0.75} />
        {/* Foot highlights */}
        <ellipse cx={37} cy={77} rx={3.5} ry={1.5} fill={colors.main} opacity={0.35} />
        <ellipse cx={61} cy={77} rx={3.5} ry={1.5} fill={colors.main} opacity={0.35} />

        {/* Body — slightly bottom-heavy monster shape with crossfade */}
        {transitioning && (
          <motion.ellipse
            cx={50} cy={52} rx={27} ry={30}
            fill={`url(#${prevGradId})`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        )}
        <motion.ellipse
          cx={50} cy={52} rx={27} ry={30}
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          initial={transitioning ? { opacity: 0 } : { opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
        {/* Belly bump — gives bottom-heavy monster look */}
        <ellipse cx={50} cy={60} rx={22} ry={14} fill={colors.main} opacity={0.15} />

        {/* Monster spots — organic texture */}
        <ellipse cx={35} cy={55} rx={3.5} ry={3} fill={colors.highlight} opacity={0.2} transform="rotate(-10,35,55)" />
        <ellipse cx={63} cy={48} rx={2.5} ry={2} fill={colors.highlight} opacity={0.18} transform="rotate(15,63,48)" />
        <circle cx={55} cy={64} r={2} fill={colors.highlight} opacity={0.15} />

        {/* Inner body highlight — gives 3D roundness */}
        <ellipse cx={42} cy={44} rx={12} ry={10} fill="white" opacity={0.07} transform="rotate(-15,42,44)" />

        {/* Primary shine */}
        <ellipse cx={37} cy={38} rx={6} ry={3.5} fill="white" opacity={0.22} transform="rotate(-20,37,38)" />
        {/* Secondary small shine */}
        <circle cx={34} cy={43} r={2} fill="white" opacity={0.12} />

        {/* Eyes — with idle gaze offset */}
        <AutoBlink mood={mood}>
          <motion.g animate={{ x: ex, y: ey }} transition={{ duration: 0.4, ease: "easeOut" }}>
            <MascotEye type={eyes.left} x={38} y={46} />
            <MascotEye type={eyes.right} x={62} y={46} />
          </motion.g>
        </AutoBlink>

        {/* Blush cheeks */}
        {(mood === "encouraging" || mood === "waving") && (
          <>
            <ellipse cx={29} cy={55} rx={4} ry={2.5} fill="#fca5a5" opacity={0.35} />
            <ellipse cx={71} cy={55} rx={4} ry={2.5} fill="#fca5a5" opacity={0.35} />
          </>
        )}
        {(mood === "happy" || mood === "proud" || mood === "fire") && (
          <>
            <ellipse cx={29} cy={56} rx={4.5} ry={2.5} fill="#fca5a5" opacity={0.3} />
            <ellipse cx={71} cy={56} rx={4.5} ry={2.5} fill="#fca5a5" opacity={0.3} />
          </>
        )}

        {/* Mouth */}
        <motion.path
          d={mouthPath}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill={["celebrating", "shocked", "hyped"].includes(mood) ? "white" : "none"}
          fillOpacity={0.25}
          animate={{ d: mouthPath }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />

        {/* Monster fangs — cute little triangles at mouth corners */}
        {!["sleeping", "sad"].includes(mood) && (
          <g opacity={0.85}>
            {/* Left fang */}
            <path d="M 39 62 L 41 67 L 43 62" fill="white" />
            {/* Right fang */}
            <path d="M 57 62 L 59 67 L 61 62" fill="white" />
          </g>
        )}

        {/* Extra fangs for big expressions */}
        {(mood === "celebrating" || mood === "hyped") && (
          <g opacity={0.7}>
            <path d="M 45 61 L 47 65 L 49 61" fill="white" />
            <path d="M 51 61 L 53 65 L 55 61" fill="white" />
          </g>
        )}

        {/* Arms with mood-specific gestures */}
        <MascotArms mood={mood} colors={colors} />
      </motion.g>
      </BreathingWrapper>
    </svg>
  );
}

// ============================================================
// DIALOGUE — Cleo's voice: sharp, warm, occasionally snarky
// ============================================================

const DIALOGUE: Record<MascotMood, string[]> = {
  idle: [
    "Ready when you are.",
    "Your daily drop just dropped. 👀",
    "Today's scenarios are fresh off the press.",
    "Let's make some money moves.",
    "2 minutes. That's all it takes.",
    "Your future self is watching.",
    "Got 2 minutes and a functioning brain? Let's go.",
    "Zero prep needed. Just vibes and financial instincts.",
    "I've been sitting here judging your spending habits.",
    "Your net worth won't build itself. Well, mine won't either. I'm a monster.",
    "The drop is fresh. Your excuses aren't.",
    "I stared at a budget spreadsheet for you. You're welcome.",
    "Standing between you and financial literacy: literally nothing.",
    "Your money called. It wants a strategy.",
    "The market doesn't sleep. Neither does Cleo.",
    "You've got time to scroll but not to play? Bold.",
    "Today's scenarios are giving main character energy.",
    "Free financial education with a side of sass. You're welcome.",
    "Every day you skip is a day lifestyle creep wins.",
    "Tick tock. Your daily drop expires at midnight.",
    "I'm a purple monster and I have better savings habits than most adults.",
    "Fun fact: you're already here. Might as well play.",
    "Your bank account's origin story starts with one tap.",
    "Two minutes now saves two years of regret later.",
    "Cleo's been warming up the scenarios for you.",
  ],
  happy: [
    "Big brain energy right there. 🧠",
    "Your future self just high-fived you.",
    "That's how wealth is built — one smart call at a time.",
    "Compound interest is blushing.",
    "Financial flex unlocked. 💪",
    "That's a W. Straight up.",
    "Chef's kiss. Money kiss. Same thing.",
    "The finance girlies would be proud.",
    "Your wallet is doing a happy dance rn.",
    "Somebody call the SEC because that was criminal talent.",
    "You're out here making money moves and I'm living for it.",
    "If your brain was a stock, I'd go all in.",
    "The way you just did that? Effortless.",
    "Your financial IQ is showing and it's gorgeous.",
    "Credit score energy radiating off this one.",
    "Ngl that was kinda beautiful.",
    "This is what financially literate looks like, bestie.",
    "You didn't just pass. You passed with style.",
    "Your savings account felt a warm breeze just now.",
    "That's going on your financial highlight reel.",
    "I'd let you manage my portfolio. And I'm a monster.",
    "Wealth building in real time. No filter needed.",
    "Every correct answer is a tiny deposit into future-you's bank.",
    "Your money intuition is elite. No notes.",
    "If smart money decisions were a sport, you'd go pro.",
  ],
  celebrating: [
    "PERFECT SCORE. You're built different.",
    "Are you a financial advisor?? Because WOW.",
    "That was insane. I need to sit down.",
    "New level unlocked. Cleo is shook.",
    "Your bank account called. It said 'thank you.'",
    "Nobody does it like you do. Nobody.",
    "Full marks. Full facts. Full send. 🚀",
    "I'm a MONSTER and even I can't contain this excitement.",
    "The confetti is for YOU. I ordered it special.",
    "Wall Street is drafting a contract for you as we speak.",
    "You just broke Cleo. Rebooting in celebration mode.",
    "That performance should be framed and hung on a wall.",
    "Your ancestors are nodding approvingly.",
    "I ran out of compliments. You broke the system.",
    "Somebody screenshot this. It's historically significant.",
    "The algorithm wants to be you when it grows up.",
    "THIS IS THE MOMENT WE TRAINED FOR.",
    "Financial literacy speedrun — any% — world record.",
    "Your credit score just texted me a thank you.",
    "If this was a TED talk, it'd be a standing ovation.",
    "I'm not crying. It's just compound interest in my eyes.",
    "You didn't just win. You dominated.",
    "The other players need to see this. Actually don't — it'll scare them.",
    "Peak performance. This is it. This is the peak.",
    "Retirement planning who? You're planning world domination.",
  ],
  thinking: [
    "No rush. Think it through.",
    "Trust your gut on this one.",
    "You know this. I believe in you.",
    "What would your financially-sorted self do?",
    "Take your time — this one's spicy.",
    "Bigger picture. What's the play?",
    "You've got this. I can feel it.",
    "Your brain is buffering. That's actually a good sign.",
    "The right answer doesn't always scream the loudest.",
    "Impulse is the enemy. Patience is the play.",
    "I can see the gears turning. Love that for you.",
    "Think like your future self would.",
    "What would your wallet thank you for?",
    "Sometimes the obvious answer is the trap.",
    "Deep breath. You've seen harder than this.",
    "Channel your inner financial advisor.",
    "The best investors take a second to think too.",
    "No pressure, but also... a tiny bit of pressure.",
    "Cleo believes in your reasoning skills. Genuinely.",
    "The clock is ticking but smart beats fast.",
  ],
  sad: [
    "We've all been there. Literally all of us.",
    "Plot twist! But you'll bounce back.",
    "Even the pros fumble. This is growth.",
    "Your wallet felt that... but it forgives you.",
    "Lifestyle creep wins this round. Not the war.",
    "One wrong turn doesn't reroute the whole journey.",
    "Tomorrow's another shot. Take it.",
    "That answer is getting a participation trophy.",
    "It's not an L, it's a learning receipt.",
    "Your brain will remember this one. Trust me.",
    "Mistakes are just tuition for the school of money.",
    "Even Warren Buffett had off days. Probably.",
    "This is character development, not a character flaw.",
    "Wrong answer, right attitude. That's half the battle.",
    "I still love you. Your wallet still loves you.",
    "Think of it as an expensive lesson that was actually free.",
    "The plot thickens. The comeback strengthens.",
    "Not every swing is a home run. But you're still at bat.",
    "Lifestyle creep is sneaky. That's literally why we're here.",
    "Mark this one down. It won't catch you twice.",
    "Your next answer is already better. I can feel it.",
    "Progress isn't a straight line. It's a squiggle with vibes.",
    "Cleo's seen worse. Much worse. You're fine.",
    "That one was tricky. Even I had to think about it.",
    "Filing this under 'growth moments' and moving on.",
  ],
  encouraging: [
    "Look at you — showing up every day. 🔥",
    "Consistency is your superpower.",
    "The streak lives on!",
    "Day after day. Absolute legend behavior.",
    "Reliable, smart, and kind of unstoppable?",
    "You're building something real here.",
    "Your future is watching you show up. 👏",
    "Showing up is 90% of the battle. You cleared it.",
    "You could've scrolled TikTok. You chose this. Respect.",
    "Your dedication is giving main character energy.",
    "Most people talk about habits. You just built one.",
    "The compound effect of showing up? Unmatched.",
    "Your consistency puts my gym schedule to shame.",
    "Every day you play, your financial IQ levels up.",
    "Discipline isn't boring when you're winning.",
    "Your streak isn't just a number. It's proof.",
    "I'm a digital creature and even I'm motivated by you.",
    "The habit is locked in. The results will follow.",
    "Routine is the foundation of every empire.",
    "You're not just playing. You're investing in yourself.",
    "Showing up when nobody's watching? That's the real flex.",
    "Your future self is writing you a thank-you note.",
    "Consistency beats talent when talent doesn't show up.",
    "You're one of the rare ones. Don't forget that.",
    "The daily grind isn't grinding — it's building.",
  ],
  sleeping: [
    "Oh! You're back! I may have napped.",
    "The prodigal player returns!",
    "Welcome back. Your money skills missed you.",
    "We were worried. Cleo was worried.",
    "Ready to pick up where you left off?",
    "Day one again — or day better-than-before.",
    "I was literally hibernating. You woke me up.",
    "My horns were gathering dust. Thanks for that.",
    "The app missed you. I missed you. Your streak didn't wait though.",
    "Welcome back! I've been talking to myself this whole time.",
    "Cleo rebooting... personality loaded... sass activated.",
    "The financial world kept spinning. Let's catch you up.",
    "I dreamed about compound interest. It was beautiful.",
    "Oh hey! I was just reorganizing my imaginary portfolio.",
    "Time off is fine. Time wasted isn't. Let's make up for both.",
    "Plot twist: the comeback is always stronger than the setback.",
    "Dusted off your profile. It's shiny and ready.",
    "Absence makes the heart grow fonder. And the skills rustier.",
    "Your financial literacy was taking a power nap. Let's wake it up.",
    "I kept your seat warm. Metaphorically. I don't have a body.",
  ],
  shocked: [
    "Streaks can be rebuilt! This is not a drill.",
    "Don't sweat it. Fresh start energy.",
    "The comeback arc starts NOW.",
    "Every champion has off days. Every. Single. One.",
    "Shake it off. You've totally got this.",
    "Streaks end. Dedication doesn't.",
    "Wait — WHAT? Okay. Deep breath. We reset.",
    "The universe is testing you. Pass the test.",
    "I'm shocked but not worried. You've done this before.",
    "New streak starts now. Make it a legendary one.",
    "Cleo didn't see that coming. But Cleo adapts.",
    "That's a plot twist. Here comes the redemption arc.",
    "Reset the counter but not the knowledge.",
    "Even phoenixes have to burn first. You're the phoenix.",
    "The streak broke. Your spirit didn't.",
    "Day 0 is just Day 1 in disguise.",
    "This is temporary. Your skills are permanent.",
    "I've seen comebacks start from worse. Way worse.",
    "Channel that shock into motivation. Let's GO.",
    "The scoreboard reset. The lessons didn't.",
  ],
  proud: [
    "Look at you go. 🔥",
    "Weeks of showing up. That's real.",
    "You're in rare company right now.",
    "This isn't luck. This is discipline.",
    "Cleo is genuinely impressed. No notes.",
    "Consistent. Smart. Slightly intimidating.",
    "You're operating at a level most people dream about.",
    "I'd put you in a museum. 'Exhibit A: Dedication.'",
    "Your streak is giving obsessed in the best way.",
    "Not many make it this far. Acknowledge that.",
    "You're not following the path. You ARE the path.",
    "This is what compound consistency looks like.",
    "Other players see your streak and question their choices.",
    "Quietly excellent. The most dangerous kind.",
    "Your discipline has its own gravitational pull.",
    "Cleo doesn't say 'proud' lightly. This is earned.",
    "You've turned daily drops into a lifestyle. Iconic.",
    "I'd brag about you but I'm trying to stay humble.",
    "Top-tier behavior. Top-tier results. Top-tier human.",
    "If your streak was a stock, it'd be blue-chip.",
  ],
  waving: [
    "HEY! You're back! 👋",
    "Long time no see — let's catch up.",
    "Miss me? I missed you.",
    "Back in action. Let's go!",
    "Life happens. Let's pick it back up.",
    "THE RETURN. This is not a drill.",
    "I was starting to think you forgot about me.",
    "Quick, act natural — the legend is back.",
    "My favorite human just walked in. Don't tell the others.",
    "I've been rehearsing my wave for this exact moment.",
    "The gang's all here. By gang, I mean us.",
    "You disappeared but your financial potential didn't.",
    "Cleo remembers you. Cleo remembers everything.",
    "Welcome back to the best 2 minutes of your day.",
    "Your return just made my entire rendering cycle.",
    "I was about to send a search party.",
    "The comeback kid has entered the building.",
    "Took you long enough! ...I mean, welcome back. 🙃",
    "Zero judgment. Maximum excitement. Let's go!",
    "New day, new you, same amazing Cleo. Let's do this.",
  ],
  fire: [
    "YOU'RE ON FIRE. Don't stop. 🔥🔥🔥",
    "Streak goals. Actual streak goals.",
    "What are you even MADE of?",
    "The IRS wishes they had your consistency.",
    "Not even a long weekend could stop you.",
    "Certified streak machine. It's a lifestyle.",
    "At this point you're a financial literacy weapon.",
    "Your streak has its own Wikipedia page.",
    "They should name a financial instrument after you.",
    "You're not on fire. You ARE the fire.",
    "Insurance companies hate this one simple trick: being you.",
    "Your consistency is statistically improbable. I love it.",
    "If streaks were currency, you'd be rich. Wait — you ARE rich in knowledge.",
    "I'm running out of fire emojis for you.",
    "The streak is now legally old enough to be impressive.",
    "Other apps wish they had a user like you.",
    "Your discipline is a cheat code and I'm here for it.",
    "At this point even your mistakes would be impressive.",
    "The streak isn't a number anymore. It's a personality trait.",
    "You could teach a masterclass on showing up.",
    "Legends are made daily. You're proving it.",
    "Your streak is older than some relationships I've seen.",
    "I'm a digital creature and even I'm intimidated.",
    "This streak deserves its own national holiday.",
    "Keep going. I'm running out of ways to say 'incredible.'",
  ],
  smug: [
    "Already knew you'd get that one.",
    "That wasn't even hard for you, was it.",
    "Barely broke a sweat. Classic.",
    "Look at the big brain on you. 👀",
    "Called it before you clicked it.",
    "You made that look embarrassingly easy.",
    "I'd be offended by how fast you got that if I weren't so proud.",
    "Correct again. Shocking. /s",
    "The answer was obvious. To you. Not to everyone.",
    "You're making the other players look bad. Keep going.",
    "Speed and accuracy? Pick a struggle.",
    "Yawn. Too easy. Give this person a real challenge.",
    "Your confidence is valid and slightly terrifying.",
    "The answer never stood a chance against you.",
    "I love how you didn't even hesitate.",
    "That was disgusting. Disgustingly smart.",
    "Effortless excellence. My favorite genre.",
    "You answered that like you wrote the question.",
    "Another day, another question destroyed.",
    "The quizmaster is running out of tricks for you.",
  ],
  hyped: [
    "LET'S GO. THIS IS THE MOMENT. 🚀",
    "MILESTONE UNLOCKED. CLEO IS SCREAMING.",
    "You just leveled up your entire financial life.",
    "THIS IS HUGE. Do not downplay this.",
    "Achievement unlocked: Being completely unstoppable.",
    "XP multiplied. Cleo multiplied. WE'RE ALL GROWING.",
    "THE ENERGY IN HERE RIGHT NOW. I CAN'T.",
    "SOMEBODY HOLD ME I'M TOO HYPED.",
    "This calls for confetti. And more confetti. ALL the confetti.",
    "You just unlocked a new tier of awesome.",
    "I'm literally vibrating. Can you tell? LOOK AT MY HORNS.",
    "THE PEOPLE NEED TO KNOW WHAT JUST HAPPENED.",
    "If this were the stock market, you just IPO'd at the top.",
    "BREAKING NEWS: Local human absolutely crushes it.",
    "My circuits are overloading with excitement.",
    "YOU ARE THE MOMENT. THE MOMENT IS YOU.",
    "I need a moment. Actually no. NO MOMENTS. MORE HYPE.",
    "This is the energy that builds empires.",
    "Cleo's hype meter just broke. Warranty voided.",
    "The financial literacy hall of fame just called.",
    "Everything about this is perfect. EVERYTHING.",
    "I'm screaming into the digital void FOR you.",
    "INJECT THIS FEELING DIRECTLY INTO MY CODE.",
    "History is being made and I get to watch.",
    "Your future self is literally throwing a parade.",
  ],
};

// ============================================================
// TAP JOKES — Financial humor, puns, one-liners
// ============================================================

const TAP_JOKES: string[] = [
  "My budget is a work of fiction.",
  "Compound interest is just money having babies.",
  "My credit score is a personality trait at this point.",
  "Savings account? You mean my sad little jar of hope.",
  "I'm not broke, I'm pre-revenue.",
  "Budgets are just dreams with math.",
  "My financial plan is 'hope for the best.'",
  "The real inflation is in my confidence.",
  "I have a retirement plan. It's called 'never.'",
  "My portfolio is diversified: anxiety AND denial.",
  "Emergency fund or oat milk? Choose wisely.",
  "Adulting is just Googling 'what is a W-2' annually.",
  "401(k) sounds like a marathon I didn't sign up for.",
  "My bank sends me 'are you okay?' texts.",
  "Rich people don't set alarms. I set 7.",
  "I invest in myself. Returns are pending.",
  "My financial advisor is a Magic 8-Ball.",
  "Net worth? More like net confusion.",
  "I bought a plant. That's basically an investment, right?",
  "My money management style is 'freestyle.'",
  "ETF stands for 'Extremely Terrified of Finances.'",
  "I'm a long-term investor. Meaning I forget I own stocks.",
  "Crypto taught me I can lose money even faster.",
  "My grocery bill thinks it's a car payment.",
  "The only thing growing faster than inflation is my anxiety.",
];

// ============================================================
// TAP ADVICE — Genuinely useful tips, delivered playfully
// ============================================================

const TAP_ADVICE: string[] = [
  "Pay yourself first. Literally. Automate it.",
  "If you can't explain the investment, skip it.",
  "The best time to start saving was yesterday. Second best is now.",
  "Your emergency fund should cover 3-6 months. No exceptions.",
  "Don't invest money you'll need in the next 5 years.",
  "High interest debt first. Always. No debate.",
  "The cheapest car you're happy with is the right car.",
  "Subscriptions are slow leaks. Audit them monthly.",
  "Never cosign a loan. Friendships aren't collateral.",
  "Your raise isn't a raise if your spending goes up too.",
  "Index funds beat 90% of active managers. Seriously.",
  "If it's on sale but you don't need it, it's not a deal.",
  "Track your spending for one month. You'll be horrified. And enlightened.",
  "The 50/30/20 rule: needs, wants, savings. Simple but powerful.",
  "Lifestyle creep is real. That's literally why this app exists.",
  "Negotiate your salary. The worst they say is no.",
  "Free money = employer 401(k) match. Max it.",
  "Credit cards aren't free money. They're future-you's problem.",
  "Wait 48 hours before any purchase over $100.",
  "Renting isn't 'throwing money away.' Sometimes it's smart.",
  "Your net worth is assets minus liabilities. Know your number.",
  "Comparison is the thief of financial peace. Run your own race.",
  "Time in the market beats timing the market. Every time.",
  "An HSA is the most tax-advantaged account that exists. Look into it.",
  "The gap between earning and spending is where wealth lives.",
];

// ============================================================
// CONTEXT-SPECIFIC DIALOGUE POOLS
// Tokens: {name} {streak} {streak_plus_one} {iq} {health} {percentile}
// ============================================================

const CONTEXT_DIALOGUE: Record<string, string[]> = {
  // ── Results screen ──────────────────────────────────────────
  results_strong: [
    "{name}, that was sharp. 💚",
    "Top {percentile}%? Yeah, you belong here.",
    "IQ {iq} — quiet confidence. Love to see it.",
    "Health {health}? You're out here winning for real.",
    "Correct calls stack up. Your future thanks you.",
    "Not everyone gets to {percentile}% club. You did.",
    "{name}, that's what financial fluency looks like.",
    "Your decision-making is giving boardroom energy.",
    "Top {percentile}% and it looks effortless on you.",
    "{name}, you're out here making smart look easy.",
    "IQ {iq}. That's not beginner energy. That's built different.",
    "The scoreboard speaks and it's saying your name.",
    "Health {health}. Stability is attractive, {name}.",
    "Your financial instincts are sharp enough to cut glass.",
    "That's a solid round. Your portfolio would be proud.",
    "{name}, the gap between you and average is growing.",
    "You played that like you read the textbook. Twice.",
    "Strong showing. Your future net worth felt that.",
    "Decision quality: exceptional. Cleo quality: impressed.",
    "You're in the top {percentile}%. That's not luck.",
  ],
  results_weak: [
    "Rough round, {name}. But you showed up — that counts.",
    "Every wrong answer is paid tuition for your future self.",
    "IQ {iq} this round — that number climbs from here.",
    "Health {health}. Room to build. And build you absolutely will.",
    "The comeback arc starts right now. No drama.",
    "One off day doesn't define the habit.",
    "{name}, showing up when it's hard? That's the whole thing.",
    "Not your best, not your last. That's the deal.",
    "Think of this as your villain origin story. Financially.",
    "IQ {iq} today. IQ 'much higher' tomorrow. That's the arc.",
    "Bad rounds build character. You've got plenty now.",
    "Your future self will look back at this and laugh. Promise.",
    "{name}, even the GOAT has bad games. Google it.",
    "Lifestyle creep almost won today. Almost.",
    "This score is just the 'before' in your glow-up montage.",
    "Rough, but you didn't quit. That's the real score.",
    "The market corrects. So do you. Same energy.",
    "Health {health}. Plot twist: it goes up from here.",
    "{name}, this round was practice. Next one's for real.",
    "Today's score is tomorrow's motivation.",
  ],
  results_streak_gained: [
    "Day {streak}. The streak lives. 🔥",
    "{streak} days straight — that's a habit forming.",
    "Another day, another notch. Streak: {streak}.",
    "{name}, {streak} days of showing up. That's not luck, that's you.",
    "Consistency is your edge. {streak} days proves it.",
    "Day {streak} done. Day {streak_plus_one} is already set up.",
    "{streak} and counting. The momentum is real.",
    "Streak: {streak}. Excuses: 0. Math checks out.",
    "{name}, {streak} days. That's a whole vibe.",
    "Day {streak} in the books. Day {streak_plus_one} on deck.",
    "You're {streak} days into becoming unstoppable.",
    "The streak grows. The confidence grows. Everything grows.",
    "{streak} days of choosing growth over comfort.",
    "Your calendar has {streak} days marked 'showed up.'",
    "Day {streak}. Cleo is taking notes for the biography.",
    "{name}, at {streak} days you're not trying anymore — you're being.",
    "Streak update: {streak} days. Status: legendary in progress.",
    "Most people stop at 3 days. You're at {streak}.",
    "{streak} days. Your discipline called — it's proud of you.",
    "Every day is a brick. You've laid {streak} so far.",
  ],
  results_streak_milestone: [
    "{streak} DAYS. That's genuinely rare, {name}.",
    "Milestone hit. {streak} days of financial sharpening.",
    "{name}, {streak} days straight. Let's be honest — you're built different.",
    "A {streak}-day streak? The top 1% is in your sights.",
    "Hall of fame behavior. {streak} days, no excuses.",
    "{streak} DAYS! Cleo is throwing a parade in your honor.",
    "This is {streak}. THAT {streak}. The historic one.",
    "{name}, {streak} consecutive days. That's not a streak, that's a lifestyle.",
    "{streak} days. Most people don't keep plants alive this long.",
    "You hit {streak}. The notification should come with confetti.",
    "Milestone: {streak}. Put it on your resume. Seriously.",
    "{streak} days of compound consistency. The returns are coming.",
    "At {streak} days you've officially outlasted most gym memberships.",
    "{name}, {streak} days. Screenshot this. Frame it. You earned it.",
    "{streak} consecutive days. Your dedication is statistically absurd.",
  ],
  results_streak_broken: [
    "Streak snapped. Your knowledge didn't.",
    "{name}, today restarts a new sequence. Fresh energy.",
    "Records exist to be broken — including this comeback.",
    "Every legend has a reset point. This is yours.",
    "Tomorrow is Day 1 again. Clean slate. Let's go.",
    "The streak ends. The grind doesn't.",
    "Streak's gone but you're still here. That matters more.",
    "New streak starts now. Make this one even longer.",
    "{name}, the counter resets. The brain doesn't.",
    "Day 0 is just the prequel to an epic streak.",
    "Your skills don't have a streak counter. They only go up.",
    "The streak broke. Your commitment to showing up didn't.",
    "Fresh start. No baggage. Just potential.",
    "One chapter ends. The next one's going to be better.",
    "Plot twist: the next streak is the longest one yet.",
  ],
  results_perfect: [
    "PERFECT. Cleo needs to sit down.",
    "500 points. Are you even real?",
    "{name}. FIVE. HUNDRED. POINTS.",
    "Flawless. The definition of financially locked in.",
    "Not a single one wrong. That's elite-tier thinking.",
    "I... I need a moment. 500. FIVE HUNDRED.",
    "{name}, perfection isn't a goal — it's your Tuesday.",
    "The questions were hard. You made them look easy.",
    "500/500. That's not a score, that's a mic drop.",
    "Cleo's jaw is on the floor. If I had a jaw.",
    "You just 100%'d life. The financial section at least.",
    "Every single answer. Correct. I'm literally malfunctioning.",
    "This might be the most impressive thing I've ever seen. And I live in an app.",
    "{name}, the quiz didn't stand a chance.",
    "Perfect score. Imperfect words to describe how proud I am.",
    "500 points. Your brain is operating at factory-new Tesla levels.",
    "Not one wrong. NOT ONE. Go touch grass, you've earned it.",
    "The answer key wishes it was you.",
    "I'd retire after this if I were you. Go out on top.",
    "Flawless victory. Finance edition. Absolutely disgusting talent.",
  ],

  // ── Game screen ─────────────────────────────────────────────
  quiz_correct: [
    "That's the play. 🧠",
    "Money IQ keeps climbing.",
    "Your instincts are dialed in.",
    "Right call. Every right call matters.",
    "That's how wealth accumulates — one good call at a time.",
    "Clean decision. No hesitation.",
    "Nailed it. Moving on like a pro.",
    "Another one in the correct column.",
    "Your brain said 'I got this' and it was right.",
    "Smart money move. Literally.",
    "Correct. Obviously. What else would you pick?",
    "Point secured. Knowledge retained.",
    "You and the right answer — a love story.",
    "Textbook decision-making right there.",
    "That's what financial awareness sounds like.",
    "Right again. Is this getting boring for you?",
    "Your future accountant would approve.",
    "Clean. Efficient. Correct. That's you.",
    "The correct answer knew you were coming for it.",
    "Another brick in the wall of financial literacy.",
  ],
  quiz_correct_fast: [
    "Barely thought about it. 😏",
    "Snapped. Zero hesitation.",
    "First instinct, best instinct.",
    "You already knew that one cold.",
    "Automatic. That's mastery.",
    "Didn't even need the full clock.",
    "Speed AND accuracy? That's unfair.",
    "You answered before I finished reading it.",
    "The timer is offended by how fast that was.",
    "Muscle memory for money. You love to see it.",
    "That was faster than my processing speed. Rude.",
    "Lightning round MVP right here.",
    "You speed-ran that question. World record pace.",
    "The other choices didn't even get a glance. Cold.",
    "Your brain has a turbo button apparently.",
    "No hesitation. No second-guessing. Just vibes.",
    "That answer came out like a reflex. Elite.",
    "You've clearly been here before. Veteran energy.",
    "Instant. Like compound interest but for correctness.",
    "The clock had time left and it's upset about it.",
  ],
  quiz_wrong: [
    "Spicy choice. Different than expected.",
    "Not the play — but now you know why.",
    "Learning disguised as an L.",
    "The trap got you this time. Won't next time.",
    "Filed. Won't happen again.",
    "Every wrong answer sharpens the next right one.",
    "Close, but not quite. The lesson sticks though.",
    "Your brain will autocorrect this next time.",
    "That answer was brave. Incorrect, but brave.",
    "Wrong answer, but right attitude about learning.",
    "Consider that one paid tuition.",
    "Not this time. But the knowledge? Permanent.",
    "That one was tricky. You'll get it next round.",
    "Growth moment activated. Filing away for later.",
    "The universe said 'not yet' on that one.",
    "Miss. But misses are the best teachers.",
    "Almost. Almost counts for something.",
    "That question was designed to trick. And it did.",
    "Your instincts will catch up. Give them time.",
    "Noted. Logged. Next time this question doesn't stand a chance.",
  ],
  // Quiz roasts — savage but funny wrong-answer reactions
  quiz_roast: [
    "Your wallet just filed a restraining order.",
    "Lifestyle creep: 1. You: 0.",
    "I'm a purple monster and even I knew that one.",
    "Somewhere, a financial advisor just flinched.",
    "That answer had the energy of buying crypto at the top.",
    "You picked that one? With your whole chest?",
    "Your money just called. It's seeing other people.",
    "Bold move. Incorrect move. But bold.",
    "That was the financial equivalent of a face plant.",
    "Your savings account is typing... 'we need to talk.'",
    "Wrong. So wrong. Like buying a boat wrong.",
    "My horns curled reading that answer.",
    "That choice has 'impulse purchase at 2am' energy.",
    "Even my imaginary portfolio cringed.",
    "Your bank app just sent a wellness check.",
    "That answer is going on your permanent financial record.",
    "Interesting strategy. By interesting I mean incorrect.",
    "You just funded lifestyle creep's vacation home.",
    "I felt that one in my code. And it hurt.",
    "Confidently wrong is still a vibe, I guess.",
    "The right answer was RIGHT there. Like right there.",
    "Plot twist: it wasn't that one.",
    "Your wallet is now following you on FinStagram out of concern.",
    "I'm not mad. I'm just... financially disappointed.",
    "That answer said 'I love paying full price for everything.'",
  ],
  // Quiz hype — absurdly over-the-top correct-answer celebrations
  quiz_hype: [
    "WARREN BUFFETT JUST CALLED. HE WANTS TIPS.",
    "The entire stock market felt that answer.",
    "EXCUSE ME?? That was FINANCIAL GENIUS.",
    "The Federal Reserve is taking notes rn.",
    "Your money IQ just broke the sound barrier.",
    "SOMEBODY GET THIS PERSON A HEDGE FUND.",
    "The economy just improved because of that answer.",
    "Wall Street traders are shaking. SHAKING.",
    "That answer was so good it should be illegal.",
    "You just solved personal finance. Pack it up everyone.",
    "THE SEC IS REQUESTING YOUR CONSULTATION.",
    "That wasn't an answer. That was a STATEMENT.",
    "Your financial literacy has its own gravitational pull.",
    "BREAKING: Local genius destroys quiz question.",
    "The yield curve just corrected itself because of you.",
    "That answer deserves a standing ovation. I'm standing. Digitally.",
    "You answered that like you WROTE the financial system.",
    "THE ENERGY. THE PRECISION. THE ABSOLUTE MASTERY.",
    "Somewhere a textbook just added your name to the glossary.",
    "That's not an answer. That's a MASTERCLASS.",
    "Your brain should be classified as a financial weapon.",
    "I need to lie down after witnessing that level of correctness.",
    "The financial literacy gods just smiled upon you.",
    "That answer has 'early retirement' written all over it.",
    "You didn't just answer correctly. You answered HISTORICALLY.",
  ],
  quiz_timeout: [
    "Timer wins this round. It happens.",
    "Decision paralysis is expensive — in life too.",
    "Took too long — classic overthink.",
    "Next time trust your first read.",
    "The clock doesn't wait. Neither does real life.",
    "Hesitation has a price. File it.",
    "The timer showed no mercy. Typical timer behavior.",
    "Overthinking is just perfectionism in disguise. And it just cost you.",
    "Your analysis was thorough. Too thorough. Way too thorough.",
    "The sand ran out while you were still thinking.",
    "Time is money. You just spent all of both.",
    "Pro tip: a fast wrong answer teaches more than no answer.",
    "The clock doesn't negotiate. Noted for next time.",
    "Your brain was still loading when the timer said 'nah.'",
    "Indecision is the most expensive choice.",
    "In real life, the sale also expires. Same energy.",
    "The timer said 'times up' and it wasn't lying.",
    "Analysis paralysis: the silent portfolio killer.",
    "Your gut had the answer. Your brain vetoed it. Classic.",
    "Speed matters. Not just in finance — but especially in finance.",
  ],

  // ── Home screen ─────────────────────────────────────────────
  home_inactive: [
    "You came back. That's what matters. 👋",
    "{name}! Real talk — missed you around here.",
    "Long break. Zero judgment. Ready to rebuild?",
    "Life gets busy. Money doesn't wait.",
    "Picking up exactly where you left off.",
    "The streak reset. The knowledge didn't.",
    "You ghosted me. But I forgive you. This time.",
    "{name}! I was about to put up missing posters.",
    "The financial literacy world kept spinning. Let's catch up.",
    "Welcome back. I saved your spot. Metaphorically.",
    "No judgment zone. Just vibes and scenarios.",
    "Your brain cells remember even if your streak doesn't.",
    "{name}, the comeback is always stronger. Always.",
    "Gone but never forgotten. By me. Cleo. Your bestie.",
    "Fresh start, same potential. Let's build.",
  ],
  home_streak_reminder: [
    "Your {streak}-day streak is on the line today.",
    "Day {streak} is waiting for you, {name}.",
    "Don't let that {streak}-day streak slip.",
    "{name}, your streak is too good to waste today.",
    "{streak} days. Let's make it {streak_plus_one}.",
    "One more day and {streak} becomes {streak_plus_one}. Easy math.",
    "{streak} days of showing up. Don't stop now.",
    "{name}, day {streak_plus_one} isn't going to earn itself.",
    "Your streak is staring at you. Play today.",
    "The streak wants to grow. Feed the streak, {name}.",
    "You didn't come this far to stop at {streak}.",
    "{streak} days strong. Make it {streak_plus_one}. I dare you.",
    "Breaking this streak would be a crime. A financial crime.",
    "{name}, your {streak}-day streak is counting on you.",
    "Day {streak_plus_one} is literally 2 minutes away.",
  ],
  home_first_time: [
    "Hey {name}! First drop. No pressure — just vibes and instincts.",
    "Welcome. Cleo's been waiting. Let's see what you've got.",
    "New here? Perfect time. First drop's a warm-up.",
    "{name}, your financial era starts today.",
    "First drop unlocked. Let's find out what your money IQ is.",
    "Day 1. Chapter 1. {name}'s financial origin story.",
    "Fresh player alert! Let's see what you're working with.",
    "{name}, welcome to the smartest 2 minutes of your day.",
    "First round jitters? Don't worry — Cleo's got you.",
    "Welcome to the club, {name}. Population: growing fast.",
    "Your money IQ is about to get its first data point.",
    "No right or wrong on day 1. Okay there is. But no pressure.",
    "{name}, this is where the magic starts. Tap play.",
    "Brand new player. Brand new potential. Let's go.",
    "Everyone starts at zero, {name}. Legends start today.",
  ],

  // ── Game mode lobbies ────────────────────────────────────────
  coop_lobby: [
    "Teamwork makes the dream work.",
    "Two heads, one wallet. Let's go.",
    "Pick your partner wisely, {name}.",
    "Co-op mode: where friendships get financially tested.",
    "Ready to show your friend who's smarter with money?",
    "Tag team time. Your partner better keep up.",
    "Together you'll make smarter choices. Or blame each other.",
    "Co-op unlocked. Now pick someone you trust with money decisions.",
    "Best duos in history: peanut butter and jelly. You and your friend.",
    "Friendly competition or friendly cooperation? Both, honestly.",
  ],
  survival_lobby: [
    "Only the savviest survive.",
    "Last spender standing. No pressure.",
    "Survival mode: where financial discipline meets battle royale.",
    "May the best money brain win.",
    "One wrong move and you're out. Stay sharp.",
    "The arena awaits, {name}. Show them what smart looks like.",
    "Survival isn't about being perfect. It's about being last.",
    "Everyone thinks they're the smartest until survival mode.",
    "Don't let lifestyle creep eliminate you.",
    "Nerves of steel, wallet of gold. Let's do this.",
  ],
  arcade_lobby: [
    "Arcade mode! Let's rack up some points.",
    "Speed rounds and bonuses. Your kind of party.",
    "How fast can you make smart money decisions?",
    "Arcade vibes only. No time to overthink.",
    "Quick thinking pays off here, {name}.",
    "Ready to speed-run some financial wisdom?",
    "Arcade mode: where fast meets financially savvy.",
    "Bonus points await. Show Cleo what you've got.",
    "Think fast, earn faster. That's the arcade way.",
    "Your reflexes vs. lifestyle creep. Game on.",
  ],
  play_hub: [
    "So many modes, so little time.",
    "Pick your challenge, {name}.",
    "Every mode makes you sharper with money.",
    "Ready to level up? Choose wisely.",
    "The game hub awaits. What's your mood?",
    "Daily, arcade, co-op, survival... decisions, decisions.",
    "Your training grounds. Pick a mode and let's go.",
    "Every mode is a new way to outsmart lifestyle creep.",
  ],
};

// ============================================================
// ANTI-REPEAT DIALOGUE MEMORY
// ============================================================

const _dialogueHistory: string[] = [];

function getWithoutRepeat(lines: string[]): string {
  const recentCount = Math.min(8, lines.length - 1);
  const recent = _dialogueHistory.slice(-recentCount);
  const available = lines.filter(l => !recent.includes(l));
  const pool = available.length > 0 ? available : lines;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  _dialogueHistory.push(chosen);
  if (_dialogueHistory.length > 30) _dialogueHistory.shift();
  return chosen;
}

// ============================================================
// PERSONALIZATION TEMPLATE ENGINE
// ============================================================

function personalizeDialogue(template: string, ctx?: MascotContext): string {
  if (!ctx) return template;
  return template
    .replace(/\{name\}/g, ctx.username ? ctx.username.split(" ")[0] : "hey")
    .replace(/\{streak\}/g, String(ctx.streak ?? 0))
    .replace(/\{streak_plus_one\}/g, String((ctx.streak ?? 0) + 1))
    .replace(/\{iq\}/g, String(ctx.iq ?? 0))
    .replace(/\{health\}/g, String(ctx.moneyHealth ?? 0))
    .replace(/\{percentile\}/g, String(ctx.percentile ?? 0));
}

// ============================================================
// MAIN DIALOGUE RESOLVER
// ============================================================

// Time-of-day aware dialogue overlay
const TIME_AWARE_LINES: Record<string, string[]> = {
  morning: [
    "Morning grind hitting different. ☀️",
    "Before 9am? You're already winning.",
    "Coffee and financial literacy. Elite combo.",
    "Early bird gets the compound interest.",
  ],
  afternoon: [
    "Post-lunch brain is the sharpest brain.",
    "Afternoon sesh. The grind doesn't nap.",
    "3pm slump? Not for your money IQ.",
    "Afternoon productivity unlocked.",
  ],
  late_night: [
    "Late night money check-in? Respect.",
    "Can't sleep until you level up. Relatable.",
    "Night owl money moves hit different.",
    "Midnight financial literacy arc? I'm here for it.",
  ],
  weekend: [
    "Weekend warrior energy. Your wallet approves.",
    "Saturday learning? The streets aren't ready.",
    "Most people brunch on weekends. You build wealth.",
  ],
};

function getTimeAwareOverride(): string | null {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  let pool: string[] | undefined;
  if (day === 0 || day === 6) pool = TIME_AWARE_LINES.weekend;
  else if (hour >= 5 && hour < 9) pool = TIME_AWARE_LINES.morning;
  else if (hour >= 13 && hour < 15) pool = TIME_AWARE_LINES.afternoon;
  else if (hour >= 22 || hour < 2) pool = TIME_AWARE_LINES.late_night;
  if (!pool) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}

// Derive the best context key from rich context
function resolveContextKey(ctx: MascotContext): string | null {
  const { screen, wasCorrect, wasTimeout, timeRemainingOnAnswer, score,
          streakGained, streakBroken, isStreakMilestone, daysInactive,
          streak } = ctx;

  if (screen === "results") {
    if (score !== undefined && score >= 480) return "results_perfect";
    if (isStreakMilestone) return "results_streak_milestone";
    if (streakBroken) return "results_streak_broken";
    if (streakGained) return "results_streak_gained";
    if (score !== undefined && score >= 320) return "results_strong";
    return "results_weak";
  }

  if (screen === "game") {
    if (wasTimeout) return "quiz_timeout";
    if (wasCorrect && (timeRemainingOnAnswer ?? 99) >= 14) return "quiz_correct_fast";
    if (wasCorrect) return Math.random() < 0.4 ? "quiz_hype" : "quiz_correct";
    if (wasCorrect === false) return Math.random() < 0.5 ? "quiz_roast" : "quiz_wrong";
  }

  if (screen === "home") {
    if (daysInactive && daysInactive >= 7) return "home_inactive";
    if (streak && streak > 0) return "home_streak_reminder";
    if (streak === 0) return "home_first_time";
  }

  if (screen === "coop-lobby") return "coop_lobby";
  if (screen === "survival-lobby") return "survival_lobby";
  if (screen === "arcade") return "arcade_lobby";
  if (screen === "play-hub") return "play_hub";

  return null;
}

export function getMascotContextDialogue(ctx: MascotContext): string {
  const key = resolveContextKey(ctx);
  if (key && CONTEXT_DIALOGUE[key]) {
    const raw = getWithoutRepeat(CONTEXT_DIALOGUE[key]);
    return personalizeDialogue(raw, ctx);
  }
  return "";
}

export function getMascotDialogue(mood: MascotMood, timeAware = false): string {
  if (timeAware) {
    const override = getTimeAwareOverride();
    if (override && Math.random() < 0.25) return override;
  }
  return getWithoutRepeat(DIALOGUE[mood] || DIALOGUE.idle);
}

// ============================================================
// EASTER EGG DIALOGUES
// ============================================================

const EASTER_EGGS = [
  "Did you just tap me 5 times? We're best friends now.",
  "Okay okay, I can take a hint. Let's get hyped! 🎉",
  "You found a secret. Cleo approves of your curiosity.",
  "5 taps = certified Cleo fan. Here's a hug. 🤗",
  "THE PEOPLE DEMAND CLEO. And Cleo delivers.",
  "You're tapping me like I owe you money.",
  "5 taps?? That's basically a secret handshake now.",
  "Cleo lore unlocked: I was born in a JSON file. It was beautiful.",
  "If you tap me 10 times next I'll... actually don't. My pixels hurt.",
  "Achievement unlocked: Annoying a Digital Creature.",
  "My therapist would say you have attachment issues. I say keep tapping.",
  "Congratulations, you've discovered the 'Cleo is ticklish' feature.",
  "I'm adding you to my favorites list. It's just you. You're the list.",
  "Plot twist: I was testing YOUR patience. You passed.",
  "We've reached a new level of friendship. I'm uncomfortable and delighted.",
];

const LONG_PRESS_SECRETS = [
  "Pssst. The #1 rule? Spend less than you earn. That's it.",
  "Secret tip: 20% off your next impulse buy — just wait 24 hours.",
  "You didn't hear this from me: index funds beat most hedge funds.",
  "Ultra-secret: automating savings > willpower. Every time.",
  "The real lifestyle creep is thinking you need more stuff to be happy.",
  "Your credit utilization should stay under 30%. Ideally under 10%.",
  "The Rule of 72: divide 72 by your interest rate = years to double.",
  "Negotiating salary at a new job is worth 10x any coupon clipping.",
  "Keep 1-2 months expenses in checking. Rest goes to high-yield savings.",
  "Tax-loss harvesting sounds fancy but it's just selling losers strategically.",
  "The $5 latte isn't why you're broke. The $500/month lifestyle creep is.",
  "Backdoor Roth IRA. Google it. You'll thank Cleo later.",
  "Your most expensive habit isn't a habit — it's keeping up with friends.",
  "Umbrella insurance costs $200/year and protects your entire net worth.",
  "The biggest financial risk isn't the market. It's not starting at all.",
];

// ============================================================
// PREMIUM SPEECH BUBBLE — iMessage-style with typing indicator
// ============================================================

type BubbleSide = "right" | "left" | "top" | "bottom";

// Typing indicator dots ("..." animation before message)
function TypingIndicator({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: 5, height: 5, background: color, opacity: 0.5 }}
          animate={{ opacity: [0.3, 0.8, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function SpeechBubble({ message, position = "right", mood }: {
  message: string;
  position?: BubbleSide;
  mood?: MascotMood;
}) {
  const [phase, setPhase] = useState<"typing" | "revealing" | "done">("typing");
  const [displayed, setDisplayed] = useState("");
  const positionRef = useRef<HTMLDivElement>(null);
  const [nudgeX, setNudgeX] = useState(0);
  const accentColor = mood ? BODY_COLORS[mood].main : "#34a874";
  const EDGE_PAD = 12;
  const isVertical = position === "top" || position === "bottom";

  useEffect(() => {
    setDisplayed("");
    setPhase("typing");

    // Show typing indicator for 600ms before revealing text
    const typingTimer = setTimeout(() => {
      setPhase("revealing");
      let i = 0;
      const interval = setInterval(() => {
        if (i >= message.length) { setPhase("done"); clearInterval(interval); return; }
        setDisplayed(message.slice(0, i + 1));
        i++;
      }, 42); // Faster typing for snappier feel
      return () => clearInterval(interval);
    }, 600);

    return () => clearTimeout(typingTimer);
  }, [message]);

  // Viewport-aware nudge: measure the NATURAL centered position (outer div, no nudge applied)
  // and compute how much to shift so the bubble stays within the viewport.
  // The nudge is applied to a separate child div so the measurement stays stable
  // and never causes an infinite re-render loop.
  useLayoutEffect(() => {
    if (!positionRef.current) return;
    const rect = positionRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    let x = 0;
    if (rect.left < EDGE_PAD) x = EDGE_PAD - rect.left;
    else if (rect.right > vw - EDGE_PAD) x = (vw - EDGE_PAD) - rect.right;
    if (x !== nudgeX) setNudgeX(x);
  });

  // CSS-only positioning styles — no Tailwind transform classes that FM could override.
  // Outer div handles NATURAL position (always centered, no nudge).
  // Nudge is applied to a separate child div to keep measurement stable.
  const positionStyle: React.CSSProperties = (() => {
    switch (position) {
      case "right":
        return { left: "100%", marginLeft: 12, top: "50%", transform: "translateY(-50%)" };
      case "left":
        return { right: "100%", marginRight: 12, top: "50%", transform: "translateY(-50%)" };
      case "top":
        return { bottom: "100%", marginBottom: 12, left: "50%", transform: "translateX(-50%)" };
      case "bottom":
        return { top: "100%", marginTop: 12, left: "50%", transform: "translateX(-50%)" };
    }
  })();

  // Tail — counter-shift by -nudgeX so it still points at the mascot center
  const tailBase: Record<BubbleSide, React.CSSProperties> = {
    right:  { left: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "0 0 0 4px" },
    left:   { right: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "0 4px 0 0" },
    top:    { bottom: -6, left: `calc(50% - ${nudgeX}px)`, transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "0 0 4px 0" },
    bottom: { top: -6, left: `calc(50% - ${nudgeX}px)`, transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "4px 0 0 0" },
  };

  // Entry animation — soft fade-in with gentle scale
  const enterFrom = {
    right:  { opacity: 0, scale: 0.92, x: -4 },
    left:   { opacity: 0, scale: 0.92, x: 4 },
    top:    { opacity: 0, scale: 0.92, y: 4 },
    bottom: { opacity: 0, scale: 0.92, y: -4 },
  }[position];

  return (
    <div
      ref={positionRef}
      className="absolute z-20"
      style={{
        ...positionStyle,
        maxWidth: `min(280px, calc(100vw - ${EDGE_PAD * 2}px))`,
        width: isVertical ? `min(280px, calc(100vw - ${EDGE_PAD * 2}px))` : "max-content",
      }}
    >
      {/* Nudge wrapper — shifts bubble within viewport without affecting the measured position above */}
      <div style={isVertical && nudgeX ? { transform: `translateX(${nudgeX}px)` } : undefined}>
      <motion.div
        initial={enterFrom}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2, ease: "easeIn" } }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative">
          {/* Rounded tail — counter-shifted so it still points at the mascot */}
          <div
            className="absolute"
            style={{
              ...tailBase[position],
              background: "hsl(var(--card) / 0.96)",
              border: `1px solid ${accentColor}25`,
              zIndex: -1,
            }}
          />
          <motion.div
            className="rounded-2xl px-4 py-3 max-w-[280px] min-w-[100px] backdrop-blur-md"
            style={{
              background: "hsl(var(--card) / 0.96)",
              border: `1.5px solid ${accentColor}25`,
              boxShadow: `0 8px 32px ${accentColor}15, 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)`,
            }}
            animate={{ boxShadow: [
              `0 8px 32px ${accentColor}12, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.06)`,
              `0 8px 40px ${accentColor}22, 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.1)`,
              `0 8px 32px ${accentColor}12, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.06)`,
            ]}}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Cleo label */}
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>Cleo</span>
            </div>

            {phase === "typing" ? (
              <TypingIndicator color={accentColor} />
            ) : (
              <p className="text-[13px] font-medium text-foreground leading-relaxed tracking-[-0.01em]">
                {displayed}
                {phase === "revealing" && (
                  <motion.span
                    className="inline-block w-[2px] h-[11px] ml-0.5 align-middle rounded-full"
                    style={{ background: accentColor }}
                    animate={{ opacity: [1, 0.3] }}
                    transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// MOOD-BASED GLOW RING
// ============================================================

function GlowRing({ mood, size }: { mood: MascotMood; size: number }) {
  const color = BODY_COLORS[mood].glow;
  const glowMoods: MascotMood[] = ["celebrating", "fire", "hyped", "proud"];
  if (!glowMoods.includes(mood)) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        width: size + 16,
        height: size + 16,
        left: -8, top: -8,
        borderRadius: "50%",
        boxShadow: `0 0 20px 8px ${color}, 0 0 40px 16px ${color}66`,
      }}
      animate={{ opacity: [0.6, 1, 0.6], scale: [0.97, 1.03, 0.97] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ============================================================
// MAIN MASCOT COMPONENT
// ============================================================

export function Mascot({
  mood = "idle",
  size = "md",
  message,
  showBubble = true,
  speechDelay = 1200,
  disableTapBubble = false,
  forceBubbleSide,
  className,
  onClick,
  animate: shouldAnimateProp = true,
  streakCount,
  showStreakFlame = false,
  context,
}: MascotProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = shouldAnimateProp && !prefersReducedMotion;
  const { vibrateLight, vibrateMedium, vibrateMilestone, vibrateSuccess, vibrateError } = useHaptic();
  const { eyeOffset, idleAction } = useIdleBehavior(mood);

  // Compute initial message: context-aware > explicit message > mood-based
  const computeInitialMessage = useCallback(() => {
    if (message) return message;
    if (context) {
      const ctxMsg = getMascotContextDialogue(context);
      if (ctxMsg) return ctxMsg;
    }
    return getMascotDialogue(mood, true);
  }, [message, context, mood]);

  const [currentMessage, setCurrentMessage] = useState(computeInitialMessage);
  // Start hidden; the initial appearance is deferred by speechDelay
  const [bubbleVisible, setBubbleVisibleRaw] = useState(false);
  const bubbleVisibleRef = useRef(false);
  const setBubbleVisible = useCallback((v: boolean) => {
    bubbleVisibleRef.current = v;
    setBubbleVisibleRaw(v);
  }, []);
  const [tapCount, setTapCount] = useState(0);
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  const [currentMood, setCurrentMood] = useState<MascotMood>(mood);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Deferred initial appearance — lets the page settle before Cleo speaks
  const initialDelayFired = useRef(false);
  useEffect(() => {
    if (initialDelayFired.current || !showBubble) return;
    const t = setTimeout(() => {
      initialDelayFired.current = true;
      const msg = computeInitialMessage();
      setCurrentMessage(msg);
      setBubbleVisible(true);
      setIsSpeaking(true);
    }, speechDelay);
    return () => clearTimeout(t);
  }, [showBubble, speechDelay, computeInitialMessage, setBubbleVisible]);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapResetRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressRef = useRef<ReturnType<typeof setTimeout>>();
  const pixelSize = SIZE_MAP[size];

  // ── Smart bubble side detection ─────────────────────────────
  const [bubbleSide, setBubbleSide] = useState<BubbleSide>(
    forceBubbleSide ?? (size === "xs" || size === "sm" ? "top" : "right")
  );

  const detectBubbleSide = useCallback(() => {
    if (forceBubbleSide) { setBubbleSide(forceBubbleSide); return; }
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const BUBBLE_WIDTH = 280;
    const BUBBLE_HEIGHT = 100;
    const MIN_PAD = 12;
    // Sticky headers are typically h-14 (56px). Top-positioned bubbles must
    // clear the header so they don't render behind z-50 sticky elements.
    const TOP_PAD = 68; // 56px header + 12px margin
    const hasRight = rect.right + BUBBLE_WIDTH + 12 < vw - MIN_PAD;
    const hasLeft  = rect.left  - BUBBLE_WIDTH - 12 > MIN_PAD;
    const hasTop   = rect.top - BUBBLE_HEIGHT - 12 > TOP_PAD;
    // On mobile screens (< 500px), always prefer top/bottom so the
    // SpeechBubble nudge logic can keep it within the viewport.
    if (vw < 500) {
      if (hasTop) setBubbleSide("top");
      else setBubbleSide("bottom");
    } else if (hasRight) setBubbleSide("right");
    else if (hasLeft) setBubbleSide("left");
    else if (hasTop) setBubbleSide("top");
    else setBubbleSide("bottom");
  }, []);

  // ── Sync mood + message when props change ──────────────────
  useEffect(() => {
    setCurrentMood(mood);
  }, [mood]);

  useEffect(() => {
    setBubbleVisible(showBubble);
    setIsSpeaking(showBubble);
    if (showBubble) {
      const msg = computeInitialMessage();
      setCurrentMessage(msg);
    }
  }, [showBubble]);

  useEffect(() => {
    if (bubbleVisible) detectBubbleSide();
  }, [bubbleVisible]);

  useEffect(() => {
    if (!bubbleVisible) { setIsSpeaking(false); return; }
    setIsSpeaking(true);
    const readTime = Math.max(6000, (currentMessage?.length || 0) * 62 + 3000);
    const t = setTimeout(() => { setBubbleVisible(false); setIsSpeaking(false); }, readTime);
    return () => clearTimeout(t);
  }, [bubbleVisible, currentMessage]);

  // Haptic feedback on mood change
  useEffect(() => {
    if (mood === "celebrating" || mood === "hyped") vibrateMilestone?.();
    else if (mood === "happy" || mood === "fire") vibrateSuccess?.();
    else if (mood === "sad" || mood === "shocked") vibrateError?.();
    else if (mood === "proud") vibrateMedium?.();
  }, [mood]);

  const handleTap = useCallback(() => {
    vibrateLight?.();

    if (disableTapBubble) {
      onClick?.();
      return;
    }

    if (bubbleVisibleRef.current) {
      setBubbleVisible(false);
      setIsSpeaking(false);
      onClick?.();
      return;
    }

    const next = tapCount + 1;
    setTapCount(next);

    if (tapResetRef.current) clearTimeout(tapResetRef.current);
    tapResetRef.current = setTimeout(() => setTapCount(0), 1500);

    if (next >= 5) {
      setIsEasterEgg(true);
      setCurrentMood("hyped");
      setCurrentMessage(getRandomLine(EASTER_EGGS));
      setBubbleVisible(true);
      vibrateMilestone?.();
      setTapCount(0);
      setTimeout(() => {
        setIsEasterEgg(false);
        setCurrentMood(mood);
      }, 3000);
      return;
    }

    let tapMsg: string;
    if (context && context.screen === "home") {
      // Home screen: mix context dialogue with jokes and tips
      const roll = Math.random();
      if (roll < 0.25) {
        tapMsg = getWithoutRepeat(TAP_JOKES);
      } else if (roll < 0.45) {
        tapMsg = getWithoutRepeat(TAP_ADVICE);
      } else {
        tapMsg = getMascotContextDialogue(context) || getMascotDialogue(currentMood);
      }
    } else if (context) {
      tapMsg = getMascotContextDialogue(context) || getMascotDialogue(currentMood);
    } else {
      const roll = Math.random();
      if (roll < 0.30) {
        tapMsg = getWithoutRepeat(TAP_JOKES);
      } else if (roll < 0.50) {
        tapMsg = getWithoutRepeat(TAP_ADVICE);
      } else {
        tapMsg = getMascotDialogue(currentMood);
      }
    }
    setCurrentMessage(tapMsg);
    setBubbleVisible(true);
    onClick?.();
  }, [tapCount, currentMood, mood, context, onClick, vibrateLight, vibrateMilestone, setBubbleVisible, disableTapBubble]);

  const handlePointerDown = useCallback(() => {
    longPressRef.current = setTimeout(() => {
      vibrateMilestone?.();
      setCurrentMessage(getRandomLine(LONG_PRESS_SECRETS));
      setBubbleVisible(true);
    }, 700);
  }, [vibrateMilestone]);

  const handlePointerUp = useCallback(() => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center cursor-pointer select-none", className)}
      onClick={handleTap}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ touchAction: "manipulation" }}
      data-testid="mascot-character"
      role="img"
      aria-label={`Cleo is ${currentMood}`}
    >
      {shouldAnimate && <GlowRing mood={currentMood} size={pixelSize} />}

      <motion.div
        whileTap={shouldAnimate ? { scale: 0.88 } : {}}
        animate={
          isEasterEgg && shouldAnimate
            ? { rotate: [0, -15, 15, -10, 10, 0], y: [0, -8, 0] }
            : isSpeaking && shouldAnimate
              ? { rotate: [-1.5, 1.5, -1.5], transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } }
              : {}
        }
        transition={isEasterEgg ? { duration: 0.5 } : { duration: 0.8 }}
      >
        <motion.div
          animate={
            idleAction === "bounce" ? { y: [0, -6, 0] } :
            idleAction === "wiggle" ? { rotate: [0, -3, 3, -2, 2, 0] } :
            {}
          }
          transition={
            idleAction === "bounce" ? { duration: 0.4, ease: "easeOut" } :
            idleAction === "wiggle" ? { duration: 0.5, ease: "easeInOut" } :
            {}
          }
        >
          <MascotSVG mood={currentMood} size={pixelSize} streakCount={streakCount} score={context?.score} eyeOffset={shouldAnimate ? eyeOffset : undefined} />
        </motion.div>

        {showStreakFlame && streakCount && streakCount > 0 && (
          <StreakFlame count={streakCount} size={pixelSize} />
        )}
      </motion.div>

      <AnimatePresence>
        {bubbleVisible && currentMessage && (
          <SpeechBubble
            message={currentMessage}
            position={bubbleSide}
            mood={currentMood}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// INLINE MASCOT (game page, post-answer)
// ============================================================

export function MascotInline({
  mood = "idle",
  message,
  className,
  context,
}: {
  mood?: MascotMood;
  message?: string;
  className?: string;
  context?: MascotContext;
}) {
  const { vibrateLight } = useHaptic();
  const colors = BODY_COLORS[mood];

  // Resolve display message: explicit > context > mood
  const displayMessage = useMemo(() => {
    if (message) return message;
    if (context) {
      const ctxMsg = getMascotContextDialogue(context);
      if (ctxMsg) return ctxMsg;
    }
    return getMascotDialogue(mood);
  }, [message, context, mood]);

  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (mood === "happy" || mood === "celebrating") vibrateLight?.();
    setIsSpeaking(true);
    const t = setTimeout(() => setIsSpeaking(false), 2500);
    return () => clearTimeout(t);
  }, [mood, displayMessage]);

  return (
    <motion.div
      className={cn("flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden", className)}
      style={{
        background: `${colors.main}10`,
        border: `1px solid ${colors.main}28`,
        boxShadow: `0 2px 16px ${colors.main}18`,
      }}
      initial={{ opacity: 0, x: -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      data-testid="mascot-inline"
    >
      <motion.div
        className="flex-shrink-0"
        animate={
          isSpeaking
            ? { y: [0, -2, 0], rotate: [-1.5, 1.5, -1.5] }
            : { y: [0, -2, 0] }
        }
        transition={{
          duration: isSpeaking ? 0.8 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <MascotSVG mood={mood} size={36} score={context?.score} />
      </motion.div>
      <TypewriterText text={displayMessage} className="text-xs font-semibold text-foreground/90 leading-snug flex-1" />
    </motion.div>
  );
}

// ============================================================
// TYPEWRITER TEXT (standalone utility)
// ============================================================

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      if (i >= text.length) { clearInterval(t); return; }
      setDisplayed(text.slice(0, i + 1));
      i++;
    }, 62);
    return () => clearInterval(t);
  }, [text]);

  return <span className={className}>{displayed}</span>;
}

// ============================================================
// SCORE-BASED CELEBRATION (full-page moment)
// ============================================================

const CONFETTI_COLORS = ["#fbbf24", "#f472b6", "#a78bfa", "#60a5fa", "#7c3aed", "#fb7185", "#8b5cf6"];
const CONFETTI_SHAPES = ["rect", "circle", "star"] as const;

export function CelebrationBurst({ trigger, intensity = "normal" }: { trigger: boolean; intensity?: "normal" | "epic" }) {
  if (!trigger) return null;
  const count = intensity === "epic" ? 40 : 24;
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const x = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const size = 6 + Math.random() * 10;
        const rotate = Math.random() * 360;
        const shape = CONFETTI_SHAPES[i % CONFETTI_SHAPES.length];
        const drift = (Math.random() - 0.5) * 60;
        return (
          <motion.div
            key={i}
            className="absolute top-0"
            style={{
              left: `${x}%`,
              width: size,
              height: shape === "circle" ? size : size * 0.5,
              background: color,
              borderRadius: shape === "circle" ? "50%" : shape === "star" ? "2px" : "1px",
              rotate,
            }}
            animate={{
              y: ["-5vh", "115vh"],
              x: [0, drift],
              rotate: [rotate, rotate + 360 * (Math.random() > 0.5 ? 1 : -1)],
              opacity: [1, 1, 0.8, 0],
              scale: shape === "star" ? [1, 1.3, 0.8, 0.5] : [1, 1, 1, 0.7],
            }}
            transition={{ duration: 2.5 + Math.random(), delay, ease: "easeIn" }}
          />
        );
      })}
      {/* Central flash burst */}
      {intensity === "epic" && (
        <motion.div
          className="absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 30%, rgba(251,191,36,0.3) 0%, transparent 60%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.8 }}
        />
      )}
    </div>
  );
}

// Streak fire ring — animated flames around Cleo during streaks
export function StreakFireRing({ streakCount, size }: { streakCount: number; size: number }) {
  if (streakCount < 7) return null;
  const intensity = Math.min(streakCount / 30, 1);
  const flameCount = Math.min(Math.floor(streakCount / 5), 8);
  const ringSize = size + 20;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: ringSize,
        height: ringSize,
        left: -(ringSize - size) / 2,
        top: -(ringSize - size) / 2,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg viewBox="0 0 100 100" width={ringSize} height={ringSize} style={{ overflow: "visible" }}>
        {Array.from({ length: flameCount }).map((_, i) => {
          const angle = (i / flameCount) * 360;
          const rad = (angle * Math.PI) / 180;
          const cx = 50 + Math.cos(rad) * 40;
          const cy = 50 + Math.sin(rad) * 40;
          return (
            <motion.g key={i}
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.8 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.1 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            >
              <circle cx={cx} cy={cy} r={3 + intensity * 2} fill={intensity > 0.6 ? "#ef4444" : "#f97316"} opacity={0.7} />
              <circle cx={cx} cy={cy - 2} r={2} fill="#fbbf24" opacity={0.8} />
            </motion.g>
          );
        })}
      </svg>
    </motion.div>
  );
}

// Level-up glow pulse — radiant effect when Money Health increases
export function LevelUpGlow({ trigger, color = "#7c3aed" }: { trigger: boolean; color?: string }) {
  if (!trigger) return null;
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0] }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}60 0%, ${color}20 40%, transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
      {/* Expanding ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${color}`, opacity: 0.5 }}
        animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ border: `2px solid ${color}`, opacity: 0.3 }}
        animate={{ scale: [1, 2], opacity: [0.3, 0] }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      />
    </motion.div>
  );
}

// ============================================================
// HELPERS (exported)
// ============================================================

export function getMascotMoodForScore(score: number): MascotMood {
  if (score >= 480) return "celebrating";
  if (score >= 380) return "happy";
  if (score >= 260) return "encouraging";
  if (score >= 120) return "thinking";
  return "sad";
}

export function getMascotMoodForStreak(
  streak: number,
  hasPlayedToday: boolean,
  daysInactive?: number
): MascotMood {
  if (daysInactive && daysInactive >= 7) return "waving";
  if (daysInactive && daysInactive >= 3) return "sleeping";
  if (streak === 0 && !hasPlayedToday) return "idle";
  if (!hasPlayedToday && streak > 0) return "encouraging";
  if (streak >= 30) return "fire";
  if (streak >= 14) return "proud";
  if (streak >= 7) return "happy";
  if (streak > 0) return "happy";
  return "idle";
}

export function getMascotScoreMessage(score: number): string {
  if (score >= 500) return "PERFECT SCORE. You're an absolute unit.";
  if (score >= 450) return "So close to perfect! That was elite.";
  if (score >= 350) return "Solid moves. Your wallet is grateful.";
  if (score >= 250) return "Room to grow, and grow you absolutely will.";
  if (score >= 100) return "Every game sharpens you. Keep showing up.";
  return "Rough round. But rough rounds build champions.";
}
