import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ChoiceCard } from "@/components/choice-card";
import { QuestionHeader } from "@/components/question-header";
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
  // Multi-stage reveal animation states
  const [revealStage, setRevealStage] = useState(0);

  // Trigger reveal sequence when showResult changes to true
  useEffect(() => {
    if (showResult && revealStage === 0) {
      // Stage 1: Pause (0.5s tension)
      setTimeout(() => setRevealStage(1), 500);
      // Stage 2: Show result indicators (flip + icons)
      setTimeout(() => setRevealStage(2), 800);
      // Stage 3: Show points and feedback
      setTimeout(() => setRevealStage(3), 1200);
    } else if (!showResult) {
      setRevealStage(0);
    }
  }, [showResult, revealStage]);

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <QuestionHeader
        category={scenario.category}
        context={scenario.context}
        question={scenario.question}
      />

      {/* Choices */}
      <div
        className="space-y-3"
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
            />
          );
        })}
      </div>
    </div>
  );
}
