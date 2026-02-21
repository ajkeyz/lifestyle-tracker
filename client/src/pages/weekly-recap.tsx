import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AnimatedCounter } from "@/components/animated-counter";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import {
  Trophy,
  AlertTriangle,
  TrendingUp,
  Crown,
  Share2,
  Sparkles,
  Flame,
  Target,
  Shield,
  Zap,
  X,
} from "lucide-react";
import type { User } from "@shared/schema";

interface WeeklyRecapData {
  bestDecision: { scenario: string; choice: string; impact: string };
  riskyDecision: { scenario: string; choice: string; risk: string };
  improvementArea: { category: string; tip: string; score: number };
  leagueRank: { rank: number; totalMembers: number; leagueName: string; change: number };
  funnyTitle: { title: string; description: string; icon: "crown" | "flame" | "target" | "shield" | "zap" };
  weekStats: { questionsAnswered: number; correctAnswers: number; streakDays: number; moneyHealthChange: number };
}

const funnyTitles = [
  { title: "Soft Life MVP", description: "Living your best financially-savvy life", icon: "crown" as const },
  { title: "Budget Whisperer", description: "Your money listens when you speak", icon: "zap" as const },
  { title: "Debt Dodger Elite", description: "Avoiding financial pitfalls like a pro", icon: "shield" as const },
  { title: "Future Millionaire", description: "Small steps, big dreams", icon: "target" as const },
  { title: "Money Mood: Unbothered", description: "Stress-free spending decisions", icon: "flame" as const },
  { title: "Chief Vibes Officer", description: "Making money moves with style", icon: "crown" as const },
  { title: "Frugal Legend", description: "Saving money is your superpower", icon: "shield" as const },
  { title: "Investment Curious", description: "Asking all the right questions", icon: "target" as const },
];

const getTitleIcon = (icon: string) => {
  switch (icon) {
    case "crown": return Crown;
    case "flame": return Flame;
    case "target": return Target;
    case "shield": return Shield;
    case "zap": return Zap;
    default: return Sparkles;
  }
};

const SLIDE_DURATION = 5000; // 5 seconds per slide

function StoryProgressBar({
  total,
  current,
  progress,
}: {
  total: number;
  current: number;
  progress: number;
}) {
  return (
    <div className="flex gap-1 px-3 pt-3 pb-1">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{
              width: i < current ? "100%" : i === current ? `${progress}%` : "0%",
              transition: i === current ? "width 100ms linear" : "none",
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default function WeeklyRecap() {
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const titleRef = useRef(funnyTitles[Math.floor(Math.random() * funnyTitles.length)]);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const recapData: WeeklyRecapData | null = user
    ? {
        bestDecision: { scenario: "Investment opportunity", choice: "Started a retirement account early", impact: "+15 Money Health" },
        riskyDecision: { scenario: "Impulse purchase temptation", choice: "Bought now, worried later", risk: "High credit utilization" },
        improvementArea: { category: "Debt Management", tip: "Focus on paying off high-interest debt first", score: 65 },
        leagueRank: { rank: 3, totalMembers: 12, leagueName: "Money Makers", change: 2 },
        funnyTitle: titleRef.current,
        weekStats: {
          questionsAnswered: 25,
          correctAnswers: 18,
          streakDays: user.streak || 0,
          moneyHealthChange: 12,
        },
      }
    : null;

  const slides = recapData
    ? [
        { id: "title", bg: "from-primary via-primary/80 to-primary/60" },
        { id: "best", bg: "from-green-600 via-green-500 to-emerald-500" },
        { id: "risky", bg: "from-orange-600 via-orange-500 to-amber-500" },
        { id: "improve", bg: "from-blue-600 via-blue-500 to-cyan-500" },
        { id: "league", bg: "from-purple-600 via-purple-500 to-violet-500" },
        { id: "funny-title", bg: "from-pink-600 via-rose-500 to-red-500" },
        { id: "stats", bg: "from-slate-800 via-slate-700 to-slate-600" },
      ]
    : [];

  const totalSlides = slides.length;

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((s) => s + 1);
      setProgress(0);
    }
  }, [currentSlide, totalSlides]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
      setProgress(0);
    }
  }, [currentSlide]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused || totalSlides === 0) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 100 / (SLIDE_DURATION / 100);
        if (next >= 100) {
          if (currentSlide < totalSlides - 1) {
            setCurrentSlide((s) => s + 1);
            return 0;
          }
          return 100;
        }
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSlide, isPaused, totalSlides]);

  // Reset progress on slide change
  useEffect(() => {
    setProgress(0);
  }, [currentSlide]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      goPrev();
    } else if (x > third * 2) {
      goNext();
    }
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100 && info.velocity.y > 200) {
      navigate("/");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-background p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!user || !recapData) {
    navigate("/");
    return null;
  }

  const TitleIcon = getTitleIcon(recapData.funnyTitle.icon);
  const currentSlideData = slides[currentSlide];

  return (
    <motion.div
      className={`min-h-screen bg-gradient-to-b ${currentSlideData.bg} transition-colors duration-500 flex flex-col select-none`}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.3}
      onDragEnd={handleDragEnd}
      data-testid="weekly-recap-stories"
    >
      {/* Progress bars */}
      <StoryProgressBar total={totalSlides} current={currentSlide} progress={progress} />

      {/* Header: X button */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-white/80">Weekly Recap</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/10 h-8 w-8"
          data-testid="button-close-recap"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Story content + tap zones */}
      <main
        className="flex-1 flex flex-col relative cursor-pointer"
        onClick={handleTap}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideData.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Title slide */}
            {currentSlideData.id === "title" && (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-primary-foreground p-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                >
                  <Sparkles className="h-12 w-12 mb-4" />
                </motion.div>
                <motion.h1
                  className="text-3xl font-semibold mb-2 tracking-[-0.02em]"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Your Week in Review
                </motion.h1>
                <motion.p
                  className="text-lg opacity-90"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={{ delay: 0.4 }}
                >
                  Let's see how you did
                </motion.p>
              </div>
            )}

            {/* Best decision */}
            {currentSlideData.id === "best" && (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-white p-6">
                <Trophy className="h-16 w-16 mb-6" />
                <p className="text-sm uppercase tracking-wide opacity-80 mb-2">Best Decision</p>
                <h2 className="text-2xl font-semibold mb-4">{recapData.bestDecision.scenario}</h2>
                <Card className="bg-white/20 border-0 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <p className="text-white font-medium">{recapData.bestDecision.choice}</p>
                    <p className="text-green-100 text-sm mt-2">{recapData.bestDecision.impact}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Risky decision */}
            {currentSlideData.id === "risky" && (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-white p-6">
                <AlertTriangle className="h-16 w-16 mb-6" />
                <p className="text-sm uppercase tracking-wide opacity-80 mb-2">Riskiest Move</p>
                <h2 className="text-2xl font-bold mb-4">{recapData.riskyDecision.scenario}</h2>
                <Card className="bg-white/20 border-0 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <p className="text-white font-medium">{recapData.riskyDecision.choice}</p>
                    <p className="text-orange-100 text-sm mt-2">{recapData.riskyDecision.risk}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Improvement area */}
            {currentSlideData.id === "improve" && (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-white p-6">
                <TrendingUp className="h-16 w-16 mb-6" />
                <p className="text-sm uppercase tracking-wide opacity-80 mb-2">Room to Grow</p>
                <h2 className="text-2xl font-bold mb-4">{recapData.improvementArea.category}</h2>
                <Card className="bg-white/20 border-0 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl font-bold">{recapData.improvementArea.score}%</span>
                    </div>
                    <p className="text-blue-100 text-sm">{recapData.improvementArea.tip}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* League standing */}
            {currentSlideData.id === "league" && (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-white p-6">
                <Crown className="h-16 w-16 mb-6" />
                <p className="text-sm uppercase tracking-wide opacity-80 mb-2">League Standing</p>
                <h2 className="text-2xl font-bold mb-2">{recapData.leagueRank.leagueName}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-5xl font-bold">#{recapData.leagueRank.rank}</span>
                  <span className="text-lg opacity-80">of {recapData.leagueRank.totalMembers}</span>
                </div>
                {recapData.leagueRank.change > 0 && (
                  <div className="flex items-center gap-1 text-green-200">
                    <TrendingUp className="h-4 w-4" />
                    <span>Up {recapData.leagueRank.change} spots this week</span>
                  </div>
                )}
              </div>
            )}

            {/* Funny title */}
            {currentSlideData.id === "funny-title" && (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-white p-6">
                <TitleIcon className="h-20 w-20 mb-6" />
                <p className="text-sm uppercase tracking-wide opacity-80 mb-2">You Earned</p>
                <h2 className="text-3xl font-bold mb-4">{recapData.funnyTitle.title}</h2>
                <p className="text-pink-100">{recapData.funnyTitle.description}</p>
              </div>
            )}

            {/* Stats summary */}
            {currentSlideData.id === "stats" && (
              <div className="flex flex-col items-center justify-center flex-1 text-white p-6">
                <Sparkles className="h-12 w-12 mb-6" />
                <p className="text-sm uppercase tracking-wide opacity-80 mb-4">Week Summary</p>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                  <Card className="bg-white/10 border-0">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold">
                        <AnimatedCounter value={recapData.weekStats.questionsAnswered} duration={1.0} />
                      </p>
                      <p className="text-xs opacity-80">Questions</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-0">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold">
                        <AnimatedCounter
                          value={Math.round((recapData.weekStats.correctAnswers / recapData.weekStats.questionsAnswered) * 100)}
                          duration={1.0}
                          suffix="%"
                        />
                      </p>
                      <p className="text-xs opacity-80">Accuracy</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-0">
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="h-5 w-5 text-orange-400" />
                        <p className="text-3xl font-bold">
                          <AnimatedCounter value={recapData.weekStats.streakDays} duration={1.0} />
                        </p>
                      </div>
                      <p className="text-xs opacity-80">Day Streak</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/10 border-0">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-green-400">
                        +<AnimatedCounter value={recapData.weekStats.moneyHealthChange} duration={1.0} />
                      </p>
                      <p className="text-xs opacity-80">Money Health</p>
                    </CardContent>
                  </Card>
                </div>
                <Button
                  className="mt-8 gap-2"
                  size="lg"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const shareText = `My Lifestyle Creep Weekly Recap:\n"${recapData.funnyTitle.title}"\n${recapData.weekStats.correctAnswers}/${recapData.weekStats.questionsAnswered} correct\n${recapData.weekStats.streakDays} day streak\n\nPlay at lifestylecreep.app`;
                    try {
                      if (navigator.share) {
                        await navigator.share({ text: shareText });
                      } else {
                        await navigator.clipboard.writeText(shareText);
                        toast({ title: "Copied to clipboard", description: "Share your recap with friends!" });
                      }
                    } catch {
                      toast({ title: "Recap ready to share", description: "Copy and paste to share!" });
                    }
                  }}
                  data-testid="button-share-recap"
                >
                  <Share2 className="h-4 w-4" />
                  Share Your Recap
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
