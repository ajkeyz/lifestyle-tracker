import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, uuid, index, uniqueIndex, primaryKey } from "drizzle-orm/pg-core";
import type {
  UserStats,
  UserGameResult,
  StreakDay,
  UserBadge,
  StreakInsurance,
  NotificationPrefs,
  GameHistoryEntry,
  CategoryStats
} from "@shared/schema";

// ============================================
// USER TABLES
// ============================================

export const lifestyleUsers = pgTable("lifestyle_users", {
  // Core identity
  id: varchar("id", { length: 255 }).primaryKey(), // Session ID from Replit Auth
  username: varchar("username", { length: 100 }).notNull(),
  avatar: varchar("avatar", { length: 100 }).notNull().default("cat"),
  bio: text("bio").default(""),

  // Privacy & Profile
  allowFriendsToFind: boolean("allow_friends_to_find").notNull().default(true),
  isProfilePrivate: boolean("is_profile_private").notNull().default(false),
  profileSetupComplete: boolean("profile_setup_complete").notNull().default(false),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),

  // Game State
  mode: varchar("mode", { length: 50 }), // tech, global, scam, student, boss
  streak: integer("streak").notNull().default(0),
  highestStreak: integer("highest_streak").notNull().default(0),
  freezeTokens: integer("freeze_tokens").notNull().default(1),
  frozenDates: jsonb("frozen_dates").$type<string[]>().notNull().default([]),
  streakCalendar: jsonb("streak_calendar").$type<StreakDay[]>().notNull().default([]),

  // Scores & Stats
  moneyHealth: integer("money_health").notNull().default(50),
  totalScore: integer("total_score").notNull().default(0),
  gamesPlayed: integer("games_played").notNull().default(0),
  lastPlayedDate: varchar("last_played_date", { length: 50 }),
  stats: jsonb("stats").$type<UserStats>().notNull(),
  todayResult: jsonb("today_result").$type<UserGameResult>(),

  // Achievements
  badges: jsonb("badges").$type<UserBadge[]>().notNull().default([]),
  perfectGames: integer("perfect_games").notNull().default(0),
  scamStreak: integer("scam_streak").notNull().default(0),
  hadPreviousStreak: boolean("had_previous_streak").notNull().default(false),

  // Settings & Preferences
  lowPressureMode: boolean("low_pressure_mode").notNull().default(false),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  notificationPrefs: jsonb("notification_prefs").$type<NotificationPrefs>().notNull(),
  streakInsurance: jsonb("streak_insurance").$type<StreakInsurance>().notNull(),

  // History & Analytics
  gameHistory: jsonb("game_history").$type<GameHistoryEntry[]>().notNull().default([]),
  categoryStats: jsonb("category_stats").$type<CategoryStats[]>().notNull().default([]),

  // Social & Referral
  referralCode: varchar("referral_code", { length: 20 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 255 }),
  referralCount: integer("referral_count").notNull().default(0),
  friendIds: jsonb("friend_ids").$type<string[]>().notNull().default([]),

  // Membership
  membershipTier: varchar("membership_tier", { length: 20 }).notNull().default("free"), // free, plus, pro

  // Weekly Theme — drives Daily Drop & Arcade content for the week
  weeklyTheme: varchar("weekly_theme", { length: 50 }), // null until first picked
  themeWeekStart: varchar("theme_week_start", { length: 10 }), // YYYY-MM-DD of Monday this theme was set

  // Arcade Mode
  arcadePlaysToday: integer("arcade_plays_today").notNull().default(0),
  arcadeLastPlayedDate: varchar("arcade_last_played_date", { length: 50 }),

  // Profile Enhancement Fields
  moneyPhilosophy: varchar("money_philosophy", { length: 100 }).default(""),
  whyImHere: varchar("why_im_here", { length: 250 }).default(""),
  friendVisibility: varchar("friend_visibility", { length: 20 }).default("trend"),

  // Missions & Bonus
  claimedMissions: jsonb("claimed_missions").$type<string[]>().notNull().default([]),
  bonusArcadePlays: integer("bonus_arcade_plays").notNull().default(0),

  // Survival Mode
  survivalWins: integer("survival_wins").notNull().default(0),
  survivalPlayed: integer("survival_played").notNull().default(0),
  survivalBestPlacement: integer("survival_best_placement"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_lifestyle_users_username").on(table.username),
  uniqueIndex("idx_lifestyle_users_referral_code").on(table.referralCode),
  index("idx_lifestyle_users_money_health").on(table.moneyHealth),
  index("idx_lifestyle_users_last_played_date").on(table.lastPlayedDate), // P0: Used in daily stats queries
  index("idx_lifestyle_users_streak").on(table.streak), // P0: Used in leaderboard sorting
]);

// ============================================
// DAILY DROP TABLES
// ============================================

export const dailyDrops = pgTable("daily_drops", {
  id: uuid("id").primaryKey().defaultRandom(),
  dropNumber: integer("drop_number").notNull(),
  date: varchar("date", { length: 50 }).notNull(),
  // Theme this drop was generated for. Nullable for legacy rows pre-theme system.
  theme: varchar("theme", { length: 50 }),
  scenarios: jsonb("scenarios").notNull(), // Full scenario data
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_daily_drops_date").on(table.date),
  index("idx_daily_drops_drop_number").on(table.dropNumber),
  // Composite unique: one drop per (date, theme) combination
  uniqueIndex("idx_daily_drops_date_theme").on(table.date, table.theme),
]);

// ============================================
// LEAGUE TABLES
// ============================================

export const leagues = pgTable("leagues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  emoji: varchar("emoji", { length: 50 }).notNull(),
  privacy: varchar("privacy", { length: 20 }).notNull(), // public, private
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  weekStartDate: varchar("week_start_date", { length: 50 }).notNull(),
  previousWeekWinner: varchar("previous_week_winner", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_leagues_invite_code").on(table.inviteCode),
  index("idx_leagues_created_by").on(table.createdBy),
]);

export const leagueMembers = pgTable("league_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  leagueId: uuid("league_id").notNull().references(() => leagues.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  weeklyScore: integer("weekly_score").notNull().default(0),
  weeklyRank: integer("weekly_rank").notNull().default(0),
  isWeeklyWinner: boolean("is_weekly_winner").notNull().default(false),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_league_members_unique").on(table.leagueId, table.userId),
  index("idx_league_members_league_id").on(table.leagueId),
  index("idx_league_members_user_id").on(table.userId),
]);

// ============================================
// CHALLENGE TABLES
// ============================================

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengerId: varchar("challenger_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  challengeeId: varchar("challengee_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // money_health, streak, accuracy
  trashTalk: text("trash_talk").notNull(),
  customMessage: text("custom_message"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, accepted, completed, expired, declined
  challengerValue: integer("challenger_value").notNull(),
  challengeeValue: integer("challengee_value"),
  winnerId: varchar("winner_id", { length: 255 }),
  badgeAwarded: varchar("badge_awarded", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_challenges_challenger_id").on(table.challengerId),
  index("idx_challenges_challengee_id").on(table.challengeeId),
  index("idx_challenges_status").on(table.status),
  // P1: Composite indexes for better query performance when filtering by status + user
  index("idx_challenges_status_challenger").on(table.status, table.challengerId),
  index("idx_challenges_status_challengee").on(table.status, table.challengeeId),
]);

// ============================================
// COMMUNITY TABLES
// ============================================

export const communityScenarios = pgTable("community_scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: varchar("author_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  context: text("context").notNull(),
  question: text("question").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // real, hypothetical
  category: varchar("category", { length: 50 }).notNull(),
  weekNumber: integer("week_number").notNull(),
  isRealistOfWeek: boolean("is_realist_of_week").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_community_scenarios_author_id").on(table.authorId),
  index("idx_community_scenarios_category").on(table.category),
  index("idx_community_scenarios_week_number").on(table.weekNumber),
  index("idx_community_scenarios_created_at").on(table.createdAt),
  // P1: Composite index for category filtering + sorting by date
  index("idx_community_scenarios_category_created").on(table.category, table.createdAt),
]);

export const communityComments = pgTable("community_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id").notNull().references(() => communityScenarios.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references(() => communityComments.id, { onDelete: "cascade" }),
  authorId: varchar("author_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isAdvice: boolean("is_advice").notNull().default(false),
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_community_comments_scenario_id").on(table.scenarioId),
  index("idx_community_comments_author_id").on(table.authorId),
  index("idx_community_comments_parent_id").on(table.parentId),
]);

export const communityVotes = pgTable("community_votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  scenarioId: uuid("scenario_id").references(() => communityScenarios.id, { onDelete: "cascade" }),
  commentId: uuid("comment_id").references(() => communityComments.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 10 }).notNull(), // up, down
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  // Ensure one vote per user per scenario/comment
  uniqueIndex("idx_community_votes_scenario_user").on(table.scenarioId, table.userId),
  uniqueIndex("idx_community_votes_comment_user").on(table.commentId, table.userId),
  index("idx_community_votes_scenario_id").on(table.scenarioId),
  index("idx_community_votes_comment_id").on(table.commentId),
]);

// ============================================
// ADMIN TABLES
// ============================================

export const adminScenarios = pgTable("admin_scenarios", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 200 }).notNull(),
  context: jsonb("context").notNull(), // AdminScenarioContext
  question: text("question").notNull(),
  choices: jsonb("choices").notNull(), // AdminScenarioChoice[]
  category: varchar("category", { length: 50 }).notNull(),
  difficulty: integer("difficulty").notNull(),
  publishDate: timestamp("publish_date"),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, published, archived
  deepDive: jsonb("deep_dive"), // ScenarioDeepDive
  createdBy: varchar("created_by", { length: 255 }).notNull().references(() => lifestyleUsers.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_admin_scenarios_status").on(table.status),
  index("idx_admin_scenarios_created_by").on(table.createdBy),
]);

export const moderators = pgTable("moderators", {
  userId: varchar("user_id", { length: 255 }).primaryKey().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by", { length: 255 }).notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const bannedUsers = pgTable("banned_users", {
  userId: varchar("user_id", { length: 255 }).primaryKey().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  bannedBy: varchar("banned_by", { length: 255 }).notNull(),
  bannedAt: timestamp("banned_at").notNull().defaultNow(),
});

// ============================================
// PUSH NOTIFICATION TABLES
// ============================================

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => lifestyleUsers.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("idx_push_subscriptions_endpoint").on(table.endpoint),
  index("idx_push_subscriptions_user_id").on(table.userId),
]);

// ============================================
// CO-OP GAME SESSION TABLES
// ============================================

export const coopSessions = pgTable("coop_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 10 }).notNull().unique(),
  hostId: varchar("host_id", { length: 255 }).notNull().references(() => lifestyleUsers.id),
  guestId: varchar("guest_id", { length: 255 }).references(() => lifestyleUsers.id),
  invitedUserId: varchar("invited_user_id", { length: 255 }).references(() => lifestyleUsers.id),
  invitedUsername: varchar("invited_username", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("waiting"), // waiting, playing, completed
  mode: varchar("mode", { length: 20 }).notNull().default("daily"), // daily, arcade
  dropId: varchar("drop_id", { length: 255 }).notNull(),
  arcadeGameIndex: integer("arcade_game_index"),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  questionStartTime: integer("question_start_time").notNull().default(0),
  players: jsonb("players").notNull(), // CoopPlayer[]
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  uniqueIndex("idx_coop_sessions_code").on(table.code),
  index("idx_coop_sessions_host_id").on(table.hostId),
  index("idx_coop_sessions_status").on(table.status),
]);

// ============================================
// SURVIVAL MODE TABLES
// ============================================

export const survivalMatches = pgTable("survival_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 6 }).notNull(),
  hostId: varchar("host_id", { length: 255 }).notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("lobby"),
  totalRounds: integer("total_rounds").notNull().default(10),
  playerCount: integer("player_count").notNull().default(0),
  winnerId: varchar("winner_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_survival_matches_status").on(table.status),
  index("idx_survival_matches_code").on(table.code),
]);

export const survivalPlayers = pgTable("survival_players", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  placement: integer("placement"),
  score: integer("score").notNull().default(0),
  roundsSurvived: integer("rounds_survived").notNull().default(0),
  shieldUsed: boolean("shield_used").notNull().default(false),
}, (table) => [
  index("idx_survival_players_match").on(table.matchId),
  index("idx_survival_players_user").on(table.userId),
]);
