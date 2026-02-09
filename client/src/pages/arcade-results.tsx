import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { Gamepad2, Home, RotateCcw, Trophy, Target, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ArcadeStatus } from "@shared/schema";

export default function ArcadeResults() {
  const [, navigate] = useLocation();

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
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
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto"
            >
              <Trophy className="w-10 h-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`text-2xl font-display font-bold ${gradeColor}`}
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6" data-testid="card-arcade-score">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold font-display" data-testid="text-score">{score}</p>
                  <p className="text-xs text-muted-foreground">out of {maxScore}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-bold font-display" data-testid="text-correct">{correct}/{total}</p>
                  <p className="text-xs text-muted-foreground">correct</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Trophy className="w-4 h-4 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold font-display" data-testid="text-accuracy">{percentage}%</p>
                  <p className="text-xs text-muted-foreground">accuracy</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            {(arcadeStatus?.canPlay || remaining > 0) && (
              <Button
                size="lg"
                className="w-full h-14 text-base font-semibold"
                onClick={() => navigate("/arcade")}
                data-testid="button-play-again"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again ({remaining} {remaining === 1 ? "play" : "plays"} left)
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-base"
              onClick={() => navigate("/")}
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
