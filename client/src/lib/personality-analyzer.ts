import type { GameHistoryEntry, CategoryStats } from "@shared/schema";

export interface PersonalityDimensions {
  riskTolerance: number; // 0-100: Conservative → Aggressive
  spendingStyle: number; // 0-100: Saver → Spender
  scamAwareness: number; // 0-100: Trusting → Skeptical
  timeHorizon: number;   // 0-100: Present → Future
}

export interface PersonalityArchetype {
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
}

export interface PersonalityAnalysis {
  archetype: PersonalityArchetype;
  dimensions: PersonalityDimensions;
  strengths: string[];
  blindSpots: string[];
  recommendations: string[];
}

const ARCHETYPES: PersonalityArchetype[] = [
  {
    id: "wealth_builder",
    name: "The Wealth Builder",
    emoji: "🦸",
    description: "You prioritize long-term growth and avoid unnecessary spending. You're building a strong financial foundation.",
    traits: ["Disciplined", "Patient", "Goal-oriented", "Strategic"],
  },
  {
    id: "calculated_risk_taker",
    name: "The Calculated Risk-Taker",
    emoji: "🎯",
    description: "You take smart risks for growth while keeping your eye on the future. You understand that fortune favors the bold.",
    traits: ["Strategic", "Confident", "Growth-minded", "Ambitious"],
  },
  {
    id: "safety_seeker",
    name: "The Safety Seeker",
    emoji: "🛡️",
    description: "You value security and stability above all. You sleep well at night knowing your finances are protected.",
    traits: ["Cautious", "Prepared", "Risk-averse", "Protective"],
  },
  {
    id: "balanced_optimist",
    name: "The Balanced Optimist",
    emoji: "🎨",
    description: "You strike a healthy balance between enjoying today and planning for tomorrow. You live life fully without compromising your future.",
    traits: ["Balanced", "Pragmatic", "Flexible", "Optimistic"],
  },
  {
    id: "yolo_spender",
    name: "The YOLO Spender",
    emoji: "🎉",
    description: "You believe in living for today and making memories. Life is too short not to enjoy it!",
    traits: ["Spontaneous", "Experiential", "Present-focused", "Adventurous"],
  },
  {
    id: "anxious_saver",
    name: "The Anxious Saver",
    emoji: "😰",
    description: "You worry about the future and save aggressively just in case. Better safe than sorry!",
    traits: ["Cautious", "Prepared", "Anxious", "Conservative"],
  },
  {
    id: "growth_chaser",
    name: "The Growth Chaser",
    emoji: "🚀",
    description: "You're always looking for the next big opportunity. You're willing to take risks to maximize returns.",
    traits: ["Aggressive", "Opportunistic", "Risk-tolerant", "Ambitious"],
  },
  {
    id: "zen_minimalist",
    name: "The Zen Minimalist",
    emoji: "🧘",
    description: "You find freedom in simplicity. You don't need much to be happy and prefer experiences over things.",
    traits: ["Mindful", "Content", "Simple", "Intentional"],
  },
];

function calculateRiskTolerance(gameHistory: GameHistoryEntry[], categoryStats: CategoryStats[]): number {
  // Look at investing, debt, and emergency fund questions
  const investingStat = categoryStats.find(c => c.category === "investing");
  const debtStat = categoryStats.find(c => c.category === "debt");
  const emergencyStat = categoryStats.find(c => c.category === "emergency");

  let score = 50; // Neutral

  // Higher accuracy in investing suggests comfort with risk
  if (investingStat && investingStat.totalQuestions >= 3) {
    score += (investingStat.accuracy - 50) * 0.5;
  }

  // Good debt management suggests calculated risk-taking
  if (debtStat && debtStat.totalQuestions >= 3) {
    score += (debtStat.accuracy - 50) * 0.3;
  }

  // Strong emergency fund awareness suggests lower risk tolerance
  if (emergencyStat && emergencyStat.totalQuestions >= 2) {
    score -= (emergencyStat.accuracy - 50) * 0.2;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateSpendingStyle(categoryStats: CategoryStats[]): number {
  // Look at lifestyle, tech, travel, and budgeting questions
  const lifestyleStat = categoryStats.find(c => c.category === "lifestyle");
  const techStat = categoryStats.find(c => c.category === "tech");
  const travelStat = categoryStats.find(c => c.category === "travel");
  const budgetingStat = categoryStats.find(c => c.category === "budgeting");

  let score = 50; // Neutral

  // Lower accuracy in discretionary categories suggests spender tendency
  if (lifestyleStat && lifestyleStat.totalQuestions >= 3) {
    score += (50 - lifestyleStat.accuracy) * 0.4;
  }

  if (techStat && techStat.totalQuestions >= 2) {
    score += (50 - techStat.accuracy) * 0.3;
  }

  if (travelStat && travelStat.totalQuestions >= 2) {
    score += (50 - travelStat.accuracy) * 0.3;
  }

  // High budgeting accuracy suggests saver tendency
  if (budgetingStat && budgetingStat.totalQuestions >= 2) {
    score -= (budgetingStat.accuracy - 50) * 0.4;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateScamAwareness(categoryStats: CategoryStats[]): number {
  const scamStat = categoryStats.find(c => c.category === "scam");

  if (!scamStat || scamStat.totalQuestions < 2) {
    return 50; // Neutral if not enough data
  }

  // Direct mapping: higher accuracy = more skeptical/aware
  return Math.max(0, Math.min(100, scamStat.accuracy));
}

function calculateTimeHorizon(categoryStats: CategoryStats[]): number {
  // Look at saving, investing, debt, and windfall questions
  const savingStat = categoryStats.find(c => c.category === "saving");
  const investingStat = categoryStats.find(c => c.category === "investing");
  const debtStat = categoryStats.find(c => c.category === "debt");
  const windfallStat = categoryStats.find(c => c.category === "windfall");

  let score = 50; // Neutral

  // Higher accuracy in long-term categories suggests future focus
  if (savingStat && savingStat.totalQuestions >= 2) {
    score += (savingStat.accuracy - 50) * 0.4;
  }

  if (investingStat && investingStat.totalQuestions >= 2) {
    score += (investingStat.accuracy - 50) * 0.4;
  }

  if (debtStat && debtStat.totalQuestions >= 2) {
    score += (debtStat.accuracy - 50) * 0.3;
  }

  if (windfallStat && windfallStat.totalQuestions >= 1) {
    score += (windfallStat.accuracy - 50) * 0.3;
  }

  return Math.max(0, Math.min(100, score));
}

function mapToArchetype(dimensions: PersonalityDimensions): PersonalityArchetype {
  const { riskTolerance, spendingStyle, scamAwareness, timeHorizon } = dimensions;

  // High future focus + low spending = Wealth Builder
  if (timeHorizon > 65 && spendingStyle < 40) {
    return ARCHETYPES[0]; // wealth_builder
  }

  // High risk + high future = Calculated Risk-Taker
  if (riskTolerance > 60 && timeHorizon > 60) {
    return ARCHETYPES[1]; // calculated_risk_taker
  }

  // Low risk + high future = Safety Seeker
  if (riskTolerance < 40 && timeHorizon > 60) {
    return ARCHETYPES[2]; // safety_seeker
  }

  // Balanced on most dimensions = Balanced Optimist
  const balance = [riskTolerance, spendingStyle, timeHorizon]
    .filter(d => d > 40 && d < 60)
    .length;
  if (balance >= 2) {
    return ARCHETYPES[3]; // balanced_optimist
  }

  // High spending + low future = YOLO Spender
  if (spendingStyle > 60 && timeHorizon < 40) {
    return ARCHETYPES[4]; // yolo_spender
  }

  // Low risk + low spending + low future = Anxious Saver
  if (riskTolerance < 35 && spendingStyle < 35) {
    return ARCHETYPES[5]; // anxious_saver
  }

  // High risk + high spending = Growth Chaser
  if (riskTolerance > 65 && spendingStyle > 55) {
    return ARCHETYPES[6]; // growth_chaser
  }

  // Low spending + low risk + balanced time = Zen Minimalist
  if (spendingStyle < 35 && riskTolerance < 45) {
    return ARCHETYPES[7]; // zen_minimalist
  }

  // Default to Balanced Optimist
  return ARCHETYPES[3];
}

function generateStrengths(archetype: PersonalityArchetype, dimensions: PersonalityDimensions): string[] {
  const strengths: string[] = [];

  if (dimensions.scamAwareness > 70) {
    strengths.push("Excellent at spotting scams and protecting yourself");
  }

  if (dimensions.timeHorizon > 65) {
    strengths.push("Strong long-term thinking and planning");
  }

  if (dimensions.spendingStyle < 35) {
    strengths.push("Disciplined with spending and saving");
  }

  if (dimensions.riskTolerance > 55 && dimensions.riskTolerance < 75) {
    strengths.push("Comfortable taking calculated risks for growth");
  }

  // Add archetype-specific strengths
  if (archetype.id === "wealth_builder") {
    strengths.push("Building a strong financial foundation");
  } else if (archetype.id === "balanced_optimist") {
    strengths.push("Maintaining healthy balance between present and future");
  }

  return strengths.slice(0, 3);
}

function generateBlindSpots(dimensions: PersonalityDimensions): string[] {
  const blindSpots: string[] = [];

  if (dimensions.riskTolerance < 35) {
    blindSpots.push("May miss growth opportunities by being too conservative");
  }

  if (dimensions.spendingStyle > 70) {
    blindSpots.push("Lifestyle creep might be impacting long-term wealth");
  }

  if (dimensions.timeHorizon < 35) {
    blindSpots.push("Focusing too much on today at the expense of tomorrow");
  }

  if (dimensions.scamAwareness < 50) {
    blindSpots.push("Could be more vigilant about financial scams");
  }

  return blindSpots.slice(0, 3);
}

function generateRecommendations(archetype: PersonalityArchetype, dimensions: PersonalityDimensions): string[] {
  const recommendations: string[] = [];

  if (dimensions.riskTolerance < 40) {
    recommendations.push("Consider learning about index fund investing for moderate risk exposure");
  } else if (dimensions.riskTolerance > 75) {
    recommendations.push("Ensure you have adequate emergency savings before taking big risks");
  }

  if (dimensions.spendingStyle > 65) {
    recommendations.push("Set aside a 'fun money' budget to enjoy life guilt-free within limits");
  } else if (dimensions.spendingStyle < 30) {
    recommendations.push("It's okay to spend on things that bring joy - don't forget to live!");
  }

  if (dimensions.timeHorizon < 40) {
    recommendations.push("Start small with retirement savings - even 5% makes a difference");
  }

  // Add archetype-specific recommendations
  if (archetype.id === "wealth_builder") {
    recommendations.push("Don't forget to celebrate milestones along your wealth-building journey");
  } else if (archetype.id === "yolo_spender") {
    recommendations.push("Automate savings before you see the money to build a safety net");
  } else if (archetype.id === "anxious_saver") {
    recommendations.push("A financial plan can reduce anxiety better than just saving more");
  }

  return recommendations.slice(0, 3);
}

export function analyzePersonality(gameHistory: GameHistoryEntry[], categoryStats: CategoryStats[]): PersonalityAnalysis {
  const dimensions: PersonalityDimensions = {
    riskTolerance: calculateRiskTolerance(gameHistory, categoryStats),
    spendingStyle: calculateSpendingStyle(categoryStats),
    scamAwareness: calculateScamAwareness(categoryStats),
    timeHorizon: calculateTimeHorizon(categoryStats),
  };

  const archetype = mapToArchetype(dimensions);
  const strengths = generateStrengths(archetype, dimensions);
  const blindSpots = generateBlindSpots(dimensions);
  const recommendations = generateRecommendations(archetype, dimensions);

  return {
    archetype,
    dimensions,
    strengths,
    blindSpots,
    recommendations,
  };
}
