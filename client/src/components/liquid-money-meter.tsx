import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import { Droplets, Sparkles } from "lucide-react";

interface LiquidMoneyMeterProps {
  value: number; // 0-100
  className?: string;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export function LiquidMoneyMeter({
  value,
  className,
  size = "md",
  animated = true,
}: LiquidMoneyMeterProps) {
  const [prevValue, setPrevValue] = useState(value);
  const bubbleControls = useAnimation();
  const sparkleControls = useAnimation();

  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  const fillPercentage = clampedValue;

  // Size configurations
  const sizes = {
    sm: { width: 60, height: 80, borderRadius: 12 },
    md: { width: 80, height: 110, borderRadius: 16 },
    lg: { width: 100, height: 140, borderRadius: 20 },
  };

  const dimensions = sizes[size];

  // Determine liquid color based on health level
  const getLiquidColor = () => {
    if (clampedValue >= 70) return "from-emerald-400 to-green-500";
    if (clampedValue >= 40) return "from-yellow-400 to-amber-500";
    return "from-red-400 to-rose-500";
  };

  const getGlowColor = () => {
    if (clampedValue >= 70) return "shadow-emerald-500/50";
    if (clampedValue >= 40) return "shadow-yellow-500/50";
    return "shadow-red-500/50";
  };

  // Trigger animations when value changes
  useEffect(() => {
    if (value > prevValue) {
      // Value increased - trigger bubble animation
      bubbleControls.start({
        y: [0, -20, -40],
        opacity: [0.8, 0.6, 0],
        scale: [0.5, 0.8, 1],
        transition: { duration: 1, ease: "easeOut" }
      });
    } else if (value < prevValue) {
      // Value decreased - trigger drain animation
      bubbleControls.start({
        y: [0, 10],
        opacity: [0.5, 0],
        transition: { duration: 0.5 }
      });
    }

    // Sparkles at 100
    if (value === 100) {
      sparkleControls.start({
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        rotate: [0, 180, 360],
        transition: { duration: 2, repeat: Infinity, repeatDelay: 1 }
      });
    }

    setPrevValue(value);
  }, [value, prevValue, bubbleControls, sparkleControls]);

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Bottle Container */}
      <motion.div
        className={cn(
          "relative overflow-hidden border-4 border-card bg-card/50 backdrop-blur-sm",
          animated && "transition-shadow duration-300",
          clampedValue >= 70 && "shadow-lg",
          getGlowColor()
        )}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: dimensions.borderRadius,
        }}
        animate={animated ? {
          scale: clampedValue === 100 ? [1, 1.05, 1] : 1,
        } : {}}
        transition={{
          scale: { duration: 0.8, repeat: clampedValue === 100 ? Infinity : 0, repeatDelay: 1 }
        }}
      >
        {/* Liquid Fill */}
        <motion.div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-gradient-to-t",
            getLiquidColor()
          )}
          initial={false}
          animate={{
            height: `${fillPercentage}%`,
          }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            mass: 0.5,
          }}
        >
          {/* Wave Effect (top of liquid) */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-2 bg-white/20"
            animate={{
              x: [-20, 20, -20],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              clipPath: "polygon(0 50%, 25% 0, 50% 50%, 75% 0, 100% 50%, 100% 100%, 0 100%)",
            }}
          />

          {/* Bubbles */}
          {animated && (
            <>
              <motion.div
                animate={bubbleControls}
                className="absolute w-2 h-2 bg-white/40 rounded-full"
                style={{ left: "30%", bottom: "20%" }}
              />
              <motion.div
                animate={bubbleControls}
                className="absolute w-1.5 h-1.5 bg-white/40 rounded-full"
                style={{ left: "60%", bottom: "40%", transitionDelay: "0.2s" }}
              />
              <motion.div
                animate={bubbleControls}
                className="absolute w-2.5 h-2.5 bg-white/30 rounded-full"
                style={{ left: "50%", bottom: "10%", transitionDelay: "0.4s" }}
              />
            </>
          )}

          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 dark:via-foreground/10 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Value Display */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <motion.div
              className={cn(
                "font-bold text-lg leading-none",
                clampedValue >= 70 ? "text-white drop-shadow-lg" :
                clampedValue >= 40 ? "text-white drop-shadow-lg" :
                "text-white drop-shadow-lg"
              )}
              animate={clampedValue === 100 ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{ duration: 0.3 }}
            >
              {clampedValue}
            </motion.div>
            <div className="text-[8px] text-white/80 drop-shadow uppercase tracking-wide font-semibold">
              Fitness
            </div>
          </div>
        </div>

        {/* Overflow Sparkles at 100 */}
        {clampedValue === 100 && animated && (
          <>
            <motion.div
              animate={sparkleControls}
              className="absolute -top-2 left-1/2 -translate-x-1/2"
            >
              <Sparkles className="w-5 h-5 text-yellow-400 drop-shadow-lg" />
            </motion.div>
            <motion.div
              animate={{
                ...sparkleControls,
                transition: { delay: 0.3 }
              }}
              className="absolute top-0 left-0"
            >
              <Sparkles className="w-3 h-3 text-yellow-300 drop-shadow-lg" />
            </motion.div>
            <motion.div
              animate={{
                ...sparkleControls,
                transition: { delay: 0.6 }
              }}
              className="absolute top-0 right-0"
            >
              <Sparkles className="w-3 h-3 text-yellow-300 drop-shadow-lg" />
            </motion.div>
          </>
        )}

        {/* Glass Reflection Effect */}
        <div
          className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-foreground/10 dark:from-foreground/20 to-transparent pointer-events-none"
          style={{ borderTopLeftRadius: dimensions.borderRadius - 4, borderTopRightRadius: dimensions.borderRadius - 4 }}
        />
      </motion.div>

      {/* Droplet Icon */}
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
        <Droplets className={cn(
          "w-3 h-3",
          clampedValue >= 70 ? "text-green-500" :
          clampedValue >= 40 ? "text-yellow-500" :
          "text-red-500"
        )} />
      </div>
    </div>
  );
}
