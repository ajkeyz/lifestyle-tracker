import type { Scenario, ScenarioCategory } from "@shared/schema";

export type ChoiceTone = "practical" | "cautious" | "strategic" | "emotional";

export const toneColors: Record<ChoiceTone, string> = {
  practical: "bg-emerald-400 dark:bg-emerald-500",
  cautious: "bg-amber-400 dark:bg-amber-500",
  strategic: "bg-blue-400 dark:bg-blue-500",
  emotional: "bg-orange-400 dark:bg-orange-500",
};

const contextBuffers: Record<ScenarioCategory, string> = {
  tech: "Where innovation meets impulse.",
  travel: "When wanderlust whispers, what does wisdom say?",
  lifestyle: "This is a moment where money, ego, and comfort overlap.",
  scam: "Trust is currency. Spend it carefully.",
  investing: "Risk and reward are having a conversation right now.",
  debt: "The weight of what you owe shapes what you can become.",
  career: "This is a moment where money, ego, and fear overlap.",
  relationships: "Where money meets the people you care about.",
  housing: "The biggest number most people ever sign next to.",
  insurance: "Paying for peace of mind — or paying for nothing?",
  tax: "The rules are complex. Your instinct doesn't have to be.",
  credit: "A number that follows you everywhere. Choose wisely.",
  emergency: "Calm decisions in urgent moments define your future.",
  budgeting: "Small leaks sink big ships.",
  health: "Your body is the one asset you can't refinance.",
  giving: "Generosity is a financial decision too.",
  saving: "Future-you is watching this moment.",
  family: "Money and family — the conversation nobody wants to have.",
  windfall: "Unexpected money reveals who you really are with money.",
};

export function getContextBuffer(category: ScenarioCategory): string {
  return contextBuffers[category] || "A moment that reveals something about how you think about money.";
}

export function getTimerMessage(timeRemaining: number, totalTime: number): string {
  const ratio = timeRemaining / totalTime;
  if (ratio > 0.5) return "Take your time";
  if (ratio > 0.25) return "Weigh the tradeoff";
  return "Trust your instinct";
}

const microAffirmations = [
  "Interesting choice.",
  "Many people hesitate here.",
  "This is a common instinct.",
  "That says something about your priorities.",
  "Worth sitting with that for a second.",
  "No wrong answers — just different trade-offs.",
  "Most people feel conflicted on this one.",
  "Your instinct kicked in fast.",
];

export function getMicroAffirmation(questionIndex: number, choiceLabel: string): string {
  const seed = questionIndex * 7 + choiceLabel.charCodeAt(0);
  return microAffirmations[seed % microAffirmations.length];
}

export function classifyChoiceTone(choice: { text: string; isCorrect: boolean; points: number }): ChoiceTone {
  const text = choice.text.toLowerCase();

  const strategicSignals = ["invest", "diversif", "index fund", "negotiate", "research", "compare", "long-term", "portfolio", "automate", "compound"];
  const cautiousSignals = ["wait", "hold", "ask", "verify", "hang up", "decline", "skip", "ignore", "avoid", "delay", "pause", "emergency fund", "save", "insurance"];
  const emotionalSignals = ["upgrade", "yolo", "treat", "splurge", "buy", "subscribe", "spend", "accept", "trust", "give", "lend", "help"];
  const practicalSignals = ["budget", "plan", "calculate", "review", "cancel", "downgrade", "sell", "pay off", "reduce", "cut", "consolidate"];

  let scores = { practical: 0, cautious: 0, strategic: 0, emotional: 0 };

  for (const s of strategicSignals) if (text.includes(s)) scores.strategic += 2;
  for (const s of cautiousSignals) if (text.includes(s)) scores.cautious += 2;
  for (const s of emotionalSignals) if (text.includes(s)) scores.emotional += 2;
  for (const s of practicalSignals) if (text.includes(s)) scores.practical += 2;

  if (choice.isCorrect && choice.points >= 80) scores.strategic += 1;
  if (choice.points < 0) scores.emotional += 1;
  if (choice.points >= 40 && choice.points < 80) scores.practical += 1;
  if (choice.points >= 0 && choice.points < 40) scores.cautious += 1;

  const entries = Object.entries(scores) as [ChoiceTone, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

const counterfactuals: string[] = [
  "What happens if nothing changes?",
  "What would you tell a friend in this exact situation?",
  "How would this feel in six months?",
  "What's the version of this where you sleep well tonight?",
  "What would the most boring, responsible answer be?",
  "What's the hidden cost here?",
];

export function getCounterfactual(questionIndex: number): string {
  return counterfactuals[questionIndex % counterfactuals.length];
}

export function getDelayTeachable(): string {
  return "Pausing can be wisdom \u2014 or avoidance. Context matters.";
}

export function getPostAnswerReflection(scenario: Scenario, selectedLabel: string | null): string | null {
  if (!selectedLabel) return null;

  const selected = scenario.choices.find(c => c.label === selectedLabel);
  const correct = scenario.choices.find(c => c.isCorrect);
  if (!selected || !correct) return null;

  if (selected.isCorrect) {
    return scenario.deepDive.teaching;
  }

  if (scenario.deepDive.alternative) {
    return scenario.deepDive.alternative;
  }

  return scenario.deepDive.teaching;
}

export interface PatternSummary {
  headline: string;
  detail: string;
  dominantTone: ChoiceTone;
  toneBreakdown: Record<ChoiceTone, number>;
}

export function analyzeAnswerPatterns(
  scenarios: Scenario[],
  answers: string[]
): PatternSummary {
  const toneBreakdown: Record<ChoiceTone, number> = {
    practical: 0,
    cautious: 0,
    strategic: 0,
    emotional: 0,
  };

  let correctCount = 0;

  scenarios.forEach((scenario, i) => {
    const answer = answers[i];
    if (!answer) return;
    const choice = scenario.choices.find(c => c.label === answer);
    if (!choice) return;

    const tone = classifyChoiceTone(choice);
    toneBreakdown[tone]++;
    if (choice.isCorrect) correctCount++;
  });

  const entries = Object.entries(toneBreakdown) as [ChoiceTone, number][];
  entries.sort((a, b) => b[1] - a[1]);
  const dominantTone = entries[0][0];
  const dominantCount = entries[0][1];

  const toneDescriptions: Record<ChoiceTone, { headline: string; detail: string }> = {
    strategic: {
      headline: "You leaned toward long-term thinking today.",
      detail: "You consistently prioritized optionality and future upside over immediate comfort.",
    },
    cautious: {
      headline: "You played it safe today.",
      detail: "You leaned toward short-term certainty over long-term change. Safety felt right.",
    },
    practical: {
      headline: "You were grounded and methodical today.",
      detail: "You chose structure and planning over impulse. The spreadsheet brain won.",
    },
    emotional: {
      headline: "You followed your gut today.",
      detail: "You made decisions based on how things felt, not just how they calculated.",
    },
  };

  let { headline, detail } = toneDescriptions[dominantTone];

  if (dominantCount <= 1 && scenarios.length >= 3) {
    headline = "Your instincts were mixed today.";
    detail = "No single pattern dominated — you adapted to each situation differently.";
  }

  if (correctCount === scenarios.length) {
    headline = "Sharp thinking across the board.";
    detail = "You found the financially sound choice every time. Your instincts are well-calibrated.";
  }

  return {
    headline,
    detail,
    dominantTone,
    toneBreakdown,
  };
}
