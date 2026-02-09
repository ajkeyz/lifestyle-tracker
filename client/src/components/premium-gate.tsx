import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Sparkles } from "lucide-react";
import { usePremium, type MembershipTier } from "@/hooks/use-premium";
import { trackPaywallViewed } from "@/lib/analytics";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

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

export function PremiumGate({
  tier = "plus",
  feature,
  description,
  children,
  showPreview = true,
  ctaText,
}: PremiumGateProps) {
  const [, navigate] = useLocation();
  const { canAccess } = usePremium();
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });

  // If user has access, show content directly
  if (canAccess(tier)) {
    return <>{children}</>;
  }

  // Track paywall view
  const handleUpgradeClick = () => {
    if (user) {
      trackPaywallViewed(
        feature.toLowerCase().replace(/ /g, "_"),
        "feature_gate",
        user,
        false
      );
    }
    navigate("/membership");
  };

  const tierLabel = tier === "pro" ? "Pro" : "Plus";
  const tierIcon = tier === "pro" ? Crown : Sparkles;
  const TierIcon = tierIcon;

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-primary/30">
      {/* Blurred preview */}
      {showPreview && (
        <div className="blur-sm pointer-events-none opacity-40 select-none">
          {children}
        </div>
      )}

      {/* Paywall overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${
          showPreview
            ? "bg-gradient-to-b from-background/80 via-background/95 to-background"
            : "bg-gradient-to-br from-primary/5 to-accent/5"
        }`}
      >
        <div className="text-center p-6 max-w-sm space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Tier badge */}
          <Badge
            variant="secondary"
            className="gap-1 text-sm font-semibold"
          >
            <TierIcon className="w-4 h-4" />
            {tierLabel} Feature
          </Badge>

          {/* Feature name */}
          <h3 className="font-bold text-lg">{feature}</h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}

          {/* CTA button */}
          <Button
            onClick={handleUpgradeClick}
            size="lg"
            className="gap-2"
          >
            <TierIcon className="w-5 h-5" />
            {ctaText || `Upgrade to ${tierLabel}`}
          </Button>

          {/* Pricing hint */}
          <p className="text-xs text-muted-foreground">
            {tier === "pro" ? "$9.99/month" : "$4.99/month"}
          </p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Inline premium gate for smaller UI elements
 */
export function InlinePremiumGate({
  tier = "plus",
  feature,
  children,
}: {
  tier?: MembershipTier;
  feature: string;
  children: ReactNode;
}) {
  const [, navigate] = useLocation();
  const { canAccess } = usePremium();

  if (canAccess(tier)) {
    return <>{children}</>;
  }

  const tierLabel = tier === "pro" ? "Pro" : "Plus";

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
      <Lock className="w-4 h-4 text-primary" />
      <span className="text-sm text-muted-foreground flex-1">
        {feature}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate("/membership")}
      >
        {tierLabel}
      </Button>
    </div>
  );
}
