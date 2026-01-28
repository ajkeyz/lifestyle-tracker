import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { Floating3DAvatar, FloatingCard } from "@/components/ui/tilt-card";
import { 
  ChevronLeft,
  Copy,
  Check,
  Settings,
  Flame,
  TrendingUp,
  Users,
  Share2,
  Eye,
  EyeOff,
  Swords,
  UserPlus,
  Loader2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

function getMoneyHealthLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "text-emerald-500" };
  if (score >= 75) return { label: "Great", color: "text-green-500" };
  if (score >= 60) return { label: "Good", color: "text-lime-500" };
  if (score >= 45) return { label: "Fair", color: "text-yellow-500" };
  if (score >= 30) return { label: "Needs Work", color: "text-orange-500" };
  return { label: "Starting Out", color: "text-red-500" };
}

export default function Profile() {
  const [, navigate] = useLocation();
  const params = useParams<{ userId?: string }>();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const isOwnProfile = !params.userId;

  const { data: user, isLoading } = useQuery<User>({
    queryKey: isOwnProfile ? ["/api/user"] : ["/api/user", params.userId],
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

  const healthInfo = getMoneyHealthLabel(user.moneyHealth);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
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
            <span className="font-display font-bold tracking-tight">
              {isOwnProfile ? "Profile" : user?.username || "Profile"}
            </span>
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
          <Floating3DAvatar data-testid="avatar-user">
            <div className="relative">
              <AnimatedAvatar 
                avatarId={user.avatar || "cosmic-cat"} 
                size="lg" 
                showRing={user.streak >= 7}
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
            </div>
          </Floating3DAvatar>

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

        {isOwnProfile ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FloatingCard className="p-4 space-y-3" depth="lg" data-testid="card-share-username">
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
            </FloatingCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3"
          >
            <Button 
              className="flex-1 gap-2"
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


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <Link href="/profile-setup?edit=true">
            <Button variant="outline" className="w-full gap-2" data-testid="button-edit-profile">
              <Settings className="w-4 h-4" />
              Edit Profile
            </Button>
          </Link>

        </motion.div>
      </main>
    </div>
  );
}
