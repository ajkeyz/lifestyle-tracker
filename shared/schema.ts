import { z } from "zod";

export * from "./models/auth";

export type GameMode = "tech" | "global" | "scam" | "student" | "boss";

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
  moneyHealth: number;
  totalScore: number;
  gamesPlayed: number;
  lastPlayedDate: string | null;
  stats: UserStats;
  todayResult: UserGameResult | null;
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
