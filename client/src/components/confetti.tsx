import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { isFeatureEnabled } from "@/lib/feature-flags";

interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

export function useConfetti() {
  const fireConfetti = useCallback((options: ConfettiOptions = {}) => {
    const defaults: ConfettiOptions = {
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"],
    };

    confetti({
      ...defaults,
      ...options,
    });
  }, []);

  const firePerfectScore = useCallback(() => {
    const isExperimental = isFeatureEnabled("experimental_animations");
    const duration = isExperimental ? 4000 : 3000;
    const end = Date.now() + duration;

    const frame = () => {
      const particleCount = isExperimental ? 6 : 3;
      confetti({
        particleCount,
        angle: 60,
        spread: isExperimental ? 70 : 55,
        origin: { x: 0 },
        colors: ["#ffd700", "#ffb700", "#ff9500"],
      });
      confetti({
        particleCount,
        angle: 120,
        spread: isExperimental ? 70 : 55,
        origin: { x: 1 },
        colors: ["#ffd700", "#ffb700", "#ff9500"],
      });

      // Extra center burst for experimental mode
      if (isExperimental && Math.random() > 0.7) {
        confetti({
          particleCount: 5,
          spread: 360,
          origin: { x: 0.5, y: 0.5 },
          colors: ["#ffd700", "#ffb700", "#ff9500", "#fff"],
          shapes: ["star"],
        });
      }

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const fireStreakMilestone = useCallback((milestone: number) => {
    const isExperimental = isFeatureEnabled("experimental_animations");
    const colors =
      milestone >= 100
        ? ["#ffd700", "#ff6b00", "#ff0000"]
        : milestone >= 30
          ? ["#8b5cf6", "#6366f1", "#3b82f6"]
          : milestone >= 14
            ? ["#22c55e", "#10b981", "#059669"]
            : ["#f59e0b", "#f97316", "#ef4444"];

    const particleMultiplier = isExperimental ? 1.5 : 1;

    confetti({
      particleCount: Math.floor(150 * particleMultiplier),
      spread: isExperimental ? 120 : 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
    });

    setTimeout(() => {
      confetti({
        particleCount: Math.floor(50 * particleMultiplier),
        angle: 60,
        spread: isExperimental ? 100 : 80,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: Math.floor(50 * particleMultiplier),
        angle: 120,
        spread: isExperimental ? 100 : 80,
        origin: { x: 1 },
        colors,
      });
    }, 250);

    // Extra firework burst for experimental mode
    if (isExperimental) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 360,
          origin: { x: 0.5, y: 0.6 },
          colors,
          shapes: ["circle", "square"],
          startVelocity: 40,
        });
      }, 500);
    }
  }, []);

  const fireAchievement = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { x: 0.5, y: 0.7 },
      colors: ["#8b5cf6", "#a855f7", "#d946ef"],
    });
  }, []);

  const fireMiniCorrect = useCallback(() => {
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { x: 0.5, y: 0.7 },
      colors: ["#22c55e", "#10b981", "#34d399"],
      gravity: 1.2,
      scalar: 0.8,
      ticks: 100,
    });
  }, []);

  const fireMiniIncorrect = useCallback(() => {
    // Subtle red particles falling for incorrect answer
    confetti({
      particleCount: 10,
      spread: 30,
      origin: { x: 0.5, y: 0.7 },
      colors: ["#ef4444", "#dc2626"],
      gravity: 2,
      scalar: 0.6,
      ticks: 50,
    });
  }, []);

  // Firework burst effect - multiple bursts in sequence
  const fireFireworks = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: ["#22c55e", "#10b981", "#f59e0b", "#8b5cf6"],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  // Star burst effect - stars shooting from center
  const fireStars = useCallback(() => {
    const defaults = {
      spread: 360,
      ticks: 100,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#ffd700", "#ff6b00", "#fff"],
      shapes: ["star"] as confetti.Shape[],
    };

    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      origin: { x: 0.5, y: 0.5 },
    });

    confetti({
      ...defaults,
      particleCount: 25,
      scalar: 0.75,
      origin: { x: 0.5, y: 0.5 },
    });
  }, []);

  // Money rain effect - green particles falling from top
  const fireMoneyRain = useCallback(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 90,
        spread: 160,
        origin: { x: Math.random(), y: -0.1 },
        colors: ["#22c55e", "#10b981", "#059669", "#047857"],
        shapes: ["square"],
        gravity: 0.8,
        scalar: 1.5,
        drift: Math.random() - 0.5,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  // Side cannons - shoot from both sides
  const fireSideCannons = useCallback(() => {
    const colors = ["#22c55e", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
    
    // Left cannon
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
    });
    
    // Right cannon
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
    });

    // Delayed second burst
    setTimeout(() => {
      confetti({
        particleCount: 30,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 30,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        colors,
      });
    }, 200);
  }, []);

  // Celebration combo - ultimate celebration
  const fireCelebration = useCallback(() => {
    // Initial burst
    fireFireworks();
    
    // Stars after delay
    setTimeout(() => fireStars(), 300);
    
    // Side cannons
    setTimeout(() => fireSideCannons(), 600);
    
    // Money rain finale
    setTimeout(() => fireMoneyRain(), 900);
  }, [fireFireworks, fireStars, fireSideCannons, fireMoneyRain]);

  return {
    fireConfetti,
    firePerfectScore,
    fireStreakMilestone,
    fireAchievement,
    fireMiniCorrect,
    fireMiniIncorrect,
    fireFireworks,
    fireStars,
    fireMoneyRain,
    fireSideCannons,
    fireCelebration,
  };
}

interface ConfettiTriggerProps {
  trigger: boolean;
  type?: "default" | "perfect" | "streak" | "achievement";
  streakMilestone?: number;
}

export function ConfettiTrigger({
  trigger,
  type = "default",
  streakMilestone = 7,
}: ConfettiTriggerProps) {
  const { fireConfetti, firePerfectScore, fireStreakMilestone, fireAchievement } =
    useConfetti();

  useEffect(() => {
    if (trigger) {
      switch (type) {
        case "perfect":
          firePerfectScore();
          break;
        case "streak":
          fireStreakMilestone(streakMilestone);
          break;
        case "achievement":
          fireAchievement();
          break;
        default:
          fireConfetti();
      }
    }
  }, [trigger, type, streakMilestone, fireConfetti, firePerfectScore, fireStreakMilestone, fireAchievement]);

  return null;
}
