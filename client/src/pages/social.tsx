import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { Badge } from "@/components/ui/badge";
import { AmbientBackground } from "@/components/ambient-background";
import {
  Users2,
  ChevronRight,
  Sparkles,
  Flame,
  UserPlus,
  Bell,
  Loader2,
  Copy,
  Check,
  Share2,
  Settings,
  EyeOff,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function Social() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [nudgedFriends, setNudgedFriends] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const handleCopyUsername = async (username: string) => {
    try {
      await navigator.clipboard.writeText(username);
      setCopied(true);
      toast({ title: "Username copied!", description: "Share it with friends so they can find you." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Please copy the username manually.", variant: "destructive" });
    }
  };

  const handleShareUsername = async (username: string) => {
    const shareText = `Add me on Lifestyle Creep! My username is: ${username}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Add me on Lifestyle Creep", text: shareText });
      } catch (err) {
        if ((err as Error).name !== "AbortError") handleCopyUsername(username);
      }
    } else {
      handleCopyUsername(username);
    }
  };

  const nudgeMutation = useMutation({
    mutationFn: async (friendId: string) => {
      const res = await apiRequest("POST", `/api/friends/${friendId}/nudge`);
      return res.json();
    },
    onSuccess: (_, friendId) => {
      setNudgedFriends((prev) => new Set(prev).add(friendId));
      toast({ title: "Nudge sent!", description: "Your friend will get a reminder to play." });
    },
    onError: (err: Error) => {
      toast({ title: "Can't nudge", description: err.message || "Try again later.", variant: "destructive" });
    },
  });

  // Mark social activity as read when this screen mounts
  useEffect(() => {
    // Update the unread state client-side immediately
    qc.setQueryData(["/api/social/unread"], { hasUnread: false });
    // Also POST to the server to mark as read
    fetch("/api/social/mark-read", { method: "POST" }).catch((err) => {
      console.warn("Failed to mark social as read:", err);
    });
  }, [qc]);

  const { data: user } = useQuery<UserType>({ queryKey: ["/api/user"] });

  // Activity feed data from friends
  const { data: friendsActivity, isLoading: activityLoading } = useQuery<{
    friendsPlayedToday: number;
    totalFriends: number;
    recentActivity: ActivityItem[];
  }>({
    queryKey: ["/api/friends/activity"],
    refetchInterval: 60000,
  });

  // Friends list
  const { data: friends, isLoading: friendsLoading } = useQuery<
    { id: string; username: string; avatar: string; moneyHealth: number; streak: number }[]
  >({
    queryKey: ["/api/friends"],
  });

  const topFriends = friends?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
      <AmbientBackground variant="default" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-2.5">
          <Users2 className="w-5 h-5 text-primary" />
          <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em] text-foreground">
            Social
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-8"
          onClick={() => navigate("/friends")}
          data-testid="button-manage-friends"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-xs">Add Friends</span>
        </Button>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* ═══ You: identity + share + privacy ═══ */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-4 rounded-2xl space-y-3" data-testid="card-you">
              <div className="flex items-center gap-3">
                <AnimatedAvatar
                  avatarId={user.avatar || "cosmic-cat"}
                  size="xs"
                  isAnimated={false}
                  className="w-11 h-11 [&>div]:w-11 [&>div]:h-11"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold truncate">@{user.username}</h2>
                    {user.isProfilePrivate && (
                      <Badge variant="outline" className="gap-1 h-5 text-[10px]" data-testid="badge-private">
                        <EyeOff className="w-2.5 h-2.5" />
                        Private
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">You control what others see</p>
                </div>
                <Link href="/profile-setup?edit=true">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    data-testid="button-edit-profile"
                    aria-label="Edit profile"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Share username row */}
              <div className="flex gap-2">
                <Input
                  value={user.username}
                  readOnly
                  className="font-mono text-sm h-9"
                  data-testid="input-username-share"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => handleCopyUsername(user.username)}
                  data-testid="button-copy-username"
                  aria-label="Copy username"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => handleShareUsername(user.username)}
                  data-testid="button-share-username"
                  aria-label="Share username"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ═══ SECTION 1: Activity Feed (Primary) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="rounded-2xl" data-testid="card-activity-feed">
            <div className="flex items-center gap-2 p-4 pb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold flex-1">Activity</h2>
              {friendsActivity && friendsActivity.friendsPlayedToday > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {friendsActivity.friendsPlayedToday} friend
                  {friendsActivity.friendsPlayedToday !== 1 ? "s" : ""} played today
                </span>
              )}
            </div>
            <ActivityFeed
              activities={friendsActivity?.recentActivity ?? []}
              isLoading={activityLoading}
              className="px-1 pb-3"
            />
          </Card>
        </motion.div>

        {/* ═══ SECTION 2: Friends (Secondary) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="p-4 rounded-2xl" data-testid="card-social-friends">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">Friends</h3>
                <span className="text-[11px] text-muted-foreground">
                  {friends?.length ?? 0}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={() => navigate("/friends")}
                data-testid="button-view-all-friends"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {friendsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topFriends.length > 0 ? (
              <div className="space-y-1">
                {topFriends.map((friend, index) => (
                  <div
                    key={friend.id}
                    data-testid={`social-friend-${friend.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      {/* Rank + Avatar */}
                      <div className="relative">
                        <AnimatedAvatar
                          avatarId={friend.avatar || "cosmic-cat"}
                          size="xs"
                          isAnimated={false}
                          className="w-9 h-9 [&>div]:w-9 [&>div]:h-9"
                        />
                        <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm border border-card">
                          <span className="text-[8px] font-bold text-white">{index + 1}</span>
                        </div>
                        {/* Activity dot */}
                        <div
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                            friend.streak > 0 ? "bg-green-500" : "bg-muted-foreground/30"
                          )}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{friend.username}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5 text-primary" />
                            {friend.moneyHealth} Fitness
                          </span>
                          {friend.streak > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5 text-orange-500" />
                              {friend.streak}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Nudge button */}
                      {friend.streak === 0 && !nudgedFriends.has(friend.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-primary flex-shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            nudgeMutation.mutate(friend.id);
                          }}
                          disabled={nudgeMutation.isPending}
                          data-testid={`button-nudge-${friend.id}`}
                        >
                          {nudgeMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Bell className="w-3 h-3" />
                          )}
                          Nudge
                        </Button>
                      )}
                      {nudgedFriends.has(friend.id) && (
                        <Badge variant="outline" className="text-[10px] h-5 flex-shrink-0 text-green-500 border-green-500/30">
                          Nudged
                        </Badge>
                      )}
                    </motion.div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                  <Users2 className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">No friends yet</p>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => navigate("/friends")}
                  data-testid="button-add-friends-social"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Friends
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Community section removed — accessible via home page preview + bottom nav */}
      </main>
    </div>
  );
}
