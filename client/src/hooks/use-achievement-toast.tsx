import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useSound } from "@/hooks/use-sound";
import { useHaptic } from "@/hooks/use-haptic";
import { BADGE_DEFINITIONS, type UserBadge } from "@shared/schema";
import { Award, Sparkles } from "lucide-react";

export function useAchievementToast() {
  const { toast } = useToast();
  const { play } = useSound();
  const { vibrateSuccess } = useHaptic();
  const previousBadges = useRef<UserBadge[]>([]);
  const initialized = useRef(false);

  const { data: badges = [] } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
  });

  useEffect(() => {
    if (!badges.length) return;

    // Skip first render to avoid showing toasts on page load
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

    // Show toast for each newly unlocked badge
    newlyUnlocked.forEach((badge, index) => {
      const definition = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeId);
      if (!definition) return;

      setTimeout(() => {
        play("achievement");
        vibrateSuccess();
        
        toast({
          title: (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center animate-bounce">
                <Award className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-semibold tracking-[-0.02em]">Badge Unlocked!</span>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
          ) as unknown as string,
          description: (
            <div className="mt-1">
              <p className="font-semibold text-foreground">{definition.name}</p>
              <p className="text-sm text-muted-foreground">{definition.description}</p>
            </div>
          ) as unknown as string,
          duration: 5000,
        });
      }, index * 1000);
    });

    previousBadges.current = badges;
  }, [badges, toast, play, vibrateSuccess]);
}
