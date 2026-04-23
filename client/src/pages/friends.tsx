import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  UserPlus,
  Swords,
  Trophy,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Flame,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ViewMode = "main" | "add-friend";

export default function Friends() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (searchQuery.length < 3) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: friends, isLoading: loadingFriends } = useQuery<{ id: string; username: string; avatar: string; moneyHealth: number; streak: number }[]>({
    queryKey: ["/api/friends"],
  });

  const { data: searchResult, isLoading: isSearching } = useQuery<{ found: boolean; username: string | null; userId: string | null }>({
    queryKey: ["/api/search-user", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search-user/${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search user");
      return res.json();
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 5000,
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
        description: "You can now see them in your friends list.",
      });
      setSearchQuery("");
      setDebouncedQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Couldn't add friend",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearchChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    setSearchQuery(cleaned);
  };

  const handleAddFriend = (userId: string) => {
    addFriendMutation.mutate(userId);
  };

  if (viewMode === "add-friend") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
        <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("main")} data-testid="button-back" aria-label="Go back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="font-bold text-lg">Add Friend</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="container max-w-md mx-auto p-4 space-y-6">
          <div className="text-center py-4">
            <h1 className="text-xl font-bold mb-2" data-testid="text-add-friend-title">
              Find a Friend
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter their username to connect
            </p>
          </div>

          <Card className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-search-username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {!isSearching && searchResult?.found && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
                {!isSearching && debouncedQuery.length >= 3 && searchResult && !searchResult.found && (
                  <X className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>

            {searchResult?.found && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md" data-testid="search-result-found">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{searchResult.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{searchResult.username}</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => searchResult.userId && handleAddFriend(searchResult.userId)}
                  disabled={addFriendMutation.isPending || !searchResult.userId}
                  data-testid="button-add-friend"
                >
                  {addFriendMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-1" />
                  )}
                  {addFriendMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            )}

            {debouncedQuery.length >= 3 && searchResult && !searchResult.found && (
              <p className="text-sm text-muted-foreground text-center">
                No user found with that username
              </p>
            )}

            {searchQuery.length > 0 && searchQuery.length < 3 && (
              <p className="text-xs text-muted-foreground text-center">
                Type at least 3 characters to search
              </p>
            )}
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back-home" aria-label="Back to home">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <AppLogo size="sm" />
          <span className="font-bold text-lg">Friends</span>
          {friends && friends.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5 px-1.5 min-w-[20px] justify-center">
              {friends.length}
            </Badge>
          )}
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            className="w-full gap-2 btn-premium border-0"
            onClick={() => setViewMode("add-friend")}
            data-testid="button-add-new-friend"
          >
            <UserPlus className="w-4 h-4" />
            Add Friend by Username
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="p-4" data-testid="card-friends-leaderboard">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Rankings</h3>
                <p className="text-xs text-muted-foreground">Compare Money Health</p>
              </div>
            </div>
            
            {loadingFriends ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : friends && friends.length > 0 ? (
              <div className="space-y-2">
                {friends.map((friend, index) => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div data-testid={`link-friend-profile-${friend.id}`}>
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 transition-colors"
                        data-testid={`friend-row-${friend.id}`}
                      >
                        <span className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</span>
                        <div className="relative">
                          <AnimatedAvatar avatarId={friend.avatar || "cosmic-cat"} size="sm" />
                          {/* Activity status dot */}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                              friend.streak > 0 ? "bg-green-500" : "bg-muted-foreground/30"
                            }`}
                            title={friend.streak > 0 ? "Active" : "Inactive"}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm">{friend.username}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" />
                              {friend.moneyHealth}
                            </span>
                            {friend.streak > 0 && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {friend.streak}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring" }}
                  className="flex justify-center mb-4"
                >
                  <AnimatedAvatar avatarId="cosmic-cat" size="lg" isAnimated />
                </motion.div>
                <p className="font-medium mb-1">No friends yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add friends to compare scores and challenge each other
                </p>
                <Button
                  className="gap-2 btn-premium border-0"
                  onClick={() => setViewMode("add-friend")}
                  data-testid="button-add-first-friend"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Your First Friend
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card 
            className="p-4 cursor-pointer hover-elevate" 
            onClick={() => navigate("/challenges")}
            data-testid="card-challenge-friend"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                  <Swords className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Challenge a Friend</h3>
                  <p className="text-xs text-muted-foreground">See who's got better money moves</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card 
            className="p-4 cursor-pointer hover-elevate" 
            onClick={() => navigate("/leagues")}
            data-testid="card-leagues"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Leagues</h3>
                  <p className="text-xs text-muted-foreground">Join or create friend groups</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
