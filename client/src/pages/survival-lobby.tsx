import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSurvivalSocket } from "@/hooks/use-survival-socket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import { AppLogo } from "@/components/app-logo";
import { GradientText } from "@/components/gradient-text";
import { RollingNumber } from "@/components/animated-counter";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Loader2,
  Zap,
  Shield,
} from "lucide-react";
import type { User } from "@shared/schema";

export default function SurvivalLobby() {
  const [, navigate] = useLocation();
  const { matchId } = useParams<{ matchId: string }>();
  const { toast } = useToast();
  const [codeCopied, setCodeCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { match, connected, lastMessage, startGame } =
    useSurvivalSocket(matchId ?? null);

  // Handle countdown messages
  useEffect(() => {
    if (lastMessage?.type === "survival_countdown") {
      setCountdown(lastMessage.seconds);
    }
  }, [lastMessage]);

  // Navigate to game when status changes to "question"
  useEffect(() => {
    if (match?.status === "question" && matchId) {
      navigate(`/survival/match/${matchId}`);
    }
  }, [match?.status, matchId, navigate]);

  const isHost = user && match ? user.id === match.hostId : false;
  const playerCount = match?.players.length ?? 0;
  const canStart = isHost && playerCount >= 2;

  const handleCopyCode = async () => {
    if (!match?.code) return;
    try {
      await navigator.clipboard.writeText(match.code);
      setCodeCopied(true);
      toast({ title: "Copied!", description: "Lobby code copied to clipboard." });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy code. Try manually.",
        variant: "destructive",
      });
    }
  };

  const handleStartGame = () => {
    if (canStart) {
      startGame();
    }
  };

  // Loading state
  if (!match && !connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 flex items-center justify-center">
        <AmbientBackground variant="premium" />
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-orange-500" />
          </motion.div>
          <p className="text-sm text-muted-foreground font-medium">Connecting to lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <AmbientBackground variant="premium" />

      {/* Countdown Overlay */}
      <AnimatePresence>
        {match?.status === "countdown" && countdown !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={countdown}
                className="flex flex-col items-center gap-2"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <GradientText variant="fire" className="text-8xl font-display font-extrabold tracking-tight">
                  {countdown}
                </GradientText>
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Get Ready
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/play-hub")}
            data-testid="button-back"
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

      <main className="container px-4 py-6 max-w-md mx-auto space-y-5">
        {/* Match Info Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-2xl" />
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {match?.isPrivate && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">
                      Code
                    </span>
                    <span className="font-mono text-sm font-bold tracking-widest text-orange-500">
                      {match.code}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    <RollingNumber value={playerCount} />/20
                  </span>
                  <span className="text-xs text-muted-foreground">players</span>
                </div>
              </div>
              {!connected && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Reconnecting...
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Player Grid Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
        >
          <Card className="relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-xl" />
            <CardHeader className="text-center pb-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, duration: 0.3 }}
                className="mx-auto w-14 h-14 bg-orange-500/10 rounded-full flex items-center justify-center mb-3"
              >
                <Shield className="h-7 w-7 text-orange-500" />
              </motion.div>
              <CardTitle className="font-display text-xl tracking-tight">
                Battle Arena
              </CardTitle>
              <CardDescription className="text-xs">
                Last one standing wins it all
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mascot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="flex justify-center py-2"
              >
                <Mascot
                  mood="hyped"
                  size="sm"
                  showBubble={true}
                  message="Only the savviest survive!"
                  context={{ screen: "survival-lobby", username: "", streak: 0 } satisfies MascotContext}
                />
              </motion.div>

              {/* Section label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex items-center gap-2"
              >
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] px-0.5">
                  Combatants
                </p>
                <div className="flex-1 h-px bg-border/40" />
              </motion.div>

              {/* Player Grid */}
              <div className="grid grid-cols-3 gap-3">
                <AnimatePresence>
                  {match?.players.map((player, i) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: 0.25 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
                      whileTap={{ scale: 0.97 }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                        player.connected
                          ? "bg-card border-border/50 hover:border-orange-500/30 hover:shadow-sm hover:shadow-orange-500/5"
                          : "bg-muted/30 border-border/20 opacity-50"
                      )}
                    >
                      <div className="relative">
                        <AnimatedAvatar
                          avatarId={player.avatar || "cosmic-cat"}
                          size="sm"
                          isAnimated={player.connected}
                          showRing={player.connected}
                        />
                        {!player.connected && (
                          <div className="absolute inset-0 rounded-full bg-muted/60" />
                        )}
                        {player.id === match.hostId && (
                          <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-gradient-to-br from-amber-400 to-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm shadow-orange-500/30">
                            H
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full text-center">
                        {player.username}
                      </span>
                      {user && player.id === user.id && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-500">You</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Section (private matches only) */}
        {match?.isPrivate && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 rounded-t-2xl" />
              <CardContent className="p-4">
                <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3">
                  Invite Friends
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center border-2 border-dashed border-orange-500/30">
                    <span className="font-mono text-2xl font-bold tracking-[0.3em] text-orange-500">
                      {match.code}
                    </span>
                  </div>
                  <motion.div whileTap={{ scale: 0.95 }}>
                    <Button
                      className={cn(
                        "shrink-0 h-11",
                        codeCopied
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                          : "btn-premium border-0"
                      )}
                      onClick={handleCopyCode}
                      data-testid="button-copy-code"
                    >
                      {codeCopied ? (
                        <>
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check className="h-4 w-4" />
                          </motion.span>
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Host Controls */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
          >
            <motion.div
              animate={canStart ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button
                className={cn(
                  "w-full h-12 text-base font-bold",
                  canStart
                    ? "btn-gold border-0"
                    : ""
                )}
                onClick={handleStartGame}
                disabled={!canStart}
                data-testid="button-start-game"
              >
                {canStart ? (
                  <motion.span
                    className="flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Zap className="h-5 w-5" />
                    Start Battle
                  </motion.span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Waiting for players...
                  </span>
                )}
              </Button>
            </motion.div>
            {!canStart && (
              <p className="text-[11px] text-muted-foreground text-center mt-2.5 uppercase tracking-wider">
                Need at least 2 players to start
              </p>
            )}
          </motion.div>
        )}

        {/* Non-host waiting indicator */}
        {!isHost && match && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="flex flex-col items-center gap-4 py-6"
          >
            <motion.div
              className="relative w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(249, 115, 22, 0.3)",
                  "0 0 0 16px rgba(249, 115, 22, 0)",
                ],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Shield className="h-7 w-7 text-orange-500" />
              </motion.div>
            </motion.div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold">
                Waiting for host to start...
              </p>
              <p className="text-[11px] text-muted-foreground">
                The battle begins soon
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
