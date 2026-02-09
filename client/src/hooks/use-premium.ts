import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { isFeatureEnabled } from "@/lib/feature-flags";

export type MembershipTier = "free" | "plus" | "pro";

export interface UsePremiumResult {
  tier: MembershipTier;
  isPremium: boolean;
  isPlus: boolean;
  isPro: boolean;
  canAccess: (requiredTier: MembershipTier) => boolean;
  isLoading: boolean;
}

const TIER_HIERARCHY: Record<MembershipTier, number> = {
  free: 0,
  plus: 1,
  pro: 2,
};

/**
 * Hook to check premium membership status and feature access
 *
 * @example
 * const { isPremium, canAccess } = usePremium();
 * if (canAccess("plus")) {
 *   // Show Plus feature
 * }
 */
export function usePremium(): UsePremiumResult {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Check for premium UI override flag (testing only - doesn't grant actual backend access)
  const hasPremiumOverride = isFeatureEnabled("premium_ui_override");

  const actualTier: MembershipTier = user?.membershipTier || "free";
  const tier: MembershipTier = hasPremiumOverride ? "pro" : actualTier;

  const isPremium = tier !== "free";
  const isPlus = tier === "plus" || tier === "pro";
  const isPro = tier === "pro";

  const canAccess = (requiredTier: MembershipTier): boolean => {
    return TIER_HIERARCHY[tier] >= TIER_HIERARCHY[requiredTier];
  };

  return {
    tier,
    isPremium,
    isPlus,
    isPro,
    canAccess,
    isLoading,
  };
}
