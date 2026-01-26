import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft,
  Copy,
  Check,
  Settings,
  Trophy,
  Flame,
  TrendingUp,
  Target,
  Gamepad2,
  Award,
  Users,
  Share2,
  Cat,
  Dog,
  Bird,
  Bot,
  Skull,
  Ghost,
  Fish,
  Rabbit,
  Squirrel,
  Bug,
  Flame as FlameIcon,
  Rocket,
  Shield,
  Eye,
  EyeOff
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import type { User } from "@shared/schema";

const avatarOptions: Record<string, typeof Cat> = {
  cat: Cat,
  dog: Dog,
  bird: Bird,
  robot: Bot,
  skull: Skull,
  ghost: Ghost,
  fish: Fish,
  rabbit: Rabbit,
  squirrel: Squirrel,
  bug: Bug,
  flame: FlameIcon,
  rocket: Rocket,
};

const getAvatarIcon = (id: string) => {
  return avatarOptions[id] || Cat;
};

function getMoneyHealthLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-500" };
  if (score >= 75) return { label: "Great", color: "text-green-500" };
  if (score >= 60) return { label: "Good", color: "text-lime-500" };
  if (score >= 45) return { label: "Fair", color: "text-yellow-500" };
  if (score >= 30) return { label: "Needs Work", color: "text-orange-500" };
  return { label: "Starting Out", color: "text-red-500" };
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  testId
}: { 
  icon: typeof Trophy; 
  label: string; 
  value: string | number; 
  subtext?: string;
  testId: string;
}) {
  return (
    <Card className="p-4 flex flex-col items-center gap-2 text-center" data-testid={`card-stat-${testId}`}>
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-2xl font-display font-bold tracking-tight" data-testid={`text-stat-value-${testId}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {subtext && (
        <div className="text-xs text-muted-foreground/70" data-testid={`text-stat-subtext-${testId}`}>{subtext}</div>
      )}
    </Card>
  );
}

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const handleCopyUsername = async () => {
    if (!user?.username) return;
    
    try {
      await navigator.clipboard.writeText(user.username);
      setCopied(true);
      toast({
        title: "Username copied!",
        description: "Share it with friends so they can find you.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Couldn't copy",
        description: "Please copy the username manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!user?.username) return;
    
    const shareText = `Add me on Lifestyle Creep! My username is: ${user.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Add me on Lifestyle Creep",
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          handleCopyUsername();
        }
      }
    } else {
      handleCopyUsername();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <p className="text-muted-foreground">Unable to load profile</p>
      </div>
    );
  }

  const AvatarIcon = getAvatarIcon(user.avatar);
  const healthInfo = getMoneyHealthLabel(user.moneyHealth);
  const badgeCount = user.badges?.filter(b => b.unlockedAt).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="font-display font-bold tracking-tight">Profile</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-primary/20" data-testid="avatar-user">
              <AvatarFallback className="bg-primary/10">
                <AvatarIcon className="w-12 h-12 text-primary" />
              </AvatarFallback>
            </Avatar>
            {user.streak >= 7 && (
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-orange-500 text-white" data-testid="badge-streak-fire">
                <Flame className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-display font-bold tracking-tight" data-testid="text-username">
              {user.username}
            </h1>
            {user.bio && (
              <p className="text-muted-foreground max-w-xs" data-testid="text-bio">
                {user.bio}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1" data-testid="badge-money-health">
              <TrendingUp className="w-3 h-3" />
              <span className={healthInfo.color}>{user.moneyHealth}</span> Money Health
            </Badge>
            {user.isProfilePrivate && (
              <Badge variant="outline" className="gap-1" data-testid="badge-private">
                <EyeOff className="w-3 h-3" />
                Private
              </Badge>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 space-y-3" data-testid="card-share-username">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-primary" />
              <span>Share your username to add friends</span>
            </div>
            
            <div className="flex gap-2">
              <Input 
                value={user.username}
                readOnly
                className="font-mono"
                data-testid="input-username-share"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyUsername}
                data-testid="button-copy-username"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                data-testid="button-share-username"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground" data-testid="text-privacy-status">
              {user.allowFriendsToFind ? (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Friends can find you by searching your username
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" />
                  Username search is disabled in your privacy settings
                </span>
              )}
            </p>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <StatCard 
            icon={TrendingUp}
            label="Money Health"
            value={user.moneyHealth}
            subtext={healthInfo.label}
            testId="money-health"
          />
          <StatCard 
            icon={Flame}
            label="Current Streak"
            value={user.streak}
            subtext={`Best: ${user.highestStreak}`}
            testId="streak"
          />
          <StatCard 
            icon={Gamepad2}
            label="Games Played"
            value={user.gamesPlayed}
            testId="games-played"
          />
          <StatCard 
            icon={Award}
            label="Badges Earned"
            value={badgeCount}
            subtext={user.badges?.length ? `of ${user.badges.length}` : undefined}
            testId="badges"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 space-y-3" data-testid="card-performance-stats">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="w-4 h-4 text-primary" />
              <span>Performance Stats</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-display font-bold tracking-tight" data-testid="text-avg-score">
                  {user.gamesPlayed > 0 ? Math.round(user.totalScore / user.gamesPlayed) : 0}
                </div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div>
                <div className="text-xl font-display font-bold tracking-tight" data-testid="text-perfect-games">
                  {user.perfectGames || 0}
                </div>
                <div className="text-xs text-muted-foreground">Perfect Games</div>
              </div>
              <div>
                <div className="text-xl font-display font-bold tracking-tight" data-testid="text-total-score">
                  {user.totalScore || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Score</div>
              </div>
            </div>
          </Card>
        </motion.div>

        {user.freezeTokens > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="p-4 bg-blue-500/10 border-blue-500/20" data-testid="card-freeze-tokens">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium">Streak Freeze Tokens</div>
                    <div className="text-sm text-muted-foreground">
                      Protect your streak on busy days
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-display font-bold text-blue-500" data-testid="text-freeze-tokens">
                  {user.freezeTokens}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Link href="/profile-setup">
            <Button variant="outline" className="w-full gap-2" data-testid="button-edit-profile">
              <Settings className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="ghost" className="w-full gap-2" data-testid="button-settings">
              <Settings className="w-4 h-4" />
              App Settings
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
