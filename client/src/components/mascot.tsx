import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  | "waving";

interface MascotProps {
  mood?: MascotMood;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  showBubble?: boolean;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

const SIZE_MAP = {
  xs: 48,
  sm: 64,
  md: 96,
  lg: 128,
  xl: 160,
};

const EYE_STATES: Record<MascotMood, { left: string; right: string; pupilScale: number }> = {
  idle: { left: "open", right: "open", pupilScale: 1 },
  happy: { left: "happy", right: "happy", pupilScale: 1.1 },
  celebrating: { left: "star", right: "star", pupilScale: 1.3 },
  thinking: { left: "look-up", right: "look-up", pupilScale: 0.9 },
  sad: { left: "sad", right: "sad", pupilScale: 0.8 },
  encouraging: { left: "wink", right: "open", pupilScale: 1 },
  sleeping: { left: "closed", right: "closed", pupilScale: 0 },
  shocked: { left: "wide", right: "wide", pupilScale: 1.4 },
  proud: { left: "smug", right: "smug", pupilScale: 1 },
  waving: { left: "open", right: "happy", pupilScale: 1.1 },
};

const MOUTH_PATHS: Record<MascotMood, string> = {
  idle: "M 38 62 Q 50 68 62 62",
  happy: "M 35 60 Q 50 72 65 60",
  celebrating: "M 35 58 Q 50 75 65 58",
  thinking: "M 42 63 Q 50 60 58 63",
  sad: "M 38 66 Q 50 60 62 66",
  encouraging: "M 36 60 Q 50 70 64 60",
  sleeping: "M 42 64 Q 50 66 58 64",
  shocked: "M 42 60 Q 50 68 58 60",
  proud: "M 36 60 Q 50 70 64 60",
  waving: "M 36 60 Q 50 70 64 60",
};

const BODY_COLORS: Record<MascotMood, { main: string; highlight: string; shadow: string }> = {
  idle: { main: "#10b981", highlight: "#34d399", shadow: "#059669" },
  happy: { main: "#10b981", highlight: "#6ee7b7", shadow: "#059669" },
  celebrating: { main: "#f59e0b", highlight: "#fbbf24", shadow: "#d97706" },
  thinking: { main: "#6366f1", highlight: "#818cf8", shadow: "#4f46e5" },
  sad: { main: "#6b7280", highlight: "#9ca3af", shadow: "#4b5563" },
  encouraging: { main: "#10b981", highlight: "#34d399", shadow: "#059669" },
  sleeping: { main: "#1e3a5f", highlight: "#2d5a8e", shadow: "#0f2640" },
  shocked: { main: "#ef4444", highlight: "#f87171", shadow: "#dc2626" },
  proud: { main: "#10b981", highlight: "#6ee7b7", shadow: "#059669" },
  waving: { main: "#10b981", highlight: "#34d399", shadow: "#059669" },
};

function MascotEye({ type, x, y, scale }: { type: string; x: number; y: number; scale: number }) {
  const eyeSize = 8;

  if (type === "closed" || type === "sleeping") {
    return (
      <motion.path
        d={`M ${x - 5} ${y} Q ${x} ${y + 3} ${x + 5} ${y}`}
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={false}
        animate={{ pathLength: 1 }}
      />
    );
  }

  if (type === "happy") {
    return (
      <motion.path
        d={`M ${x - 5} ${y + 2} Q ${x} ${y - 4} ${x + 5} ${y + 2}`}
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (type === "star") {
    const starPath = `M ${x} ${y - 5} L ${x + 1.5} ${y - 1.5} L ${x + 5} ${y - 1} L ${x + 2.5} ${y + 1.5} L ${x + 3} ${y + 5} L ${x} ${y + 3} L ${x - 3} ${y + 5} L ${x - 2.5} ${y + 1.5} L ${x - 5} ${y - 1} L ${x - 1.5} ${y - 1.5} Z`;
    return (
      <motion.g
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      >
        <circle cx={x} cy={y} r={eyeSize * scale * 0.6} fill="white" />
        <motion.path
          d={starPath}
          fill="hsl(var(--accent))"
          stroke="none"
        />
      </motion.g>
    );
  }

  if (type === "wink") {
    return (
      <motion.path
        d={`M ${x - 4} ${y} L ${x + 4} ${y}`}
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    );
  }

  if (type === "sad") {
    return (
      <g>
        <circle cx={x} cy={y} r={eyeSize * scale * 0.55} fill="white" />
        <motion.circle
          cx={x}
          cy={y}
          r={3 * scale}
          fill="#1a1a2e"
          animate={{ cy: [y, y + 1, y] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.ellipse
          cx={x}
          cy={y + 10}
          rx={2}
          ry={3}
          fill="#60a5fa"
          opacity={0.6}
          animate={{ cy: [y + 10, y + 14], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      </g>
    );
  }

  if (type === "wide") {
    return (
      <g>
        <motion.circle
          cx={x}
          cy={y}
          r={eyeSize * scale * 0.7}
          fill="white"
          animate={{ r: [eyeSize * scale * 0.7, eyeSize * scale * 0.8, eyeSize * scale * 0.7] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
        <circle cx={x} cy={y} r={2.5 * scale} fill="#1a1a2e" />
      </g>
    );
  }

  if (type === "look-up") {
    return (
      <g>
        <circle cx={x} cy={y} r={eyeSize * scale * 0.55} fill="white" />
        <motion.circle
          cx={x}
          cy={y - 2}
          r={3 * scale}
          fill="#1a1a2e"
          animate={{ cx: [x, x + 2, x], cy: [y - 2, y - 3, y - 2] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </g>
    );
  }

  if (type === "smug") {
    return (
      <g>
        <circle cx={x} cy={y} r={eyeSize * scale * 0.5} fill="white" />
        <circle cx={x + 1} cy={y - 1} r={2.5 * scale} fill="#1a1a2e" />
        <motion.path
          d={`M ${x - 5} ${y - 5} L ${x + 5} ${y - 5}`}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      </g>
    );
  }

  return (
    <g>
      <circle cx={x} cy={y} r={eyeSize * scale * 0.55} fill="white" />
      <motion.circle
        cx={x}
        cy={y}
        r={3 * scale}
        fill="#1a1a2e"
        animate={{ cx: [x, x + 1, x - 1, x] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <circle cx={x + 1} cy={y - 1} r={1} fill="white" opacity={0.8} />
    </g>
  );
}

function MascotBlink({ children, mood }: { children: React.ReactNode; mood: MascotMood }) {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    if (mood === "sleeping" || mood === "celebrating") return;
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mood]);

  if (blinking && mood !== "sleeping" && mood !== "celebrating") {
    return (
      <g>
        <motion.path
          d="M 33 46 Q 38 49 43 46"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          d="M 57 46 Q 62 49 67 46"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    );
  }

  return <>{children}</>;
}

function Sprout({ mood }: { mood: MascotMood }) {
  const isHappy = mood === "happy" || mood === "celebrating" || mood === "proud";
  const isSad = mood === "sad";

  return (
    <motion.g
      animate={
        isHappy
          ? { rotate: [-5, 5, -5], y: [0, -2, 0] }
          : isSad
            ? { rotate: [-2, 0, -2], y: [0, 1, 0] }
            : { rotate: [-3, 3, -3] }
      }
      transition={{
        duration: isHappy ? 0.6 : 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ transformOrigin: "50px 20px" }}
    >
      <path
        d="M 50 28 Q 50 18 50 14"
        stroke={isSad ? "#6b7280" : "#059669"}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <motion.ellipse
        cx={46}
        cy={14}
        rx={6}
        ry={4}
        fill={isSad ? "#6b7280" : "#10b981"}
        transform="rotate(-30, 46, 14)"
        animate={isHappy ? { rx: [6, 7, 6], ry: [4, 5, 4] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <motion.ellipse
        cx={54}
        cy={14}
        rx={6}
        ry={4}
        fill={isSad ? "#6b7280" : "#34d399"}
        transform="rotate(30, 54, 14)"
        animate={isHappy ? { rx: [6, 7, 6], ry: [4, 5, 4] } : {}}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
      />
    </motion.g>
  );
}

function CelebrationParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 50 + Math.cos((i * Math.PI * 2) / 6) * 45,
        y: 50 + Math.sin((i * Math.PI * 2) / 6) * 45,
        color: ["#f59e0b", "#10b981", "#6366f1", "#ef4444", "#ec4899", "#8b5cf6"][i],
        size: 3 + Math.random() * 2,
      })),
    []
  );

  return (
    <g>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={p.color}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            cx: [50, p.x],
            cy: [50, p.y],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: p.id * 0.15,
            ease: "easeOut",
          }}
        />
      ))}
    </g>
  );
}

function SleepZzz() {
  const zPaths = [
    { x: 72, y: 32, s: 4 },
    { x: 78, y: 22, s: 5 },
    { x: 84, y: 12, s: 6 },
  ];
  return (
    <g>
      {zPaths.map((z, i) => (
        <motion.path
          key={i}
          d={`M ${z.x - z.s} ${z.y - z.s} L ${z.x + z.s} ${z.y - z.s} L ${z.x - z.s} ${z.y + z.s} L ${z.x + z.s} ${z.y + z.s}`}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: [0, 0.5, 0],
            y: [10, -5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeOut",
          }}
        />
      ))}
    </g>
  );
}

function WavingArm() {
  return (
    <motion.g
      animate={{ rotate: [-10, 25, -10] }}
      transition={{ duration: 0.5, repeat: 5, ease: "easeInOut" }}
      style={{ transformOrigin: "72px 50px" }}
    >
      <path
        d="M 70 50 Q 78 42 82 38"
        stroke="#059669"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={82} cy={36} r={4} fill="#34d399" />
    </motion.g>
  );
}

function MascotSVG({ mood, size }: { mood: MascotMood; size: number }) {
  const eyes = EYE_STATES[mood];
  const mouthPath = MOUTH_PATHS[mood];
  const colors = BODY_COLORS[mood];

  const bodyAnimation = useMemo(() => {
    switch (mood) {
      case "celebrating":
        return { y: [0, -6, 0], scale: [1, 1.05, 1], rotate: [0, -3, 3, 0] };
      case "happy":
        return { y: [0, -3, 0], scale: [1, 1.02, 1] };
      case "sad":
        return { y: [0, 2, 0], scale: [1, 0.98, 1] };
      case "sleeping":
        return { y: [0, 2, 0], scale: [1, 1.01, 1] };
      case "shocked":
        return { y: [0, -4, 0], scale: [1, 1.04, 1] };
      case "waving":
        return { y: [0, -2, 0] };
      case "thinking":
        return { y: [0, -1, 0], rotate: [0, 2, 0] };
      default:
        return { y: [0, -2, 0], scale: [1, 1.01, 1] };
    }
  }, [mood]);

  const bodySpeed = mood === "celebrating" ? 0.6 : mood === "sleeping" ? 3 : 2;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`body-grad-${mood}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={colors.highlight} />
          <stop offset="70%" stopColor={colors.main} />
          <stop offset="100%" stopColor={colors.shadow} />
        </radialGradient>
        <filter id="mascot-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {mood === "celebrating" && <CelebrationParticles />}
      {mood === "sleeping" && <SleepZzz />}

      <Sprout mood={mood} />

      <motion.g
        animate={bodyAnimation}
        transition={{
          duration: bodySpeed,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <ellipse
          cx={50}
          cy={80}
          rx={16}
          ry={5}
          fill="black"
          opacity={0.08}
        />

        <circle
          cx={50}
          cy={50}
          r={28}
          fill={`url(#body-grad-${mood})`}
          filter="url(#mascot-glow)"
        />

        <ellipse cx={36} cy={40} rx={5} ry={3} fill="white" opacity={0.15} transform="rotate(-20, 36, 40)" />

        <MascotBlink mood={mood}>
          <MascotEye type={eyes.left} x={38} y={46} scale={eyes.pupilScale} />
          <MascotEye type={eyes.right} x={62} y={46} scale={eyes.pupilScale} />
        </MascotBlink>

        {mood === "encouraging" && (
          <circle cx={32} cy={54} rx={4} ry={2} fill="#f9a8d4" opacity={0.4} />
        )}
        {mood === "happy" && (
          <>
            <ellipse cx={30} cy={54} rx={4} ry={2} fill="#fca5a5" opacity={0.3} />
            <ellipse cx={70} cy={54} rx={4} ry={2} fill="#fca5a5" opacity={0.3} />
          </>
        )}

        <motion.path
          d={mouthPath}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill={mood === "celebrating" || mood === "shocked" ? "white" : "none"}
          fillOpacity={0.3}
          initial={false}
          animate={{ d: mouthPath }}
          transition={{ duration: 0.3 }}
        />

        {mood === "waving" && <WavingArm />}
      </motion.g>
    </svg>
  );
}

const SMART_DECISION_LINES = [
  "Big brain energy right there.",
  "Your future self just high-fived you.",
  "That's how you build wealth.",
  "Compound interest approves.",
  "Smart. Very smart.",
  "Financial flex unlocked.",
];

const CREEP_DECISION_LINES = [
  "We've all been there...",
  "Tomorrow's a new day.",
  "It's a learning moment.",
  "Your wallet felt that one.",
  "Plot twist! But you'll bounce back.",
  "Even pros miss sometimes.",
];

const STREAK_MAINTAINED_LINES = [
  "Look at you, unstoppable!",
  "Consistency is your superpower.",
  "The streak lives on!",
  "Day after day. Legend behavior.",
  "Your dedication is inspiring.",
];

const STREAK_LOST_LINES = [
  "Streaks can be rebuilt!",
  "Don't sweat it. Fresh start.",
  "The comeback starts now.",
  "Every champion has off days.",
  "Shake it off. You've got this.",
];

const RETURN_LINES = [
  "Look who's back! Missed you.",
  "The prodigal player returns!",
  "Welcome back, champion!",
  "Your money skills waited for you.",
  "Ready to pick up where you left off?",
];

const LEVEL_UP_LINES = [
  "LEVEL UP! You're evolving!",
  "New level unlocked! Keep climbing.",
  "Higher and higher!",
  "Your financial IQ just jumped!",
];

const IDLE_LINES = [
  "Ready when you are!",
  "Got 2 minutes? Let's play.",
  "Your daily drop awaits...",
  "Today's scenarios are fresh!",
  "Let's make some money moves.",
];

const ENCOURAGING_LINES = [
  "You've totally got this!",
  "Trust your instincts.",
  "Think it through. No rush.",
  "Stay focused, stay smart.",
  "Take your time with this one.",
];

function getRandomLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}

export function getMascotDialogue(mood: MascotMood): string {
  switch (mood) {
    case "happy":
      return getRandomLine(SMART_DECISION_LINES);
    case "celebrating":
      return getRandomLine(LEVEL_UP_LINES);
    case "thinking":
      return getRandomLine(ENCOURAGING_LINES);
    case "sad":
      return getRandomLine(CREEP_DECISION_LINES);
    case "encouraging":
      return getRandomLine(STREAK_MAINTAINED_LINES);
    case "sleeping":
      return getRandomLine(RETURN_LINES);
    case "shocked":
      return getRandomLine(STREAK_LOST_LINES);
    case "proud":
      return getRandomLine(STREAK_MAINTAINED_LINES);
    case "waving":
      return getRandomLine(RETURN_LINES);
    default:
      return getRandomLine(IDLE_LINES);
  }
}

function SpeechBubble({ message, position = "right" }: { message: string; position?: "right" | "top" | "bottom" }) {
  const positionClasses = {
    right: "left-full ml-2 top-1/2 -translate-y-1/2",
    top: "bottom-full mb-2 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 -translate-x-1/2",
  };

  const tailClasses = {
    right: "absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-[hsl(var(--card))]",
    top: "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[hsl(var(--card))]",
    bottom: "absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[hsl(var(--card))]",
  };

  return (
    <motion.div
      className={cn("absolute z-10 pointer-events-none", positionClasses[position])}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="relative">
        <div className={tailClasses[position]} />
        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg max-w-[180px] min-w-[120px]">
          <p className="text-xs font-medium text-foreground leading-snug">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function Mascot({
  mood = "idle",
  size = "md",
  message,
  showBubble = true,
  className,
  onClick,
  animate = true,
}: MascotProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  const [currentMessage, setCurrentMessage] = useState(message || getMascotDialogue(mood));
  const [bubbleVisible, setBubbleVisible] = useState(showBubble);
  const [tapped, setTapped] = useState(false);
  const pixelSize = SIZE_MAP[size];

  useEffect(() => {
    if (message) {
      setCurrentMessage(message);
      setBubbleVisible(true);
    } else {
      setCurrentMessage(getMascotDialogue(mood));
      setBubbleVisible(showBubble);
    }
  }, [mood, message, showBubble]);

  useEffect(() => {
    if (!bubbleVisible) return;
    const timer = setTimeout(() => {
      setBubbleVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [bubbleVisible, currentMessage]);

  const handleTap = useCallback(() => {
    setTapped(true);
    setCurrentMessage(getMascotDialogue(mood));
    setBubbleVisible(true);
    setTimeout(() => setTapped(false), 300);
    onClick?.();
  }, [mood, onClick]);

  const bubblePosition = size === "xs" || size === "sm" ? "top" : "right";

  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      data-testid="mascot"
    >
      <motion.div
        className="cursor-pointer select-none"
        whileTap={{ scale: 0.9 }}
        animate={tapped ? { rotate: [0, -10, 10, 0] } : {}}
        transition={{ duration: 0.3 }}
        onClick={handleTap}
        data-testid="mascot-character"
      >
        <MascotSVG mood={mood} size={pixelSize} />
      </motion.div>

      <AnimatePresence>
        {bubbleVisible && currentMessage && (
          <SpeechBubble message={currentMessage} position={bubblePosition} />
        )}
      </AnimatePresence>
    </div>
  );
}

export function MascotInline({
  mood = "idle",
  message,
  className,
}: {
  mood?: MascotMood;
  message?: string;
  className?: string;
}) {
  const displayMessage = message || getMascotDialogue(mood);

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg bg-card/60 border border-border/50",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="mascot-inline"
    >
      <div className="flex-shrink-0">
        <MascotSVG mood={mood} size={36} />
      </div>
      <p className="text-xs font-medium text-muted-foreground leading-snug flex-1">{displayMessage}</p>
    </motion.div>
  );
}

export function getMascotMoodForScore(score: number): MascotMood {
  if (score >= 450) return "celebrating";
  if (score >= 350) return "happy";
  if (score >= 250) return "encouraging";
  if (score >= 100) return "thinking";
  return "sad";
}

export function getMascotMoodForStreak(streak: number, hasPlayedToday: boolean, daysInactive?: number): MascotMood {
  if (daysInactive && daysInactive >= 7) return "waving";
  if (daysInactive && daysInactive >= 3) return "sleeping";
  if (!hasPlayedToday && streak > 0) return "encouraging";
  if (streak >= 30) return "celebrating";
  if (streak >= 7) return "proud";
  if (streak > 0) return "happy";
  return "idle";
}

export function getMascotScoreMessage(score: number): string {
  if (score >= 500) return "PERFECT SCORE! You're a financial genius!";
  if (score >= 450) return "So close to perfect! Incredible run!";
  if (score >= 350) return "Solid decisions today. Your wallet thanks you.";
  if (score >= 250) return "Not bad! Room to grow, and grow you will.";
  if (score >= 100) return "Every game makes you sharper. Keep at it!";
  return "Tough round, but showing up is half the battle.";
}
