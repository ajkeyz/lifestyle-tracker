import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltAmount?: number;
  glareEnabled?: boolean;
  floatOnHover?: boolean;
  perspective?: number;
  scale?: number;
}

export function TiltCard({
  children,
  className = "",
  tiltAmount = 10,
  glareEnabled = true,
  floatOnHover = true,
  perspective = 1000,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [tiltAmount, -tiltAmount]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-tiltAmount, tiltAmount]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [0, 100]);
  
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) =>
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.8) 0%, transparent 50%)`
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const xPos = (e.clientX - rect.left) / rect.width - 0.5;
      const yPos = (e.clientY - rect.top) / rect.height - 0.5;

      x.set(xPos);
      y.set(yPos);
    },
    [x, y]
  );

  const handlePointerEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovering(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={cn("relative", className)}
      style={{
        perspective,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isHovering && floatOnHover ? scale : 1,
          z: isHovering && floatOnHover ? 30 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="relative w-full h-full"
      >
        {children}
        
        {glareEnabled && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
            style={{
              opacity: isHovering ? 0.15 : 0,
              background: glareBackground,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  depth?: "sm" | "md" | "lg" | "xl";
  hoverLift?: boolean;
  "data-testid"?: string;
}

const depthShadows = {
  sm: "shadow-[0_2px_8px_-2px_rgba(0,0,0,0.1),0_4px_16px_-4px_rgba(0,0,0,0.1)]",
  md: "shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12),0_8px_24px_-4px_rgba(0,0,0,0.12),0_16px_32px_-8px_rgba(0,0,0,0.08)]",
  lg: "shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1),0_16px_32px_-8px_rgba(0,0,0,0.1),0_24px_48px_-12px_rgba(0,0,0,0.15)]",
  xl: "shadow-[0_12px_24px_-6px_rgba(0,0,0,0.12),0_24px_48px_-12px_rgba(0,0,0,0.15),0_32px_64px_-16px_rgba(0,0,0,0.2)]",
};

const darkDepthShadows = {
  sm: "dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_4px_16px_-4px_rgba(0,0,0,0.3)]",
  md: "dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4),0_8px_24px_-4px_rgba(0,0,0,0.35),0_16px_32px_-8px_rgba(0,0,0,0.25)]",
  lg: "dark:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.35),0_16px_32px_-8px_rgba(0,0,0,0.3),0_24px_48px_-12px_rgba(0,0,0,0.4)]",
  xl: "dark:shadow-[0_12px_24px_-6px_rgba(0,0,0,0.4),0_24px_48px_-12px_rgba(0,0,0,0.45),0_32px_64px_-16px_rgba(0,0,0,0.5)]",
};

export function FloatingCard({
  children,
  className = "",
  depth = "md",
  hoverLift = true,
  "data-testid": dataTestId,
}: FloatingCardProps) {
  return (
    <motion.div
      data-testid={dataTestId}
      className={cn(
        "relative rounded-xl bg-card border transition-shadow duration-300",
        depthShadows[depth],
        darkDepthShadows[depth],
        className
      )}
      whileHover={
        hoverLift
          ? {
              y: -4,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  isFlipped: boolean;
  className?: string;
  flipDirection?: "horizontal" | "vertical";
}

export function FlipCard({
  front,
  back,
  isFlipped,
  className = "",
  flipDirection = "horizontal",
}: FlipCardProps) {
  const rotateAxis = flipDirection === "horizontal" ? "rotateY" : "rotateX";

  return (
    <div
      className={cn("relative", className)}
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          [rotateAxis]: isFlipped ? 180 : 0,
        }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 15 }}
      >
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: flipDirection === "horizontal" ? "rotateY(180deg)" : "rotateX(180deg)",
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}

interface Floating3DAvatarProps {
  children: React.ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function Floating3DAvatar({ children, className = "", "data-testid": dataTestId }: Floating3DAvatarProps) {
  return (
    <motion.div
      data-testid={dataTestId}
      className={cn("relative", className)}
      animate={{
        y: [0, -8, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <motion.div
        className="relative"
        whileHover={{
          scale: 1.05,
          rotateY: 10,
          rotateX: -5,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ transformStyle: "preserve-3d", perspective: 800 }}
      >
        {children}
        <motion.div
          className="absolute -inset-2 rounded-full bg-gradient-to-b from-primary/20 to-transparent blur-xl -z-10"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-16 h-4 rounded-full bg-black/10 dark:bg-black/30 blur-md"
        animate={{
          scaleX: [1, 0.9, 1],
          opacity: [0.3, 0.2, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

interface PerspectiveTextProps {
  children: React.ReactNode;
  className?: string;
}

export function PerspectiveText({ children, className = "" }: PerspectiveTextProps) {
  return (
    <motion.div
      className={cn("relative", className)}
      style={{ transformStyle: "preserve-3d", perspective: 500 }}
      whileHover={{
        rotateX: -5,
        scale: 1.02,
        textShadow: "0 10px 20px rgba(0,0,0,0.2)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
