import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProgressRing } from "@/components/progress-ring";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trophy,
  TrendingUp,
  PiggyBank,
  Eye,
  Target,
  Flame,
  Crown,
  Lock,
  Share2,
  ArrowLeft,
  Swords,
  Check,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { UserBadge, BadgeDefinition } from "@shared/schema";
import { BADGE_DEFINITIONS } from "@shared/schema";

function getIconForBadge(iconName: string, size = "h-8 w-8") {
  const iconMap: Record<string, React.ReactNode> = {
    ninja: <Swords className={size} />,
    "trending-up": <TrendingUp className={size} />,
    "piggy-bank": <PiggyBank className={size} />,
    eye: <Eye className={size} />,
    target: <Target className={size} />,
    flame: <Flame className={size} />,
    crown: <Crown className={size} />,
  };
  return iconMap[iconName] || <Trophy className={size} />;
}

interface BadgeCardProps {
  definition: BadgeDefinition;
  userBadge: UserBadge;
  isSpotlight?: boolean;
  onSelect?: () => void;
}

function BadgeCard({ definition, userBadge, isSpotlight, onSelect }: BadgeCardProps) {
  const { toast } = useToast();
  const isUnlocked = userBadge.unlocked;
  const progress = Math.min(userBadge.progress, definition.maxProgress);
  const progressPercent = (progress / definition.maxProgress) * 100;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `I just unlocked the "${definition.name}" badge in Lifestyle Creep! ${definition.description}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${definition.name} Badge Unlocked!`,
          text: shareText,
        });
      } catch {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Share your achievement with friends.",
        });
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard!",
        description: "Share your achievement with friends.",
      });
    }
  };

  return (
    <Card
      className={`p-4 transition-all cursor-pointer ${
        isUnlocked
          ? "border-primary/40 hover:border-primary/60"
          : isSpotlight
          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
          : "backdrop-blur-sm bg-card/80 hover:bg-card/90"
      }`}
      onClick={onSelect}
      data-testid={`badge-card-${definition.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon with circular progress ring */}
        <div className="relative shrink-0">
          <ProgressRing
            progress={progressPercent}
            size={56}
            strokeWidth={3}
            color={isUnlocked ? "success" : isSpotlight ? "primary" : "primary"}
            animate={false}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isUnlocked
                  ? "bg-gradient-to-br from-primary/20 to-accent/20"
                  : "bg-muted"
              }`}
            >
              <div className={`${isUnlocked ? "text-primary" : "text-muted-foreground"}`}>
                {getIconForBadge(definition.icon, "h-5 w-5")}
              </div>
            </div>
          </ProgressRing>

          {/* Lock overlay for locked badges */}
          {!isUnlocked && !isSpotlight && progress === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                <Lock className="h-4 w-4 text-muted-foreground/60" />
              </div>
            </div>
          )}

          {/* Unlocked check */}
          {isUnlocked && (
            <motion.div
              className="absolute -top-0.5 -right-0.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-sm ${!isUnlocked && progress === 0 ? "text-muted-foreground" : ""}`}
              data-testid={`badge-name-${definition.id}`}
            >
              {definition.name}
            </h3>
            {isUnlocked && (
              <Badge
                variant="secondary"
                className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] px-1.5 py-0"
              >
                Unlocked
              </Badge>
            )}
            {isSpotlight && !isUnlocked && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0"
              >
                Almost there!
              </Badge>
            )}
          </div>

          <p
            className="text-xs text-muted-foreground mt-0.5 line-clamp-1"
            data-testid={`badge-desc-${definition.id}`}
          >
            {definition.description}
          </p>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground mb-0.5">
              <span className="truncate">{definition.unlockCriteria}</span>
              <span className="shrink-0" data-testid={`badge-progress-${definition.id}`}>
                {progress}/{definition.maxProgress}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isUnlocked ? "bg-green-500" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                data-testid={`badge-progress-bar-${definition.id}`}
              />
            </div>
          </div>

          {/* Share button for unlocked */}
          {isUnlocked && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={handleShare}
              data-testid={`button-share-badge-${definition.id}`}
            >
              <Share2 className="h-3 w-3 mr-1.5" />
              Share
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2 pt-4 pb-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {children}
      </p>
      {count !== undefined && (
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
          {count}
        </Badge>
      )}
      <div className="flex-1 h-px bg-border/50" />
    </div>
  );
}

export default function Achievements() {
  const [, navigate] = useLocation();
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const { data: badges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = BADGE_DEFINITIONS.length;

  const allBadges: UserBadge[] = useMemo(
    () =>
      BADGE_DEFINITIONS.map((def) => {
        const existing = badges.find((b) => b.badgeId === def.id);
        return (
          existing || {
            badgeId: def.id,
            unlocked: false,
            unlockedAt: null,
            progress: 0,
          }
        );
      }),
    [badges]
  );

  const overallProgressPercent = useMemo(() => {
    const totalProgress = allBadges.reduce((sum, badge) => {
      const def = BADGE_DEFINITIONS.find((d) => d.id === badge.badgeId);
      if (!def) return sum;
      return sum + badge.progress / def.maxProgress;
    }, 0);
    return Math.round((totalProgress / totalCount) * 100);
  }, [allBadges, totalCount]);

  // Group badges
  const unlockedBadges = useMemo(() => allBadges.filter((b) => b.unlocked), [allBadges]);
  const inProgressBadges = useMemo(
    () =>
      allBadges
        .filter((b) => !b.unlocked && b.progress > 0)
        .sort((a, b) => {
          const aDef = BADGE_DEFINITIONS.find((d) => d.id === a.badgeId);
          const bDef = BADGE_DEFINITIONS.find((d) => d.id === b.badgeId);
          if (!aDef || !bDef) return 0;
          return b.progress / bDef.maxProgress - a.progress / aDef.maxProgress;
        }),
    [allBadges]
  );
  const lockedBadges = useMemo(
    () => allBadges.filter((b) => !b.unlocked && b.progress === 0),
    [allBadges]
  );

  const closestToUnlock = inProgressBadges[0];
  const closestDef = closestToUnlock
    ? BADGE_DEFINITIONS.find((d) => d.id === closestToUnlock.badgeId)
    : null;

  // Selected badge for detail modal
  const selectedBadge = selectedBadgeId ? allBadges.find((b) => b.badgeId === selectedBadgeId) : null;
  const selectedDef = selectedBadgeId ? BADGE_DEFINITIONS.find((d) => d.id === selectedBadgeId) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center gap-4 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg" data-testid="text-page-title">
            Achievements
          </h1>
          <p className="text-sm text-muted-foreground" data-testid="text-badge-count">
            {unlockedCount} of {totalCount} badges unlocked
          </p>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* === OVERALL PROGRESS RING HEADER === */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            className="p-5 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"
            data-testid="card-summary"
          >
            <div className="flex items-center gap-5">
              <ProgressRing
                progress={overallProgressPercent}
                size={72}
                strokeWidth={5}
                color="gradient"
              >
                <div className="text-center">
                  <span className="text-lg font-bold">{unlockedCount}</span>
                  <span className="text-[10px] text-muted-foreground block leading-none">
                    /{totalCount}
                  </span>
                </div>
              </ProgressRing>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold">Your Badge Collection</h2>
                <p className="text-sm text-muted-foreground">
                  {overallProgressPercent}% complete
                </p>
                {closestDef && closestToUnlock && (
                  <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Next: {closestDef.name} ({closestToUnlock.progress}/{closestDef.maxProgress})
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* === NEXT UNLOCK SPOTLIGHT === */}
        {closestToUnlock && closestDef && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <BadgeCard
              definition={closestDef}
              userBadge={closestToUnlock}
              isSpotlight={true}
              onSelect={() => setSelectedBadgeId(closestDef.id)}
            />
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* === UNLOCKED BADGES === */}
            {unlockedBadges.length > 0 && (
              <>
                <SectionHeader count={unlockedBadges.length}>Unlocked</SectionHeader>
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {unlockedBadges.map((userBadge) => {
                    const def = BADGE_DEFINITIONS.find((d) => d.id === userBadge.badgeId);
                    if (!def) return null;
                    return (
                      <motion.div
                        key={userBadge.badgeId}
                        variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                      >
                        <BadgeCard
                          definition={def}
                          userBadge={userBadge}
                          onSelect={() => setSelectedBadgeId(def.id)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}

            {/* === IN PROGRESS BADGES === */}
            {inProgressBadges.length > 0 && (
              <>
                <SectionHeader count={inProgressBadges.length}>In Progress</SectionHeader>
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
                  }}
                >
                  {inProgressBadges
                    .filter((b) => b.badgeId !== closestToUnlock?.badgeId)
                    .map((userBadge) => {
                      const def = BADGE_DEFINITIONS.find((d) => d.id === userBadge.badgeId);
                      if (!def) return null;
                      return (
                        <motion.div
                          key={userBadge.badgeId}
                          variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                        >
                          <BadgeCard
                            definition={def}
                            userBadge={userBadge}
                            onSelect={() => setSelectedBadgeId(def.id)}
                          />
                        </motion.div>
                      );
                    })}
                </motion.div>
              </>
            )}

            {/* === LOCKED BADGES (frosted glass) === */}
            {lockedBadges.length > 0 && (
              <>
                <SectionHeader count={lockedBadges.length}>Locked</SectionHeader>
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.2 } },
                  }}
                >
                  {lockedBadges.map((userBadge) => {
                    const def = BADGE_DEFINITIONS.find((d) => d.id === userBadge.badgeId);
                    if (!def) return null;
                    return (
                      <motion.div
                        key={userBadge.badgeId}
                        variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                      >
                        <BadgeCard
                          definition={def}
                          userBadge={userBadge}
                          onSelect={() => setSelectedBadgeId(def.id)}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </>
            )}
          </>
        )}

        {/* === BADGE DETAIL MODAL === */}
        <Dialog open={!!selectedBadge} onOpenChange={() => setSelectedBadgeId(null)}>
          <DialogContent className="max-w-sm">
            {selectedDef && selectedBadge && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedBadge.unlocked
                          ? "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {getIconForBadge(selectedDef.icon, "h-6 w-6")}
                    </div>
                    <div>
                      <span className="block">{selectedDef.name}</span>
                      {selectedBadge.unlocked && (
                        <Badge
                          variant="secondary"
                          className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] mt-1"
                        >
                          <Check className="w-2.5 h-2.5 mr-1" />
                          Unlocked
                        </Badge>
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground">{selectedDef.description}</p>

                  <div className="flex items-center justify-center py-2">
                    <ProgressRing
                      progress={(Math.min(selectedBadge.progress, selectedDef.maxProgress) / selectedDef.maxProgress) * 100}
                      size={100}
                      strokeWidth={6}
                      color={selectedBadge.unlocked ? "success" : "primary"}
                    >
                      <div className="text-center">
                        <span className="text-xl font-bold">
                          {Math.min(selectedBadge.progress, selectedDef.maxProgress)}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          /{selectedDef.maxProgress}
                        </span>
                      </div>
                    </ProgressRing>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{selectedDef.unlockCriteria}</p>
                    {selectedBadge.unlockedAt && (
                      <p className="text-xs text-primary mt-2">
                        Unlocked on{" "}
                        {new Date(selectedBadge.unlockedAt).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
