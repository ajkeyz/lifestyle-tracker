import { z } from "zod";

export * from "./models/auth";

export type GameMode = "tech" | "global" | "scam" | "student" | "boss";

export type ScenarioCategory = "tech" | "travel" | "lifestyle" | "scam" | "investing" | "debt" | "career" | "relationships" | "housing" | "insurance" | "tax" | "credit" | "emergency" | "budgeting" | "health" | "giving" | "saving" | "family" | "windfall";

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
  category: ScenarioCategory;
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

export interface GameHistoryEntry {
  date: string;
  dropNumber: number;
  score: number;
  moneyHealth: number;
  correctAnswers: number;
  totalQuestions: number;
  categoryBreakdown: {
    category: string;
    correct: number;
    total: number;
  }[];
  timeSpent: number;
}

export interface CategoryStats {
  category: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export interface StreakInsurance {
  isPlus: boolean;
  lastBuybackDate: string | null;
  lostStreak: number | null;
  lostStreakDate: string | null;
  latePassAvailable: boolean;
}

export const defaultStreakInsurance: StreakInsurance = {
  isPlus: false,
  lastBuybackDate: null,
  lostStreak: null,
  lostStreakDate: null,
  latePassAvailable: false,
};

export interface User {
  id: string;
  username: string;
  avatar: string;
  bio: string;
  allowFriendsToFind: boolean;
  isProfilePrivate: boolean;
  profileSetupComplete: boolean;
  onboardingComplete: boolean;
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
  lowPressureMode: boolean;
  soundEnabled: boolean;
  notificationPrefs: NotificationPrefs;
  streakInsurance: StreakInsurance;
  gameHistory: GameHistoryEntry[];
  categoryStats: CategoryStats[];
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  friendIds: string[];
  membershipTier: "free" | "plus" | "pro";
  arcadePlaysToday: number;
  arcadeLastPlayedDate: string | null;
}

export interface NotificationPrefs {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  onlyIfNotPlayed: boolean;
  onlyIfNotPlayedTime: string;
  challengeAlerts: boolean;
  leagueRankAlerts: boolean;
}

export const defaultNotificationPrefs: NotificationPrefs = {
  dailyReminderEnabled: true,
  dailyReminderTime: "09:00",
  onlyIfNotPlayed: true,
  onlyIfNotPlayedTime: "20:00",
  challengeAlerts: true,
  leagueRankAlerts: true,
};

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

export const submitArcadeGameSchema = z.object({
  arcadeDropId: z.string(),
  answers: z.array(z.object({
    scenarioId: z.string(),
    choiceLabel: z.string(),
  })),
});

export interface ArcadeGameResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  playsUsedToday: number;
  playsRemaining: number;
}

export interface ArcadeStatus {
  playsUsedToday: number;
  maxPlaysToday: number;
  playsRemaining: number;
  canPlay: boolean;
  membershipTier: "free" | "plus" | "pro";
}

export const ARCADE_LIMITS: Record<"free" | "plus" | "pro", number> = {
  free: 1,
  plus: 3,
  pro: 999,
};

export type CreateUser = z.infer<typeof createUserSchema>;
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;
export type SubmitGame = z.infer<typeof submitGameSchema>;
export type SubmitArcadeGame = z.infer<typeof submitArcadeGameSchema>;

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

// Community Mode types
export type ScenarioType = "real" | "hypothetical";

export interface CommunityScenario {
  id: string;
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  authorBadges: UserBadge[];
  authorMoneyHealth: number;
  title: string;
  context: string;
  question: string;
  type: ScenarioType;
  category: "tech" | "travel" | "lifestyle" | "scam" | "investing" | "debt" | "career" | "relationships";
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: string;
  weekNumber: number; // For tracking "Realest of the Week"
  isRealistOfWeek: boolean;
  userVote: "up" | "down" | null; // For current user
}

export interface CommunityComment {
  id: string;
  scenarioId: string;
  parentId: string | null; // For replies
  authorId: string;
  authorUsername: string;
  authorAvatar: string;
  authorBadges: UserBadge[];
  authorMoneyHealth: number;
  content: string;
  isAdvice: boolean; // Marked as financial advice
  upvotes: number;
  downvotes: number;
  createdAt: string;
  userVote: "up" | "down" | null; // For current user
  replies?: CommunityComment[]; // Nested replies
}

export interface CommunityVote {
  id: string;
  scenarioId: string | null;
  commentId: string | null;
  userId: string;
  type: "up" | "down";
  createdAt: string;
}

export const communityScenarioSchema = z.object({
  title: z.string().min(10).max(100),
  context: z.string().min(20).max(500),
  question: z.string().min(10).max(200),
  type: z.enum(["real", "hypothetical"]),
  category: z.enum(["tech", "travel", "lifestyle", "scam", "investing", "debt", "career", "relationships"]),
});

export type CreateCommunityScenario = z.infer<typeof communityScenarioSchema>;

export const communityCommentSchema = z.object({
  scenarioId: z.string(),
  parentId: z.string().optional(),
  content: z.string().min(5).max(500),
  isAdvice: z.boolean().default(false),
});

export type CreateCommunityComment = z.infer<typeof communityCommentSchema>;

export const communityVoteSchema = z.object({
  scenarioId: z.string().optional(),
  commentId: z.string().optional(),
  type: z.enum(["up", "down"]),
});

export type CreateCommunityVote = z.infer<typeof communityVoteSchema>;

export const COMMUNITY_CATEGORIES = [
  { id: "tech", label: "Tech & Gadgets", icon: "smartphone" },
  { id: "travel", label: "Travel", icon: "plane" },
  { id: "lifestyle", label: "Lifestyle", icon: "sparkles" },
  { id: "scam", label: "Scams & Fraud", icon: "alert-triangle" },
  { id: "investing", label: "Investing", icon: "trending-up" },
  { id: "debt", label: "Debt & Loans", icon: "credit-card" },
  { id: "career", label: "Career & Salary", icon: "briefcase" },
  { id: "relationships", label: "Friends & Family", icon: "users" },
] as const;

// Admin types
export type AdminScenarioStatus = "draft" | "published" | "archived";

export interface AdminScenarioContext {
  cash: number;
  debt: number;
  credit: number;
  stress: number;
  portfolio: number;
}

export interface AdminScenarioChoice {
  label: "A" | "B" | "C" | "D";
  text: string;
  isCorrect: boolean;
  points: number;
  feedback: string;
}

export interface AdminScenario {
  id: string;
  title: string;
  context: AdminScenarioContext;
  question: string;
  choices: AdminScenarioChoice[];
  category: "tech" | "travel" | "lifestyle" | "scam" | "investing" | "debt" | "career" | "relationships";
  difficulty: number; // 1-5 scale
  publishDate: string | null;
  status: AdminScenarioStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deepDive: ScenarioDeepDive | null;
}

export interface Moderator {
  userId: string;
  username: string;
  avatar: string;
  assignedAt: string;
  assignedBy: string;
}

export interface BannedUser {
  userId: string;
  username: string;
  avatar: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
  bannedByUsername: string;
}

export const adminScenarioSchema = z.object({
  title: z.string().min(5).max(100),
  context: z.object({
    cash: z.number().min(-100).max(100),
    debt: z.number().min(-100).max(100),
    credit: z.number().min(-100).max(100),
    stress: z.number().min(-100).max(100),
    portfolio: z.number().min(-100).max(100),
  }),
  question: z.string().min(10).max(500),
  choices: z.array(z.object({
    label: z.enum(["A", "B", "C", "D"]),
    text: z.string().min(1).max(200),
    isCorrect: z.boolean(),
    points: z.number().min(-100).max(100),
    feedback: z.string().min(1).max(300),
  })).length(4),
  category: z.enum(["tech", "travel", "lifestyle", "scam", "investing", "debt", "career", "relationships"]),
  difficulty: z.number().min(1).max(5),
  publishDate: z.string().nullable(),
  status: z.enum(["draft", "published", "archived"]),
  deepDive: z.object({
    teaching: z.string(),
    alternative: z.string().nullable(),
    ruleOfThumb: z.string(),
    realWorldExample: z.string(),
  }).nullable().optional(),
});

export type CreateAdminScenario = z.infer<typeof adminScenarioSchema>;

export const banUserSchema = z.object({
  userId: z.string(),
  reason: z.string().min(5).max(200),
});

export type BanUser = z.infer<typeof banUserSchema>;

export const addModeratorSchema = z.object({
  userId: z.string(),
});

export type AddModerator = z.infer<typeof addModeratorSchema>;

// Co-op Game Session types
export type CoopSessionStatus = "waiting" | "playing" | "completed";

export interface CoopPlayer {
  id: string;
  username: string;
  avatar: string;
  answers: Record<string, string>;
  currentQuestionIndex: number;
  score: number;
  connected: boolean;
}

export interface CoopSession {
  id: string;
  code: string; // 6-character join code
  hostId: string;
  guestId: string | null;
  status: CoopSessionStatus;
  dropId: string;
  currentQuestionIndex: number;
  questionStartTime: number; // timestamp when current question started
  players: CoopPlayer[];
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CoopGameResult {
  sessionId: string;
  players: {
    id: string;
    username: string;
    avatar: string;
    score: number;
    correctAnswers: number;
    answers: { scenarioId: string; choiceLabel: string; points: number; isCorrect: boolean }[];
  }[];
  totalQuestions: number;
  winner: string | null; // null if tie
}

export const createCoopSessionSchema = z.object({});

export const joinCoopSessionSchema = z.object({
  code: z.string().length(6).toUpperCase(),
});

export type CreateCoopSession = z.infer<typeof createCoopSessionSchema>;
export type JoinCoopSession = z.infer<typeof joinCoopSessionSchema>;

// WebSocket message types for co-op
export type CoopMessageType = 
  | "player_joined"
  | "game_start"
  | "answer_submitted"
  | "next_question"
  | "timer_sync"
  | "game_complete"
  | "player_disconnected"
  | "player_reconnected";

export interface CoopMessage {
  type: CoopMessageType;
  sessionId: string;
  payload: unknown;
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
