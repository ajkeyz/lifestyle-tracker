import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useSurvivalSocket } from "@/hooks/use-survival-socket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Loader2,
  Zap,
  Clock,
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Countdown Overlay */}
      <AnimatePresence>
        {match?.status === "countdown" && countdown !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={countdown}
                className="text-7xl font-bold text-primary"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {countdown}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-[-0.02em]">
            Survival Lobby
          </h1>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-md mx-auto space-y-4">
        {/* Match Info Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {match?.isPrivate && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Code
                    </span>
                    <span className="font-mono text-sm font-bold text-primary">
                      {match.code}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {playerCount}/20 players
                  </span>
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

        {/* Player Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Players
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
                <AnimatePresence>
                  {match?.players.map((player, i) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                        player.connected
                          ? "bg-card border-border/50"
                          : "bg-muted/30 border-border/20 opacity-50"
                      )}
                    >
                      <div className="relative">
                        <AnimatedAvatar
                          avatarId={player.avatar || "cosmic-cat"}
                          size="sm"
                          isAnimated={player.connected}
                        />
                        {!player.connected && (
                          <div className="absolute inset-0 rounded-full bg-muted/60" />
                        )}
                        {player.id === match.hostId && (
                          <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            H
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-medium truncate max-w-full text-center">
                        {player.username}
                      </span>
                      {user && player.id === user.id && (
                        <span className="text-[10px] text-primary font-medium">You</span>
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
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Invite Friends
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted/50 rounded-xl p-3 text-center border-2 border-dashed border-primary/20">
                    <span className="font-mono text-2xl font-bold tracking-[0.25em] text-primary">
                      {match.code}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleCopyCode}
                    className="shrink-0"
                    data-testid="button-copy-code"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
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
            transition={{ delay: 0.3 }}
          >
            <motion.div
              animate={canStart ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button
                className={cn(
                  "w-full h-12",
                  canStart
                    ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                    : ""
                )}
                onClick={handleStartGame}
                disabled={!canStart}
                data-testid="button-start-game"
              >
                {canStart ? (
                  <Zap className="h-5 w-5 mr-2" />
                ) : (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                )}
                {canStart ? "Start Game" : "Waiting for players..."}
              </Button>
            </motion.div>
            {!canStart && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Need at least 2 players to start
              </p>
            )}
          </motion.div>
        )}

        {/* Non-host waiting indicator */}
        {!isHost && match && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <motion.div
              className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
              animate={{
                boxShadow: [
                  "0 0 0 0 hsl(var(--primary) / 0.2)",
                  "0 0 0 12px hsl(var(--primary) / 0)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            >
              <Clock className="h-6 w-6 text-primary" />
            </motion.div>
            <p className="text-sm text-muted-foreground font-medium">
              Waiting for host to start...
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
