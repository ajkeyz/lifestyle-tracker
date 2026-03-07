import { randomBytes } from "crypto";
import { eq, and, or, desc, sql, like, ilike, inArray, aliasedTable } from "drizzle-orm";
import { db } from "./db";
import { appSchema } from "./db";
import type { IStorage } from "./storage";
import type {
  User,
  UserStats,
  DailyDrop,
  UserGameResult,
  LeaderboardEntry,
  SubmitGame,
  SubmitArcadeGame,
  ArcadeGameResult,
  ArcadeStatus,
  League,
  CreateLeague,
  Challenge,
  CreateChallenge,
  StreakDay,
  UserBadge,
  BadgeId,
  CommunityScenario,
  CommunityComment,
  CreateCommunityScenario,
  CreateCommunityComment,
  AdminScenario,
  CreateAdminScenario,
  Moderator,
  BannedUser,
  BanUser,
  CoopSession,
  CoopGameResult,
  CoopPlayer,
  CoopMode,
  Scenario,
  GameHistoryEntry,
  CategoryStats,
} from "@shared/schema";
import { defaultNotificationPrefs, defaultStreakInsurance, BADGE_DEFINITIONS, ARCADE_LIMITS } from "@shared/schema";
import { getDailyScenarios, getArcadeScenarios } from "./static-scenarios";

// ============================================
// TIMEZONE & DATE HANDLING
// ============================================
// ALL date operations use UTC timezone for consistency across global users
// - Daily drops reset at midnight UTC
// - Streaks are calculated based on UTC dates
// - User lastPlayedDate is stored as UTC date string (YYYY-MM-DD)
// ============================================

// Helper functions
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0]; // Returns UTC date (YYYY-MM-DD)
}

function getYesterdayDateString(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return yesterday.toISOString().split("T")[0];
}

function getDayNumber(): number {
  // IMPORTANT: All date calculations use UTC to ensure consistency across timezones
  const start = new Date("2024-01-01T00:00:00Z");
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function generateInviteCode(): string {
  // P1-8: Use cryptographically secure random bytes instead of Math.random()
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

function getWeekStartDate(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const diff = now.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setUTCDate(diff));
  return monday.toISOString().split("T")[0];
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
}

const defaultStats: UserStats = {
  cash: 3000,
  debt: 500,
  credit: 680,
  stress: 50,
  investment: 2000,
};

function createInitialBadges(): UserBadge[] {
  return BADGE_DEFINITIONS.map(def => ({
    badgeId: def.id,
    unlocked: false,
    unlockedAt: null,
    progress: 0,
  }));
}

// Deterministic shuffle based on seed string (scenario ID + date)
function seededShuffle<T>(array: T[], seed: string): T[] {
  const result = [...array];

  // Create a simple seeded random number generator
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Simple LCG-style pseudo-random based on seed
  const seededRandom = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };

  // Fisher-Yates shuffle with seeded random
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Shuffle choices and reassign labels A, B, C, D
function shuffleScenarioChoices(scenario: Scenario, date: string): Scenario {
  const seed = scenario.id + date;
  const shuffledChoices = seededShuffle(scenario.choices, seed);
  const labels = ['A', 'B', 'C', 'D'];

  return {
    ...scenario,
    choices: shuffledChoices.map((choice, index) => ({
      ...choice,
      label: labels[index],
    })),
  };
}

/**
 * PostgreSQL Storage Implementation
 * Replaces in-memory storage with persistent database operations
 */
export class PostgresStorage implements IStorage {
  // ============================================
  // USER OPERATIONS
  // ============================================

  async getUser(sessionId: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(appSchema.lifestyleUsers)
      .where(eq(appSchema.lifestyleUsers.id, sessionId))
      .limit(1);

    if (result.length === 0) return undefined;

    return this.dbUserToAppUser(result[0]);
  }

  async getOrCreateUser(sessionId: string): Promise<User> {
    // Try to get existing user
    let user = await this.getUser(sessionId);

    if (user) {
      return user;
    }

    // Create new user
    const referralCode = generateInviteCode();
    const newUser = {
      id: sessionId,
      username: `Player${Math.floor(Math.random() * 9999)}`,
      avatar: "cat",
      bio: "",
      allowFriendsToFind: true,
      isProfilePrivate: false,
      profileSetupComplete: false,
      onboardingComplete: true, // "Play First" onboarding - skip tutorial, let them play immediately
      mode: null, // null so new users go through mode selection on /setup
      streak: 0,
      highestStreak: 0,
      freezeTokens: 1,
      frozenDates: [],
      streakCalendar: [],
      moneyHealth: 50,
      totalScore: 0,
      gamesPlayed: 0,
      lastPlayedDate: null,
      stats: defaultStats,
      todayResult: null,
      badges: createInitialBadges(),
      perfectGames: 0,
      scamStreak: 0,
      hadPreviousStreak: false,
      lowPressureMode: false,
      soundEnabled: true,
      notificationPrefs: defaultNotificationPrefs,
      streakInsurance: defaultStreakInsurance,
      gameHistory: [],
      categoryStats: [],
      referralCode,
      referredBy: null,
      referralCount: 0,
      friendIds: [],
      membershipTier: "free" as const,
      arcadePlaysToday: 0,
      arcadeLastPlayedDate: null,
      moneyPhilosophy: "",
      whyImHere: "",
      friendVisibility: "trend" as const,
      survivalWins: 0,
      survivalPlayed: 0,
      survivalBestPlacement: null,
      createdAt: new Date(),
    };

    await db.insert(appSchema.lifestyleUsers).values(newUser);

    // Return app-shaped user (with string createdAt for the client)
    return { ...newUser, createdAt: newUser.createdAt.toISOString(), claimedMissions: [] as string[], bonusArcadePlays: 0 };
  }

  async updateUser(sessionId: string, updates: Partial<User>): Promise<User | undefined> {
    // Update timestamp
    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };

    await db
      .update(appSchema.lifestyleUsers)
      .set(updatedData)
      .where(eq(appSchema.lifestyleUsers.id, sessionId));

    return this.getUser(sessionId);
  }

  /**
   * Permanently delete user account and all associated data
   * Required for GDPR/CCPA compliance and Apple App Store requirements
   */
  async deleteUserAccount(userId: string): Promise<boolean> {
    try {
      // First verify user exists
      const user = await this.getUser(userId);
      if (!user) {
        return false;
      }

      // Delete user's data from all tables
      // Order matters due to foreign key constraints

      // 1. Delete from league memberships
      await db.delete(appSchema.leagueMembers).where(eq(appSchema.leagueMembers.userId, userId));

      // 2. Delete from challenges (both as challenger and challengee)
      await db.delete(appSchema.challenges).where(
        or(
          eq(appSchema.challenges.challengerId, userId),
          eq(appSchema.challenges.challengeeId, userId)
        )
      );

      // 3. Remove user from other users' friend lists
      // P0 FIX: Use SQL JSONB operations instead of N+1 query
      // Remove userId from friendIds array for all users who have this user as a friend
      await db.execute(sql`
        UPDATE lifestyle_users
        SET friend_ids = (
          SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
          FROM jsonb_array_elements(friend_ids) AS elem
          WHERE elem::text != to_jsonb(${userId}::text)::text
        )
        WHERE friend_ids @> jsonb_build_array(${userId}::text)
      `);

      // 4. Delete community content
      await db.delete(appSchema.communityScenarios).where(eq(appSchema.communityScenarios.authorId, userId));
      await db.delete(appSchema.communityComments).where(eq(appSchema.communityComments.authorId, userId));

      // 5. Delete community votes
      await db.delete(appSchema.communityVotes).where(eq(appSchema.communityVotes.userId, userId));

      // 6. Delete push subscriptions
      await db.delete(appSchema.pushSubscriptions).where(eq(appSchema.pushSubscriptions.userId, userId));

      // 7. Delete coop sessions where user is host or guest
      await db.delete(appSchema.coopSessions).where(
        or(
          eq(appSchema.coopSessions.hostId, userId),
          eq(appSchema.coopSessions.guestId, userId)
        )
      );

      // 8. Finally, delete the user record itself
      await db.delete(appSchema.lifestyleUsers).where(eq(appSchema.lifestyleUsers.id, userId));

      console.log(`Successfully deleted account for user: ${userId}`);
      return true;
    } catch (error) {
      console.error("Error in deleteUserAccount:", error);
      throw error;
    }
  }

  async checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const lowerUsername = username.toLowerCase();

    const conditions = [sql`LOWER(${appSchema.lifestyleUsers.username}) = ${lowerUsername}`];

    if (excludeUserId) {
      conditions.push(sql`${appSchema.lifestyleUsers.id} != ${excludeUserId}`);
    }

    const result = await db
      .select({ id: appSchema.lifestyleUsers.id })
      .from(appSchema.lifestyleUsers)
      .where(and(...conditions))
      .limit(1);

    return result.length === 0;
  }

  async searchUserByUsername(
    username: string,
    excludeUserId?: string
  ): Promise<{ found: boolean; username: string | null; userId: string | null }> {
    const lowerUsername = username.toLowerCase();

    let query = db
      .select({
        id: appSchema.lifestyleUsers.id,
        username: appSchema.lifestyleUsers.username,
      })
      .from(appSchema.lifestyleUsers)
      .where(
        and(
          eq(appSchema.lifestyleUsers.allowFriendsToFind, true),
          sql`LOWER(${appSchema.lifestyleUsers.username}) LIKE ${`%${lowerUsername}%`}`
        )
      );

    if (excludeUserId) {
      query = query.where(sql`${appSchema.lifestyleUsers.id} != ${excludeUserId}`);
    }

    const results = await query.limit(1);

    if (results.length === 0) {
      return { found: false, username: null, userId: null };
    }

    return {
      found: true,
      username: results[0].username,
      userId: results[0].id,
    };
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(appSchema.lifestyleUsers)
      .where(eq(appSchema.lifestyleUsers.referralCode, code))
      .limit(1);

    if (result.length === 0) return undefined;
    return this.dbUserToAppUser(result[0]);
  }

  async applyReferralBonus(referrerId: string, referredUserId: string): Promise<boolean> {
    const referrer = await this.getUser(referrerId);
    const referred = await this.getUser(referredUserId);

    if (!referrer || !referred) return false;
    if (referred.referredBy) return false; // Already referred

    // Give both users a freeze token
    await db
      .update(appSchema.lifestyleUsers)
      .set({
        freezeTokens: sql`${appSchema.lifestyleUsers.freezeTokens} + 1`,
        referralCount: sql`${appSchema.lifestyleUsers.referralCount} + 1`,
      })
      .where(eq(appSchema.lifestyleUsers.id, referrerId));

    await db
      .update(appSchema.lifestyleUsers)
      .set({
        referredBy: referrerId,
        freezeTokens: sql`${appSchema.lifestyleUsers.freezeTokens} + 1`,
      })
      .where(eq(appSchema.lifestyleUsers.id, referredUserId));

    return true;
  }

  async getFriends(userId: string): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const friendIds = user.friendIds || [];

    if (friendIds.length === 0) {
      // Return suggested friends (users who allow friend discovery)
      const suggested = await db
        .select()
        .from(appSchema.lifestyleUsers)
        .where(
          and(
            eq(appSchema.lifestyleUsers.allowFriendsToFind, true),
            eq(appSchema.lifestyleUsers.profileSetupComplete, true),
            sql`${appSchema.lifestyleUsers.id} != ${userId}`
          )
        )
        .limit(10);

      return suggested.map(u => this.dbUserToAppUser(u));
    }

    // P0 FIX: Fetch all friends in a single query instead of N sequential queries
    const friendRecords = await db
      .select()
      .from(appSchema.lifestyleUsers)
      .where(inArray(appSchema.lifestyleUsers.id, friendIds));

    return friendRecords.map(u => this.dbUserToAppUser(u));
  }

  async addFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    if (userId === friendId) {
      return { success: false, message: "Cannot add yourself as a friend" };
    }

    const user = await this.getUser(userId);
    const friend = await this.getUser(friendId);

    if (!user) return { success: false, message: "User not found" };
    if (!friend) return { success: false, message: "Friend not found" };

    const friendIds = user.friendIds || [];
    if (friendIds.includes(friendId)) {
      return { success: false, message: "Already friends" };
    }

    // P1-9: Wrap both user updates in a single transaction
    await db.transaction(async (tx) => {
      // Add to both users' friend lists
      await tx
        .update(appSchema.lifestyleUsers)
        .set({
          friendIds: [...friendIds, friendId],
        })
        .where(eq(appSchema.lifestyleUsers.id, userId));

      const friendFriendIds = friend.friendIds || [];
      if (!friendFriendIds.includes(userId)) {
        await tx
          .update(appSchema.lifestyleUsers)
          .set({
            friendIds: [...friendFriendIds, userId],
          })
          .where(eq(appSchema.lifestyleUsers.id, friendId));
      }
    });

    return { success: true, message: "Friend added successfully" };
  }

  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.getUser(userId);
    const friend = await this.getUser(friendId);

    if (!user) return { success: false, message: "User not found" };
    if (!friend) return { success: false, message: "Friend not found" };

    const userFriendIds = user.friendIds || [];
    if (!userFriendIds.includes(friendId)) {
      return { success: false, message: "Not friends" };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(appSchema.lifestyleUsers)
        .set({ friendIds: userFriendIds.filter(id => id !== friendId) })
        .where(eq(appSchema.lifestyleUsers.id, userId));

      const friendFriendIds = (friend.friendIds || []).filter(id => id !== userId);
      await tx
        .update(appSchema.lifestyleUsers)
        .set({ friendIds: friendFriendIds })
        .where(eq(appSchema.lifestyleUsers.id, friendId));
    });

    return { success: true, message: "Friend removed successfully" };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Convert database user record to application User type
   */
  private computeRealStreak(dbUser: any): number {
    const storedStreak = dbUser.streak ?? 0;
    if (storedStreak === 0) return 0;
    const lastPlayed = dbUser.lastPlayedDate;
    if (!lastPlayed) return 0;
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    if (lastPlayed === today || lastPlayed === yesterday) return storedStreak;
    const frozenDates: string[] = dbUser.frozenDates || [];
    if (frozenDates.includes(yesterday)) return storedStreak;
    return 0;
  }

  private dbUserToAppUser(dbUser: any): User {
    const membershipTier = dbUser.membershipTier || "free";

    const streakInsurance = dbUser.streakInsurance || defaultStreakInsurance;
    const isPlus = membershipTier === "plus" || membershipTier === "pro";

    const realStreak = this.computeRealStreak(dbUser);

    return {
      id: dbUser.id,
      username: dbUser.username,
      avatar: dbUser.avatar,
      bio: dbUser.bio || "",
      allowFriendsToFind: dbUser.allowFriendsToFind ?? true,
      isProfilePrivate: dbUser.isProfilePrivate ?? false,
      profileSetupComplete: dbUser.profileSetupComplete ?? false,
      onboardingComplete: dbUser.onboardingComplete ?? false,
      mode: dbUser.mode ?? null,
      streak: realStreak,
      highestStreak: dbUser.highestStreak ?? 0,
      freezeTokens: dbUser.freezeTokens ?? 1,
      frozenDates: dbUser.frozenDates || [],
      streakCalendar: dbUser.streakCalendar || [],
      moneyHealth: dbUser.moneyHealth ?? 50,
      totalScore: dbUser.totalScore ?? 0,
      gamesPlayed: dbUser.gamesPlayed ?? 0,
      lastPlayedDate: dbUser.lastPlayedDate,
      stats: dbUser.stats || defaultStats,
      todayResult: dbUser.lastPlayedDate === getTodayDateString() ? dbUser.todayResult : null,
      badges: dbUser.badges || createInitialBadges(),
      perfectGames: dbUser.perfectGames ?? 0,
      scamStreak: dbUser.scamStreak ?? 0,
      hadPreviousStreak: dbUser.hadPreviousStreak ?? false,
      lowPressureMode: dbUser.lowPressureMode ?? false,
      soundEnabled: dbUser.soundEnabled ?? true,
      notificationPrefs: dbUser.notificationPrefs || defaultNotificationPrefs,
      streakInsurance: {
        ...streakInsurance,
        isPlus, // Sync with membershipTier
      },
      gameHistory: dbUser.gameHistory || [],
      categoryStats: dbUser.categoryStats || [],
      referralCode: dbUser.referralCode,
      referredBy: dbUser.referredBy,
      referralCount: dbUser.referralCount,
      friendIds: dbUser.friendIds || [],
      membershipTier,
      arcadePlaysToday: dbUser.arcadePlaysToday || 0,
      arcadeLastPlayedDate: dbUser.arcadeLastPlayedDate || null,
      moneyPhilosophy: dbUser.moneyPhilosophy || "",
      whyImHere: dbUser.whyImHere || "",
      friendVisibility: dbUser.friendVisibility || "trend",
      survivalWins: dbUser.survivalWins ?? 0,
      survivalPlayed: dbUser.survivalPlayed ?? 0,
      survivalBestPlacement: dbUser.survivalBestPlacement ?? null,
      createdAt: dbUser.createdAt instanceof Date
        ? dbUser.createdAt.toISOString()
        : (dbUser.createdAt ?? new Date().toISOString()),
      claimedMissions: dbUser.claimedMissions || [],
      bonusArcadePlays: dbUser.bonusArcadePlays ?? 0,
    };
  }

  // ============================================
  // GAME OPERATIONS
  // ============================================

  async getDailyDrop(): Promise<DailyDrop> {
    const today = getTodayDateString();
    const dropNumber = getDayNumber();

    // Check if drop exists in database for today
    const existingDrop = await db
      .select()
      .from(appSchema.dailyDrops)
      .where(eq(appSchema.dailyDrops.date, today))
      .limit(1);

    if (existingDrop.length > 0) {
      return existingDrop[0] as DailyDrop;
    }

    // Generate new drop for today
    const todayScenarios = getDailyScenarios(dropNumber);
    let shuffledScenarios = todayScenarios.map(scenario =>
      shuffleScenarioChoices(scenario, today)
    );

    // Mystery Scenario Friday: Add 6th bonus question on Fridays (UTC timezone)
    const dayOfWeek = new Date(today + 'T00:00:00Z').getUTCDay();
    const isFriday = dayOfWeek === 5;
    if (isFriday) {
      // Get a random "mystery" scenario from a different day
      const mysteryDayIndex = Math.floor(Math.random() * 30);
      const mysteryScenarios = getDailyScenarios(mysteryDayIndex + 1);
      if (!mysteryScenarios || mysteryScenarios.length === 0) {
        console.warn("No mystery scenarios available for Friday bonus");
      }
      const mysteryScenario = mysteryScenarios?.[Math.floor(Math.random() * mysteryScenarios.length)];

      if (mysteryScenario) {
        const enhancedMystery = {
          ...mysteryScenario,
          id: crypto.randomUUID(),
        };
        shuffledScenarios.push(shuffleScenarioChoices(enhancedMystery, today));
      }
    }

    const newDrop: DailyDrop = {
      id: crypto.randomUUID(),
      dropNumber,
      date: today,
      scenarios: shuffledScenarios,
    };

    // Store in database
    await db.insert(appSchema.dailyDrops).values({
      id: newDrop.id,
      dropNumber,
      date: today,
      scenarios: shuffledScenarios as any,
    });

    console.log(`Created new daily drop for day ${dropNumber} (${today})`);

    // NOTE: todayResult is validated in submitGame() by checking user.lastPlayedDate !== today
    // We don't reset all users here to avoid race conditions at midnight
    // Instead, results naturally become stale when date changes

    return newDrop;
  }

  async submitGame(sessionId: string, submission: SubmitGame, prefetchedDrop?: DailyDrop, prefetchedUser?: User): Promise<UserGameResult> {
    const drop = prefetchedDrop || await this.getDailyDrop();
    const user = prefetchedUser || await this.getOrCreateUser(sessionId);

    // Idempotency check (allow replays where todayResult was cleared)
    const today = getTodayDateString();
    const isReplay = user.lastPlayedDate === today && !user.todayResult;
    if (user.lastPlayedDate === today && user.todayResult) {
      throw new Error("Already played today");
    }

    // SECURITY: Validate dropId matches today's drop
    if (submission.dropId !== drop.id) {
      throw new Error("Invalid drop ID - answers must be for today's quiz");
    }

    // ── Pure CPU computation (no DB calls) ──────────────────────────

    let totalScore = 0;
    let correctCount = 0;
    const answerLabels: string[] = [];
    const categoryResults: Map<string, { correct: number; total: number }> = new Map();

    submission.answers.forEach((answer) => {
      const scenario = drop.scenarios.find((s) => s.id === answer.scenarioId);
      if (scenario) {
        const choice = scenario.choices.find((c) => c.label === answer.choiceLabel);
        const isCorrect = choice?.isCorrect || false;

        if (choice) {
          if (isCorrect) {
            correctCount++;
            totalScore += Math.max(0, choice.points);
          }
        }
        answerLabels.push(answer.choiceLabel);

        const catStats = categoryResults.get(scenario.category) || { correct: 0, total: 0 };
        catStats.total++;
        if (isCorrect) catStats.correct++;
        categoryResults.set(scenario.category, catStats);
      }
    });

    totalScore = Math.max(0, totalScore);
    const accuracy = correctCount / drop.scenarios.length;
    const iq = totalScore;
    const moneyHealth = Math.max(0, Math.min(100, Math.round(accuracy * 100)));

    const newStats: UserStats = {
      cash: Math.max(0, user.stats.cash + totalScore * 2),
      debt: Math.max(0, user.stats.debt - correctCount * 50),
      credit: Math.min(850, Math.max(300, user.stats.credit + correctCount * 5)),
      stress: Math.max(0, Math.min(100, user.stats.stress - correctCount * 5)),
      investment: Math.max(0, user.stats.investment + correctCount * 200),
    };

    const result: UserGameResult = {
      answers: answerLabels,
      score: totalScore,
      moneyHealth,
      iq,
      stats: newStats,
    };

    // On replay, preserve existing streak and gamesPlayed
    let newStreak: number;
    if (isReplay) {
      newStreak = user.streak;
    } else {
      const yesterday = getYesterdayDateString();
      const wasFrozenYesterday = user.frozenDates.includes(yesterday);
      const playedYesterday = user.lastPlayedDate === yesterday;

      if (playedYesterday || wasFrozenYesterday) {
        newStreak = user.streak + 1;
      } else {
        newStreak = 1;
      }
    }

    const newHighestStreak = Math.max(user.highestStreak, newStreak);

    const newStreakCalendar = [...user.streakCalendar];
    const todayIndex = newStreakCalendar.findIndex(d => d.date === today);
    if (todayIndex >= 0) {
      newStreakCalendar[todayIndex] = { date: today, played: true, frozen: false, score: totalScore };
    } else {
      newStreakCalendar.push({ date: today, played: true, frozen: false, score: totalScore });
    }

    const categoryBreakdown = Array.from(categoryResults.entries()).map(([category, stats]) => ({
      category,
      correct: stats.correct,
      total: stats.total,
    }));

    const historyEntry: GameHistoryEntry = {
      date: today,
      dropNumber: drop.dropNumber,
      score: totalScore,
      moneyHealth,
      correctAnswers: correctCount,
      totalQuestions: drop.scenarios.length,
      categoryBreakdown,
      timeSpent: 0,
    };

    const existingHistory = Array.isArray(user.gameHistory) ? user.gameHistory : [];
    // On replay, replace today's entry instead of adding a duplicate
    const filteredHistory = isReplay
      ? existingHistory.filter(h => h.date !== today)
      : existingHistory;
    const newGameHistory = [...filteredHistory, historyEntry].slice(-30);

    const newCategoryStats = [...(Array.isArray(user.categoryStats) ? user.categoryStats : [])];
    categoryBreakdown.forEach(({ category, correct, total }) => {
      const existingIndex = newCategoryStats.findIndex(c => c.category === category);
      if (existingIndex >= 0) {
        const existing = newCategoryStats[existingIndex];
        const newTotal = existing.totalQuestions + total;
        const newCorrect = existing.correctAnswers + correct;
        newCategoryStats[existingIndex] = {
          category,
          totalQuestions: newTotal,
          correctAnswers: newCorrect,
          accuracy: newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
        };
      } else {
        newCategoryStats.push({
          category,
          totalQuestions: total,
          correctAnswers: correct,
          accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        });
      }
    });

    // Compute badge updates inline (pure CPU, no DB)
    const badges = [...user.badges];

    const spendingCategories = ["budgeting", "saving", "debt", "lifestyle", "credit"];
    const spendingCorrect = (newCategoryStats || [])
      .filter(c => spendingCategories.includes(c.category))
      .reduce((sum, c) => sum + c.correctAnswers, 0);
    this.applyBadgeProgress(badges, "no_spend_ninja", spendingCorrect);
    this.applyBadgeProgress(badges, "credit_climber", moneyHealth);
    this.applyBadgeProgress(badges, "emergency_fund_builder", user.gamesPlayed + 1);

    const scamResults = categoryResults.get("scam");
    let newScamStreak = user.scamStreak;
    if (scamResults) {
      if (scamResults.correct === scamResults.total && scamResults.total > 0) {
        newScamStreak += scamResults.correct;
      } else {
        newScamStreak = 0;
      }
    }
    this.applyBadgeProgress(badges, "scam_spotter", newScamStreak);

    const isPerfect = correctCount === drop.scenarios.length && drop.scenarios.length > 0;
    const newPerfectGames = isPerfect ? user.perfectGames + 1 : user.perfectGames;
    this.applyBadgeProgress(badges, "budget_sniper", newPerfectGames);
    this.applyBadgeProgress(badges, "streak_monster", newStreak);

    if (user.hadPreviousStreak) {
      this.applyBadgeProgress(badges, "comeback_king", newStreak);
    }

    // ── PERF: Fire-and-forget DB write ──────────────────────────────
    // The client doesn't need to wait for the DB write to see their results.
    // The route-level idempotency cache prevents double-processing.
    // This turns a 1-5s blocking write into ~0ms from the client's perspective.
    db.update(appSchema.lifestyleUsers)
      .set({
        streak: newStreak,
        highestStreak: newHighestStreak,
        streakCalendar: newStreakCalendar,
        moneyHealth,
        totalScore: isReplay ? user.totalScore : user.totalScore + totalScore,
        gamesPlayed: isReplay ? user.gamesPlayed : user.gamesPlayed + 1,
        lastPlayedDate: today,
        stats: newStats,
        todayResult: result,
        gameHistory: newGameHistory,
        categoryStats: newCategoryStats,
        badges,
        scamStreak: newScamStreak,
        perfectGames: newPerfectGames,
        updatedAt: new Date(),
      })
      .where(eq(appSchema.lifestyleUsers.id, sessionId))
      .then(async () => {
        console.log(`[submit-game] Saved results for ${sessionId} (score: ${totalScore})`);
        try {
          await db.update(appSchema.leagueMembers)
            .set({ weeklyScore: sql`${appSchema.leagueMembers.weeklyScore} + ${totalScore}` })
            .where(eq(appSchema.leagueMembers.userId, sessionId));
        } catch (leagueErr) {
          console.error(`[submit-game] Failed to update league scores for ${sessionId}:`, leagueErr);
        }
      })
      .catch((err) => {
        console.error(`[submit-game] FAILED to save results for ${sessionId}:`, err);
      });

    return result;
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const users = await db
      .select({
        id: appSchema.lifestyleUsers.id,
        username: appSchema.lifestyleUsers.username,
        moneyHealth: appSchema.lifestyleUsers.moneyHealth,
        streak: appSchema.lifestyleUsers.streak,
        lastPlayedDate: appSchema.lifestyleUsers.lastPlayedDate,
        frozenDates: appSchema.lifestyleUsers.frozenDates,
      })
      .from(appSchema.lifestyleUsers)
      .orderBy(desc(appSchema.lifestyleUsers.moneyHealth))
      .limit(limit);

    return users.map((user, index) => ({
      id: user.id,
      username: user.username,
      moneyHealth: user.moneyHealth,
      streak: this.computeRealStreak(user),
      rank: index + 1,
    }));
  }

  // ============================================
  // LEAGUE OPERATIONS
  // ============================================

  async createLeague(userId: string, data: CreateLeague): Promise<League> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const leagueId = crypto.randomUUID();
    const inviteCode = generateInviteCode();
    const weekStartDate = getWeekStartDate();

    // Create league
    await db.insert(appSchema.leagues).values({
      id: leagueId,
      name: data.name,
      emoji: data.emoji,
      privacy: data.privacy,
      inviteCode,
      createdBy: userId,
      weekStartDate,
      previousWeekWinner: null,
    });

    // Add creator as first member
    await db.insert(appSchema.leagueMembers).values({
      leagueId,
      userId: user.id,
      weeklyScore: user.todayResult?.score || 0,
      weeklyRank: 1,
      isWeeklyWinner: false,
    });

    // Return the created league
    return this.getLeague(leagueId) as Promise<League>;
  }

  async getLeague(leagueId: string): Promise<League | undefined> {
    const leagueResult = await db
      .select()
      .from(appSchema.leagues)
      .where(eq(appSchema.leagues.id, leagueId))
      .limit(1);

    if (leagueResult.length === 0) return undefined;

    const league = leagueResult[0];

    const currentWeekStart = getWeekStartDate();
    if (league.weekStartDate && league.weekStartDate !== currentWeekStart) {
      const previousMembers = await db
        .select({ userId: appSchema.leagueMembers.userId, weeklyScore: appSchema.leagueMembers.weeklyScore })
        .from(appSchema.leagueMembers)
        .where(eq(appSchema.leagueMembers.leagueId, leagueId));
      const topMember = previousMembers.sort((a, b) => b.weeklyScore - a.weeklyScore)[0];
      const winnerId = topMember && topMember.weeklyScore > 0 ? topMember.userId : null;

      await db.update(appSchema.leagues)
        .set({ weekStartDate: currentWeekStart, previousWeekWinner: winnerId })
        .where(eq(appSchema.leagues.id, leagueId));
      await db.update(appSchema.leagueMembers)
        .set({ weeklyScore: 0, isWeeklyWinner: false })
        .where(eq(appSchema.leagueMembers.leagueId, leagueId));
      league.weekStartDate = currentWeekStart;
      league.previousWeekWinner = winnerId;
    }

    const membersResult = await db
      .select({
        id: appSchema.leagueMembers.id,
        userId: appSchema.leagueMembers.userId,
        username: appSchema.lifestyleUsers.username,
        avatar: appSchema.lifestyleUsers.avatar,
        weeklyScore: appSchema.leagueMembers.weeklyScore,
        weeklyRank: appSchema.leagueMembers.weeklyRank,
        isWeeklyWinner: appSchema.leagueMembers.isWeeklyWinner,
      })
      .from(appSchema.leagueMembers)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.leagueMembers.userId, appSchema.lifestyleUsers.id)
      )
      .where(eq(appSchema.leagueMembers.leagueId, leagueId));

    // Sort by weekly score and update ranks
    const sortedMembers = membersResult
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
      .map((m, index) => ({
        userId: m.userId,
        username: m.username,
        avatar: m.avatar,
        weeklyScore: m.weeklyScore,
        weeklyRank: index + 1,
        isWeeklyWinner: index === 0 && m.weeklyScore > 0,
      }));

    return {
      id: league.id,
      name: league.name,
      emoji: league.emoji,
      privacy: league.privacy,
      inviteCode: league.inviteCode,
      createdBy: league.createdBy,
      createdAt: league.createdAt.toISOString(),
      members: sortedMembers,
      weekStartDate: league.weekStartDate,
      previousWeekWinner: league.previousWeekWinner,
    };
  }

  async getLeagueByCode(inviteCode: string): Promise<League | undefined> {
    const upperCode = inviteCode.toUpperCase();

    const leagueResult = await db
      .select()
      .from(appSchema.leagues)
      .where(eq(appSchema.leagues.inviteCode, upperCode))
      .limit(1);

    if (leagueResult.length === 0) return undefined;

    return this.getLeague(leagueResult[0].id);
  }

  async joinLeague(userId: string, inviteCode: string): Promise<League | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const league = await this.getLeagueByCode(inviteCode);
    if (!league) return undefined;

    // Check if already a member
    const existingMember = await db
      .select()
      .from(appSchema.leagueMembers)
      .where(
        and(
          eq(appSchema.leagueMembers.leagueId, league.id),
          eq(appSchema.leagueMembers.userId, userId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return league; // Already a member
    }

    // Add as new member
    await db.insert(appSchema.leagueMembers).values({
      leagueId: league.id,
      userId: user.id,
      weeklyScore: user.todayResult?.score || 0,
      weeklyRank: league.members.length + 1,
      isWeeklyWinner: false,
    });

    return this.getLeague(league.id);
  }

  async leaveLeague(userId: string, leagueId: string): Promise<boolean> {
    // Remove user from league
    const deleted = await db
      .delete(appSchema.leagueMembers)
      .where(
        and(
          eq(appSchema.leagueMembers.leagueId, leagueId),
          eq(appSchema.leagueMembers.userId, userId)
        )
      );

    // Check if league is now empty
    const remainingMembers = await db
      .select()
      .from(appSchema.leagueMembers)
      .where(eq(appSchema.leagueMembers.leagueId, leagueId));

    // Delete league if no members left
    if (remainingMembers.length === 0) {
      await db
        .delete(appSchema.leagues)
        .where(eq(appSchema.leagues.id, leagueId));
    }

    return true;
  }

  async getUserLeagues(userId: string): Promise<League[]> {
    // Get all league IDs where user is a member (single query)
    const membershipResults = await db
      .select({ leagueId: appSchema.leagueMembers.leagueId })
      .from(appSchema.leagueMembers)
      .where(eq(appSchema.leagueMembers.userId, userId));

    if (membershipResults.length === 0) return [];

    // Batch-fetch all leagues in parallel instead of sequential N+1
    const userLeagues = await Promise.all(
      membershipResults.map((m) => this.getLeague(m.leagueId))
    );

    return userLeagues.filter((l): l is League => l !== undefined);
  }

  // ============================================
  // CHALLENGE OPERATIONS
  // ============================================

  async createChallenge(challengerId: string, data: CreateChallenge): Promise<Challenge> {
    const challenger = await this.getUser(challengerId);
    if (!challenger) throw new Error("Challenger not found");

    const challengee = await this.getUser(data.challengeeId);
    if (!challengee) throw new Error("Challengee not found");

    let challengerValue = 0;
    if (data.type === "money_health") {
      challengerValue = challenger.moneyHealth;
    } else if (data.type === "streak") {
      challengerValue = challenger.streak;
    } else if (data.type === "accuracy") {
      challengerValue = challenger.todayResult
        ? Math.round((challenger.todayResult.score / 500) * 100)
        : 0;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const challengeId = crypto.randomUUID();

    await db.insert(appSchema.challenges).values({
      id: challengeId,
      challengerId,
      challengeeId: data.challengeeId,
      type: data.type,
      trashTalk: data.trashTalk,
      customMessage: data.customMessage || null,
      status: "pending",
      challengerValue,
      challengeeValue: null,
      winnerId: null,
      expiresAt,
      completedAt: null,
      badgeAwarded: null,
    });

    return this.getChallenge(challengeId) as Promise<Challenge>;
  }

  async getChallenge(challengeId: string): Promise<Challenge | undefined> {
    const challengeResult = await db
      .select({
        id: appSchema.challenges.id,
        challengerId: appSchema.challenges.challengerId,
        challengerUsername: appSchema.lifestyleUsers.username,
        challengerAvatar: appSchema.lifestyleUsers.avatar,
        challengeeId: appSchema.challenges.challengeeId,
        type: appSchema.challenges.type,
        trashTalk: appSchema.challenges.trashTalk,
        customMessage: appSchema.challenges.customMessage,
        status: appSchema.challenges.status,
        challengerValue: appSchema.challenges.challengerValue,
        challengeeValue: appSchema.challenges.challengeeValue,
        winnerId: appSchema.challenges.winnerId,
        createdAt: appSchema.challenges.createdAt,
        expiresAt: appSchema.challenges.expiresAt,
        completedAt: appSchema.challenges.completedAt,
        badgeAwarded: appSchema.challenges.badgeAwarded,
      })
      .from(appSchema.challenges)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.challenges.challengerId, appSchema.lifestyleUsers.id)
      )
      .where(eq(appSchema.challenges.id, challengeId))
      .limit(1);

    if (challengeResult.length === 0) return undefined;

    const challenge = challengeResult[0];

    // Get challengee info
    const challengee = await this.getUser(challenge.challengeeId);
    if (!challengee) return undefined;

    return {
      id: challenge.id,
      challengerId: challenge.challengerId,
      challengerUsername: challenge.challengerUsername,
      challengerAvatar: challenge.challengerAvatar,
      challengeeId: challenge.challengeeId,
      challengeeUsername: challengee.username,
      challengeeAvatar: challengee.avatar,
      type: challenge.type as any,
      trashTalk: challenge.trashTalk,
      customMessage: challenge.customMessage,
      status: challenge.status as any,
      challengerValue: challenge.challengerValue,
      challengeeValue: challenge.challengeeValue,
      winnerId: challenge.winnerId,
      createdAt: challenge.createdAt.toISOString(),
      expiresAt: challenge.expiresAt.toISOString(),
      completedAt: challenge.completedAt?.toISOString() || null,
      badgeAwarded: challenge.badgeAwarded,
    };
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    // Single query with JOINs for both challenger and challengee usernames/avatars
    const challenger = aliasedTable(appSchema.lifestyleUsers, "challenger");
    const challengee = aliasedTable(appSchema.lifestyleUsers, "challengee");

    const challengeResults = await db
      .select({
        id: appSchema.challenges.id,
        challengerId: appSchema.challenges.challengerId,
        challengerUsername: challenger.username,
        challengerAvatar: challenger.avatar,
        challengeeId: appSchema.challenges.challengeeId,
        challengeeUsername: challengee.username,
        challengeeAvatar: challengee.avatar,
        type: appSchema.challenges.type,
        trashTalk: appSchema.challenges.trashTalk,
        customMessage: appSchema.challenges.customMessage,
        status: appSchema.challenges.status,
        challengerValue: appSchema.challenges.challengerValue,
        challengeeValue: appSchema.challenges.challengeeValue,
        winnerId: appSchema.challenges.winnerId,
        createdAt: appSchema.challenges.createdAt,
        expiresAt: appSchema.challenges.expiresAt,
        completedAt: appSchema.challenges.completedAt,
        badgeAwarded: appSchema.challenges.badgeAwarded,
      })
      .from(appSchema.challenges)
      .innerJoin(challenger, eq(appSchema.challenges.challengerId, challenger.id))
      .innerJoin(challengee, eq(appSchema.challenges.challengeeId, challengee.id))
      .where(
        or(
          eq(appSchema.challenges.challengerId, userId),
          eq(appSchema.challenges.challengeeId, userId)
        )
      )
      .orderBy(desc(appSchema.challenges.createdAt));

    return challengeResults.map((c) => ({
      id: c.id,
      challengerId: c.challengerId,
      challengerUsername: c.challengerUsername,
      challengerAvatar: c.challengerAvatar,
      challengeeId: c.challengeeId,
      challengeeUsername: c.challengeeUsername,
      challengeeAvatar: c.challengeeAvatar,
      type: c.type as any,
      trashTalk: c.trashTalk,
      customMessage: c.customMessage,
      status: c.status as any,
      challengerValue: c.challengerValue,
      challengeeValue: c.challengeeValue,
      winnerId: c.winnerId,
      createdAt: c.createdAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
      completedAt: c.completedAt?.toISOString() || null,
      badgeAwarded: c.badgeAwarded,
    }));
  }

  async respondToChallenge(
    challengeId: string,
    userId: string,
    accept: boolean
  ): Promise<Challenge | undefined> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) return undefined;
    if (challenge.challengeeId !== userId) return undefined;
    if (challenge.status !== "pending") return undefined;

    if (!accept) {
      await db
        .update(appSchema.challenges)
        .set({ status: "declined" })
        .where(eq(appSchema.challenges.id, challengeId));

      return this.getChallenge(challengeId);
    }

    const challengee = await this.getUser(userId);
    if (!challengee) return undefined;

    let challengeeValue = 0;
    if (challenge.type === "money_health") {
      challengeeValue = challengee.moneyHealth;
    } else if (challenge.type === "streak") {
      challengeeValue = challengee.streak;
    } else if (challenge.type === "accuracy") {
      challengeeValue = challengee.todayResult
        ? Math.round((challengee.todayResult.score / 500) * 100)
        : 0;
    }

    let winnerId: string | null = null;
    let badgeAwarded: string | null = null;

    if (challengeeValue > challenge.challengerValue) {
      winnerId = challenge.challengeeId;
      if (challenge.type === "money_health") badgeAwarded = "money_master";
      else if (challenge.type === "streak") badgeAwarded = "streak_keeper";
      else if (challenge.type === "accuracy") badgeAwarded = "sharp_shooter";
    } else if (challenge.challengerValue > challengeeValue) {
      winnerId = challenge.challengerId;
      if (challenge.type === "money_health") badgeAwarded = "money_master";
      else if (challenge.type === "streak") badgeAwarded = "streak_keeper";
      else if (challenge.type === "accuracy") badgeAwarded = "sharp_shooter";
    }

    await db
      .update(appSchema.challenges)
      .set({
        status: "completed",
        challengeeValue,
        winnerId,
        badgeAwarded,
        completedAt: new Date(),
      })
      .where(eq(appSchema.challenges.id, challengeId));

    return this.getChallenge(challengeId);
  }

  // ============================================
  // STREAK OPERATIONS
  // ============================================

  async useStreakFreeze(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, message: "User not found" };

    if (user.freezeTokens <= 0) {
      return { success: false, message: "No freeze tokens available" };
    }

    const today = getTodayDateString();
    if (user.frozenDates.includes(today)) {
      return { success: false, message: "Today is already frozen" };
    }

    if (user.lastPlayedDate === today) {
      return { success: false, message: "You've already played today" };
    }

    const newStreakCalendar = [...user.streakCalendar];
    const todayIndex = newStreakCalendar.findIndex(d => d.date === today);
    if (todayIndex >= 0) {
      newStreakCalendar[todayIndex] = { ...newStreakCalendar[todayIndex], frozen: true };
    } else {
      newStreakCalendar.push({ date: today, played: false, frozen: true });
    }

    await this.updateUser(userId, {
      freezeTokens: user.freezeTokens - 1,
      frozenDates: [...user.frozenDates, today],
      streakCalendar: newStreakCalendar,
    });

    return { success: true, message: "Streak frozen for today" };
  }

  async addFreezeToken(userId: string, count: number = 1): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    await db
      .update(appSchema.lifestyleUsers)
      .set({ freezeTokens: user.freezeTokens + count })
      .where(eq(appSchema.lifestyleUsers.id, userId));

    return this.getUser(userId);
  }

  async getStreakCalendar(userId: string, days: number = 30): Promise<StreakDay[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    return user.streakCalendar.slice(-days);
  }

  // ============================================
  // BADGE OPERATIONS
  // ============================================

  async getBadges(userId: string): Promise<UserBadge[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    // P1-8: Removed expensive recomputation that fired on every call when badges were zero.
    // Badge progress is now computed in computeAndUpdateAllBadges() during submitGame(),
    // so this getter should just return the stored badges without triggering recomputation.

    return user.badges;
  }

  private async recomputeBadgeProgress(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const spendingCategories = ["budgeting", "saving", "debt", "lifestyle", "credit"];
    const spendingCorrect = (user.categoryStats || [])
      .filter(c => spendingCategories.includes(c.category))
      .reduce((sum, c) => sum + c.correctAnswers, 0);
    await this.updateBadgeProgress(userId, "no_spend_ninja", spendingCorrect);
    await this.updateBadgeProgress(userId, "credit_climber", user.moneyHealth);
    await this.updateBadgeProgress(userId, "emergency_fund_builder", user.gamesPlayed);
    await this.updateBadgeProgress(userId, "scam_spotter", user.scamStreak);
    await this.updateBadgeProgress(userId, "budget_sniper", user.perfectGames);
    await this.updateBadgeProgress(userId, "streak_monster", user.streak);
    if (user.hadPreviousStreak) {
      await this.updateBadgeProgress(userId, "comeback_king", user.streak);
    }
  }

  // P1-4: In-memory badge progress helper — mutates the badges array without DB calls
  private applyBadgeProgress(badges: UserBadge[], badgeId: BadgeId, progress: number): void {
    const badgeIndex = badges.findIndex(b => b.badgeId === badgeId);
    if (badgeIndex === -1) return;

    const badge = badges[badgeIndex];
    const badgeDef = BADGE_DEFINITIONS.find(d => d.id === badgeId);
    if (!badgeDef) return;

    const shouldUnlock = !badge.unlocked && progress >= badgeDef.maxProgress;
    badges[badgeIndex] = {
      ...badge,
      progress,
      unlocked: shouldUnlock || badge.unlocked,
      unlockedAt: shouldUnlock ? new Date().toISOString() : badge.unlockedAt,
    };
  }

  // P1-4: Compute all badge changes in memory, then persist with a single updateUser call
  private async computeAndUpdateAllBadges(
    userId: string,
    gameData: {
      correctCount: number;
      totalQuestions: number;
      categoryResults: Map<string, { correct: number; total: number }>;
    }
  ): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const badges = [...user.badges];

    const spendingCategories = ["budgeting", "saving", "debt", "lifestyle", "credit"];
    const spendingCorrect = (user.categoryStats || [])
      .filter(c => spendingCategories.includes(c.category))
      .reduce((sum, c) => sum + c.correctAnswers, 0);
    this.applyBadgeProgress(badges, "no_spend_ninja", spendingCorrect);

    this.applyBadgeProgress(badges, "credit_climber", user.moneyHealth);

    this.applyBadgeProgress(badges, "emergency_fund_builder", user.gamesPlayed);

    const scamResults = gameData.categoryResults.get("scam");
    let newScamStreak = user.scamStreak;
    if (scamResults) {
      if (scamResults.correct === scamResults.total && scamResults.total > 0) {
        newScamStreak += scamResults.correct;
      } else {
        newScamStreak = 0;
      }
    }
    this.applyBadgeProgress(badges, "scam_spotter", newScamStreak);

    const isPerfect = gameData.correctCount === gameData.totalQuestions && gameData.totalQuestions > 0;
    const newPerfectGames = isPerfect ? user.perfectGames + 1 : user.perfectGames;
    this.applyBadgeProgress(badges, "budget_sniper", newPerfectGames);

    this.applyBadgeProgress(badges, "streak_monster", user.streak);

    if (user.hadPreviousStreak) {
      this.applyBadgeProgress(badges, "comeback_king", user.streak);
    }

    // Single DB write for all badge changes + derived fields
    await this.updateUser(userId, {
      badges,
      scamStreak: newScamStreak,
      perfectGames: newPerfectGames,
    });
  }

  async updateBadgeProgress(userId: string, badgeId: BadgeId, progress: number): Promise<UserBadge | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const badgeIndex = user.badges.findIndex(b => b.badgeId === badgeId);
    if (badgeIndex === -1) return undefined;

    const badge = user.badges[badgeIndex];
    const badgeDef = BADGE_DEFINITIONS.find(d => d.id === badgeId);
    if (!badgeDef) return undefined;

    const newBadges = [...user.badges];
    const shouldUnlock = !badge.unlocked && progress >= badgeDef.maxProgress;

    newBadges[badgeIndex] = {
      ...badge,
      progress,
      unlocked: shouldUnlock || badge.unlocked,
      unlockedAt: shouldUnlock ? new Date().toISOString() : badge.unlockedAt,
    };

    await this.updateUser(userId, { badges: newBadges });

    return newBadges[badgeIndex];
  }

  // ============================================
  // PLUS/PREMIUM FEATURES
  // ============================================

  async useStreakBuyback(userId: string): Promise<{ success: boolean; message: string; restoredStreak?: number }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, message: "User not found" };

    if (!user.streakInsurance.isPlus) {
      return { success: false, message: "Streak Insurance requires Plus membership" };
    }

    if (!user.streakInsurance.lostStreak) {
      return { success: false, message: "No lost streak to restore" };
    }

    const today = getTodayDateString();
    if (user.streakInsurance.lastBuybackDate === today) {
      return { success: false, message: "Already used buyback today" };
    }

    const restoredStreak = user.streakInsurance.lostStreak;

    await this.updateUser(userId, {
      streak: restoredStreak,
      streakInsurance: {
        ...user.streakInsurance,
        lastBuybackDate: today,
        lostStreak: null,
        lostStreakDate: null,
      },
    });

    return {
      success: true,
      message: `Restored ${restoredStreak}-day streak!`,
      restoredStreak,
    };
  }

  async useLatePass(userId: string): Promise<{ success: boolean; message: string; drop?: DailyDrop }> {
    const user = await this.getUser(userId);
    if (!user) return { success: false, message: "User not found" };

    if (!user.streakInsurance.isPlus) {
      return { success: false, message: "Late Pass requires Plus membership" };
    }

    if (!user.streakInsurance.latePassAvailable) {
      return { success: false, message: "Late Pass already used this cycle" };
    }

    const drop = await this.getDailyDrop();

    await this.updateUser(userId, {
      streakInsurance: {
        ...user.streakInsurance,
        latePassAvailable: false,
      },
    });

    return {
      success: true,
      message: "Late Pass activated! You have 24 extra hours.",
      drop,
    };
  }

  async togglePlusStatus(userId: string, isPlus: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Sync membershipTier with isPlus for backwards compatibility
    const membershipTier = isPlus ? "plus" : "free";

    await this.updateUser(userId, {
      membershipTier,
      streakInsurance: {
        ...user.streakInsurance,
        isPlus,
        latePassAvailable: isPlus,
      },
    });

    return this.getUser(userId);
  }

  // ============================================
  // DAILY STATS
  // ============================================

  async getDailyStats(): Promise<{ playersToday: number; totalPlayers: number }> {
    const today = getTodayDateString();

    const playersToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(appSchema.lifestyleUsers)
      .where(eq(appSchema.lifestyleUsers.lastPlayedDate, today));

    const totalPlayers = await db
      .select({ count: sql<number>`count(*)` })
      .from(appSchema.lifestyleUsers);

    return {
      playersToday: Number(playersToday[0]?.count || 0),
      totalPlayers: Number(totalPlayers[0]?.count || 0),
    };
  }

  async createCommunityScenario(userId: string, data: CreateCommunityScenario): Promise<CommunityScenario> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const scenarioId = crypto.randomUUID();
    const weekNumber = getWeekNumber();

    await db.insert(appSchema.communityScenarios).values({
      id: scenarioId,
      authorId: userId,
      title: data.title,
      context: data.context,
      question: data.question,
      type: data.type,
      category: data.category,
      weekNumber,
      isRealistOfWeek: false,
    });

    return this.getCommunityScenario(scenarioId, userId) as Promise<CommunityScenario>;
  }

  async getCommunityScenarios(
    userId: string,
    category?: string,
    sortBy: "latest" | "hot" | "realest" = "hot",
    limit: number = 50,
    offset: number = 0
  ): Promise<CommunityScenario[]> {
    // P1: Added pagination to prevent loading all scenarios at once
    // Build WHERE conditions
    const conditions = [];
    if (category) {
      conditions.push(eq(appSchema.communityScenarios.category, category as any));
    }
    if (sortBy === "realest") {
      conditions.push(eq(appSchema.communityScenarios.type, "real"));
    }

    // Build base query with all conditions
    const baseQuery = db
      .select({
        id: appSchema.communityScenarios.id,
        authorId: appSchema.communityScenarios.authorId,
        authorUsername: appSchema.lifestyleUsers.username,
        authorAvatar: appSchema.lifestyleUsers.avatar,
        authorBadges: appSchema.lifestyleUsers.badges,
        authorMoneyHealth: appSchema.lifestyleUsers.moneyHealth,
        title: appSchema.communityScenarios.title,
        context: appSchema.communityScenarios.context,
        question: appSchema.communityScenarios.question,
        type: appSchema.communityScenarios.type,
        category: appSchema.communityScenarios.category,
        upvotes: appSchema.communityScenarios.upvotes,
        downvotes: appSchema.communityScenarios.downvotes,
        commentCount: appSchema.communityScenarios.commentCount,
        createdAt: appSchema.communityScenarios.createdAt,
        weekNumber: appSchema.communityScenarios.weekNumber,
        isRealistOfWeek: appSchema.communityScenarios.isRealistOfWeek,
      })
      .from(appSchema.communityScenarios)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.communityScenarios.authorId, appSchema.lifestyleUsers.id)
      )
      .$dynamic();

    // Apply WHERE conditions if any
    const queryWithWhere = conditions.length > 0
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // P1: Sort in SQL instead of JavaScript for better performance
    let finalQuery;
    if (sortBy === "latest") {
      finalQuery = queryWithWhere
        .orderBy(desc(appSchema.communityScenarios.createdAt))
        .limit(limit)
        .offset(offset);
    } else {
      // For hot/realest, sort by score (upvotes - downvotes)
      finalQuery = queryWithWhere
        .orderBy(desc(sql`${appSchema.communityScenarios.upvotes} - ${appSchema.communityScenarios.downvotes}`))
        .limit(limit)
        .offset(offset);
    }

    const scenarios = await finalQuery;

    // Get user's votes
    const votes = await db
      .select()
      .from(appSchema.communityVotes)
      .where(eq(appSchema.communityVotes.userId, userId));

    const voteMap = new Map(
      votes
        .filter(v => v.scenarioId)
        .map(v => [v.scenarioId, v.type])
    );

    // P1: Sorting now done in SQL, just add user votes
    const scenariosWithVotes = scenarios.map(s => ({
      ...s,
      userVote: voteMap.get(s.id) || null,
      createdAt: s.createdAt.toISOString(),
    }));

    return scenariosWithVotes;
  }

  async getCommunityScenario(scenarioId: string, userId: string): Promise<CommunityScenario | undefined> {
    const scenarioResult = await db
      .select({
        id: appSchema.communityScenarios.id,
        authorId: appSchema.communityScenarios.authorId,
        authorUsername: appSchema.lifestyleUsers.username,
        authorAvatar: appSchema.lifestyleUsers.avatar,
        authorBadges: appSchema.lifestyleUsers.badges,
        authorMoneyHealth: appSchema.lifestyleUsers.moneyHealth,
        title: appSchema.communityScenarios.title,
        context: appSchema.communityScenarios.context,
        question: appSchema.communityScenarios.question,
        type: appSchema.communityScenarios.type,
        category: appSchema.communityScenarios.category,
        upvotes: appSchema.communityScenarios.upvotes,
        downvotes: appSchema.communityScenarios.downvotes,
        commentCount: appSchema.communityScenarios.commentCount,
        createdAt: appSchema.communityScenarios.createdAt,
        weekNumber: appSchema.communityScenarios.weekNumber,
        isRealistOfWeek: appSchema.communityScenarios.isRealistOfWeek,
      })
      .from(appSchema.communityScenarios)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.communityScenarios.authorId, appSchema.lifestyleUsers.id)
      )
      .where(eq(appSchema.communityScenarios.id, scenarioId))
      .limit(1);

    if (scenarioResult.length === 0) return undefined;

    const scenario = scenarioResult[0];

    // Get user's vote
    const voteResult = await db
      .select({
        type: appSchema.communityVotes.type,
      })
      .from(appSchema.communityVotes)
      .where(
        and(
          eq(appSchema.communityVotes.userId, userId),
          eq(appSchema.communityVotes.scenarioId, scenarioId)
        )
      )
      .limit(1);

    return {
      ...scenario,
      userVote: voteResult[0]?.type || null,
      createdAt: scenario.createdAt.toISOString(),
    };
  }

  async voteCommunityScenario(userId: string, scenarioId: string, voteType: "up" | "down"): Promise<CommunityScenario | undefined> {
    // P1-3: Wrap all vote + count operations in a single transaction
    await db.transaction(async (tx) => {
      // Check if user already voted
      const existingVote = await tx
        .select()
        .from(appSchema.communityVotes)
        .where(
          and(
            eq(appSchema.communityVotes.userId, userId),
            eq(appSchema.communityVotes.scenarioId, scenarioId)
          )
        )
        .limit(1);

      if (existingVote.length > 0) {
        const oldVote = existingVote[0];

        if (oldVote.type === voteType) {
          // Remove vote
          await tx
            .delete(appSchema.communityVotes)
            .where(eq(appSchema.communityVotes.id, oldVote.id));

          // Update scenario counts
          if (voteType === "up") {
            await tx
              .update(appSchema.communityScenarios)
              .set({ upvotes: sql`${appSchema.communityScenarios.upvotes} - 1` })
              .where(eq(appSchema.communityScenarios.id, scenarioId));
          } else {
            await tx
              .update(appSchema.communityScenarios)
              .set({ downvotes: sql`${appSchema.communityScenarios.downvotes} - 1` })
              .where(eq(appSchema.communityScenarios.id, scenarioId));
          }
        } else {
          // Change vote
          await tx
            .update(appSchema.communityVotes)
            .set({ type: voteType })
            .where(eq(appSchema.communityVotes.id, oldVote.id));

          // Update scenario counts
          if (voteType === "up") {
            await tx
              .update(appSchema.communityScenarios)
              .set({
                upvotes: sql`${appSchema.communityScenarios.upvotes} + 1`,
                downvotes: sql`${appSchema.communityScenarios.downvotes} - 1`,
              })
              .where(eq(appSchema.communityScenarios.id, scenarioId));
          } else {
            await tx
              .update(appSchema.communityScenarios)
              .set({
                upvotes: sql`${appSchema.communityScenarios.upvotes} - 1`,
                downvotes: sql`${appSchema.communityScenarios.downvotes} + 1`,
              })
              .where(eq(appSchema.communityScenarios.id, scenarioId));
          }
        }
      } else {
        // New vote
        await tx.insert(appSchema.communityVotes).values({
          id: crypto.randomUUID(),
          scenarioId,
          commentId: null,
          userId,
          type: voteType,
        });

        // Update scenario counts
        if (voteType === "up") {
          await tx
            .update(appSchema.communityScenarios)
            .set({ upvotes: sql`${appSchema.communityScenarios.upvotes} + 1` })
            .where(eq(appSchema.communityScenarios.id, scenarioId));
        } else {
          await tx
            .update(appSchema.communityScenarios)
            .set({ downvotes: sql`${appSchema.communityScenarios.downvotes} + 1` })
            .where(eq(appSchema.communityScenarios.id, scenarioId));
        }
      }
    });

    return this.getCommunityScenario(scenarioId, userId);
  }

  async getScenarioComments(scenarioId: string, userId: string): Promise<CommunityComment[]> {
    const comments = await db
      .select({
        id: appSchema.communityComments.id,
        scenarioId: appSchema.communityComments.scenarioId,
        parentId: appSchema.communityComments.parentId,
        authorId: appSchema.communityComments.authorId,
        authorUsername: appSchema.lifestyleUsers.username,
        authorAvatar: appSchema.lifestyleUsers.avatar,
        authorBadges: appSchema.lifestyleUsers.badges,
        authorMoneyHealth: appSchema.lifestyleUsers.moneyHealth,
        content: appSchema.communityComments.content,
        isAdvice: appSchema.communityComments.isAdvice,
        upvotes: appSchema.communityComments.upvotes,
        downvotes: appSchema.communityComments.downvotes,
        createdAt: appSchema.communityComments.createdAt,
      })
      .from(appSchema.communityComments)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.communityComments.authorId, appSchema.lifestyleUsers.id)
      )
      .where(eq(appSchema.communityComments.scenarioId, scenarioId));

    // Get user's votes on comments
    const votes = await db
      .select()
      .from(appSchema.communityVotes)
      .where(
        and(
          eq(appSchema.communityVotes.userId, userId),
          sql`${appSchema.communityVotes.commentId} IS NOT NULL`
        )
      );

    const voteMap = new Map(
      votes
        .filter(v => v.commentId)
        .map(v => [v.commentId, v.type])
    );

    // Build comment tree
    const commentsWithVotes = comments.map(c => ({
      ...c,
      userVote: voteMap.get(c.id) || null,
      createdAt: c.createdAt.toISOString(),
      replies: [] as CommunityComment[],
    }));

    // Organize comments into tree structure
    const commentMap = new Map(commentsWithVotes.map(c => [c.id, c]));
    const topLevelComments: CommunityComment[] = [];

    for (const comment of commentsWithVotes) {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        topLevelComments.push(comment);
      }
    }

    return topLevelComments;
  }

  async addComment(userId: string, data: CreateCommunityComment): Promise<CommunityComment> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const commentId = crypto.randomUUID();

    // P1-3: Wrap INSERT + UPDATE in a single transaction to keep comment and count in sync
    return await db.transaction(async (tx) => {
      await tx.insert(appSchema.communityComments).values({
        id: commentId,
        scenarioId: data.scenarioId,
        parentId: data.parentId || null,
        authorId: userId,
        content: data.content,
        isAdvice: data.isAdvice,
      });

      // Increment comment count on scenario
      await tx
        .update(appSchema.communityScenarios)
        .set({ commentCount: sql`${appSchema.communityScenarios.commentCount} + 1` })
        .where(eq(appSchema.communityScenarios.id, data.scenarioId));

      const commentResult = await tx
        .select({
          id: appSchema.communityComments.id,
          scenarioId: appSchema.communityComments.scenarioId,
          parentId: appSchema.communityComments.parentId,
          authorId: appSchema.communityComments.authorId,
          authorUsername: appSchema.lifestyleUsers.username,
          authorAvatar: appSchema.lifestyleUsers.avatar,
          authorBadges: appSchema.lifestyleUsers.badges,
          authorMoneyHealth: appSchema.lifestyleUsers.moneyHealth,
          content: appSchema.communityComments.content,
          isAdvice: appSchema.communityComments.isAdvice,
          upvotes: appSchema.communityComments.upvotes,
          downvotes: appSchema.communityComments.downvotes,
          createdAt: appSchema.communityComments.createdAt,
        })
        .from(appSchema.communityComments)
        .innerJoin(
          appSchema.lifestyleUsers,
          eq(appSchema.communityComments.authorId, appSchema.lifestyleUsers.id)
        )
        .where(eq(appSchema.communityComments.id, commentId))
        .limit(1);

      return {
        ...commentResult[0],
        userVote: null,
        createdAt: commentResult[0].createdAt.toISOString(),
      };
    });
  }

  async voteComment(userId: string, commentId: string, voteType: "up" | "down"): Promise<CommunityComment | undefined> {
    // Check if user already voted
    const existingVote = await db
      .select()
      .from(appSchema.communityVotes)
      .where(
        and(
          eq(appSchema.communityVotes.userId, userId),
          eq(appSchema.communityVotes.commentId, commentId)
        )
      )
      .limit(1);

    if (existingVote.length > 0) {
      const oldVote = existingVote[0];

      if (oldVote.type === voteType) {
        // Remove vote
        await db
          .delete(appSchema.communityVotes)
          .where(eq(appSchema.communityVotes.id, oldVote.id));

        // Update comment counts
        if (voteType === "up") {
          await db
            .update(appSchema.communityComments)
            .set({ upvotes: sql`${appSchema.communityComments.upvotes} - 1` })
            .where(eq(appSchema.communityComments.id, commentId));
        } else {
          await db
            .update(appSchema.communityComments)
            .set({ downvotes: sql`${appSchema.communityComments.downvotes} - 1` })
            .where(eq(appSchema.communityComments.id, commentId));
        }
      } else {
        // Change vote
        await db
          .update(appSchema.communityVotes)
          .set({ type: voteType })
          .where(eq(appSchema.communityVotes.id, oldVote.id));

        // Update comment counts
        if (voteType === "up") {
          await db
            .update(appSchema.communityComments)
            .set({
              upvotes: sql`${appSchema.communityComments.upvotes} + 1`,
              downvotes: sql`${appSchema.communityComments.downvotes} - 1`,
            })
            .where(eq(appSchema.communityComments.id, commentId));
        } else {
          await db
            .update(appSchema.communityComments)
            .set({
              upvotes: sql`${appSchema.communityComments.upvotes} - 1`,
              downvotes: sql`${appSchema.communityComments.downvotes} + 1`,
            })
            .where(eq(appSchema.communityComments.id, commentId));
        }
      }
    } else {
      // New vote
      await db.insert(appSchema.communityVotes).values({
        id: crypto.randomUUID(),
        scenarioId: null,
        commentId,
        userId,
        type: voteType,
      });

      // Update comment counts
      if (voteType === "up") {
        await db
          .update(appSchema.communityComments)
          .set({ upvotes: sql`${appSchema.communityComments.upvotes} + 1` })
          .where(eq(appSchema.communityComments.id, commentId));
      } else {
        await db
          .update(appSchema.communityComments)
          .set({ downvotes: sql`${appSchema.communityComments.downvotes} + 1` })
          .where(eq(appSchema.communityComments.id, commentId));
      }
    }

    // Return updated comment
    const commentResult = await db
      .select({
        id: appSchema.communityComments.id,
        scenarioId: appSchema.communityComments.scenarioId,
        parentId: appSchema.communityComments.parentId,
        authorId: appSchema.communityComments.authorId,
        authorUsername: appSchema.lifestyleUsers.username,
        authorAvatar: appSchema.lifestyleUsers.avatar,
        authorBadges: appSchema.lifestyleUsers.badges,
        authorMoneyHealth: appSchema.lifestyleUsers.moneyHealth,
        content: appSchema.communityComments.content,
        isAdvice: appSchema.communityComments.isAdvice,
        upvotes: appSchema.communityComments.upvotes,
        downvotes: appSchema.communityComments.downvotes,
        createdAt: appSchema.communityComments.createdAt,
      })
      .from(appSchema.communityComments)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.communityComments.authorId, appSchema.lifestyleUsers.id)
      )
      .where(eq(appSchema.communityComments.id, commentId))
      .limit(1);

    if (commentResult.length === 0) return undefined;

    return {
      ...commentResult[0],
      userVote: voteType,
      createdAt: commentResult[0].createdAt.toISOString(),
    };
  }

  async getRealistOfWeek(userId: string): Promise<CommunityScenario[]> {
    const currentWeek = getWeekNumber();

    const scenarios = await db
      .select({
        id: appSchema.communityScenarios.id,
        authorId: appSchema.communityScenarios.authorId,
        authorUsername: appSchema.lifestyleUsers.username,
        authorAvatar: appSchema.lifestyleUsers.avatar,
        authorBadges: appSchema.lifestyleUsers.badges,
        authorMoneyHealth: appSchema.lifestyleUsers.moneyHealth,
        title: appSchema.communityScenarios.title,
        context: appSchema.communityScenarios.context,
        question: appSchema.communityScenarios.question,
        type: appSchema.communityScenarios.type,
        category: appSchema.communityScenarios.category,
        upvotes: appSchema.communityScenarios.upvotes,
        downvotes: appSchema.communityScenarios.downvotes,
        commentCount: appSchema.communityScenarios.commentCount,
        createdAt: appSchema.communityScenarios.createdAt,
        weekNumber: appSchema.communityScenarios.weekNumber,
        isRealistOfWeek: appSchema.communityScenarios.isRealistOfWeek,
      })
      .from(appSchema.communityScenarios)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.communityScenarios.authorId, appSchema.lifestyleUsers.id)
      )
      .where(
        and(
          eq(appSchema.communityScenarios.weekNumber, currentWeek),
          eq(appSchema.communityScenarios.type, "real")
        )
      );

    // Get user's votes
    const votes = await db
      .select()
      .from(appSchema.communityVotes)
      .where(eq(appSchema.communityVotes.userId, userId));

    const voteMap = new Map(
      votes
        .filter(v => v.scenarioId)
        .map(v => [v.scenarioId, v.type])
    );

    const scenariosWithVotes = scenarios.map(s => ({
      ...s,
      userVote: voteMap.get(s.id) || null,
      createdAt: s.createdAt.toISOString(),
    }));

    // Sort by votes (upvotes - downvotes)
    scenariosWithVotes.sort((a, b) => {
      const aScore = a.upvotes - a.downvotes;
      const bScore = b.upvotes - b.downvotes;
      return bScore - aScore;
    });

    // Return top 10
    return scenariosWithVotes.slice(0, 10);
  }

  async isAdmin(userId: string): Promise<boolean> {
    // Hardcoded admin check - in production you'd have an admin table or flag
    // For now, check if user is a moderator with special privileges
    const moderatorResult = await db
      .select()
      .from(appSchema.moderators)
      .where(eq(appSchema.moderators.userId, userId))
      .limit(1);

    // Could add additional admin-specific logic here
    return moderatorResult.length > 0;
  }

  async isModerator(userId: string): Promise<boolean> {
    const moderatorResult = await db
      .select()
      .from(appSchema.moderators)
      .where(eq(appSchema.moderators.userId, userId))
      .limit(1);

    return moderatorResult.length > 0;
  }

  async getModerators(): Promise<Moderator[]> {
    const moderators = await db
      .select({
        userId: appSchema.moderators.userId,
        username: appSchema.lifestyleUsers.username,
        avatar: appSchema.lifestyleUsers.avatar,
        assignedAt: appSchema.moderators.assignedAt,
        assignedBy: appSchema.moderators.assignedBy,
      })
      .from(appSchema.moderators)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.moderators.userId, appSchema.lifestyleUsers.id)
      );

    return moderators.map(m => ({
      ...m,
      assignedAt: m.assignedAt.toISOString(),
    }));
  }

  async addModerator(userId: string, assignedBy: string): Promise<Moderator | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    // Check if already a moderator
    const existingMod = await db
      .select()
      .from(appSchema.moderators)
      .where(eq(appSchema.moderators.userId, userId))
      .limit(1);

    if (existingMod.length > 0) {
      // Already a moderator
      const moderators = await this.getModerators();
      return moderators.find(m => m.userId === userId);
    }

    await db.insert(appSchema.moderators).values({
      userId,
      assignedBy,
    });

    const moderators = await this.getModerators();
    return moderators.find(m => m.userId === userId);
  }

  async removeModerator(userId: string): Promise<boolean> {
    await db
      .delete(appSchema.moderators)
      .where(eq(appSchema.moderators.userId, userId));

    return true;
  }

  async getBannedUsers(): Promise<BannedUser[]> {
    const banned = await db
      .select({
        userId: appSchema.bannedUsers.userId,
        username: appSchema.lifestyleUsers.username,
        avatar: appSchema.lifestyleUsers.avatar,
        reason: appSchema.bannedUsers.reason,
        bannedAt: appSchema.bannedUsers.bannedAt,
        bannedBy: appSchema.bannedUsers.bannedBy,
        bannedByUsername: sql<string>`banned_by_user.username`,
      })
      .from(appSchema.bannedUsers)
      .innerJoin(
        appSchema.lifestyleUsers,
        eq(appSchema.bannedUsers.userId, appSchema.lifestyleUsers.id)
      )
      .innerJoin(
        sql`${appSchema.lifestyleUsers} AS banned_by_user`,
        sql`banned_by_user.id = ${appSchema.bannedUsers.bannedBy}`
      );

    return banned.map(b => ({
      ...b,
      bannedAt: b.bannedAt.toISOString(),
    }));
  }

  async banUser(data: BanUser, bannedBy: string): Promise<BannedUser | undefined> {
    const user = await this.getUser(data.userId);
    if (!user) return undefined;

    const bannerUser = await this.getUser(bannedBy);
    if (!bannerUser) return undefined;

    // Check if already banned
    const existingBan = await db
      .select()
      .from(appSchema.bannedUsers)
      .where(eq(appSchema.bannedUsers.userId, data.userId))
      .limit(1);

    if (existingBan.length > 0) {
      // Update ban reason
      await db
        .update(appSchema.bannedUsers)
        .set({ reason: data.reason })
        .where(eq(appSchema.bannedUsers.userId, data.userId));
    } else {
      // Insert new ban
      await db.insert(appSchema.bannedUsers).values({
        userId: data.userId,
        reason: data.reason,
        bannedBy,
      });
    }

    return {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      reason: data.reason,
      bannedAt: new Date().toISOString(),
      bannedBy,
      bannedByUsername: bannerUser.username,
    };
  }

  async unbanUser(userId: string): Promise<boolean> {
    await db
      .delete(appSchema.bannedUsers)
      .where(eq(appSchema.bannedUsers.userId, userId));

    return true;
  }

  async isUserBanned(userId: string): Promise<boolean> {
    const banResult = await db
      .select()
      .from(appSchema.bannedUsers)
      .where(eq(appSchema.bannedUsers.userId, userId))
      .limit(1);

    return banResult.length > 0;
  }

  async getTopCreators(limit: number = 10): Promise<any[]> {
    const creators = await db
      .select({
        id: appSchema.lifestyleUsers.id,
        username: appSchema.lifestyleUsers.username,
        avatar: appSchema.lifestyleUsers.avatar,
        scenarioCount: sql<number>`COUNT(${appSchema.communityScenarios.id})`,
        totalUpvotes: sql<number>`SUM(${appSchema.communityScenarios.upvotes})`,
      })
      .from(appSchema.lifestyleUsers)
      .innerJoin(
        appSchema.communityScenarios,
        eq(appSchema.lifestyleUsers.id, appSchema.communityScenarios.authorId)
      )
      .groupBy(appSchema.lifestyleUsers.id)
      .orderBy(desc(sql`SUM(${appSchema.communityScenarios.upvotes})`))
      .limit(limit);

    return creators.map((creator, index) => ({
      id: creator.id,
      username: creator.username,
      avatar: creator.avatar,
      totalUpvotes: Number(creator.totalUpvotes) || 0,
      scenarioCount: Number(creator.scenarioCount) || 0,
      rank: index + 1,
    }));
  }

  async updateMembershipTier(userId: string, tier: "free" | "plus" | "pro"): Promise<User> {
    const updatedUsers = await db
      .update(appSchema.lifestyleUsers)
      .set({ membershipTier: tier })
      .where(eq(appSchema.lifestyleUsers.id, userId))
      .returning();

    if (updatedUsers.length === 0) {
      throw new Error("User not found");
    }

    return this.dbUserToAppUser(updatedUsers[0]);
  }

  async getAdminScenarios(): Promise<AdminScenario[]> {
    const scenarios = await db
      .select()
      .from(appSchema.adminScenarios)
      .orderBy(desc(appSchema.adminScenarios.updatedAt));

    return scenarios.map(s => ({
      id: s.id,
      title: s.title,
      context: s.context,
      question: s.question,
      choices: s.choices,
      category: s.category,
      difficulty: s.difficulty,
      publishDate: s.publishDate,
      status: s.status,
      createdBy: s.createdBy,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      deepDive: s.deepDive,
    }));
  }

  async getAdminScenario(scenarioId: string): Promise<AdminScenario | undefined> {
    const scenarioResult = await db
      .select()
      .from(appSchema.adminScenarios)
      .where(eq(appSchema.adminScenarios.id, scenarioId))
      .limit(1);

    if (scenarioResult.length === 0) return undefined;

    const s = scenarioResult[0];
    return {
      id: s.id,
      title: s.title,
      context: s.context,
      question: s.question,
      choices: s.choices,
      category: s.category,
      difficulty: s.difficulty,
      publishDate: s.publishDate,
      status: s.status,
      createdBy: s.createdBy,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      deepDive: s.deepDive,
    };
  }

  async createAdminScenario(userId: string, data: CreateAdminScenario): Promise<AdminScenario> {
    const scenarioId = crypto.randomUUID();

    await db.insert(appSchema.adminScenarios).values({
      id: scenarioId,
      title: data.title,
      context: data.context,
      question: data.question,
      choices: data.choices,
      category: data.category,
      difficulty: data.difficulty,
      publishDate: data.publishDate,
      status: data.status,
      createdBy: userId,
      deepDive: data.deepDive || null,
    });

    return this.getAdminScenario(scenarioId) as Promise<AdminScenario>;
  }

  async updateAdminScenario(scenarioId: string, data: Partial<CreateAdminScenario>): Promise<AdminScenario | undefined> {
    const scenario = await this.getAdminScenario(scenarioId);
    if (!scenario) return undefined;

    await db
      .update(appSchema.adminScenarios)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(appSchema.adminScenarios.id, scenarioId));

    return this.getAdminScenario(scenarioId);
  }

  async deleteAdminScenario(scenarioId: string): Promise<boolean> {
    await db
      .delete(appSchema.adminScenarios)
      .where(eq(appSchema.adminScenarios.id, scenarioId));

    return true;
  }

  async publishAdminScenario(scenarioId: string): Promise<AdminScenario | undefined> {
    const scenario = await this.getAdminScenario(scenarioId);
    if (!scenario) return undefined;

    await db
      .update(appSchema.adminScenarios)
      .set({
        status: "published",
        publishDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(appSchema.adminScenarios.id, scenarioId));

    return this.getAdminScenario(scenarioId);
  }

  async getAllUsersForAdmin(): Promise<Pick<User, "id" | "username" | "avatar" | "moneyHealth" | "gamesPlayed">[]> {
    const users = await db
      .select({
        id: appSchema.lifestyleUsers.id,
        username: appSchema.lifestyleUsers.username,
        avatar: appSchema.lifestyleUsers.avatar,
        moneyHealth: appSchema.lifestyleUsers.moneyHealth,
        gamesPlayed: appSchema.lifestyleUsers.gamesPlayed,
      })
      .from(appSchema.lifestyleUsers)
      .orderBy(desc(appSchema.lifestyleUsers.gamesPlayed));

    return users;
  }

  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    // Check if subscription already exists
    const existingSub = await db
      .select()
      .from(appSchema.pushSubscriptions)
      .where(
        and(
          eq(appSchema.pushSubscriptions.userId, userId),
          eq(appSchema.pushSubscriptions.endpoint, subscription.endpoint)
        )
      )
      .limit(1);

    if (existingSub.length === 0) {
      // Insert new subscription
      await db.insert(appSchema.pushSubscriptions).values({
        id: crypto.randomUUID(),
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
    } else {
      // Update existing subscription
      await db
        .update(appSchema.pushSubscriptions)
        .set({
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        })
        .where(eq(appSchema.pushSubscriptions.id, existingSub[0].id));
    }
  }

  async getPushSubscription(userId: string): Promise<any> {
    const subscriptions = await db
      .select()
      .from(appSchema.pushSubscriptions)
      .where(eq(appSchema.pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return null;

    // Return the most recent subscription in the correct format
    const sub = subscriptions[subscriptions.length - 1];
    return {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db
      .delete(appSchema.pushSubscriptions)
      .where(
        and(
          eq(appSchema.pushSubscriptions.userId, userId),
          eq(appSchema.pushSubscriptions.endpoint, endpoint)
        )
      );
  }

  async getAllPushSubscriptions(): Promise<{ userId: string; subscription: any }[]> {
    const subscriptions = await db
      .select()
      .from(appSchema.pushSubscriptions);

    return subscriptions.map(s => ({
      userId: s.userId,
      subscription: {
        endpoint: s.endpoint,
        keys: {
          p256dh: s.p256dh,
          auth: s.auth,
        },
      },
    }));
  }

  async createCoopSession(hostId: string, mode: CoopMode = "daily", arcadeGameIndex: number | null = null, invitedUserId: string | null = null): Promise<CoopSession> {
    const host = await this.getUser(hostId);
    if (!host) throw new Error("Host user not found");

    let invitedUsername: string | null = null;
    if (invitedUserId) {
      const invitedUser = await this.getUser(invitedUserId);
      invitedUsername = invitedUser?.username || null;
    }

    const sessionId = crypto.randomUUID();
    const code = generateInviteCode();
    const today = getTodayDateString();

    let dropId: string;
    if (mode === "arcade") {
      const gameIdx = arcadeGameIndex ?? 0;
      let arcadePlaysToday = host.arcadePlaysToday || 0;
      if (host.arcadeLastPlayedDate !== today) {
        arcadePlaysToday = 0;
      }
      if (gameIdx >= arcadePlaysToday) {
        const maxPlays = ARCADE_LIMITS[host.membershipTier || "free"] || 1;
        if (arcadePlaysToday >= maxPlays) {
          throw new Error("Arcade play limit reached — cannot create co-op session for locked game");
        }
      }
      dropId = `arcade-${today}-${gameIdx}`;
    } else {
      const drop = await this.getDailyDrop();
      dropId = drop.id;
    }

    const hostPlayer: CoopPlayer = {
      id: hostId,
      username: host.username,
      avatar: host.avatar,
      answers: {},
      currentQuestionIndex: 0,
      score: 0,
      connected: true,
    };

    await db.insert(appSchema.coopSessions).values({
      id: sessionId,
      code,
      hostId,
      guestId: null,
      invitedUserId,
      invitedUsername,
      status: "waiting",
      dropId,
      mode,
      arcadeGameIndex,
      currentQuestionIndex: 0,
      questionStartTime: 0,
      players: [hostPlayer],
    });

    return this.getCoopSession(sessionId) as Promise<CoopSession>;
  }

  async getCoopPendingInvites(userId: string): Promise<CoopSession[]> {
    const results = await db
      .select()
      .from(appSchema.coopSessions)
      .where(
        and(
          eq(appSchema.coopSessions.invitedUserId, userId),
          eq(appSchema.coopSessions.status, "waiting")
        )
      );

    return Promise.all(results.map(r => this.getCoopSession(r.id))).then(
      sessions => sessions.filter((s): s is CoopSession => !!s)
    );
  }

  async getCoopSession(sessionId: string): Promise<CoopSession | undefined> {
    const sessionResult = await db
      .select()
      .from(appSchema.coopSessions)
      .where(eq(appSchema.coopSessions.id, sessionId))
      .limit(1);

    if (sessionResult.length === 0) return undefined;

    const session = sessionResult[0];

    return {
      id: session.id,
      code: session.code,
      hostId: session.hostId,
      guestId: session.guestId,
      invitedUserId: session.invitedUserId ?? null,
      invitedUsername: session.invitedUsername ?? null,
      status: session.status,
      mode: session.mode as CoopMode || "daily",
      dropId: session.dropId,
      arcadeGameIndex: session.arcadeGameIndex ?? null,
      currentQuestionIndex: session.currentQuestionIndex,
      questionStartTime: session.questionStartTime,
      players: session.players,
      createdAt: session.createdAt.toISOString(),
      startedAt: session.startedAt?.toISOString() || null,
      completedAt: session.completedAt?.toISOString() || null,
    };
  }

  async getCoopSessionByCode(code: string): Promise<CoopSession | undefined> {
    const sessionResult = await db
      .select()
      .from(appSchema.coopSessions)
      .where(eq(appSchema.coopSessions.code, code.toUpperCase()))
      .limit(1);

    if (sessionResult.length === 0) return undefined;

    return this.getCoopSession(sessionResult[0].id);
  }

  async joinCoopSession(guestId: string, code: string): Promise<CoopSession | undefined> {
    const guest = await this.getUser(guestId);
    if (!guest) return undefined;

    const session = await this.getCoopSessionByCode(code);
    if (!session) return undefined;

    if (session.status !== "waiting") {
      throw new Error("Session already started or completed");
    }

    if (session.guestId) {
      throw new Error("Session is full");
    }

    const guestPlayer: CoopPlayer = {
      id: guestId,
      username: guest.username,
      avatar: guest.avatar,
      answers: {},
      currentQuestionIndex: 0,
      score: 0,
      connected: true,
    };

    const updatedPlayers = [...session.players, guestPlayer];

    await db
      .update(appSchema.coopSessions)
      .set({
        guestId,
        status: "waiting",
        players: updatedPlayers,
      })
      .where(eq(appSchema.coopSessions.id, session.id));

    return this.getCoopSession(session.id);
  }

  async updateCoopSession(sessionId: string, updates: Partial<CoopSession>): Promise<CoopSession | undefined> {
    const session = await this.getCoopSession(sessionId);
    if (!session) return undefined;

    await db
      .update(appSchema.coopSessions)
      .set(updates as any)
      .where(eq(appSchema.coopSessions.id, sessionId));

    return this.getCoopSession(sessionId);
  }

  private getCoopScenarios(session: CoopSession): Scenario[] {
    const dayNumber = getDayNumber();
    const today = getTodayDateString();
    let scenarios: Scenario[];

    if (session.mode === "arcade") {
      scenarios = getArcadeScenarios(dayNumber, session.arcadeGameIndex || 0);
    } else {
      scenarios = getDailyScenarios(dayNumber);
    }

    return scenarios.map(scenario =>
      shuffleScenarioChoices(scenario, session.mode === "arcade"
        ? today + "-arcade-" + (session.arcadeGameIndex || 0)
        : today)
    );
  }

  async submitCoopAnswer(sessionId: string, playerId: string, scenarioId: string, choiceLabel: string): Promise<CoopSession | undefined> {
    const session = await this.getCoopSession(sessionId);
    if (!session) return undefined;

    const scenarios = this.getCoopScenarios(session);
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return undefined;

    const choice = scenario.choices.find(c => c.label === choiceLabel);
    if (!choice) return undefined;

    // Update player's answers
    const updatedPlayers = session.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          answers: { ...p.answers, [scenarioId]: choiceLabel },
          score: p.score + (choice.isCorrect ? 100 : 0),
        };
      }
      return p;
    });

    // Check if both players answered
    const allAnswered = updatedPlayers.every(p => p.answers[scenarioId]);

    let updates: any = { players: updatedPlayers };

    if (allAnswered && session.currentQuestionIndex < scenarios.length - 1) {
      updates.currentQuestionIndex = session.currentQuestionIndex + 1;
      updates.questionStartTime = Math.floor(Date.now() / 1000);
    } else if (allAnswered && session.currentQuestionIndex === scenarios.length - 1) {
      // Game complete
      updates.status = "completed";
      updates.completedAt = new Date();
    }

    await db
      .update(appSchema.coopSessions)
      .set(updates)
      .where(eq(appSchema.coopSessions.id, sessionId));

    return this.getCoopSession(sessionId);
  }

  async getCoopGameResult(sessionId: string): Promise<CoopGameResult | undefined> {
    const session = await this.getCoopSession(sessionId);
    if (!session || session.status !== "completed") return undefined;

    const scenarios = this.getCoopScenarios(session);

    const playerResults = session.players.map(p => {
      const answers = Object.entries(p.answers).map(([scenarioId, choiceLabel]) => {
        const scenario = scenarios.find(s => s.id === scenarioId);
        const choice = scenario?.choices.find(c => c.label === choiceLabel);
        return {
          scenarioId,
          choiceLabel,
          points: choice?.points || 0,
          isCorrect: choice?.isCorrect || false,
        };
      });

      const correctAnswers = answers.filter(a => a.isCorrect).length;

      return {
        id: p.id,
        username: p.username,
        avatar: p.avatar,
        score: p.score,
        correctAnswers,
        answers,
      };
    });

    // Determine winner
    const sortedPlayers = [...playerResults].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0].score > sortedPlayers[1].score ? sortedPlayers[0].id : null;

    return {
      sessionId,
      players: playerResults,
      totalQuestions: scenarios.length,
      winner,
    };
  }

  // ============================================
  // ARCADE MODE OPERATIONS
  // ============================================

  async getArcadeDrop(userId: string, gameIndex?: number): Promise<DailyDrop> {
    const user = await this.getOrCreateUser(userId);
    const today = getTodayDateString();
    const dayNumber = getDayNumber();

    let arcadePlaysToday = user.arcadePlaysToday || 0;
    if (user.arcadeLastPlayedDate !== today) {
      arcadePlaysToday = 0;
      await db
        .update(appSchema.lifestyleUsers)
        .set({ arcadePlaysToday: 0, arcadeLastPlayedDate: today })
        .where(eq(appSchema.lifestyleUsers.id, userId));
    }

    const arcadeGameIndex = gameIndex !== undefined ? gameIndex : arcadePlaysToday;
    const scenarios = getArcadeScenarios(dayNumber, arcadeGameIndex);
    const shuffledScenarios = scenarios.map(scenario =>
      shuffleScenarioChoices(scenario, today + "-arcade-" + arcadeGameIndex)
    );

    return {
      id: `arcade-${today}-${arcadeGameIndex}`,
      dropNumber: dayNumber,
      date: today,
      scenarios: shuffledScenarios,
    };
  }

  async submitArcadeGame(userId: string, submission: SubmitArcadeGame): Promise<ArcadeGameResult> {
    const user = await this.getOrCreateUser(userId);
    const today = getTodayDateString();

    let arcadePlaysToday = user.arcadePlaysToday || 0;
    if (user.arcadeLastPlayedDate !== today) {
      arcadePlaysToday = 0;
    }

    const membershipTier = user.membershipTier || "free";
    const maxPlays = ARCADE_LIMITS[membershipTier] || 1;

    const parts = submission.arcadeDropId.split("-");
    const arcadeGameIndex = parseInt(parts[parts.length - 1]) || 0;

    const isNewGameUnlock = arcadeGameIndex === arcadePlaysToday;

    if (isNewGameUnlock) {
      const atomicResult = await db.execute(sql`
        UPDATE lifestyle_users
        SET arcade_plays_today = CASE WHEN arcade_last_played_date = ${today} THEN arcade_plays_today + 1 ELSE 1 END,
            arcade_last_played_date = ${today}
        WHERE id = ${userId}
          AND (CASE WHEN arcade_last_played_date = ${today} THEN arcade_plays_today ELSE 0 END) < ${maxPlays}
        RETURNING arcade_plays_today
      `);
      if (!atomicResult.rows || atomicResult.rows.length === 0) {
        throw new Error("Arcade play limit reached for today");
      }
      arcadePlaysToday = (atomicResult.rows[0] as any).arcade_plays_today;
    }

    const dayNumber = getDayNumber();
    const rawScenarios = getArcadeScenarios(dayNumber, arcadeGameIndex);
    const scenarios = rawScenarios.map(scenario =>
      shuffleScenarioChoices(scenario, today + "-arcade-" + arcadeGameIndex)
    );

    let correctAnswers = 0;
    let totalScore = 0;
    const categoryResults: Map<string, { correct: number; total: number }> = new Map();
    for (const answer of submission.answers) {
      const scenario = scenarios.find(s => s.id === answer.scenarioId);
      if (!scenario) continue;
      const choice = scenario.choices.find(c => c.label === answer.choiceLabel);
      if (choice && choice.isCorrect) {
        correctAnswers++;
        totalScore += Math.max(0, choice.points);
      }
      const catStats = categoryResults.get(scenario.category) || { correct: 0, total: 0 };
      catStats.total++;
      if (choice?.isCorrect) catStats.correct++;
      categoryResults.set(scenario.category, catStats);
    }
    totalScore = Math.max(0, totalScore);

    const newCategoryStats = [...(user.categoryStats || [])];
    const categoryEntries = Array.from(categoryResults.entries());
    for (const [category, stats] of categoryEntries) {
      const existingIndex = newCategoryStats.findIndex(c => c.category === category);
      if (existingIndex >= 0) {
        const existing = newCategoryStats[existingIndex];
        const newTotal = existing.totalQuestions + stats.total;
        const newCorrect = existing.correctAnswers + stats.correct;
        newCategoryStats[existingIndex] = {
          category,
          totalQuestions: newTotal,
          correctAnswers: newCorrect,
          accuracy: newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0,
        };
      } else {
        newCategoryStats.push({
          category,
          totalQuestions: stats.total,
          correctAnswers: stats.correct,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        });
      }
    }

    const updateFields: any = {
      gamesPlayed: user.gamesPlayed + 1,
      totalScore: user.totalScore + totalScore,
      categoryStats: newCategoryStats,
    };
    if (!isNewGameUnlock) {
      updateFields.arcadePlaysToday = arcadePlaysToday;
      updateFields.arcadeLastPlayedDate = today;
    }
    await this.updateUser(userId, updateFields);

    await this.computeAndUpdateAllBadges(userId, {
      correctCount: correctAnswers,
      totalQuestions: scenarios.length,
      categoryResults,
    });

    const currentPlays = isNewGameUnlock ? arcadePlaysToday : arcadePlaysToday;
    const playsRemaining = Math.max(0, maxPlays - currentPlays);

    return {
      score: totalScore,
      correctAnswers,
      totalQuestions: scenarios.length,
      playsUsedToday: currentPlays,
      playsRemaining,
    };
  }

  async getArcadeStatus(userId: string): Promise<ArcadeStatus> {
    const user = await this.getOrCreateUser(userId);
    const today = getTodayDateString();

    let playsToday = user.arcadePlaysToday || 0;
    if (user.arcadeLastPlayedDate !== today) {
      playsToday = 0;
    }

    const membershipTier = user.membershipTier || "free";
    const baseMax = ARCADE_LIMITS[membershipTier] || 1;
    const maxPlays = baseMax + (user.bonusArcadePlays || 0);
    const playsRemaining = Math.max(0, maxPlays - playsToday);

    return {
      playsUsedToday: playsToday,
      maxPlaysToday: maxPlays,
      playsRemaining,
      canPlay: playsRemaining > 0,
      canReplay: playsToday > 0,
      gamesUnlocked: playsToday,
      currentGameIndex: playsToday,
      membershipTier,
    };
  }

  // ============================================
  // SURVIVAL MODE METHODS
  // ============================================

  async saveSurvivalMatch(match: { id: string; code: string; hostId: string; isPrivate: boolean; playerCount: number; totalRounds: number; winnerId: string | null; startedAt: string; completedAt: string }): Promise<void> {
    try {
      await db.insert(appSchema.survivalMatches).values({
        id: match.id,
        code: match.code,
        hostId: match.hostId,
        isPrivate: match.isPrivate,
        status: "completed",
        totalRounds: match.totalRounds,
        playerCount: match.playerCount,
        winnerId: match.winnerId,
        startedAt: new Date(match.startedAt),
        completedAt: new Date(match.completedAt),
      });
    } catch (error) {
      console.error("Error saving survival match:", error);
    }
  }

  async saveSurvivalPlayers(matchId: string, players: { userId: string; placement: number | null; score: number; roundsSurvived: number; shieldUsed: boolean }[]): Promise<void> {
    try {
      if (players.length === 0) return;
      await db.insert(appSchema.survivalPlayers).values(
        players.map(p => ({
          matchId,
          userId: p.userId,
          placement: p.placement,
          score: p.score,
          roundsSurvived: p.roundsSurvived,
          shieldUsed: p.shieldUsed,
        }))
      );
    } catch (error) {
      console.error("Error saving survival players:", error);
    }
  }

  async updateSurvivalStats(userId: string, won: boolean, placement: number): Promise<void> {
    try {
      const updates: Record<string, any> = {
        survivalPlayed: sql`${appSchema.lifestyleUsers.survivalPlayed} + 1`,
      };
      if (won) {
        updates.survivalWins = sql`${appSchema.lifestyleUsers.survivalWins} + 1`;
      }
      await db.update(appSchema.lifestyleUsers)
        .set(updates)
        .where(eq(appSchema.lifestyleUsers.id, userId));

      // Update best placement separately (need to check current value)
      const user = await this.getUser(userId);
      if (user && (!user.survivalBestPlacement || placement < user.survivalBestPlacement)) {
        await db.update(appSchema.lifestyleUsers)
          .set({ survivalBestPlacement: placement })
          .where(eq(appSchema.lifestyleUsers.id, userId));
      }
    } catch (error) {
      console.error("Error updating survival stats:", error);
    }
  }

  async getSurvivalHistory(userId: string, limit = 20): Promise<{ matchId: string; placement: number | null; score: number; playerCount: number; completedAt: string }[]> {
    try {
      const rows = await db
        .select({
          matchId: appSchema.survivalPlayers.matchId,
          placement: appSchema.survivalPlayers.placement,
          score: appSchema.survivalPlayers.score,
          playerCount: appSchema.survivalMatches.playerCount,
          completedAt: appSchema.survivalMatches.completedAt,
        })
        .from(appSchema.survivalPlayers)
        .innerJoin(
          appSchema.survivalMatches,
          eq(appSchema.survivalPlayers.matchId, appSchema.survivalMatches.id)
        )
        .where(eq(appSchema.survivalPlayers.userId, userId))
        .orderBy(desc(appSchema.survivalMatches.completedAt))
        .limit(limit);

      return rows.map(r => ({
        matchId: r.matchId,
        placement: r.placement,
        score: r.score,
        playerCount: r.playerCount,
        completedAt: r.completedAt?.toISOString() ?? "",
      }));
    } catch (error) {
      console.error("Error fetching survival history:", error);
      return [];
    }
  }

  async deleteUsersByPrefix(prefix: string): Promise<number> {
    try {
      // Escape SQL LIKE wildcards (%, _) in user-provided prefix
      const safePrefix = prefix.replace(/[%_]/g, '\\$&');
      const result = await db.delete(appSchema.lifestyleUsers)
        .where(like(appSchema.lifestyleUsers.id, `${safePrefix}%`));
      // result may or may not have rowCount depending on driver
      return (result as any)?.rowCount ?? 0;
    } catch (err: any) {
      console.error(`[deleteUsersByPrefix] Error: ${err.message}`);
      return 0;
    }
  }
}

// Export a singleton instance
export const postgresStorage = new PostgresStorage();
