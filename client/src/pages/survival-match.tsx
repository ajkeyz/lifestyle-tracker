import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Clock, Skull, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { cn } from "@/lib/utils";
import { useSurvivalSocket } from "@/hooks/use-survival-socket";
import type { SurvivalMatch, SurvivalPlayer, Scenario, SurvivalDifficulty } from "@shared/schema";

interface User {
  id: string;
  username: string;
  avatar: string;
}

const CHOICE_LABELS = ["A", "B", "C", "D"];

const difficultyConfig: Record<SurvivalDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-500/20 border-emerald-500/40" },
  medium: { label: "Medium", color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40" },
  hard: { label: "Hard", color: "text-red-400", bg: "bg-red-500/20 border-red-500/40" },
};

export default function SurvivalMatchPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();

  const { match, connected, sendAnswer } = useSurvivalSocket(matchId ?? null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Local UI state
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showEliminatedOverlay, setShowEliminatedOverlay] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [scorePopup, setScorePopup] = useState<{ text: string; key: number } | null>(null);

  // Derive own player
  const myPlayer = useMemo<SurvivalPlayer | null>(() => {
    if (!match || !user) return null;
    return match.players.find((p) => p.id === user.id) ?? null;
  }, [match, user]);

  // Reset answer state when round changes
  useEffect(() => {
    if (match?.status === "question") {
      setHasAnswered(false);
      setSelectedChoice(null);
      setScorePopup(null);
    }
  }, [match?.round, match?.status]);

  // Show eliminated overlay when player gets eliminated
  useEffect(() => {
    if (myPlayer?.eliminated && !isSpectating) {
      setShowEliminatedOverlay(true);
    }
  }, [myPlayer?.eliminated, isSpectating]);

  // Navigate to results when match ends
  useEffect(() => {
    if (match?.status === "results" && matchId) {
      navigate(`/survival/results/${matchId}`);
    }
  }, [match?.status, matchId, navigate]);

  // Timer countdown
  useEffect(() => {
    if (match?.status !== "question" || !match.questionStartTime || !match.timeLimit) {
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - match.questionStartTime;
      const remaining = Math.max(0, match.timeLimit * 1000 - elapsed);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [match?.status, match?.questionStartTime, match?.timeLimit]);

  // Handle choice selection
  const handleSelectChoice = useCallback(
    (label: string) => {
      if (hasAnswered || !match || myPlayer?.eliminated) return;

      setSelectedChoice(label);
      setHasAnswered(true);
      sendAnswer(label, match.round);
    },
    [hasAnswered, match, myPlayer, sendAnswer]
  );

  // Compute score popup on reveal
  useEffect(() => {
    if (match?.status !== "reveal" || !selectedChoice || !match.currentScenario) return;

    const choice = match.currentScenario.choices.find((c) => c.label === selectedChoice);
    if (choice?.isCorrect) {
      const elapsed = match.questionStartTime
        ? (Date.now() - match.questionStartTime) / 1000
        : match.timeLimit;
      const isSpeedBonus = elapsed < match.timeLimit * 0.5;
      setScorePopup({
        text: isSpeedBonus ? "+110 SPEED BONUS" : "+100 pts",
        key: Date.now(),
      });
    }
  }, [match?.status, selectedChoice, match?.currentScenario, match?.questionStartTime, match?.timeLimit]);

  // Timer display values
  const secondsRemaining = Math.ceil(timeRemaining / 1000);
  const timerProgress = match?.timeLimit
    ? Math.min(1, timeRemaining / (match.timeLimit * 1000))
    : 0;
  const timerColor =
    secondsRemaining > 10 ? "text-emerald-400" : secondsRemaining > 5 ? "text-amber-400" : "text-red-400";
  const timerStroke =
    secondsRemaining > 10 ? "stroke-emerald-400" : secondsRemaining > 5 ? "stroke-amber-400" : "stroke-red-400";

  // Difficulty config
  const difficulty = match?.difficulty ?? "easy";
  const diffConfig = difficultyConfig[difficulty];

  // Loading state
  if (!match || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Clock className="h-8 w-8 text-muted-foreground" />
        </motion.div>
      </div>
    );
  }

  const correctAnswer = match.currentScenario?.choices.find((c) => c.isCorrect)?.label;
  const isReveal = match.status === "reveal";
  const isQuestion = match.status === "question";
  const maxLives = 3;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* ===== TOP STATUS BAR ===== */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Left: Round indicator */}
          <div className="text-sm font-medium text-muted-foreground">
            Round{" "}
            <span className="text-foreground font-bold">{match.round}</span>
            <span className="text-muted-foreground">/{match.maxRounds}</span>
          </div>

          {/* Center: Difficulty badge */}
          <div
            className={cn(
              "px-3 py-0.5 rounded-full text-xs font-semibold border",
              diffConfig.bg,
              diffConfig.color
            )}
          >
            {diffConfig.label}
          </div>

          {/* Right: Lives + Shield */}
          <div className="flex items-center gap-1.5">
            {myPlayer && (
              <>
                {Array.from({ length: maxLives }).map((_, i) => (
                  <Heart
                    key={i}
                    className={cn(
                      "h-4 w-4 transition-colors",
                      i < myPlayer.lives
                        ? "text-red-500 fill-red-500"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
                {myPlayer.shieldActive && (
                  <Shield className="h-4 w-4 text-blue-400 fill-blue-400/30 ml-1" />
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* ===== TIMER ===== */}
      {(isQuestion || isReveal) && (
        <div className="flex justify-center pt-4 pb-2">
          <motion.div
            className="relative w-20 h-20 flex items-center justify-center"
            animate={
              isQuestion && secondsRemaining <= 5 && secondsRemaining > 0
                ? { scale: [1, 1.05, 1] }
                : {}
            }
            transition={
              secondsRemaining <= 5
                ? { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                : {}
            }
          >
            {/* SVG circular progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                strokeWidth="4"
                className="stroke-muted/20"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className={cn(timerStroke, "transition-colors duration-300")}
                strokeDasharray={2 * Math.PI * 35}
                strokeDashoffset={2 * Math.PI * 35 * (1 - timerProgress)}
              />
            </svg>

            {/* Timer number */}
            <motion.span
              key={secondsRemaining}
              initial={secondsRemaining <= 5 ? { scale: 1.3 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "text-2xl font-bold tabular-nums",
                timerColor,
                "transition-colors duration-300"
              )}
            >
              {isReveal ? "--" : secondsRemaining}
            </motion.span>
          </motion.div>
        </div>
      )}

      {/* ===== QUESTION CARD ===== */}
      <div className="flex-1 px-0">
        <AnimatePresence mode="wait">
          {(isQuestion || isReveal) && match.currentScenario && (
            <motion.div
              key={`round-${match.round}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="px-4"
            >
              {/* Scenario context */}
              <div className="bg-card rounded-xl p-4 mb-4 border border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {match.currentScenario.context}
                </p>
                <p className="text-base font-semibold text-foreground mt-3 leading-snug">
                  {match.currentScenario.question}
                </p>
              </div>

              {/* Score popup */}
              <AnimatePresence>
                {scorePopup && isReveal && (
                  <motion.div
                    key={scorePopup.key}
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex justify-center mb-3"
                  >
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-lg">
                      <Zap className="h-5 w-5" />
                      {scorePopup.text}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Choice buttons */}
              <div className="space-y-2.5">
                {match.currentScenario.choices.map((choice, idx) => {
                  const label = choice.label || CHOICE_LABELS[idx];
                  const isSelected = selectedChoice === label;
                  const isCorrectChoice = choice.isCorrect;
                  const showAsSpectator = (isSpectating || myPlayer?.eliminated) && !hasAnswered;

                  let choiceStyle = "bg-card border-border/50 hover:border-primary/50 hover:bg-card/80";

                  if (isReveal) {
                    if (isCorrectChoice) {
                      choiceStyle =
                        "bg-emerald-500/15 border-emerald-500/60 text-emerald-300";
                    } else if (isSelected && !isCorrectChoice) {
                      choiceStyle =
                        "bg-red-500/15 border-red-500/60 text-red-300";
                    } else {
                      choiceStyle = "bg-card/50 border-border/30 opacity-50";
                    }
                  } else if (isSelected) {
                    choiceStyle =
                      "bg-primary/15 border-primary/60 text-primary";
                  }

                  return (
                    <motion.button
                      key={label}
                      onClick={() => handleSelectChoice(label)}
                      disabled={hasAnswered || isReveal || showAsSpectator}
                      className={cn(
                        "w-full min-h-14 px-4 py-3 rounded-xl border text-left flex items-center gap-3 transition-all",
                        choiceStyle,
                        (hasAnswered || isReveal || showAsSpectator) && "cursor-default"
                      )}
                      whileTap={
                        !hasAnswered && !isReveal && !showAsSpectator
                          ? { scale: 0.98 }
                          : undefined
                      }
                      layout
                    >
                      <span
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                          isReveal && isCorrectChoice
                            ? "bg-emerald-500/30 text-emerald-300"
                            : isReveal && isSelected && !isCorrectChoice
                              ? "bg-red-500/30 text-red-300"
                              : isSelected
                                ? "bg-primary/30 text-primary"
                                : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-sm font-medium leading-snug flex-1">
                        {choice.text}
                      </span>
                      {isReveal && isCorrectChoice && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          <Trophy className="h-5 w-5 text-emerald-400" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Elimination notifications during reveal */}
              <AnimatePresence>
                {isReveal &&
                  match.eliminatedThisRound.length > 0 &&
                  match.eliminatedThisRound.map((playerId) => {
                    const eliminatedPlayer = match.players.find((p) => p.id === playerId);
                    if (!eliminatedPlayer) return null;

                    return (
                      <motion.div
                        key={`elim-${playerId}`}
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="mt-3 flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
                      >
                        <motion.div
                          initial={{ rotate: -30, scale: 0 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 15,
                            delay: 0.1,
                          }}
                        >
                          <Skull className="h-5 w-5 text-red-400" />
                        </motion.div>
                        <span className="text-sm font-medium text-red-300">
                          {eliminatedPlayer.username} was eliminated!
                        </span>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== PLAYER STRIP (bottom) ===== */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="px-3 py-2.5 flex gap-3 overflow-x-auto scrollbar-none">
          {match.players.map((player) => {
            const isEliminated = player.eliminated;
            const isConnected = player.connected;
            const playerAnswered = match.roundAnswers[player.id] !== undefined;

            return (
              <div
                key={player.id}
                className={cn(
                  "flex flex-col items-center gap-1 shrink-0 transition-opacity",
                  isEliminated && "opacity-40 grayscale"
                )}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "rounded-full p-0.5",
                      isConnected && !isEliminated
                        ? "ring-2 ring-emerald-500/60"
                        : ""
                    )}
                  >
                    <AnimatedAvatar
                      avatarId={player.avatar || "cosmic-cat"}
                      size="xs"
                      isAnimated={false}
                    />
                  </div>

                  {/* Answered checkmark overlay */}
                  {playerAnswered && !isEliminated && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                    >
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-[48px]">
                  {player.id === user.id ? "You" : player.username}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ELIMINATED OVERLAY ===== */}
      <AnimatePresence>
        {showEliminatedOverlay && myPlayer?.eliminated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-8 mx-6 max-w-sm w-full text-center space-y-5"
            >
              <motion.div
                initial={{ rotateY: 180, scale: 0 }}
                animate={{ rotateY: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
              >
                <Skull className="h-16 w-16 text-red-400 mx-auto" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  You've been eliminated!
                </h2>
                <p className="text-lg text-muted-foreground">
                  You finished{" "}
                  <span className="text-foreground font-semibold">
                    #{(() => {
                      const alive = match.players.filter((p) => !p.eliminated).length;
                      return alive + 1;
                    })()}
                  </span>
                </p>
              </div>

              <Button
                onClick={() => {
                  setShowEliminatedOverlay(false);
                  setIsSpectating(true);
                }}
                className="w-full min-h-12 text-base font-semibold"
                variant="outline"
              >
                <Trophy className="h-5 w-5 mr-2" />
                Spectate
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== URGENT TIMER VIGNETTE ===== */}
      <AnimatePresence>
        {isQuestion && secondsRemaining <= 5 && secondsRemaining > 0 && !hasAnswered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-40"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 50%, rgba(239, 68, 68, 0.2) 100%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
