import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { Gamepad2, Home, RotateCcw, Trophy, Target, Zap, Share2, Star, ArrowUp } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ArcadeStatus } from "@shared/schema";
import { Mascot, type MascotContext } from "@/components/mascot";
import { useConfetti } from "@/components/confetti";
import { cn } from "@/lib/utils";

// ─── localStorage helpers ───
function getArcadeBestScore(): number {
  try { return parseInt(localStorage.getItem("arcade_best_score") || "0", 10); } catch { return 0; }
}
function getArcadeBestAccuracy(): number {
  try { return parseInt(localStorage.getItem("arcade_best_accuracy") || "0", 10); } catch { return 0; }
}

// ─── Animated Score Ring ───
function ScoreRing({
  percentage,
  size = 140,
  strokeWidth = 10,
  delay = 0.8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  delay?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayPct(percentage);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  const color = percentage >= 80
    ? "hsl(38, 88%, 56%)"   // gold
    : percentage >= 60
      ? "hsl(153, 62%, 48%)" // emerald
      : percentage >= 40
        ? "hsl(217, 91%, 60%)" // blue
        : "hsl(240, 5%, 60%)"; // muted

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (displayPct / 100) * circumference }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AnimatedCounter value={displayPct} suffix="%" className="text-3xl font-bold tabular-nums" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Accuracy</span>
      </div>
    </div>
  );
}

// ─── Animated Number Counter ───
function AnimatedCounter({
  value,
  suffix = "",
  className = "",
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value]);

  return <span className={className}>{display}{suffix}</span>;
}

// ─── Share Card ───
function ArcadeShareCard({
  score,
  correct,
  total,
  percentage,
  grade,
}: {
  score: number;
  correct: number;
  total: number;
  percentage: number;
  grade: string;
}) {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const blocks = Array.from({ length: total }, (_, i) => (i < correct ? "\u{1F7E9}" : "\u{1F7E5}"));
    return `Lifestyle Creep Arcade \u{1F3AE}\n${grade} \u2022 ${percentage}% accuracy\nScore: ${score} \u2022 ${correct}/${total} correct\n${blocks.join("")}\nPlay at lifecreep.app`;
  };

  const handleShare = async () => {
    const text = generateShareText();
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch { /* fallback to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full h-12 text-base gap-2"
      onClick={handleShare}
      data-testid="button-share-arcade"
    >
      <Share2 className="w-4 h-4" />
      {copied ? "Copied to clipboard!" : "Share Score"}
    </Button>
  );
}

export default function ArcadeResults() {
  const [, navigate] = useLocation();
  const { fireCelebration } = useConfetti();
  const hasConfettied = useRef(false);

  const params = new URLSearchParams(window.location.search);
  const score = parseInt(params.get("score") || "0");
  const correct = parseInt(params.get("correct") || "0");
  const total = parseInt(params.get("total") || "5");
  const remaining = parseInt(params.get("remaining") || "0");

  const { data: arcadeStatus } = useQuery<ArcadeStatus>({
    queryKey: ["/api/arcade-status"],
  });

  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const maxScore = total * 100;

  // Best score comparison
  const bestScore = getArcadeBestScore();
  const bestAccuracy = getArcadeBestAccuracy();
  const isNewBestScore = score >= bestScore && score > 0;
  const isNewBestAccuracy = percentage >= bestAccuracy && percentage > 0;
  const isNewPersonalBest = isNewBestScore || isNewBestAccuracy;

  let grade = "Keep Practicing";
  let gradeColor = "text-muted-foreground";
  if (percentage >= 80) {
    grade = "Financial Genius";
    gradeColor = "text-yellow-500";
  } else if (percentage >= 60) {
    grade = "Money Smart";
    gradeColor = "text-emerald-500";
  } else if (percentage >= 40) {
    grade = "Getting There";
    gradeColor = "text-blue-500";
  }

  // Fire confetti for great scores
  useEffect(() => {
    if (percentage >= 80 && !hasConfettied.current) {
      hasConfettied.current = true;
      const timer = setTimeout(() => fireCelebration?.(), 600);
      return () => clearTimeout(timer);
    }
  }, [percentage, fireCelebration]);

  const mascotContext: MascotContext = {
    screen: "results",
    score: percentage,
    username: undefined,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-sm">
        <div className="container max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AppLogo size="sm" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" /> Arcade Results
                </span>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-3 relative">
            {/* Ambient radial glow based on performance */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: percentage >= 80
                  ? "radial-gradient(ellipse 60% 40% at 50% 20%, hsl(38 88% 56% / 0.12) 0%, transparent 70%)"
                  : percentage >= 60
                    ? "radial-gradient(ellipse 60% 40% at 50% 20%, hsl(153 62% 32% / 0.10) 0%, transparent 70%)"
                    : "transparent"
              }}
            />

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto"
            >
              <Mascot
                mood={percentage >= 80 ? "celebrating" : percentage >= 60 ? "happy" : percentage >= 40 ? "encouraging" : "sad"}
                size="md"
                showBubble={true}
                context={mascotContext}
              />
            </motion.div>

            {/* New Personal Best badge */}
            <AnimatePresence>
              {isNewPersonalBest && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/15 border border-amber-500/25"
                >
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </motion.div>
                  <span className="text-sm font-bold text-amber-500">New Personal Best!</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={cn("text-3xl font-display font-bold tracking-[-0.03em]", gradeColor)}
              data-testid="text-arcade-grade"
            >
              {grade}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground"
            >
              Arcade game complete
            </motion.p>
          </div>

          {/* Score Ring + Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6" data-testid="card-arcade-score">
              <div className="flex flex-col items-center gap-5">
                {/* Animated score ring */}
                <ScoreRing percentage={percentage} />

                {/* Score + Correct stats */}
                <div className="grid grid-cols-2 gap-6 w-full max-w-xs text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Zap className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-semibold font-display tabular-nums" data-testid="text-score">
                      <AnimatedCounter value={score} />
                    </p>
                    <p className="text-xs text-muted-foreground">out of {maxScore}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-semibold font-display" data-testid="text-correct">{correct}/{total}</p>
                    <p className="text-xs text-muted-foreground">correct</p>
                  </div>
                </div>

                {/* Best score comparison */}
                {bestScore > 0 && !isNewPersonalBest && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t w-full max-w-xs justify-center"
                  >
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>Best: {bestScore} pts</span>
                    </div>
                    <span className="text-border">|</span>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-amber-500" />
                      <span>Best: {bestAccuracy}%</span>
                    </div>
                  </motion.div>
                )}

                {/* Delta vs previous best */}
                {isNewPersonalBest && bestScore > 0 && score > bestScore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="flex items-center gap-1.5 text-sm text-emerald-500 font-medium"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>+{score - bestScore} from previous best</span>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {(arcadeStatus?.canPlay || remaining > 0) && (
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold btn-premium border-0"
                onClick={() => navigate("/arcade")}
                data-testid="button-play-again"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again ({remaining} {remaining === 1 ? "play" : "plays"} left)
              </Button>
            )}

            {/* Share card */}
            <ArcadeShareCard
              score={score}
              correct={correct}
              total={total}
              percentage={percentage}
              grade={grade}
            />

            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 text-base"
              onClick={() => navigate("/play-hub")}
              data-testid="button-go-home"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-xs text-muted-foreground"
          >
            Arcade scores don't affect your daily streak or Money Health
          </motion.p>
        </motion.div>
      </main>
    </div>
  );
}
