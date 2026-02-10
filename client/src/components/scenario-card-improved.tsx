import { useState, useEffect, useMemo } from "react";
import { ChoiceCard } from "@/components/choice-card";
import { QuestionHeader } from "@/components/question-header";
import { classifyChoiceTone } from "@/lib/game-insights";
import type { Scenario } from "@shared/schema";

interface ScenarioCardProps {
  scenario: Scenario;
  selectedChoice: string | null;
  onSelectChoice: (label: string) => void;
  showResult?: boolean;
  questionNumber: number;
  totalQuestions: number;
}

export function ScenarioCard({
  scenario,
  selectedChoice,
  onSelectChoice,
  showResult = false,
  questionNumber,
  totalQuestions,
}: ScenarioCardProps) {
  const [revealStage, setRevealStage] = useState(0);

  useEffect(() => {
    if (showResult && revealStage === 0) {
      const t1 = setTimeout(() => setRevealStage(1), 500);
      const t2 = setTimeout(() => setRevealStage(2), 800);
      const t3 = setTimeout(() => setRevealStage(3), 1200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else if (!showResult) {
      setRevealStage(0);
    }
  }, [showResult, revealStage]);

  const choiceTones = useMemo(() => {
    return scenario.choices.map(choice => classifyChoiceTone(choice));
  }, [scenario.choices]);

  return (
    <div className="grid grid-rows-[auto_auto] gap-5">
      {/* Zone A+B: Context + Question */}
      <QuestionHeader
        category={scenario.category}
        context={scenario.context}
        question={scenario.question}
      />

      {/* Zone C: Answer Options */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-muted-foreground/50 uppercase tracking-wider px-1" data-testid="text-choose-label">
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
