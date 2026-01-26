import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";

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
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#ffd700", "#ffb700", "#ff9500"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#ffd700", "#ffb700", "#ff9500"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const fireStreakMilestone = useCallback((milestone: number) => {
    const colors =
      milestone >= 100
        ? ["#ffd700", "#ff6b00", "#ff0000"]
        : milestone >= 30
          ? ["#8b5cf6", "#6366f1", "#3b82f6"]
          : milestone >= 14
            ? ["#22c55e", "#10b981", "#059669"]
            : ["#f59e0b", "#f97316", "#ef4444"];

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 80,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 80,
        origin: { x: 1 },
        colors,
      });
    }, 250);
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

  return {
    fireConfetti,
    firePerfectScore,
    fireStreakMilestone,
    fireAchievement,
    fireMiniCorrect,
    fireMiniIncorrect,
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
