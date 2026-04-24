import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/app-logo";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { RollingNumber } from "@/components/animated-counter";
import { Home, Trophy, Crown, Users, Target, Check, X } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { CoopGameResult, User } from "@shared/schema";
import { useConfetti } from "@/components/confetti";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Mascot, type MascotContext } from "@/components/mascot";

export default function CoopResults() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, navigate] = useLocation();
  const { fireCelebration } = useConfetti();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: result, isLoading } = useQuery<CoopGameResult>({
    queryKey: ["/api/coop/session", sessionId, "result"],
    queryFn: async () => {
      const res = await fetch(`/api/coop/session/${sessionId}/result`);
      if (!res.ok) throw new Error("Failed to fetch result");
      return res.json();
    },
  });

  const currentPlayerResult = result?.players.find(p => p.id === user?.id);
  const partnerResult = result?.players.find(p => p.id !== user?.id);
  const isWinner = result?.winner === user?.id;
  const isTie = result?.winner === null;

  useEffect(() => {
    if (result && isWinner) {
      setTimeout(() => fireCelebration(), 300);
    }
  }, [result, isWinner, fireCelebration]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-white/10">
          <div className="container flex h-14 items-center gap-4 px-4">
            <AppLogo size="sm" />
            <h1 className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]">
              Co-op Results
            </h1>
          </div>
        </header>
        <main className="container px-4 py-8 max-w-md mx-auto">
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Results not available</p>
          <Button onClick={() => navigate("/play-hub")} className="mt-4">
            Back
          </Button>
        </Card>
      </div>
    );
  }

  const mascotContext: MascotContext = {
    screen: "results",
    score: currentPlayerResult ? Math.round((currentPlayerResult.correctAnswers / result.totalQuestions) * 100) : 0,
    streakGained: isWinner,
    username: user?.username,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-white/10">
        <div className="container flex h-14 items-center gap-4 px-4">
          <AppLogo size="sm" />
          <h1 className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]">
            Game Complete
          </h1>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-md mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <Card>
            <CardHeader className="text-center bg-gradient-to-b from-primary/10 to-transparent pb-8 relative rounded-t-xl">
              <div className="mx-auto mb-4">
                <Mascot
                  mood={isWinner ? "celebrating" : isTie ? "happy" : "encouraging"}
                  size="lg"
                  showBubble={true}
                  speechDelay={1200}
                  context={mascotContext}
                />
              </div>
              <CardTitle className={`font-display text-3xl tracking-tight ${isWinner ? "bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent" : ""}`}>
                {isWinner ? "You Win!" : isTie ? "It's a Tie!" : "Good Game!"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <div className={`mx-auto border-4 rounded-full ${isWinner ? 'border-yellow-500' : isTie ? 'border-primary' : 'border-muted'}`}>
                    <AnimatedAvatar avatarId={currentPlayerResult?.avatar || "cosmic-cat"} size="lg" isAnimated={isWinner} />
                  </div>
                  <p className="font-medium mt-2">You</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-3xl font-display font-semibold text-primary"
                  >
                    <RollingNumber value={currentPlayerResult?.score || 0} />
                  </motion.p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlayerResult?.correctAnswers}/{result.totalQuestions} correct
                  </p>
                </div>

                <div className="text-2xl font-bold text-muted-foreground">vs</div>

                <div className="flex-1 text-center">
                  <div className={`mx-auto border-4 rounded-full ${!isWinner && !isTie ? 'border-yellow-500' : isTie ? 'border-primary' : 'border-muted'}`}>
                    <AnimatedAvatar avatarId={partnerResult?.avatar || "cosmic-cat"} size="lg" isAnimated={!isWinner && !isTie} />
                  </div>
                  <p className="font-medium mt-2">{partnerResult?.username || "Friend"}</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-display font-semibold text-foreground"
                  >
                    <RollingNumber value={partnerResult?.score || 0} />
                  </motion.p>
                  <p className="text-sm text-muted-foreground">
                    {partnerResult?.correctAnswers}/{result.totalQuestions} correct
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Answer Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.players[0]?.answers.map((answer, index) => {
                const myAnswer = currentPlayerResult?.answers[index];
                const partnerAnswer = partnerResult?.answers[index];
                
                return (
                  <div
                    key={answer.scenarioId}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">You:</span>
                        {myAnswer?.isCorrect ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{partnerResult?.username?.split(' ')[0] || "Friend"}:</span>
                        {partnerAnswer?.isCorrect ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            className="w-full h-12 btn-premium border-0"
            onClick={() => navigate("/coop-lobby")}
            data-testid="button-play-again"
          >
            <Users className="h-5 w-5 mr-2" />
            Play Again with Friend
          </Button>
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate("/play-hub")}
            data-testid="button-go-home"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Play
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
