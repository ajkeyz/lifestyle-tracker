import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AppLogo } from "@/components/app-logo";
import { useToast } from "@/hooks/use-toast";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { Floating3DAvatar } from "@/components/ui/tilt-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Copy,
  Check,
  Settings,
  BarChart3,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Share2,
  Eye,
  EyeOff,
  Swords,
  UserPlus,
  Loader2,
  Heart,
  Brain,
  Shield,
  Sparkles,
  Target,
  Zap,
  Award,
  Star,
  Info,
  Pencil,
  Save,
  X,
  ChevronDown,
  Trophy,
  Crown,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AnimatedCounter } from "@/components/animated-counter";
import { ScoreTrendChart } from "@/components/trend-chart";
import { MilestoneProgress } from "@/components/milestone-progress";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import type { User } from "@shared/schema";
import { BADGE_DEFINITIONS } from "@shared/schema";

function getMoneyHealthLabel(score: number): { label: string; color: string; trend: "up" | "stable" | "down" } {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-500", trend: "up" };
  if (score >= 75) return { label: "Great", color: "text-green-500", trend: "up" };
  if (score >= 60) return { label: "Good", color: "text-lime-500", trend: "stable" };
  if (score >= 45) return { label: "Fair", color: "text-yellow-500", trend: "stable" };
  if (score >= 30) return { label: "Needs Work", color: "text-orange-500", trend: "down" };
  return { label: "Starting Out", color: "text-red-500", trend: "down" };
}

function getAvatarGlowColor(moneyHealth: number, membershipTier?: string): string {
  if (membershipTier === "pro") return "from-yellow-400/40 via-amber-500/40 to-orange-500/40";
  if (membershipTier === "plus") return "from-blue-400/40 via-indigo-500/40 to-purple-500/40";
  if (moneyHealth >= 75) return "from-emerald-500/30 to-green-500/30";
  if (moneyHealth >= 50) return "from-yellow-500/30 to-amber-500/30";
  return "from-orange-500/30 to-red-500/30";
}

function getStreakIntensity(streak: number): { ring: boolean; pulseSpeed: number } {
  if (streak >= 30) return { ring: true, pulseSpeed: 1 };
  if (streak >= 14) return { ring: true, pulseSpeed: 1.5 };
  if (streak >= 7) return { ring: true, pulseSpeed: 2 };
  return { ring: false, pulseSpeed: 3 };
}

function getMilestones(user: User): { id: string; label: string; unlocked: boolean; icon: typeof Star }[] {
  const milestones = [];

  milestones.push({
    id: "first-game",
    label: "Played your first game",
    unlocked: user.gamesPlayed >= 1,
    icon: Zap,
  });

  milestones.push({
    id: "first-streak",
    label: "Built your first streak",
    unlocked: user.highestStreak >= 2,
    icon: Flame,
  });

  milestones.push({
    id: "week-complete",
    label: "Completed a full week",
    unlocked: user.highestStreak >= 7,
    icon: Star,
  });

  milestones.push({
    id: "perfect-game",
    label: "Scored a perfect game",
    unlocked: user.perfectGames >= 1,
    icon: Award,
  });

  milestones.push({
    id: "ten-games",
    label: "Played 10 games",
    unlocked: user.gamesPlayed >= 10,
    icon: Target,
  });

  milestones.push({
    id: "money-wise",
    label: "Reached 75+ Money Health",
    unlocked: user.moneyHealth >= 75,
    icon: TrendingUp,
  });

  return milestones;
}

function getReflectionLine(user: User): string {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const reflections = [
    user.moneyHealth >= 70
      ? "Lately, you've been choosing patience over impulse."
      : "You're building awareness about your financial habits.",
    user.streak >= 7
      ? "Your consistency is becoming a superpower."
      : "Every day you play is a step toward clarity.",
    user.gamesPlayed >= 10
      ? "You've seen enough scenarios to start spotting patterns."
      : "Each decision teaches you something new about yourself.",
    user.perfectGames >= 1
      ? "Your financial instincts are getting sharper."
      : "Growth happens in the space between knowing and choosing.",
    user.highestStreak >= 14
      ? "You've built a real habit around financial mindfulness."
      : "Small, daily reflections compound into big change.",
    "The way you think about money is quietly evolving.",
    "You're learning to pause before you spend.",
    "Financial clarity comes from practice, not perfection.",
  ];

  return reflections[weekNumber % reflections.length];
}

function getSeasonalBadge(): { label: string; description: string } {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { label: "Rebuilding", description: "Spring energy, fresh starts" };
  if (month >= 5 && month <= 7) return { label: "Intentional", description: "Summer clarity, purposeful choices" };
  if (month >= 8 && month <= 10) return { label: "Observer", description: "Autumn reflection, seeing patterns" };
  return { label: "Stabilizing", description: "Winter grounding, steady habits" };
}

export default function Profile() {
  const [, navigate] = useLocation();
  const params = useParams<{ userId?: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editingPhilosophy, setEditingPhilosophy] = useState(false);
  const [editingWhyHere, setEditingWhyHere] = useState(false);
  const [philosophyDraft, setPhilosophyDraft] = useState("");
  const [whyHereDraft, setWhyHereDraft] = useState("");
  const [philosophyOpen, setPhilosophyOpen] = useState(false);
  const [whyHereOpen, setWhyHereOpen] = useState(false);

  const isOwnProfile = !params.userId;

  const { data: user, isLoading } = useQuery<User>({
    queryKey: isOwnProfile ? ["/api/user"] : ["/api/user", params.userId],
    queryFn: async () => {
      const endpoint = isOwnProfile ? "/api/user" : `/api/user/${params.userId}`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/user"],
    enabled: !isOwnProfile,
  });

  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await apiRequest("POST", "/api/friends/add", { friendId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      toast({
        title: "Friend added!",
        description: `You can now see ${user?.username} in your friends list.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't add friend",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<User, 'moneyPhilosophy' | 'whyImHere' | 'friendVisibility' | 'allowFriendsToFind' | 'isProfilePrivate'>>) => {
      const res = await apiRequest("POST", "/api/profile", {
        username: user?.username,
        avatar: user?.avatar,
        bio: user?.bio || "",
        allowFriendsToFind: user?.allowFriendsToFind ?? true,
        isProfilePrivate: user?.isProfilePrivate ?? false,
        moneyPhilosophy: user?.moneyPhilosophy || "",
        whyImHere: user?.whyImHere || "",
        friendVisibility: user?.friendVisibility || "trend",
        ...updates,
      });
      return res.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ["/api/user"] });
      const previousUser = queryClient.getQueryData<User>(["/api/user"]);
      if (previousUser) {
        queryClient.setQueryData<User>(["/api/user"], { ...previousUser, ...updates });
      }
      return { previousUser };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Saved", description: "Your changes have been saved." });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["/api/user"], context.previousUser);
      }
      toast({
        title: "Couldn't save",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
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
    } catch {
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

  const handleSavePhilosophy = () => {
    updateFieldMutation.mutate({ moneyPhilosophy: philosophyDraft });
    setEditingPhilosophy(false);
  };

  const handleSaveWhyHere = () => {
    updateFieldMutation.mutate({ whyImHere: whyHereDraft });
    setEditingWhyHere(false);
  };

  const milestones = useMemo(() => (user ? getMilestones(user) : []), [user]);
  const reflectionLine = useMemo(() => (user ? getReflectionLine(user) : ""), [user]);
  const seasonalBadge = useMemo(() => getSeasonalBadge(), []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 p-4">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
        <p className="text-muted-foreground">Unable to load profile</p>
      </div>
    );
  }

  const healthInfo = getMoneyHealthLabel(user.moneyHealth);
  const glowColor = getAvatarGlowColor(user.moneyHealth, user.membershipTier);
  const streakInfo = getStreakIntensity(user.streak);
  const TrendIcon = healthInfo.trend === "up" ? TrendingUp : healthInfo.trend === "down" ? TrendingDown : Minus;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? window.history.back() : navigate("/")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="font-display font-semibold tracking-[-0.02em]">
              {isOwnProfile ? "Profile" : user?.username || "Profile"}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate("/stats")} data-testid="button-stats" aria-label="View statistics">
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 pb-24 space-y-6">
        {/* === HERO SECTION: Avatar + Name + Health === */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3 pt-2"
        >
          <div className="relative">
            <Floating3DAvatar data-testid="avatar-user">
              <div className="relative">
                <motion.div
                  className={`absolute -inset-3 rounded-full bg-gradient-to-r ${glowColor} blur-lg -z-10`}
                  animate={{
                    opacity: [0.4, 0.7, 0.4],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: streakInfo.pulseSpeed,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <AnimatedAvatar
                  avatarId={user.avatar || "cosmic-cat"}
                  size="lg"
                  showRing={streakInfo.ring}
                  isAnimated={true}
                />
                {user.streak >= 7 && (
                  <motion.div
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
                    data-testid="badge-streak-fire"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Flame className="w-4 h-4" />
                  </motion.div>
                )}
                {user.membershipTier !== "free" && (
                  <motion.div
                    className={`absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-lg ${
                      user.membershipTier === "pro"
                        ? "bg-gradient-to-r from-yellow-500 to-amber-600"
                        : "bg-gradient-to-r from-blue-500 to-indigo-600"
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    data-testid="badge-membership"
                  >
                    {user.membershipTier === "pro" ? "PRO" : "PLUS"}
                  </motion.div>
                )}
              </div>
            </Floating3DAvatar>

            {/* Seasonal Identity Badge */}
            <motion.div
              className="absolute -top-1 -left-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <Badge variant="outline" className="gap-1 text-[10px] bg-background/80 backdrop-blur-sm" data-testid="badge-seasonal">
                <Sparkles className="w-3 h-3 text-primary" />
                {seasonalBadge.label}
              </Badge>
            </motion.div>
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-semibold tracking-[-0.02em]" data-testid="text-username">
              {user.username}
            </h1>
            {user.bio && (
              <p className="text-muted-foreground text-sm max-w-xs" data-testid="text-bio">
                {user.bio}
              </p>
            )}
          </div>

          {/* Money Health with explanation */}
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full"
                  data-testid="button-money-health"
                >
                  <TrendIcon className={`w-3.5 h-3.5 ${healthInfo.color}`} />
                  <span className={`font-semibold ${healthInfo.color}`}>{user.moneyHealth}</span>
                  <span className="text-muted-foreground">Money Health</span>
                  <Info className="w-3 h-3 text-muted-foreground/60" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-center">What is Money Health?</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Your Money Health reflects how you approach financial decisions. It's not about income or net worth.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-emerald-500/10 p-2 shrink-0">
                        <Shield className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Consistency</p>
                        <p className="text-xs text-muted-foreground">Playing regularly builds financial awareness</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
                        <Brain className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Restraint</p>
                        <p className="text-xs text-muted-foreground">Making thoughtful choices under pressure</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-purple-500/10 p-2 shrink-0">
                        <Heart className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Reflection</p>
                        <p className="text-xs text-muted-foreground">Learning from past decisions over time</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center italic">
                    Based on consistency, restraint, and reflection
                  </p>
                </div>
              </DialogContent>
            </Dialog>

            {user.streak > 0 && (
              <Badge variant="outline" className="gap-1" data-testid="badge-streak">
                <Flame className="w-3 h-3 text-orange-500" />
                {user.streak} day{user.streak !== 1 ? "s" : ""}
              </Badge>
            )}

            {user.isProfilePrivate && (
              <Badge variant="outline" className="gap-1" data-testid="badge-private">
                <EyeOff className="w-3 h-3" />
                Private
              </Badge>
            )}
          </div>

          {/* Whisper line under health */}
          <p className="text-xs text-muted-foreground/60 italic" data-testid="text-health-whisper">
            Based on consistency, restraint, and reflection
          </p>
        </motion.div>

        {/* === ANIMATED STATS ROW === */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { icon: Flame, label: "Streak", value: user.streak, color: "text-orange-500", suffix: "d" },
            { icon: Heart, label: "Health", value: user.moneyHealth, color: "text-emerald-500", suffix: "" },
            { icon: Target, label: "Games", value: user.gamesPlayed, color: "text-blue-500", suffix: "" },
            { icon: Star, label: "Best", value: user.highestStreak, color: "text-yellow-500", suffix: "d" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card/50 border border-border/50">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-lg font-bold tabular-nums">
                <AnimatedCounter value={stat.value} duration={1.2} suffix={stat.suffix} />
              </span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* === ACHIEVEMENT SHOWCASE === */}
        {isOwnProfile && user.badges && (() => {
          const unlockedBadges = user.badges
            .filter((b) => b.unlocked)
            .slice(-3)
            .map((b) => {
              const def = BADGE_DEFINITIONS.find((d) => d.id === b.badgeId);
              return def ? { badgeId: b.badgeId, name: def.name, iconName: def.icon } : null;
            })
            .filter(Boolean) as { badgeId: string; name: string; iconName: string }[];

          if (unlockedBadges.length === 0) return null;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex items-center gap-3">
                {unlockedBadges.map((badge, i) => (
                  <motion.div
                    key={badge.badgeId}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center"
                    title={badge.name}
                  >
                    <Trophy className="w-4 h-4 text-primary" />
                  </motion.div>
                ))}
              </div>
              <Link href="/achievements">
                <Button variant="link" size="sm" className="text-[11px] text-muted-foreground h-auto p-0">
                  View all {user.badges.filter((b) => b.unlocked).length} badges →
                </Button>
              </Link>
            </motion.div>
          );
        })()}

        {/* === ACTIVITY SPARKLINE (Last 14 Days) === */}
        {isOwnProfile && user.gameHistory && user.gameHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Last 14 Days</span>
            <div className="flex items-end gap-[3px]">
              {Array.from({ length: 14 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (13 - i));
                const dateStr = date.toISOString().split("T")[0];
                const game = user.gameHistory.find((g) => g.date.startsWith(dateStr));
                const played = !!game;
                const score = game?.score || 0;
                const height = played ? Math.max(8, Math.min(24, (score / 500) * 24)) : 4;
                return (
                  <div
                    key={i}
                    className={`w-[6px] rounded-full transition-all ${
                      played ? "bg-primary" : "bg-muted-foreground/20"
                    }`}
                    style={{ height: `${height}px` }}
                    title={`${dateStr}: ${played ? `${score} pts` : "No game"}`}
                  />
                );
              })}
            </div>
          </motion.div>
        )}

        {/* === REFLECTION LINE === */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground italic" data-testid="text-reflection">
              "{reflectionLine}"
            </p>
          </motion.div>
        )}

        {/* === SOCIAL SECTION (own profile) === */}
        {isOwnProfile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="p-4 space-y-3" data-testid="card-share-username">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-primary" />
                <span>Play better with people who know you</span>
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

              <p className="text-xs text-muted-foreground" data-testid="text-privacy-hint">
                You control what others see.
              </p>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <Button
              className="flex-1 gap-2 btn-premium border-0"
              onClick={() => navigate("/challenges")}
              data-testid="button-challenge-user"
            >
              <Swords className="w-4 h-4" />
              Challenge
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => params.userId && addFriendMutation.mutate(params.userId)}
              disabled={addFriendMutation.isPending}
              data-testid="button-add-friend"
            >
              {addFriendMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {addFriendMutation.isPending ? "Adding..." : "Add Friend"}
            </Button>
          </motion.div>
        )}

        {/* === MONEY PHILOSOPHY (own profile only, collapsible) === */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Collapsible open={philosophyOpen || editingPhilosophy} onOpenChange={setPhilosophyOpen}>
              <Card className="p-4 space-y-2" data-testid="card-money-philosophy">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium shrink-0">
                        Money Philosophy
                      </p>
                      {user.moneyPhilosophy && !philosophyOpen && !editingPhilosophy && (
                        <span className="text-xs text-muted-foreground/50 truncate">
                          — {user.moneyPhilosophy}
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: philosophyOpen || editingPhilosophy ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <AnimatePresence mode="wait">
                    {editingPhilosophy ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-2 pt-2"
                      >
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <span>I'm trying to be more mindful about</span>
                        </div>
                        <Input
                          value={philosophyDraft}
                          onChange={(e) => setPhilosophyDraft(e.target.value.slice(0, 80))}
                          placeholder="impulse upgrades, subscription creep..."
                          className="text-sm"
                          data-testid="input-philosophy"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground/50">{philosophyDraft.length}/80</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingPhilosophy(false)}
                              data-testid="button-cancel-philosophy"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSavePhilosophy}
                              disabled={updateFieldMutation.isPending}
                              data-testid="button-save-philosophy"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="pt-2"
                      >
                        <div className="flex items-center justify-between">
                          {user.moneyPhilosophy ? (
                            <p className="text-sm italic flex-1" data-testid="text-philosophy">
                              "I'm trying to be more mindful about {user.moneyPhilosophy}"
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground/50 flex-1" data-testid="text-philosophy-empty">
                              Tap the pencil to set your money philosophy
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhilosophyDraft(user.moneyPhilosophy || "");
                              setPhilosophyOpen(true);
                              setEditingPhilosophy(true);
                            }}
                            data-testid="button-edit-philosophy"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        )}

        {/* === FRIEND VISIBILITY (own profile only) === */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between gap-2 px-1" data-testid="control-friend-visibility">
              <span className="text-sm text-muted-foreground">Friends can see:</span>
              <Select
                value={user.friendVisibility || "trend"}
                onValueChange={(value: "nothing" | "trend" | "streak") => {
                  updateFieldMutation.mutate({ friendVisibility: value });
                }}
              >
                <SelectTrigger className="w-[140px]" data-testid="select-friend-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nothing" data-testid="option-visibility-nothing">Nothing</SelectItem>
                  <SelectItem value="trend" data-testid="option-visibility-trend">Health trend</SelectItem>
                  <SelectItem value="streak" data-testid="option-visibility-streak">Streak only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        {/* === PRIVATE MILESTONES (own profile only) === */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4 space-y-3" data-testid="card-milestones">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Quiet Wins
                </p>
                <Badge variant="outline" className="text-[10px]">
                  <EyeOff className="w-2.5 h-2.5 mr-1" />
                  Only you
                </Badge>
              </div>

              <MilestoneProgress
                value={milestones.filter(m => m.unlocked).length}
                max={milestones.length}
                milestones={milestones.map((m, i) => ({
                  value: i + 1,
                  label: m.label,
                  icon: m.icon,
                  reached: m.unlocked,
                }))}
                showLabels={false}
                showTooltips={true}
                gradient={true}
                shimmer={milestones.every(m => m.unlocked)}
              />
            </Card>
          </motion.div>
        )}

        {/* === SCORE TREND === */}
        {isOwnProfile && user.gameHistory && user.gameHistory.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            <ScoreTrendChart gameHistory={user.gameHistory} />
          </motion.div>
        )}

        {/* === WHY I'M HERE (own profile only, collapsible) === */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Collapsible open={whyHereOpen || editingWhyHere} onOpenChange={setWhyHereOpen}>
              <Card className="p-4 space-y-2" data-testid="card-why-here">
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between gap-2 cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium shrink-0">
                        Why I'm Here
                      </p>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        <EyeOff className="w-2.5 h-2.5 mr-1" />
                        Private
                      </Badge>
                      {user.whyImHere && !whyHereOpen && !editingWhyHere && (
                        <span className="text-xs text-muted-foreground/50 truncate">
                          — {user.whyImHere}
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: whyHereOpen || editingWhyHere ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                  <AnimatePresence mode="wait">
                    {editingWhyHere ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-2 pt-2"
                      >
                        <Textarea
                          value={whyHereDraft}
                          onChange={(e) => setWhyHereDraft(e.target.value.slice(0, 200))}
                          placeholder="I use Lifestyle Creep because..."
                          rows={3}
                          className="text-sm resize-none"
                          data-testid="input-why-here"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-muted-foreground/50">{whyHereDraft.length}/200</span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingWhyHere(false)}
                              data-testid="button-cancel-why-here"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSaveWhyHere}
                              disabled={updateFieldMutation.isPending}
                              data-testid="button-save-why-here"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="pt-2"
                      >
                        <div className="flex items-center justify-between">
                          {user.whyImHere ? (
                            <p className="text-sm italic flex-1" data-testid="text-why-here">
                              "{user.whyImHere}"
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground/50 flex-1" data-testid="text-why-here-empty">
                              Add a private note about why you play
                            </p>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setWhyHereDraft(user.whyImHere || "");
                              setWhyHereOpen(true);
                              setEditingWhyHere(true);
                            }}
                            data-testid="button-edit-why-here"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </motion.div>
        )}

        {/* === EDIT PROFILE (tertiary) === */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/profile-setup?edit=true" replace>
              <Button variant="ghost" className="w-full gap-2 text-muted-foreground" data-testid="button-edit-profile">
                <Settings className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </motion.div>
        )}

        {/* === BOTTOM EMPTY SPACE === */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <div className="w-12 h-px bg-border mx-auto mb-4" />
          <p className="text-xs text-muted-foreground/40" data-testid="text-profile-grows">
            This profile grows as you play.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
