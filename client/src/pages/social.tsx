import { useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityFeed, type ActivityItem } from "@/components/activity-feed";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { Badge } from "@/components/ui/badge";
import { AmbientBackground } from "@/components/ambient-background";
import { GradientStripe } from "@/components/gradient-stripe";
import {
  Users2,
  ChevronRight,
  Trophy,
  MessageSquare,
  Sparkles,
  Flame,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import type { User as UserType, CommunityScenario } from "@shared/schema";

export default function Social() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();

  // Mark social activity as read when this screen mounts
  useEffect(() => {
    // Update the unread state client-side immediately
    qc.setQueryData(["/api/social/unread"], { hasUnread: false });
    // Also POST to the server to mark as read
    fetch("/api/social/mark-read", { method: "POST" }).catch(() => {});
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

  // Community hot posts
  const { data: hotPosts, isLoading: postsLoading } = useQuery<CommunityScenario[]>({
    queryKey: ["/api/community/scenarios", { sortBy: "hot", limit: 5 }],
    queryFn: async () => {
      const res = await fetch("/api/community/scenarios?sortBy=hot");
      return res.json();
    },
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
        {/* ═══ SECTION 1: Activity Feed (Primary) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden rounded-2xl" data-testid="card-activity-feed">
            <GradientStripe variant="primary" />
            <div className="flex items-center gap-2 p-4 pb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold">Activity</h2>
                {friendsActivity && friendsActivity.friendsPlayedToday > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {friendsActivity.friendsPlayedToday} friend
                    {friendsActivity.friendsPlayedToday !== 1 ? "s" : ""} played today
                  </p>
                )}
              </div>
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
          <Card className="p-4 relative overflow-hidden rounded-2xl" data-testid="card-social-friends">
            <GradientStripe variant="primary" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <Trophy className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Friends</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {friends?.length ?? 0} friend{(friends?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
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
                  <Link
                    key={friend.id}
                    href={`/profile/${friend.id}`}
                    data-testid={`social-friend-${friend.id}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
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
                    </motion.div>
                  </Link>
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

        {/* ═══ SECTION 3: Community (Tertiary) ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="p-4 relative overflow-hidden rounded-2xl" data-testid="card-social-community">
            <GradientStripe variant="primary" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                  <MessageSquare className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Community</h3>
                  <p className="text-xs text-muted-foreground">Real scenarios, real advice</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => navigate("/community")}
                data-testid="button-view-community-social"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {postsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/20">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : hotPosts && hotPosts.length > 0 ? (
              <div className="space-y-2">
                {hotPosts.slice(0, 3).map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all"
                    onClick={() => navigate(`/community/${post.id}`)}
                    data-testid={`social-community-post-${post.id}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {post.context}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {post.upvotes + post.downvotes + post.commentCount >= 10 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 border-orange-500/30 text-orange-500 px-1.5"
                          >
                            <Flame className="w-2.5 h-2.5 mr-0.5" />
                            Hot
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3 text-primary" />
                          <span>{post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <AnimatedAvatar
                        avatarId={post.authorAvatar || "cosmic-cat"}
                        size="xs"
                      />
                      <span>{post.authorUsername}</span>
                      <span>·</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                  </motion.div>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1 text-xs mt-1"
                  onClick={() => navigate("/community/submit")}
                  data-testid="button-submit-scenario-social"
                >
                  Share a real scenario
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <p className="mb-1">Your question might save someone money tonight.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() => navigate("/community/submit")}
                >
                  Share a real scenario
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
