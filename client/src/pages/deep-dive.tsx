import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Lightbulb, 
  Sparkles, 
  BookOpen, 
  Globe,
  Home
} from "lucide-react";
import { useLocation } from "wouter";
import type { User, DailyDrop } from "@shared/schema";

export default function DeepDive() {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: dailyDrop, isLoading: dropLoading } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
  });

  if (userLoading || dropLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user?.todayResult || !dailyDrop) {
    navigate("/");
    return null;
  }

  const scenarios = dailyDrop.scenarios;
  const answers = user.todayResult.answers;
  const totalScenarios = scenarios.length;

  const currentScenario = scenarios[currentIndex];
  const userAnswer = answers[currentIndex];
  const userChoice = currentScenario?.choices.find(c => c.label === userAnswer);
  const correctChoice = currentScenario?.choices.find(c => c.isCorrect);
  const isCorrect = userChoice?.isCorrect || false;

  const goNext = () => {
    if (currentIndex < totalScenarios - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goHome = () => {
    navigate("/");
  };

  if (!currentScenario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/results")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg" data-testid="text-page-title">Deep Dive</h1>
            <p className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {totalScenarios}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {scenarios.map((_, idx) => {
            const answer = answers[idx];
            const scenario = scenarios[idx];
            const choice = scenario?.choices.find(c => c.label === answer);
            const correct = choice?.isCorrect || false;
            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all ${
                  idx === currentIndex 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : ""
                } ${correct ? "bg-green-500" : "bg-red-500"}`}
                data-testid={`dot-indicator-${idx}`}
              />
            );
          })}
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        <Card className="p-4" data-testid="card-question">
          <div className="flex items-start gap-3 flex-wrap">
            <div className={`p-2 rounded-full ${isCorrect ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {isCorrect ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="secondary" className="capitalize">
                  {currentScenario.category}
                </Badge>
                <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-500/10 text-green-500" : ""}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {currentScenario.context}
              </p>
              <p className="font-medium" data-testid="text-question">
                {currentScenario.question}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-primary/30 bg-primary/5" data-testid="card-your-choice">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
              isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}>
              {userAnswer}
            </div>
            <h3 className="font-semibold">What you chose</h3>
          </div>
          <p className="text-sm" data-testid="text-your-choice">{userChoice?.text}</p>
          <p className="text-sm text-muted-foreground mt-2" data-testid="text-feedback">
            {userChoice?.feedback}
          </p>
        </Card>

        {!isCorrect && correctChoice && (
          <Card className="p-4 border-green-500/30 bg-green-500/5" data-testid="card-smarter-alternative">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Sparkles className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Smarter alternative</h3>
            </div>
            <p className="text-sm" data-testid="text-alternative-choice">
              <span className="font-medium">{correctChoice.label}:</span> {correctChoice.text}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {correctChoice.feedback}
            </p>
          </Card>
        )}

        <Card className="p-4" data-testid="card-teaching">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold">What this teaches</h3>
          </div>
          <p className="text-sm" data-testid="text-teaching">
            {currentScenario.deepDive.teaching}
          </p>
        </Card>

        {currentScenario.deepDive.alternative && (
          <Card className="p-4" data-testid="card-better-approach">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Pro tip</h3>
            </div>
            <p className="text-sm" data-testid="text-better-approach">
              {currentScenario.deepDive.alternative}
            </p>
          </Card>
        )}

        <Card className="p-4" data-testid="card-rule">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">Rule of thumb</h3>
          </div>
          <p className="text-sm font-medium" data-testid="text-rule">
            {currentScenario.deepDive.ruleOfThumb}
          </p>
        </Card>

        <Card className="p-4" data-testid="card-example">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Globe className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold">Real-world example</h3>
          </div>
          <p className="text-sm text-muted-foreground" data-testid="text-example">
            {currentScenario.deepDive.realWorldExample}
          </p>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex-1"
            data-testid="button-prev"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          {currentIndex === totalScenarios - 1 ? (
            <Button
              onClick={goHome}
              className="flex-1"
              data-testid="button-finish"
            >
              <Home className="h-4 w-4 mr-2" />
              Done
            </Button>
          ) : (
            <Button
              onClick={goNext}
              className="flex-1"
              data-testid="button-next"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
