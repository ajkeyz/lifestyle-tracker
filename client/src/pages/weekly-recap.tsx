import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Trophy, 
  AlertTriangle, 
  TrendingUp, 
  Crown,
  Share2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  Target,
  Shield,
  Zap
} from "lucide-react";
import type { User } from "@shared/schema";

interface WeeklyRecapData {
  bestDecision: {
    scenario: string;
    choice: string;
    impact: string;
  };
  riskyDecision: {
    scenario: string;
    choice: string;
    risk: string;
  };
  improvementArea: {
    category: string;
    tip: string;
    score: number;
  };
  leagueRank: {
    rank: number;
    totalMembers: number;
    leagueName: string;
    change: number;
  };
  funnyTitle: {
    title: string;
    description: string;
    icon: "crown" | "flame" | "target" | "shield" | "zap";
  };
  weekStats: {
    questionsAnswered: number;
    correctAnswers: number;
    streakDays: number;
    moneyHealthChange: number;
  };
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

export default function WeeklyRecap() {
  const [, navigate] = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 via-background to-background p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const randomTitle = funnyTitles[Math.floor(Math.random() * funnyTitles.length)];
  
  const recapData: WeeklyRecapData = {
    bestDecision: {
      scenario: "Investment opportunity",
      choice: "Started a retirement account early",
      impact: "+15 Money Health"
    },
    riskyDecision: {
      scenario: "Impulse purchase temptation",
      choice: "Bought now, worried later",
      risk: "High credit utilization"
    },
    improvementArea: {
      category: "Debt Management",
      tip: "Focus on paying off high-interest debt first",
      score: 65
    },
    leagueRank: {
      rank: 3,
      totalMembers: 12,
      leagueName: "Money Makers",
      change: 2
    },
    funnyTitle: randomTitle,
    weekStats: {
      questionsAnswered: 25,
      correctAnswers: 18,
      streakDays: user.streak || 0,
      moneyHealthChange: 12
    }
  };

  const TitleIcon = getTitleIcon(recapData.funnyTitle.icon);

  const slides = [
    {
      id: "title",
      bg: "from-primary via-primary/80 to-primary/60",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center text-primary-foreground p-6">
          <Sparkles className="h-12 w-12 mb-4 animate-pulse" />
          <h1 className="text-3xl font-semibold mb-2 tracking-[-0.02em]">Your Week in Review</h1>
          <p className="text-lg opacity-90">Let's see how you did</p>
        </div>
      )
    },
    {
      id: "best",
      bg: "from-green-600 via-green-500 to-emerald-500",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center text-white p-6">
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
      )
    },
    {
      id: "risky",
      bg: "from-orange-600 via-orange-500 to-amber-500",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center text-white p-6">
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
      )
    },
    {
      id: "improve",
      bg: "from-blue-600 via-blue-500 to-cyan-500",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center text-white p-6">
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
      )
    },
    {
      id: "league",
      bg: "from-purple-600 via-purple-500 to-violet-500",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center text-white p-6">
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
      )
    },
    {
      id: "funny-title",
      bg: "from-pink-600 via-rose-500 to-red-500",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center text-white p-6">
          <TitleIcon className="h-20 w-20 mb-6" />
          <p className="text-sm uppercase tracking-wide opacity-80 mb-2">You Earned</p>
          <h2 className="text-3xl font-bold mb-4">{recapData.funnyTitle.title}</h2>
          <p className="text-pink-100">{recapData.funnyTitle.description}</p>
        </div>
      )
    },
    {
      id: "stats",
      bg: "from-slate-800 via-slate-700 to-slate-600",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-white p-6">
          <Sparkles className="h-12 w-12 mb-6" />
          <p className="text-sm uppercase tracking-wide opacity-80 mb-4">Week Summary</p>
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold">{recapData.weekStats.questionsAnswered}</p>
                <p className="text-xs opacity-80">Questions</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold">{Math.round((recapData.weekStats.correctAnswers / recapData.weekStats.questionsAnswered) * 100)}%</p>
                <p className="text-xs opacity-80">Accuracy</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <p className="text-3xl font-bold">{recapData.weekStats.streakDays}</p>
                </div>
                <p className="text-xs opacity-80">Day Streak</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-bold text-green-400">+{recapData.weekStats.moneyHealthChange}</p>
                <p className="text-xs opacity-80">Money Health</p>
              </CardContent>
            </Card>
          </div>
          <Button 
            className="mt-8 gap-2"
            size="lg"
            onClick={async () => {
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
      )
    }
  ];

  const goNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${currentSlideData.bg} transition-all duration-500`}>
      <header className="flex items-center justify-between gap-2 p-4 flex-wrap">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          className="text-white"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide 
                  ? "w-6 bg-white" 
                  : "w-1.5 bg-white/40"
              }`}
              data-testid={`slide-indicator-${idx}`}
            />
          ))}
        </div>
        <div className="w-9" />
      </header>

      <main className="flex-1 flex flex-col min-h-[calc(100vh-140px)]">
        {currentSlideData.content}
      </main>

      <footer className="flex items-center justify-between gap-4 p-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="text-white disabled:opacity-30"
          data-testid="button-prev"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <span className="text-white/60 text-sm">
          {currentSlide + 1} / {slides.length}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          disabled={currentSlide === slides.length - 1}
          className="text-white disabled:opacity-30"
          data-testid="button-next"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </footer>
    </div>
  );
}
