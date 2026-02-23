import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Crown, Shield, ArrowLeft, RotateCcw, Skull, Sparkles } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { SurvivalMatch, SurvivalPlayer, User } from "@shared/schema";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { cn } from "@/lib/utils";
import { useSurvivalSocket } from "@/hooks/use-survival-socket";

// ---- Sparkle particle for winner confetti effect ----
function SparkleParticle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 0.8, 0],
        y: [0, -20, -40],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: "easeOut",
      }}
    >
      <Sparkles className="w-4 h-4 text-yellow-400" />
    </motion.div>
  );
}

// ---- Podium column component ----
function PodiumColumn({
  player,
  placement,
  delay,
}: {
  player: SurvivalPlayer;
  placement: 1 | 2 | 3;
  delay: number;
}) {
  const config = {
    1: {
      height: "h-36",
      avatarSize: "lg" as const,
      icon: <Crown className="w-7 h-7 text-yellow-400 drop-shadow-md" />,
      gradient: "from-yellow-500/30 via-amber-500/20 to-orange-500/10",
      border: "border-yellow-500/40",
      label: "1st",
      textColor: "text-yellow-400",
      bgColor: "bg-gradient-to-t from-yellow-500/20 to-yellow-500/5",
    },
    2: {
      height: "h-24",
      avatarSize: "md" as const,
      icon: <Medal className="w-5 h-5 text-slate-300 drop-shadow-md" />,
      gradient: "from-slate-400/20 via-gray-400/15 to-slate-300/5",
      border: "border-slate-400/30",
      label: "2nd",
      textColor: "text-slate-300",
      bgColor: "bg-gradient-to-t from-slate-400/15 to-slate-400/5",
    },
    3: {
      height: "h-16",
      avatarSize: "sm" as const,
      icon: <Medal className="w-5 h-5 text-amber-600 drop-shadow-md" />,
      gradient: "from-amber-700/20 via-orange-700/15 to-amber-600/5",
      border: "border-amber-600/30",
      label: "3rd",
      textColor: "text-amber-600",
      bgColor: "bg-gradient-to-t from-amber-700/15 to-amber-600/5",
    },
  }[placement];

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 18 }}
    >
      {/* Icon + avatar */}
      <div className="relative">
        {placement === 1 && (
          <>
            <SparkleParticle delay={0} x={-20} y={10} />
            <SparkleParticle delay={0.5} x={80} y={0} />
            <SparkleParticle delay={1.0} x={50} y={-10} />
            <SparkleParticle delay={1.5} x={10} y={-5} />
          </>
        )}
        <motion.div
          className="flex justify-center mb-1"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.2, type: "spring", stiffness: 300, damping: 15 }}
        >
          {config.icon}
        </motion.div>
        <AnimatedAvatar
          avatarId={player.avatar || "cosmic-cat"}
          size={config.avatarSize}
          showRing={placement === 1}
          isAnimated={placement === 1}
        />
      </div>

      {/* Username + score */}
      <div className="text-center">
        <p className={cn("font-semibold text-sm truncate max-w-[100px]", config.textColor)}>
          {player.username}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">{player.score} pts</p>
      </div>

      {/* Podium bar */}
      <motion.div
        className={cn(
          "w-20 rounded-t-lg border-t border-x",
          config.height,
          config.bgColor,
          config.border
        )}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center justify-center h-full">
          <span className={cn("text-lg font-bold", config.textColor)}>{config.label}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SurvivalResults() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();

  const { match } = useSurvivalSocket(matchId ?? null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Players are already ranked by score (descending) from the server
  const players = match?.players ?? [];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Find my placement (1-indexed)
  const myIndex = sortedPlayers.findIndex((p) => p.id === user?.id);
  const myPlacement = myIndex >= 0 ? myIndex + 1 : null;
  const myPlayer = myIndex >= 0 ? sortedPlayers[myIndex] : null;
  const isWinner = myPlacement === 1;

  // Podium players (top 3)
  const podiumPlayers = sortedPlayers.slice(0, 3);
  const first = podiumPlayers[0] ?? null;
  const second = podiumPlayers[1] ?? null;
  const third = podiumPlayers[2] ?? null;

  // Loading / no-data state
  if (!match || match.status !== "results") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 p-6"
        >
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading results...</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      {/* Ambient glow for winner */}
      {isWinner && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 15%, hsl(38 88% 56% / 0.12) 0%, transparent 70%)",
          }}
        />
      )}

      <main className="relative z-10 container max-w-lg mx-auto px-4 py-8 space-y-6 pb-32">
        {/* Title */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold font-display tracking-tight">
            Survival Complete
          </h1>
          <p className="text-sm text-muted-foreground">
            {match.round} rounds played
          </p>
        </motion.div>

        {/* ── Podium Section ── */}
        <motion.div
          className="relative pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-end justify-center gap-3">
            {/* 2nd place (left) */}
            {second && <PodiumColumn player={second} placement={2} delay={0.4} />}

            {/* 1st place (center) */}
            {first && <PodiumColumn player={first} placement={1} delay={0.2} />}

            {/* 3rd place (right) */}
            {third && <PodiumColumn player={third} placement={3} delay={0.6} />}
          </div>

          {/* Podium base */}
          <div className="h-2 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent rounded-full mt-1" />
        </motion.div>

        {/* ── Your Result Card ── */}
        {myPlayer && myPlacement !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={cn(
              "bg-card border rounded-xl p-6 space-y-4",
              isWinner && "border-yellow-500/40 bg-gradient-to-br from-yellow-500/5 to-amber-500/5"
            )}
          >
            {/* Victory or placement header */}
            <div className="text-center space-y-1">
              {isWinner ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, type: "spring", stiffness: 250, damping: 15 }}
                  className="space-y-2"
                >
                  <span className="text-4xl">🏆</span>
                  <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
                    Victory!
                  </h2>
                </motion.div>
              ) : (
                <h2 className="text-2xl font-bold font-display text-foreground">
                  You placed #{myPlacement}
                </h2>
              )}
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold tabular-nums">{myPlayer.score}</p>
                <p className="text-xs text-muted-foreground">Total Score</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold tabular-nums">
                  {myPlayer.eliminatedRound ?? match.round}
                </p>
                <p className="text-xs text-muted-foreground">Rounds Survived</p>
              </div>
            </div>

            {/* Shield usage */}
            {myPlayer.shieldActive && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2"
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Shield saved you!</span>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Full Standings Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-card border rounded-xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b bg-muted/30">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Full Standings
            </h3>
          </div>

          <div className="divide-y divide-border">
            {sortedPlayers.map((player, index) => {
              const rank = index + 1;
              const isMe = player.id === user?.id;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1 + index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors",
                    isMe && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  {/* Rank indicator */}
                  <div className="w-8 flex-shrink-0 flex items-center justify-center">
                    {rank === 1 ? (
                      <Crown className="w-5 h-5 text-yellow-400" />
                    ) : rank <= 3 ? (
                      <Medal className={cn("w-5 h-5", rank === 2 ? "text-slate-300" : "text-amber-600")} />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <AnimatedAvatar
                    avatarId={player.avatar || "cosmic-cat"}
                    size="xs"
                    isAnimated={false}
                  />

                  {/* Name + elimination info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isMe && "text-primary"
                    )}>
                      {player.username}
                      {isMe && (
                        <span className="text-xs text-muted-foreground ml-1">(you)</span>
                      )}
                    </p>
                    {player.eliminated && player.eliminatedRound !== null && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Skull className="w-3 h-3 text-red-400" />
                        <span>Eliminated round {player.eliminatedRound}</span>
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{player.score}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {player.eliminatedRound
                        ? `${player.eliminatedRound} rds`
                        : `${match.round} rds`}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="space-y-3 pt-2"
        >
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold btn-premium border-0"
            onClick={() => navigate("/survival")}
            data-testid="button-play-again"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 text-base"
            onClick={() => navigate("/")}
            data-testid="button-go-home"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Home
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
