import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Check
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { UserBadge, BadgeDefinition } from "@shared/schema";
import { BADGE_DEFINITIONS } from "@shared/schema";

function getIconForBadge(iconName: string) {
  const iconMap: Record<string, React.ReactNode> = {
    "ninja": <Swords className="h-8 w-8" />,
    "trending-up": <TrendingUp className="h-8 w-8" />,
    "piggy-bank": <PiggyBank className="h-8 w-8" />,
    "eye": <Eye className="h-8 w-8" />,
    "target": <Target className="h-8 w-8" />,
    "flame": <Flame className="h-8 w-8" />,
    "crown": <Crown className="h-8 w-8" />,
  };
  return iconMap[iconName] || <Trophy className="h-8 w-8" />;
}

interface BadgeCardProps {
  definition: BadgeDefinition;
  userBadge: UserBadge;
}

function BadgeCard({ definition, userBadge }: BadgeCardProps) {
  const { toast } = useToast();
  const isUnlocked = userBadge.unlocked;
  const progress = Math.min(userBadge.progress, definition.maxProgress);
  const progressPercent = (progress / definition.maxProgress) * 100;

  const handleShare = async () => {
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
      className={`p-4 transition-all ${isUnlocked ? 'border-primary/50' : 'opacity-60'}`}
      data-testid={`badge-card-${definition.id}`}
    >
      <div className="flex items-start gap-4">
        <div className={`relative p-3 rounded-xl ${isUnlocked ? 'bg-gradient-to-br from-primary/20 to-accent/20' : 'bg-muted'}`}>
          <div className={isUnlocked ? 'text-primary' : 'text-muted-foreground'}>
            {getIconForBadge(definition.icon)}
          </div>
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          {isUnlocked && (
            <div className="absolute -top-1 -right-1">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold" data-testid={`badge-name-${definition.id}`}>
              {definition.name}
            </h3>
            {isUnlocked && (
              <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                Unlocked
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1" data-testid={`badge-desc-${definition.id}`}>
            {definition.description}
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1 flex-wrap">
              <span>{definition.unlockCriteria}</span>
              <span data-testid={`badge-progress-${definition.id}`}>
                {progress} / {definition.maxProgress}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${isUnlocked ? 'bg-green-500' : 'bg-primary'}`}
                style={{ width: `${progressPercent}%` }}
                data-testid={`badge-progress-bar-${definition.id}`}
              />
            </div>
          </div>

          {isUnlocked && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={handleShare}
              data-testid={`button-share-badge-${definition.id}`}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Badge
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function Achievements() {
  const [, navigate] = useLocation();

  const { data: badges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/badges"],
  });

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = BADGE_DEFINITIONS.length;

  const allBadges: UserBadge[] = BADGE_DEFINITIONS.map(def => {
    const existing = badges.find(b => b.badgeId === def.id);
    return existing || {
      badgeId: def.id,
      unlocked: false,
      unlockedAt: null,
      progress: 0,
    };
  });

  const sortedBadges = [...allBadges].sort((a, b) => {
    if (a.unlocked && !b.unlocked) return -1;
    if (!a.unlocked && b.unlocked) return 1;
    
    const aDef = BADGE_DEFINITIONS.find(d => d.id === a.badgeId);
    const bDef = BADGE_DEFINITIONS.find(d => d.id === b.badgeId);
    if (!aDef || !bDef) return 0;
    
    const aProgress = a.progress / aDef.maxProgress;
    const bProgress = b.progress / bDef.maxProgress;
    return bProgress - aProgress;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-4 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg" data-testid="text-page-title">Achievements</h1>
          <p className="text-sm text-muted-foreground" data-testid="text-badge-count">
            {unlockedCount} of {totalCount} badges unlocked
          </p>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4">
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="p-3 rounded-full bg-primary/20">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">Your Badge Collection</h2>
              <p className="text-sm text-muted-foreground">
                Unlock badges by playing daily and mastering financial decisions
              </p>
            </div>
            <div className="text-center px-4 py-2 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-primary" data-testid="text-unlocked-count">
                {unlockedCount}
              </div>
              <div className="text-xs text-muted-foreground">Unlocked</div>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4" data-testid="badges-list">
            {sortedBadges.map(userBadge => {
              const definition = BADGE_DEFINITIONS.find(d => d.id === userBadge.badgeId);
              if (!definition) return null;
              
              return (
                <BadgeCard 
                  key={userBadge.badgeId}
                  definition={definition}
                  userBadge={userBadge}
                />
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
