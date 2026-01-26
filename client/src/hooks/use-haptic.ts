import { useCallback } from "react";

type HapticType = "light" | "medium" | "heavy" | "success" | "error" | "warning";

const HAPTIC_PATTERNS: Record<HapticType, number[]> = {
  light: [10],
  medium: [25],
  heavy: [50],
  success: [10, 50, 10],
  error: [50, 100, 50],
  warning: [30, 50, 30],
};

export function useHaptic() {
  const vibrate = useCallback((type: HapticType = "light") => {
    if (!("vibrate" in navigator)) return;
    
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

  return {
    vibrate,
    vibrateSuccess,
    vibrateError,
    vibrateLight,
    vibrateMedium,
  };
}
