import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Scenario } from "@shared/schema";
import { Laptop, Plane, ShoppingBag, ShieldAlert, TrendingUp, CreditCard } from "lucide-react";

const categoryIcons = {
  tech: Laptop,
  travel: Plane,
  lifestyle: ShoppingBag,
  scam: ShieldAlert,
  investing: TrendingUp,
  debt: CreditCard,
};

const categoryColors = {
  tech: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  travel: "bg-primary/10 text-primary border-primary/20",
  lifestyle: "bg-accent/10 text-accent-foreground border-accent/20",
  scam: "bg-destructive/10 text-destructive border-destructive/20",
  investing: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  debt: "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
};

interface ScenarioCardProps {
  scenario: Scenario;
  selectedChoice: string | null;
  onSelectChoice: (label: string) => void;
  showResult?: boolean;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
}

export function ScenarioCard({
  scenario,
  selectedChoice,
  onSelectChoice,
  showResult = false,
  questionNumber,
  totalQuestions,
  timeRemaining,
}: ScenarioCardProps) {
  const Icon = categoryIcons[scenario.category] || ShoppingBag;

  return (
    <Card className="p-6 scenario-reveal" data-testid={`card-scenario-${scenario.id}`}>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn("border", categoryColors[scenario.category])}
            data-testid={`badge-category-${scenario.category}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground" data-testid="text-question-number">
            Q{questionNumber}/{totalQuestions}
          </span>
        </div>
        {timeRemaining !== undefined && (
          <Badge
            variant={timeRemaining <= 5 ? "destructive" : "secondary"}
            className={timeRemaining <= 5 ? "animate-pulse" : ""}
            data-testid="badge-timer"
          >
            {timeRemaining}s
          </Badge>
        )}
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <p className="text-sm text-muted-foreground font-mono" data-testid="text-scenario-context">{scenario.context}</p>
      </div>

      <h3 className="text-lg font-semibold mb-4" data-testid="text-scenario-question">{scenario.question}</h3>

      <div className="space-y-2">
        {scenario.choices.map((choice) => {
          const isSelected = selectedChoice === choice.label;
          const isCorrect = choice.isCorrect;
          const showCorrectness = showResult && (isSelected || isCorrect);

          return (
            <button
              key={choice.label}
              onClick={() => !showResult && onSelectChoice(choice.label)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-md border-2 text-left transition-all",
                "flex items-start gap-3",
                !showResult && !isSelected && "hover-elevate border-border",
                !showResult && isSelected && "border-primary bg-primary/5",
                showResult && isSelected && isCorrect && "border-primary bg-primary/10",
                showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10 shake",
                showResult && !isSelected && isCorrect && "border-primary/50 bg-primary/5"
              )}
              data-testid={`button-choice-${choice.label}`}
            >
              <span
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  !showResult && !isSelected && "bg-secondary text-secondary-foreground",
                  !showResult && isSelected && "bg-primary text-primary-foreground",
                  showResult && isCorrect && "bg-primary text-primary-foreground",
                  showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
                )}
                data-testid={`label-choice-${choice.label}`}
              >
                {choice.label}
              </span>
              <div className="flex-1">
                <p className="font-medium" data-testid={`text-choice-${choice.label}`}>{choice.text}</p>
                {showResult && showCorrectness && (
                  <p
                    className={cn(
                      "text-sm mt-1",
                      isCorrect ? "text-primary" : "text-destructive"
                    )}
                    data-testid={`text-feedback-${choice.label}`}
                  >
                    {choice.feedback}
                  </p>
                )}
              </div>
              {showResult && isCorrect && (
                <Badge variant="default" className="flex-shrink-0" data-testid={`badge-points-${choice.label}`}>
                  +{choice.points}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
