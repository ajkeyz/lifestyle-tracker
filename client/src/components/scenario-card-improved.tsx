import { useState, useEffect, useMemo } from "react";
import { ChoiceCard } from "@/components/choice-card";
import { QuestionHeader } from "@/components/question-header";
import { classifyChoiceTone, simulateCommunityDistribution } from "@/lib/game-insights";
import { cn } from "@/lib/utils";
import type { Scenario } from "@shared/schema";

interface ScenarioCardProps {
  scenario: Scenario;
  selectedChoice: string | null;
  onSelectChoice: (label: string) => void;
  showResult?: boolean;
  questionNumber: number;
  totalQuestions: number;
  // #5: Timer urgency props
  timeRemaining?: number;
  timerRunning?: boolean;
  // #11: Lifeline 50/50 props
  eliminatedChoices?: string[];
}

export function ScenarioCard({
  scenario,
  selectedChoice,
  onSelectChoice,
  showResult = false,
  questionNumber,
  totalQuestions,
  timeRemaining,
  timerRunning,
  eliminatedChoices = [],
}: ScenarioCardProps) {
  const [revealStage, setRevealStage] = useState(0);

  useEffect(() => {
    if (showResult) {
      const t1 = setTimeout(() => setRevealStage(1), 500);
      const t2 = setTimeout(() => setRevealStage(2), 800);
      const t3 = setTimeout(() => setRevealStage(3), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else {
      setRevealStage(0);
    }
  }, [showResult]);

  const choiceTones = useMemo(() => {
    return scenario.choices.map(choice => classifyChoiceTone(choice));
  }, [scenario.choices]);

  // #9: Community answer distribution (simulated from point values)
  const communityDistribution = useMemo(() => {
    return simulateCommunityDistribution(scenario.choices);
  }, [scenario.choices]);

  // #5: Timer urgency class
  const urgencyClass = useMemo(() => {
    if (!timerRunning || showResult || timeRemaining === undefined) return "";
    if (timeRemaining <= 5) return "timer-urgent-critical";
    if (timeRemaining <= 10) return "timer-urgent-warning";
    return "";
  }, [timeRemaining, timerRunning, showResult]);

  return (
    <div className={cn("grid grid-rows-[auto_auto] gap-5", urgencyClass)}>
      {/* Zone A+B: Context + Question with difficulty indicator (#13) */}
      <QuestionHeader
        category={scenario.category}
        context={scenario.context}
        question={scenario.question}
        choices={scenario.choices}
      />

      {/* Zone C: Answer Options */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em] px-1" data-testid="text-choose-label">
          Choose your answer
        </p>
        <div
          className="grid grid-cols-1 gap-2.5"
          role="radiogroup"
          aria-label="Answer choices"
          data-testid="choices-container"
        >
          {scenario.choices.map((choice, index) => {
            const isSelected = selectedChoice === choice.label;
            const isCorrect = choice.isCorrect;

            return (
              <ChoiceCard
                key={choice.label}
                label={choice.label}
                text={choice.text}
                points={choice.points}
                feedback={choice.feedback}
                isSelected={isSelected}
                isCorrect={isCorrect}
                showResult={showResult}
                revealStage={revealStage}
                onSelect={() => onSelectChoice(choice.label)}
                index={index}
                disabled={showResult}
                tone={choiceTones[index]}
                communityPct={communityDistribution[choice.label]}
                eliminated={eliminatedChoices.includes(choice.label)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
