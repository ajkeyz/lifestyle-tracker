import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { AppLogo } from "@/components/app-logo";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import {
  ArrowLeft,
  Users,
  Check,
  Loader2,
  UserPlus,
  Calendar,
  Gamepad2,
  Sparkles,
  Zap,
  Search,
  Heart,
  Flame,
  Send,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CoopSession, CoopMode, ArcadeStatus, User } from "@shared/schema";

type FriendPickerTab = "friends" | "search";

export default function CoopLobby() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [selectedMode, setSelectedMode] = useState<CoopMode>("daily");
  const [selectedFriend, setSelectedFriend] = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [pickerTab, setPickerTab] = useState<FriendPickerTab>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [invitedFriendName, setInvitedFriendName] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    if (searchQuery.length < 3) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-join from URL params (e.g. from push notification ?join=CODE)
  // Also handles ?invite={friendId} from Social page Play Co-op button
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      joinSessionMutation.mutate(joinCode.toUpperCase());
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: arcadeStatus } = useQuery<ArcadeStatus>({
    queryKey: ["/api/arcade-status"],
  });

  const { data: friends, isLoading: loadingFriends } = useQuery<
    { id: string; username: string; avatar: string; moneyHealth: number; streak: number }[]
  >({
    queryKey: ["/api/friends"],
  });

  // Auto-select friend from ?invite={friendId} URL param (e.g. from Social page)
  const [autoInviteHandled, setAutoInviteHandled] = useState(false);
  useEffect(() => {
    if (autoInviteHandled || !friends) return;
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get("invite");
    if (!inviteId) return;
    const friend = friends.find((f) => f.id === inviteId);
    if (friend) {
      setSelectedFriend({ id: friend.id, username: friend.username, avatar: friend.avatar });
      setPickerTab("friends");
      setAutoInviteHandled(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [friends, autoInviteHandled]);

  const { data: pendingInvites } = useQuery<CoopSession[]>({
    queryKey: ["/api/coop/pending-invites"],
    refetchInterval: 10000,
  });

  const { data: searchResult, isLoading: isSearching } = useQuery<{
    found: boolean;
    username: string | null;
    userId: string | null;
  }>({
    queryKey: ["/api/search-user", debouncedQuery],
    queryFn: async () => {
      const res = await fetch(`/api/search-user/${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Failed to search user");
      return res.json();
    },
    enabled: debouncedQuery.length >= 3,
    staleTime: 5000,
  });

  const { data: session, refetch: refetchSession } = useQuery<CoopSession>({
    queryKey: ["/api/coop/session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/coop/session/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: sessionId ? 2000 : false,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/coop/create", {
        mode: selectedMode,
        arcadeGameIndex: selectedMode === "arcade" ? 0 : undefined,
        invitedUserId: selectedFriend?.id,
      });
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsHost(true);
      setInvitedFriendName(selectedFriend?.username || null);
      toast({
        title: "Invite sent!",
        description: `${selectedFriend?.username} will receive a notification to join.`,
      });
    },
    onError: () => {
      toast({
        title: "Couldn't create session",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/coop/join", { code });
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsHost(false);
      navigate(`/coop-game/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Couldn't join",
        description: "Session not found or already full.",
        variant: "destructive",
      });
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/coop/session/${sessionId}/start`);
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: (data) => {
      navigate(`/coop-game/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Couldn't start the game",
        description: "Make sure your friend has joined, then try again.",
        variant: "destructive",
      });
    },
  });

  const handleStartGame = () => {
    if (session && session.players.length >= 2) {
      startGameMutation.mutate();
    }
  };

  const handleSearchChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    setSearchQuery(cleaned);
  };

  const canStart = session && session.players.length >= 2 && isHost;

  // ── Invite expiration countdown ──────────────────────────────
  // Invite expires 2 minutes after creation if friend hasn't joined.
  const INVITE_DURATION_S = 120;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!session || session.players.length >= 2 || session.status !== "waiting") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [session?.id, session?.players.length, session?.status]);

  const inviteSecondsLeft = session && session.players.length < 2
    ? Math.max(0, INVITE_DURATION_S - Math.floor((now - new Date(session.createdAt).getTime()) / 1000))
    : INVITE_DURATION_S;
  const inviteExpired = inviteSecondsLeft <= 0 && session && session.players.length < 2;

  // Auto-reset when invite expires
  useEffect(() => {
    if (!inviteExpired) return;
    toast({
      title: "Invite expired",
      description: invitedFriendName ? `${invitedFriendName} didn't join in time.` : "Try sending a new invite.",
      variant: "destructive",
    });
    setSessionId(null);
    setIsHost(false);
    setInvitedFriendName(null);
    setSelectedFriend(null);
  }, [inviteExpired]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <AmbientBackground variant="default" />
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/play-hub")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <AppLogo size="sm" />
          <h1 className="text-lg font-semibold tracking-[-0.02em]">
            Play with Friend
          </h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-md mx-auto space-y-4">
        {/* Pending Invites Banner */}
        {!sessionId && pendingInvites && pendingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pending Invites
            </p>
            {pendingInvites.map((invite) => {
              const hostPlayer = invite.players.find((p) => p.id === invite.hostId);
              return (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary/30 bg-primary/5"
                >
                  <AnimatedAvatar
                    avatarId={hostPlayer?.avatar || "cosmic-cat"}
                    size="sm"
                    isAnimated
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {hostPlayer?.username || "Someone"} invited you
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invite.mode === "daily" ? "Daily Drop" : "Arcade"} co-op
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={() => joinSessionMutation.mutate(invite.code)}
                    disabled={joinSessionMutation.isPending}
                    data-testid={`button-join-invite-${invite.id}`}
                  >
                    {joinSessionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Join"
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!sessionId ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Mode Selection */}
            <Card className="relative">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600 rounded-t-xl" />
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="font-display text-xl tracking-tight">
                  Challenge a Friend
                </CardTitle>
                <CardDescription className="text-xs">
                  Pick a friend and play scenarios together!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mode Toggle */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Mode</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      role="button"
                      tabIndex={0}
                      whileTap={{ scale: 0.97 }}
                      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedMode === "daily"
                          ? "border-primary bg-gradient-to-b from-primary/10 to-primary/5 shadow-sm shadow-primary/10"
                          : "border-border hover:border-primary/40"
                      }`}
                      onClick={() => setSelectedMode("daily")}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedMode("daily")}
                      data-testid="mode-daily"
                    >
                      {selectedMode === "daily" && (
                        <motion.div
                          className="absolute top-2 right-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedMode === "daily" ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          <Calendar
                            className={`h-5 w-5 ${
                              selectedMode === "daily" ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Daily Drop</p>
                          <p className="text-[10px] text-muted-foreground">Today&apos;s scenarios</p>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div
                      role="button"
                      tabIndex={0}
                      whileTap={{ scale: 0.97 }}
                      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedMode === "arcade"
                          ? "border-primary bg-gradient-to-b from-primary/10 to-primary/5 shadow-sm shadow-primary/10"
                          : "border-border hover:border-primary/40"
                      }`}
                      onClick={() => setSelectedMode("arcade")}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedMode("arcade")}
                      data-testid="mode-arcade"
                    >
                      {selectedMode === "arcade" && (
                        <motion.div
                          className="absolute top-2 right-2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring" }}
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedMode === "arcade" ? "bg-primary/20" : "bg-muted"
                          }`}
                        >
                          <Gamepad2
                            className={`h-5 w-5 ${
                              selectedMode === "arcade" ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Arcade</p>
                          <p className="text-[10px] text-muted-foreground">
                            {arcadeStatus
                              ? `${
                                  arcadeStatus.membershipTier === "free"
                                    ? "1 game/day"
                                    : arcadeStatus.membershipTier === "plus"
                                    ? "3 games/day"
                                    : "Unlimited"
                                }`
                              : "Arcade mode"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
                </motion.div>

                {/* Mascot */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.3 }}>
                <div className="flex justify-center mb-4 py-2">
                  <Mascot
                    mood="happy"
                    size="md"
                    showBubble={true}
                    speechDelay={1400}
                    message="Pick your partner wisely!"
                    context={{ screen: "coop-lobby", username: "", streak: 0 } satisfies MascotContext}
                  />
                </div>
                </motion.div>

                {/* Friend Picker */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pick a Friend</Label>

                  {/* Tab toggle */}
                  <div className="flex rounded-lg bg-muted p-1 gap-1">
                    <button
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                        pickerTab === "friends"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setPickerTab("friends")}
                    >
                      <Users className="w-3 h-3 inline mr-1" />
                      Friends
                    </button>
                    <button
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${
                        pickerTab === "search"
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setPickerTab("search")}
                    >
                      <Search className="w-3 h-3 inline mr-1" />
                      Search
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {pickerTab === "friends" ? (
                      <motion.div
                        key="friends"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                      >
                        {loadingFriends ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : !friends || friends.length === 0 ? (
                          <div className="text-center py-6">
                            <p className="text-sm text-muted-foreground mb-2">No friends yet</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate("/friends")}
                            >
                              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                              Add Friends
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-52 overflow-y-auto">
                            {friends.map((friend) => (
                              <motion.div
                                key={friend.id}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                  selectedFriend?.id === friend.id
                                    ? "bg-primary/10 border border-primary/25"
                                    : "bg-muted/40 hover:bg-muted/60 border border-transparent"
                                }`}
                                onClick={() =>
                                  setSelectedFriend(
                                    selectedFriend?.id === friend.id
                                      ? null
                                      : { id: friend.id, username: friend.username, avatar: friend.avatar }
                                  )
                                }
                                data-testid={`friend-pick-${friend.id}`}
                              >
                                <AnimatedAvatar avatarId={friend.avatar || "cosmic-cat"} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{friend.username}</p>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                                    <span className="flex items-center gap-0.5">
                                      <Heart className="w-3 h-3" />
                                      {friend.moneyHealth}
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <Flame className="w-3 h-3" />
                                      {friend.streak}
                                    </span>
                                  </p>
                                </div>
                                {selectedFriend?.id === friend.id && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500 }}
                                  >
                                    <Check className="w-5 h-5 text-primary" />
                                  </motion.div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="search"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-2"
                      >
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search by username..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9 text-sm"
                            data-testid="input-search-user"
                          />
                        </div>

                        {isSearching && (
                          <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        )}

                        {searchResult && !isSearching && (
                          <AnimatePresence>
                            {searchResult.found && searchResult.userId ? (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                  selectedFriend?.id === searchResult.userId
                                    ? "bg-primary/10 border border-primary/25"
                                    : "bg-muted/40 hover:bg-muted/60 border border-transparent"
                                }`}
                                onClick={() =>
                                  setSelectedFriend(
                                    selectedFriend?.id === searchResult.userId
                                      ? null
                                      : {
                                          id: searchResult.userId!,
                                          username: searchResult.username!,
                                          avatar: "cosmic-cat",
                                        }
                                  )
                                }
                                data-testid="search-result"
                              >
                                <AnimatedAvatar avatarId="cosmic-cat" size="sm" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{searchResult.username}</p>
                                </div>
                                {selectedFriend?.id === searchResult.userId && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 500 }}
                                  >
                                    <Check className="w-5 h-5 text-primary" />
                                  </motion.div>
                                )}
                              </motion.div>
                            ) : (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-muted-foreground text-center py-3"
                              >
                                No user found with that username
                              </motion.p>
                            )}
                          </AnimatePresence>
                        )}

                        {!searchResult && !isSearching && debouncedQuery.length === 0 && searchQuery.length > 0 && searchQuery.length < 3 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            Type at least 3 characters to search
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </motion.div>

                {/* Selected Friend Indicator + Send Invite Button */}
                <AnimatePresence>
                  {selectedFriend && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary/5 border border-primary/15 mb-3">
                        <AnimatedAvatar avatarId={selectedFriend.avatar || "cosmic-cat"} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Challenging</p>
                          <p className="text-sm font-semibold truncate">{selectedFriend.username}</p>
                        </div>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedFriend(null)}
                        >
                          Change
                        </button>
                      </div>

                      <Button
                        className="w-full h-11 btn-gold border-0 font-bold"
                        onClick={() => createSessionMutation.mutate()}
                        disabled={createSessionMutation.isPending}
                        data-testid="button-send-invite"
                      >
                        {createSessionMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send Invite
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Waiting Lobby */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-600 rounded-t-2xl" />
              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl tracking-tight">
                  {invitedFriendName ? "Invite Sent!" : "Waiting for Player"}
                </CardTitle>
                <CardDescription>
                  {invitedFriendName
                    ? `Waiting for ${invitedFriendName} to join...`
                    : "Waiting for your friend to join"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invite sent animation */}
                {invitedFriendName && (
                  <motion.div
                    className="flex flex-col items-center gap-3 py-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 hsl(var(--primary) / 0.2)",
                          "0 0 0 12px hsl(var(--primary) / 0)",
                        ],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    >
                      <Send className="h-7 w-7 text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      {invitedFriendName} will get a notification
                    </p>
                  </motion.div>
                )}

                {/* Player list */}
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Players ({session?.players.length || 0}/2)
                  </p>

                  {/* Invite expiration countdown */}
                  {session && session.players.length < 2 && session.status === "waiting" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Invite expires in</span>
                        <span
                          className={
                            inviteSecondsLeft <= 30
                              ? "font-mono font-bold text-destructive tabular-nums"
                              : inviteSecondsLeft <= 60
                                ? "font-mono font-bold text-amber-500 tabular-nums"
                                : "font-mono font-bold text-foreground tabular-nums"
                          }
                          data-testid="text-invite-countdown"
                        >
                          {Math.floor(inviteSecondsLeft / 60)}:{String(inviteSecondsLeft % 60).padStart(2, "0")}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <motion.div
                          className={
                            inviteSecondsLeft <= 30
                              ? "h-full rounded-full bg-destructive"
                              : inviteSecondsLeft <= 60
                                ? "h-full rounded-full bg-amber-500"
                                : "h-full rounded-full bg-primary"
                          }
                          initial={false}
                          animate={{ width: `${(inviteSecondsLeft / INVITE_DURATION_S) * 100}%` }}
                          transition={{ duration: 0.5, ease: "linear" }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {session?.players.map((player, i) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.9, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        transition={{ delay: i * 0.15, type: "spring" }}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50"
                      >
                        <AnimatedAvatar avatarId={player.avatar || "cosmic-cat"} size="sm" isAnimated />
                        <div className="flex-1">
                          <p className="font-medium">{player.username || "Player"}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {player.connected ? (
                              <>
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                Connected
                              </>
                            ) : (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Connecting...
                              </>
                            )}
                          </p>
                        </div>
                        {player.id === session.hostId && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                            Host
                          </span>
                        )}
                      </motion.div>
                    ))}

                    {session && session.players.length < 2 && (
                      <motion.div
                        className="flex items-center gap-3 p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5"
                        animate={{
                          borderColor: [
                            "hsl(var(--primary) / 0.3)",
                            "hsl(var(--primary) / 0.1)",
                            "hsl(var(--primary) / 0.3)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-5 w-5 text-primary" />
                          </motion.div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Waiting for friend</p>
                          <p className="text-xs text-muted-foreground">
                            {invitedFriendName
                              ? `${invitedFriendName} has been notified`
                              : "Your friend will join soon"}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {isHost && (
                  <motion.div
                    animate={canStart ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Button
                      className={`w-full h-12 ${canStart ? "btn-premium border-0" : ""}`}
                      onClick={handleStartGame}
                      disabled={!canStart || startGameMutation.isPending}
                      data-testid="button-start-game"
                    >
                      {startGameMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      ) : canStart ? (
                        <Zap className="h-5 w-5 mr-2" />
                      ) : null}
                      {canStart ? "Start Game!" : "Waiting for friend..."}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
