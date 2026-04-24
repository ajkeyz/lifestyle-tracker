import { ReactNode } from "react";
import type { MembershipTier } from "@/hooks/use-premium";

export interface PremiumGateProps {
  /** Required tier to access this feature */
  tier?: MembershipTier;
  /** Feature name for display */
  feature: string;
  /** Description of what user gets */
  description?: string;
  /** Content to show when user has access */
  children: ReactNode;
  /** Show blurred preview behind paywall */
  showPreview?: boolean;
  /** Custom CTA text */
  ctaText?: string;
}

/**
 * Membership / paid tiers are disabled app-wide. The /membership route is not
 * registered in App.tsx ("app is free for all"), so any upgrade CTA would 404.
 *
 * This gate is intentionally inert — it always renders its children. The
 * component, props, and call sites are kept so we can re-enable paid tiers
 * later by restoring the original gating logic without touching every caller.
 */
export function PremiumGate({ children }: PremiumGateProps) {
  return <>{children}</>;
}

/** Inline variant — same inert pass-through as PremiumGate. */
export function InlinePremiumGate({
  children,
}: {
  tier?: MembershipTier;
  feature: string;
  children: ReactNode;
}) {
  return <>{children}</>;
}
