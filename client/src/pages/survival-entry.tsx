import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import { AppLogo } from "@/components/app-logo";
import { GradientText } from "@/components/gradient-text";
import { RollingNumber } from "@/components/animated-counter";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Zap,
  Users,
  Heart,
  TrendingUp,
  Trophy,
  Crown,
  Loader2,
  X,
  Swords,
  Shield,
} from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";


export default function SurvivalEntry() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Matchmaking state
  const [isSearching, setIsSearching] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  // Private lobby state
  const [joinCode, setJoinCode] = useState("");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const hasPlayedBefore =
    user && (user.survivalPlayed > 0 || user.survivalWins > 0);

  // Quick Match — join the matchmaking queue
  const queueMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/survival/queue");
      return res.json();
    },
    onSuccess: (data: { matchId?: string; position?: number }) => {
      if (data.matchId) {
        navigate(`/survival/lobby/${data.matchId}`);
      } else {
        setIsSearching(true);
        setQueuePosition(data.position ?? null);
      }
    },
    onError: () => {
      toast({
        title: "Queue Error",
        description: "Failed to join matchmaking. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel matchmaking
  const cancelQueueMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/survival/queue");
    },
    onSuccess: () => {
      setIsSearching(false);
      setQueuePosition(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to leave queue.",
        variant: "destructive",
      });
    },
  });

  // Create private room
  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/survival/create", {
        isPrivate: true,
      });
      return res.json();
    },
    onSuccess: (data: { matchId: string }) => {
      navigate(`/survival/lobby/${data.matchId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join private room by code
  const joinRoomMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", `/api/survival/join/${code}`);
      return res.json();
    },
    onSuccess: (data: { matchId: string }) => {
      navigate(`/survival/lobby/${data.matchId}`);
    },
    onError: () => {
      toast({
        title: "Invalid Code",
        description: "Room not found. Check the code and try again.",
        variant: "destructive",
      });
    },
  });

  const handleJoinByCode = () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (trimmed.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Room codes are 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    joinRoomMutation.mutate(trimmed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <AmbientBackground variant="premium" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/play-hub")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <AppLogo size="sm" />
          <GradientText
            variant="fire"
            as="h1"
            className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]"
          >
            Survival
          </GradientText>
        </div>
      </header>

      <main className="container max-w-md mx-auto px-4 py-6 space-y-5">
        {/* Player Stats Card */}
        <AnimatePresence>
          {hasPlayedBefore && user && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-2xl" />
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AnimatedAvatar
                      avatarId={user.avatar || "cosmic-cat"}
                      size="sm"
                      isAnimated={false}
                    />
                    <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                      Your Survival Stats
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-display font-bold tabular-nums">
                        <RollingNumber value={user.survivalPlayed} />
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Played
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold tabular-nums text-orange-500">
                        <RollingNumber value={user.survivalWins} />
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Wins
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-display font-bold tabular-nums">
                        {user.survivalBestPlacement != null
                          ? `#${user.survivalBestPlacement}`
                          : "--"}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Best
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="flex justify-center"
        >
          <Mascot
            mood="hyped"
            size="sm"
            showBubble={true}
            message="Think you can outlast them all?"
            context={{ screen: "survival-lobby", username: user?.username ?? "", streak: 0 } satisfies MascotContext}
          />
        </motion.div>

        {/* Section Label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center gap-2"
        >
          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] px-0.5">
            Choose Your Battle
          </p>
          <div className="flex-1 h-px bg-border/40" />
        </motion.div>

        {/* Quick Match Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-2xl" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/30"
                >
                  <Zap className="w-5 h-5 text-white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-bold tracking-tight">
                    Quick Match
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Join matchmaking queue — play against random opponents
                  </p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div
                    key="searching"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-center gap-3 py-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="w-5 h-5 text-orange-500" />
                      </motion.div>
                      <span className="text-sm font-medium">
                        Searching for players...
                      </span>
                    </div>
                    {queuePosition != null && (
                      <p className="text-center text-xs text-muted-foreground">
                        Queue position:{" "}
                        <span className="font-semibold text-orange-500">
                          #{queuePosition}
                        </span>
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => cancelQueueMutation.mutate()}
                      disabled={cancelQueueMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="idle">
                    <Button
                      size="lg"
                      className="w-full text-base font-bold btn-gold border-0"
                      onClick={() => queueMutation.mutate()}
                      disabled={queueMutation.isPending}
                    >
                      {queueMutation.isPending ? (
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                          }}
                        >
                          Joining...
                        </motion.span>
                      ) : (
                        <>
                          <Swords className="w-5 h-5 mr-2" />
                          Find Match
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Private Lobby Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-2xl" />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.23, duration: 0.3 }}
                  className="w-11 h-11 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0"
                >
                  <Shield className="w-5 h-5 text-orange-500" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-bold tracking-tight">
                    Private Lobby
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create a room and invite friends
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {/* Create Room */}
                <Button
                  size="lg"
                  className="w-full text-base font-bold btn-premium border-0"
                  onClick={() => createRoomMutation.mutate()}
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      Creating...
                    </motion.span>
                  ) : (
                    <>
                      <Crown className="w-5 h-5 mr-2" />
                      Create Room
                    </>
                  )}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                    or join with code
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                {/* Join by Code */}
                <div className="flex gap-2">
                  <Input
                    placeholder="ABC123"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)
                      )
                    }
                    className="flex-1 text-center font-mono text-base tracking-widest uppercase"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleJoinByCode}
                    disabled={
                      joinCode.trim().length !== 6 ||
                      joinRoomMutation.isPending
                    }
                    className="btn-premium border-0 px-5"
                  >
                    {joinRoomMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Join"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-2xl" />
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                  How It Works
                </p>
                <div className="flex-1 h-px bg-border/40" />
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <span className="text-sm">3 lives, 1 shield</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <span className="text-sm">
                    Difficulty increases each round
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-sm">Last player standing wins!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
