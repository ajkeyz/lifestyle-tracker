import { z } from "zod";

export * from "./models/auth";

export type GameMode = "tech" | "global" | "scam" | "student" | "boss";

export interface ScenarioDeepDive {
  teaching: string;
  alternative: string | null;
  ruleOfThumb: string;
  realWorldExample: string;
}

export interface Scenario {
  id: string;
  context: string;
  question: string;
  choices: {
    label: string;
    text: string;
    isCorrect: boolean;
    points: number;
    feedback: string;
  }[];
  category: "tech" | "travel" | "lifestyle" | "scam" | "investing" | "debt";
  deepDive: ScenarioDeepDive;
}

export interface DailyDrop {
  id: string;
  dropNumber: number;
  date: string;
  scenarios: Scenario[];
}

export interface UserStats {
  cash: number;
  debt: number;
  credit: number;
  stress: number;
  investment: number;
}

export interface UserGameResult {
  answers: string[];
  score: number;
  moneyHealth: number;
  iq: number;
  stats: UserStats;
}

export interface StreakDay {
  date: string;
  played: boolean;
  frozen: boolean;
  score?: number;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  allowFriendsToFind: boolean;
  isProfilePrivate: boolean;
  profileSetupComplete: boolean;
  mode: GameMode | null;
  streak: number;
  highestStreak: number;
  freezeTokens: number;
  frozenDates: string[];
  streakCalendar: StreakDay[];
  moneyHealth: number;
  totalScore: number;
  gamesPlayed: number;
  lastPlayedDate: string | null;
  stats: UserStats;
  todayResult: UserGameResult | null;
  badges: UserBadge[];
  perfectGames: number;
  scamStreak: number;
  hadPreviousStreak: boolean;
}

export const setModeSchema = z.object({
  mode: z.enum(["tech", "global", "scam", "student", "boss"]),
});

export type SetMode = z.infer<typeof setModeSchema>;

export interface LeaderboardEntry {
  id: string;
  username: string;
  moneyHealth: number;
  streak: number;
  rank: number;
}

export const createUserSchema = z.object({
  username: z.string().min(1).max(20),
});

export const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  avatar: z.string(),
  bio: z.string().max(100).optional().default(""),
  allowFriendsToFind: z.boolean(),
  isProfilePrivate: z.boolean(),
});

export type UpdateProfile = z.infer<typeof updateProfileSchema>;

export const submitAnswerSchema = z.object({
  scenarioId: z.string(),
  choiceLabel: z.string(),
});

export const submitGameSchema = z.object({
  dropId: z.string(),
  answers: z.array(z.object({
    scenarioId: z.string(),
    choiceLabel: z.string(),
  })),
});

export type CreateUser = z.infer<typeof createUserSchema>;
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;
export type SubmitGame = z.infer<typeof submitGameSchema>;

// League types
export interface LeagueMember {
  userId: string;
  username: string;
  avatar: string;
  weeklyScore: number;
  weeklyRank: number;
  isWeeklyWinner: boolean;
}

export interface League {
  id: string;
  name: string;
  emoji: string;
  privacy: "public" | "private";
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: LeagueMember[];
  weekStartDate: string;
  previousWeekWinner: string | null;
}

export const createLeagueSchema = z.object({
  name: z.string().min(3).max(30),
  emoji: z.string().min(1).max(20),
  privacy: z.enum(["public", "private"]),
});

export type CreateLeague = z.infer<typeof createLeagueSchema>;

export const joinLeagueSchema = z.object({
  inviteCode: z.string().min(6).max(10),
});

export type JoinLeague = z.infer<typeof joinLeagueSchema>;

// Challenge types
export type ChallengeType = "money_health" | "streak" | "accuracy";
export type ChallengeStatus = "pending" | "accepted" | "completed" | "expired" | "declined";

export interface Challenge {
  id: string;
  challengerId: string;
  challengerUsername: string;
  challengerAvatar: string;
  challengeeId: string;
  challengeeUsername: string;
  challengeeAvatar: string;
  type: ChallengeType;
  trashTalk: string;
  customMessage: string | null;
  status: ChallengeStatus;
  challengerValue: number;
  challengeeValue: number | null;
  winnerId: string | null;
  createdAt: string;
  expiresAt: string;
  completedAt: string | null;
  badgeAwarded: string | null;
}

export const CHALLENGE_TYPES = [
  { id: "money_health" as ChallengeType, label: "Beat my Money Health today", icon: "heart" },
  { id: "streak" as ChallengeType, label: "Match my streak this week", icon: "flame" },
  { id: "accuracy" as ChallengeType, label: "Try to outperform my accuracy", icon: "target" },
] as const;

export const TRASH_TALK_PRESETS = [
  "Think you can handle this? Prove it!",
  "My wallet is stronger than yours",
  "Ready to get schooled in money moves?",
  "Show me what you've got!",
  "Hope you've been practicing...",
  "This is going to be embarrassing for you",
  "May the best saver win!",
  "I'm not even trying and I'll still win",
] as const;

export const CHALLENGE_BADGES = [
  { id: "money_master", name: "Money Master", icon: "trophy", description: "Won a Money Health challenge" },
  { id: "streak_keeper", name: "Streak Keeper", icon: "flame", description: "Won a Streak challenge" },
  { id: "sharp_shooter", name: "Sharp Shooter", icon: "target", description: "Won an Accuracy challenge" },
  { id: "challenger", name: "Challenger", icon: "swords", description: "Sent 5 challenges" },
  { id: "defender", name: "Defender", icon: "shield", description: "Won 3 challenges in a row" },
] as const;

export const createChallengeSchema = z.object({
  challengeeId: z.string(),
  type: z.enum(["money_health", "streak", "accuracy"]),
  trashTalk: z.string().min(1).max(100),
  customMessage: z.string().max(200).nullable().optional(),
});

export type CreateChallenge = z.infer<typeof createChallengeSchema>;

export const addFreezeTokenSchema = z.object({
  count: z.number().int().min(1).max(10).optional().default(1),
});

// Achievement/Badge types
export type BadgeId = 
  | "no_spend_ninja"
  | "credit_climber"
  | "emergency_fund_builder"
  | "scam_spotter"
  | "budget_sniper"
  | "streak_monster"
  | "comeback_king";

export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  unlockCriteria: string;
  maxProgress: number;
}

export interface UserBadge {
  badgeId: BadgeId;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "no_spend_ninja",
    name: "No-Spend Ninja",
    description: "Master of avoiding unnecessary purchases",
    icon: "ninja",
    unlockCriteria: "Answer 10 spending questions correctly",
    maxProgress: 10,
  },
  {
    id: "credit_climber",
    name: "Credit Climber",
    description: "Expert at building credit score",
    icon: "trending-up",
    unlockCriteria: "Reach 750+ Money Health score",
    maxProgress: 750,
  },
  {
    id: "emergency_fund_builder",
    name: "Emergency Fund Builder",
    description: "Always prepared for the unexpected",
    icon: "piggy-bank",
    unlockCriteria: "Play 30 games total",
    maxProgress: 30,
  },
  {
    id: "scam_spotter",
    name: "Scam Spotter",
    description: "Can smell a scam from a mile away",
    icon: "eye",
    unlockCriteria: "Get 5 scam questions correct in a row",
    maxProgress: 5,
  },
  {
    id: "budget_sniper",
    name: "Budget Sniper",
    description: "Never misses a budgeting opportunity",
    icon: "target",
    unlockCriteria: "Achieve 100% accuracy in 3 games",
    maxProgress: 3,
  },
  {
    id: "streak_monster",
    name: "Streak Monster",
    description: "Unstoppable daily player",
    icon: "flame",
    unlockCriteria: "Reach a 30-day streak",
    maxProgress: 30,
  },
  {
    id: "comeback_king",
    name: "Comeback King/Queen",
    description: "Bounced back from a lost streak",
    icon: "crown",
    unlockCriteria: "Rebuild a 7-day streak after losing one",
    maxProgress: 7,
  },
];
