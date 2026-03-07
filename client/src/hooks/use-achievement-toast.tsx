import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHaptic } from "@/hooks/use-haptic";
import { useAchievementOverlay } from "@/components/achievement-overlay-provider";
import { BADGE_DEFINITIONS, type UserBadge } from "@shared/schema";

export function useAchievementToast() {
  const { vibrateSuccess } = useHaptic();
  const { showAchievement } = useAchievementOverlay();
  const previousBadges = useRef<UserBadge[]>([]);
  const initialized = useRef(false);

  const { data: badges = [] } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
  });

  useEffect(() => {
    if (!badges.length) return;

    // Skip first render to avoid showing overlays on page load
    if (!initialized.current) {
      previousBadges.current = badges;
      initialized.current = true;
      return;
    }

    // Find newly unlocked badges
    const newlyUnlocked = badges.filter((badge) => {
      const previousBadge = previousBadges.current.find(
        (b) => b.badgeId === badge.badgeId
      );
      return badge.unlocked && (!previousBadge || !previousBadge.unlocked);
    });

    // Show cinematic overlay for each newly unlocked badge
    newlyUnlocked.forEach((badge, index) => {
      const definition = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeId);
      if (!definition) return;

      setTimeout(() => {
        vibrateSuccess();

        showAchievement({
          id: badge.badgeId,
          name: definition.name,
          description: definition.description,
          rarity: definition.tier === "gold" ? "legendary" : definition.tier === "silver" ? "epic" : "common",
        });
      }, index * 4500);
    });

    previousBadges.current = badges;
  }, [badges, vibrateSuccess, showAchievement]);
}
