/**
 * Feature Flag System
 *
 * Lightweight feature flag management using localStorage.
 * Supports runtime toggling via debug screen for testing new features.
 */

export type FeatureFlag =
  | "experimental_animations"      // Enhanced confetti and transition effects
  | "premium_ui_override"          // Force premium UI elements visible for testing
  | "new_game_modes"               // Enable upcoming game mode variations
  | "advanced_analytics"           // Extra analytics and tracking features
  | "beta_social_features";        // Experimental social/community features

export interface FeatureFlagConfig {
  key: FeatureFlag;
  name: string;
  description: string;
  defaultEnabled: boolean;
  requiresReload?: boolean;
}

// Feature flag definitions
export const FEATURE_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  experimental_animations: {
    key: "experimental_animations",
    name: "Experimental Animations",
    description: "Enhanced confetti effects, page transitions, and micro-interactions",
    defaultEnabled: false,
  },
  premium_ui_override: {
    key: "premium_ui_override",
    name: "Premium UI Override",
    description: "Force premium features visible (testing only - doesn't grant actual access)",
    defaultEnabled: false,
    requiresReload: true,
  },
  new_game_modes: {
    key: "new_game_modes",
    name: "New Game Modes",
    description: "Enable experimental game mode variations (timed, survival, etc.)",
    defaultEnabled: false,
  },
  advanced_analytics: {
    key: "advanced_analytics",
    name: "Advanced Analytics",
    description: "Extra event tracking and performance monitoring",
    defaultEnabled: false,
  },
  beta_social_features: {
    key: "beta_social_features",
    name: "Beta Social Features",
    description: "Experimental community challenges and friend competitions",
    defaultEnabled: false,
  },
};

const STORAGE_KEY = "lifestyle_tracker_flags";

// Get all flags from localStorage
function getFlagsFromStorage(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to load feature flags:", error);
    return {};
  }
}

// Save all flags to localStorage
function saveFlagsToStorage(flags: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.error("Failed to save feature flags:", error);
  }
}

/**
 * Check if a feature flag is enabled
 * @param flag - The feature flag to check
 * @returns true if the flag is enabled, false otherwise
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const storedFlags = getFlagsFromStorage();

  // Check localStorage first, fall back to default
  if (flag in storedFlags) {
    return storedFlags[flag];
  }

  return FEATURE_FLAGS[flag]?.defaultEnabled ?? false;
}

/**
 * Enable a feature flag
 * @param flag - The feature flag to enable
 */
export function enableFeature(flag: FeatureFlag): void {
  const flags = getFlagsFromStorage();
  flags[flag] = true;
  saveFlagsToStorage(flags);

  // Log for debugging
  console.log(`[Feature Flags] Enabled: ${flag}`);

  // Check if reload is needed
  const config = FEATURE_FLAGS[flag];
  if (config?.requiresReload) {
    console.warn(`[Feature Flags] "${config.name}" requires page reload to take effect`);
  }
}

/**
 * Disable a feature flag
 * @param flag - The feature flag to disable
 */
export function disableFeature(flag: FeatureFlag): void {
  const flags = getFlagsFromStorage();
  flags[flag] = false;
  saveFlagsToStorage(flags);

  console.log(`[Feature Flags] Disabled: ${flag}`);

  const config = FEATURE_FLAGS[flag];
  if (config?.requiresReload) {
    console.warn(`[Feature Flags] "${config.name}" requires page reload to take effect`);
  }
}

/**
 * Toggle a feature flag
 * @param flag - The feature flag to toggle
 * @returns The new state of the flag
 */
export function toggleFeature(flag: FeatureFlag): boolean {
  const currentState = isFeatureEnabled(flag);

  if (currentState) {
    disableFeature(flag);
  } else {
    enableFeature(flag);
  }

  return !currentState;
}

/**
 * Get all feature flags with their current states
 * @returns Array of flags with their enabled state
 */
export function getAllFeatureFlags(): Array<FeatureFlagConfig & { enabled: boolean }> {
  const storedFlags = getFlagsFromStorage();

  return Object.values(FEATURE_FLAGS).map((config) => ({
    ...config,
    enabled: storedFlags[config.key] ?? config.defaultEnabled,
  }));
}

/**
 * Reset all feature flags to their default values
 */
export function resetAllFlags(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log("[Feature Flags] Reset to defaults");
}

/**
 * Get flag statistics for debugging
 */
export function getFlagStats() {
  const allFlags = getAllFeatureFlags();
  const enabledCount = allFlags.filter((f) => f.enabled).length;

  return {
    total: allFlags.length,
    enabled: enabledCount,
    disabled: allFlags.length - enabledCount,
    flags: allFlags,
  };
}
