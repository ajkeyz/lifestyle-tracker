import { useCallback } from "react";

type HapticType = 
  | "light" 
  | "medium" 
  | "heavy" 
  | "success" 
  | "error" 
  | "warning"
  | "selection"
  | "impact"
  | "notification"
  | "streak"
  | "milestone"
  | "menu"
  | "refresh";

const HAPTIC_PATTERNS: Record<HapticType, number[]> = {
  light: [10],
  medium: [25],
  heavy: [50],
  success: [10, 50, 10],
  error: [50, 100, 50],
  warning: [30, 50, 30],
  selection: [5],
  impact: [15, 30],
  notification: [20, 40, 20],
  streak: [10, 20, 10, 20, 10, 20, 30],
  milestone: [50, 50, 50, 100],
  menu: [8],
  refresh: [15, 30, 15],
};

export function useHaptic() {
  const vibrate = useCallback((type: HapticType = "light") => {
    if (!("vibrate" in navigator)) return;
    if (localStorage.getItem("hapticEnabled") === "false") return;

    const pattern = HAPTIC_PATTERNS[type];
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail if vibration not supported
    }
  }, []);

  const vibrateSuccess = useCallback(() => vibrate("success"), [vibrate]);
  const vibrateError = useCallback(() => vibrate("error"), [vibrate]);
  const vibrateLight = useCallback(() => vibrate("light"), [vibrate]);
  const vibrateMedium = useCallback(() => vibrate("medium"), [vibrate]);
  const vibrateSelection = useCallback(() => vibrate("selection"), [vibrate]);
  const vibrateImpact = useCallback(() => vibrate("impact"), [vibrate]);
  const vibrateStreak = useCallback(() => vibrate("streak"), [vibrate]);
  const vibrateMilestone = useCallback(() => vibrate("milestone"), [vibrate]);
  const vibrateMenu = useCallback(() => vibrate("menu"), [vibrate]);
  const vibrateRefresh = useCallback(() => vibrate("refresh"), [vibrate]);

  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateLight,
    vibrateMedium,
    vibrateSelection,
    vibrateImpact,
    vibrateStreak,
    vibrateMilestone,
    vibrateMenu,
    vibrateRefresh,
  };
}
