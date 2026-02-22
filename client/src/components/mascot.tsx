import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  screen?: "home" | "game" | "results";
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
  disableTapBubble?: boolean;
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
  ],
  celebrating: [
    "PERFECT SCORE. You're built different.",
    "Are you a financial advisor?? Because WOW.",
    "That was insane. I need to sit down.",
    "New level unlocked. Cleo is shook.",
    "Your bank account called. It said 'thank you.'",
    "Nobody does it like you do. Nobody.",
    "Full marks. Full facts. Full send. 🚀",
  ],
  thinking: [
    "No rush. Think it through.",
    "Trust your gut on this one.",
    "You know this. I believe in you.",
    "What would your financially-sorted self do?",
    "Take your time — this one's spicy.",
    "Bigger picture. What's the play?",
    "You've got this. I can feel it.",
  ],
  sad: [
    "We've all been there. Literally all of us.",
    "Plot twist! But you'll bounce back.",
    "Even the pros fumble. This is growth.",
    "Your wallet felt that... but it forgives you.",
    "Lifestyle creep wins this round. Not the war.",
    "One wrong turn doesn't reroute the whole journey.",
    "Tomorrow's another shot. Take it.",
  ],
  encouraging: [
    "Look at you — showing up every day. 🔥",
    "Consistency is your superpower.",
    "The streak lives on!",
    "Day after day. Absolute legend behavior.",
    "Reliable, smart, and kind of unstoppable?",
    "You're building something real here.",
    "Your future is watching you show up. 👏",
  ],
  sleeping: [
    "Oh! You're back! I may have napped.",
    "The prodigal player returns!",
    "Welcome back. Your money skills missed you.",
    "We were worried. Cleo was worried.",
    "Ready to pick up where you left off?",
    "Day one again — or day better-than-before.",
  ],
  shocked: [
    "Streaks can be rebuilt! This is not a drill.",
    "Don't sweat it. Fresh start energy.",
    "The comeback arc starts NOW.",
    "Every champion has off days. Every. Single. One.",
    "Shake it off. You've totally got this.",
    "Streaks end. Dedication doesn't.",
  ],
  proud: [
    "Look at you go. 🔥",
    "Weeks of showing up. That's real.",
    "You're in rare company right now.",
    "This isn't luck. This is discipline.",
    "Cleo is genuinely impressed. No notes.",
    "Consistent. Smart. Slightly intimidating.",
  ],
  waving: [
    "HEY! You're back! 👋",
    "Long time no see — let's catch up.",
    "Miss me? I missed you.",
    "Back in action. Let's go!",
    "Life happens. Let's pick it back up.",
  ],
  fire: [
    "YOU'RE ON FIRE. Don't stop. 🔥🔥🔥",
    "Streak goals. Actual streak goals.",
    "What are you even MADE of?",
    "The IRS wishes they had your consistency.",
    "Not even a long weekend could stop you.",
    "Certified streak machine. It's a lifestyle.",
  ],
  smug: [
    "Already knew you'd get that one.",
    "That wasn't even hard for you, was it.",
    "Barely broke a sweat. Classic.",
    "Look at the big brain on you. 👀",
    "Called it before you clicked it.",
  ],
  hyped: [
    "LET'S GO. THIS IS THE MOMENT. 🚀",
    "MILESTONE UNLOCKED. CLEO IS SCREAMING.",
    "You just leveled up your entire financial life.",
    "THIS IS HUGE. Do not downplay this.",
    "Achievement unlocked: Being completely unstoppable.",
    "XP multiplied. Cleo multiplied. WE'RE ALL GROWING.",
  ],
};

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
  ],
  results_weak: [
    "Rough round, {name}. But you showed up — that counts.",
    "Every wrong answer is paid tuition for your future self.",
    "IQ {iq} this round — that number climbs from here.",
    "Health {health}. Room to build. And build you absolutely will.",
    "The comeback arc starts right now. No drama.",
    "One off day doesn't define the habit.",
    "{name}, showing up when it's hard? That's the whole thing.",
  ],
  results_streak_gained: [
    "Day {streak}. The streak lives. 🔥",
    "{streak} days straight — that's a habit forming.",
    "Another day, another notch. Streak: {streak}.",
    "{name}, {streak} days of showing up. That's not luck, that's you.",
    "Consistency is your edge. {streak} days proves it.",
    "Day {streak} done. Day {streak_plus_one} is already set up.",
  ],
  results_streak_milestone: [
    "{streak} DAYS. That's genuinely rare, {name}.",
    "Milestone hit. {streak} days of financial sharpening.",
    "{name}, {streak} days straight. Let's be honest — you're built different.",
    "A {streak}-day streak? The top 1% is in your sights.",
    "Hall of fame behavior. {streak} days, no excuses.",
  ],
  results_streak_broken: [
    "Streak snapped. Your knowledge didn't.",
    "{name}, today restarts a new sequence. Fresh energy.",
    "Records exist to be broken — including this comeback.",
    "Every legend has a reset point. This is yours.",
    "Tomorrow is Day 1 again. Clean slate. Let's go.",
    "The streak ends. The grind doesn't.",
  ],
  results_perfect: [
    "PERFECT. Cleo needs to sit down.",
    "500 points. Are you even real?",
    "{name}. FIVE. HUNDRED. POINTS.",
    "Flawless. The definition of financially locked in.",
    "Not a single one wrong. That's elite-tier thinking.",
  ],

  // ── Game screen ─────────────────────────────────────────────
  quiz_correct: [
    "That's the play. 🧠",
    "Money IQ keeps climbing.",
    "Your instincts are dialed in.",
    "Right call. Every right call matters.",
    "That's how wealth accumulates — one good call at a time.",
    "Clean decision. No hesitation.",
  ],
  quiz_correct_fast: [
    "Barely thought about it. 😏",
    "Snapped. Zero hesitation.",
    "First instinct, best instinct.",
    "You already knew that one cold.",
    "Automatic. That's mastery.",
    "Didn't even need the full clock.",
  ],
  quiz_wrong: [
    "Spicy choice. Different than expected.",
    "Not the play — but now you know why.",
    "Learning disguised as an L.",
    "The trap got you this time. Won't next time.",
    "Filed. Won't happen again.",
    "Every wrong answer sharpens the next right one.",
  ],
  quiz_timeout: [
    "Timer wins this round. It happens.",
    "Decision paralysis is expensive — in life too.",
    "Took too long — classic overthink.",
    "Next time trust your first read.",
    "The clock doesn't wait. Neither does real life.",
    "Hesitation has a price. File it.",
  ],

  // ── Home screen ─────────────────────────────────────────────
  home_inactive: [
    "You came back. That's what matters. 👋",
    "{name}! Real talk — missed you around here.",
    "Long break. Zero judgment. Ready to rebuild?",
    "Life gets busy. Money doesn't wait.",
    "Picking up exactly where you left off.",
    "The streak reset. The knowledge didn't.",
  ],
  home_streak_reminder: [
    "Your {streak}-day streak is on the line today.",
    "Day {streak} is waiting for you, {name}.",
    "Don't let that {streak}-day streak slip.",
    "{name}, your streak is too good to waste today.",
    "{streak} days. Let's make it {streak_plus_one}.",
    "One more day and {streak} becomes {streak_plus_one}. Easy math.",
  ],
  home_first_time: [
    "Hey {name}! First drop. No pressure — just vibes and instincts.",
    "Welcome. Cleo's been waiting. Let's see what you've got.",
    "New here? Perfect time. First drop's a warm-up.",
    "{name}, your financial era starts today.",
    "First drop unlocked. Let's find out what your money IQ is.",
  ],
};

// ============================================================
// ANTI-REPEAT DIALOGUE MEMORY
// ============================================================

const _dialogueHistory: string[] = [];

function getWithoutRepeat(lines: string[]): string {
  const recentCount = Math.min(3, lines.length - 1);
  const recent = _dialogueHistory.slice(-recentCount);
  const available = lines.filter(l => !recent.includes(l));
  const pool = available.length > 0 ? available : lines;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  _dialogueHistory.push(chosen);
  if (_dialogueHistory.length > 12) _dialogueHistory.shift();
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
function getTimeAwareOverride(): string | null {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9)  return "Morning grind hitting different. ☀️";
  if (hour >= 22 || hour < 2) return "Late night money check-in? Respect.";
  if (hour >= 13 && hour < 15) return "Post-lunch brain is the sharpest brain.";
  return null;
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
    if (wasCorrect) return "quiz_correct";
    if (wasCorrect === false) return "quiz_wrong";
  }

  if (screen === "home") {
    if (daysInactive && daysInactive >= 7) return "home_inactive";
    if (streak && streak > 0) return "home_streak_reminder";
    if (streak === 0) return "home_first_time";
  }

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
];

const LONG_PRESS_SECRETS = [
  "Pssst. The #1 rule? Spend less than you earn. That's it.",
  "Secret tip: 20% off your next impulse buy — just wait 24 hours.",
  "You didn't hear this from me: index funds beat most hedge funds.",
  "Ultra-secret: automating savings > willpower. Every time.",
  "The real lifestyle creep is thinking you need more stuff to be happy.",
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
  const accentColor = mood ? BODY_COLORS[mood].main : "#34a874";

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

  // Position classes
  const posClass: Record<BubbleSide, string> = {
    right:  "left-full ml-3 top-1/2 -translate-y-1/2",
    left:   "right-full mr-3 top-1/2 -translate-y-1/2",
    top:    "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
  };

  // Tail — modern rounded tail instead of triangle
  const tailStyles: Record<BubbleSide, React.CSSProperties> = {
    right: { left: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "0 0 0 4px" },
    left: { right: -6, top: "50%", transform: "translateY(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "0 4px 0 0" },
    top: { bottom: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "0 0 4px 0" },
    bottom: { top: -6, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 12, height: 12, borderRadius: "4px 0 0 0" },
  };

  const enterFrom = {
    right:  { opacity: 0, scale: 0.82, x: -6, y: 0 },
    left:   { opacity: 0, scale: 0.82, x: 6,  y: 0 },
    top:    { opacity: 0, scale: 0.82, x: 0,  y: 5 },
    bottom: { opacity: 0, scale: 0.82, x: 0,  y: -5 },
  }[position];

  return (
    <motion.div
      className={cn("absolute z-20", posClass[position])}
      initial={enterFrom}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <div className="relative">
        {/* Rounded tail */}
        <div
          className="absolute"
          style={{
            ...tailStyles[position],
            background: "hsl(var(--card) / 0.96)",
            border: `1px solid ${accentColor}25`,
            zIndex: -1,
          }}
        />
        <motion.div
          className="rounded-2xl px-4 py-3 max-w-[220px] min-w-[80px] backdrop-blur-md"
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
            <p className="text-xs font-medium text-foreground leading-snug tracking-[-0.01em]">
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
  disableTapBubble = false,
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
  const [bubbleVisible, setBubbleVisibleRaw] = useState(showBubble);
  const bubbleVisibleRef = useRef(showBubble);
  const setBubbleVisible = useCallback((v: boolean) => {
    bubbleVisibleRef.current = v;
    setBubbleVisibleRaw(v);
  }, []);
  const [tapCount, setTapCount] = useState(0);
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  const [currentMood, setCurrentMood] = useState<MascotMood>(mood);
  const [isSpeaking, setIsSpeaking] = useState(showBubble);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapResetRef = useRef<ReturnType<typeof setTimeout>>();
  const longPressRef = useRef<ReturnType<typeof setTimeout>>();
  const pixelSize = SIZE_MAP[size];

  // ── Smart bubble side detection ─────────────────────────────
  const [bubbleSide, setBubbleSide] = useState<BubbleSide>(
    size === "xs" || size === "sm" ? "top" : "right"
  );

  const detectBubbleSide = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const BUBBLE_WIDTH = 230;
    const BUBBLE_HEIGHT = 100;
    const MIN_PAD = 16;
    const hasRight = rect.right + BUBBLE_WIDTH + 12 < vw - MIN_PAD;
    const hasLeft  = rect.left  - BUBBLE_WIDTH - 12 > MIN_PAD;
    const hasTop   = rect.top - BUBBLE_HEIGHT - 12 > MIN_PAD;
    if (hasRight) setBubbleSide("right");
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

    const tapMsg = context
      ? (getMascotContextDialogue(context) || getMascotDialogue(currentMood))
      : getMascotDialogue(currentMood);
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
