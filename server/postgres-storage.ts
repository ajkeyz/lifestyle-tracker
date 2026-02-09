import { eq, and, or, desc, sql, like, ilike } from "drizzle-orm";
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
  Scenario,
  GameHistoryEntry,
  CategoryStats,
} from "@shared/schema";
import { defaultNotificationPrefs, defaultStreakInsurance, BADGE_DEFINITIONS } from "@shared/schema";
import { getDailyScenarios } from "./static-scenarios";

// Helper functions
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayNumber(): number {
  const start = new Date("2024-01-01");
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
      mode: "global" as const, // Default mode - users can change later in settings
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
    };

    await db.insert(appSchema.lifestyleUsers).values(newUser);

    return newUser;
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

  async checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const lowerUsername = username.toLowerCase();

    let query = db
      .select({ id: appSchema.lifestyleUsers.id })
      .from(appSchema.lifestyleUsers)
      .where(sql`LOWER(${appSchema.lifestyleUsers.username}) = ${lowerUsername}`);

    if (excludeUserId) {
      query = query.where(sql`${appSchema.lifestyleUsers.id} != ${excludeUserId}`);
    }

    const result = await query.limit(1);
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

    // Get actual friends by querying each friend ID
    const friends: User[] = [];
    for (const friendId of friendIds) {
      const friend = await this.getUser(friendId);
      if (friend) {
        friends.push(friend);
      }
    }

    return friends;
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

    // Add to both users' friend lists
    await db
      .update(appSchema.lifestyleUsers)
      .set({
        friendIds: [...friendIds, friendId],
      })
      .where(eq(appSchema.lifestyleUsers.id, userId));

    const friendFriendIds = friend.friendIds || [];
    if (!friendFriendIds.includes(userId)) {
      await db
        .update(appSchema.lifestyleUsers)
        .set({
          friendIds: [...friendFriendIds, userId],
        })
        .where(eq(appSchema.lifestyleUsers.id, friendId));
    }

    return { success: true, message: "Friend added successfully" };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Convert database user record to application User type
   */
  private dbUserToAppUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      avatar: dbUser.avatar,
      bio: dbUser.bio || "",
      allowFriendsToFind: dbUser.allowFriendsToFind,
      isProfilePrivate: dbUser.isProfilePrivate,
      profileSetupComplete: dbUser.profileSetupComplete,
      onboardingComplete: dbUser.onboardingComplete,
      mode: dbUser.mode,
      streak: dbUser.streak,
      highestStreak: dbUser.highestStreak,
      freezeTokens: dbUser.freezeTokens,
      frozenDates: dbUser.frozenDates || [],
      streakCalendar: dbUser.streakCalendar || [],
      moneyHealth: dbUser.moneyHealth,
      totalScore: dbUser.totalScore,
      gamesPlayed: dbUser.gamesPlayed,
      lastPlayedDate: dbUser.lastPlayedDate,
      stats: dbUser.stats,
      todayResult: dbUser.todayResult,
      badges: dbUser.badges || createInitialBadges(),
      perfectGames: dbUser.perfectGames,
      scamStreak: dbUser.scamStreak,
      hadPreviousStreak: dbUser.hadPreviousStreak,
      lowPressureMode: dbUser.lowPressureMode,
      soundEnabled: dbUser.soundEnabled,
      notificationPrefs: dbUser.notificationPrefs || defaultNotificationPrefs,
      streakInsurance: dbUser.streakInsurance || defaultStreakInsurance,
      gameHistory: dbUser.gameHistory || [],
      categoryStats: dbUser.categoryStats || [],
      referralCode: dbUser.referralCode,
      referredBy: dbUser.referredBy,
      referralCount: dbUser.referralCount,
      friendIds: dbUser.friendIds || [],
      membershipTier: dbUser.membershipTier || "free",
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

    // Mystery Scenario Friday: Add 6th bonus question on Fridays
    const dayOfWeek = new Date(today).getDay();
    const isFriday = dayOfWeek === 5;
    if (isFriday) {
      // Get a random "mystery" scenario from a different day
      const mysteryDayIndex = Math.floor(Math.random() * 30);
      const mysteryScenarios = getDailyScenarios(mysteryDayIndex + 1);
      const mysteryScenario = mysteryScenarios[Math.floor(Math.random() * mysteryScenarios.length)];

      // Make it worth 150 points (50% bonus)
      const enhancedMystery = {
        ...mysteryScenario,
        id: crypto.randomUUID(), // New ID to avoid conflicts
        choices: mysteryScenario.choices.map(choice => ({
          ...choice,
          points: Math.round(choice.points * 1.5), // 150pts max instead of 100
        })),
      };

      shuffledScenarios.push(shuffleScenarioChoices(enhancedMystery, today));
      console.log(`🎉 Mystery Friday! Added bonus scenario worth 150pts`);
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

    // Reset today's results for all users (new day)
    await db
      .update(appSchema.lifestyleUsers)
      .set({ todayResult: null })
      .where(sql`1=1`); // Update all users

    return newDrop;
  }

  async submitGame(sessionId: string, submission: SubmitGame): Promise<UserGameResult> {
    const user = await this.getOrCreateUser(sessionId);
    const drop = await this.getDailyDrop();

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
          totalScore += choice.points;
          if (isCorrect) correctCount++;
        }
        answerLabels.push(answer.choiceLabel);

        const catStats = categoryResults.get(scenario.category) || { correct: 0, total: 0 };
        catStats.total++;
        if (isCorrect) catStats.correct++;
        categoryResults.set(scenario.category, catStats);
      }
    });

    const maxScore = drop.scenarios.length * 100;
    const iq = Math.max(0, Math.min(500, Math.round((totalScore / maxScore) * 500 + 250)));
    const accuracy = correctCount / drop.scenarios.length;
    const moneyHealth = Math.max(0, Math.min(100, Math.round(50 + accuracy * 50)));

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

    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const wasFrozenYesterday = user.frozenDates.includes(yesterdayStr);
    const playedYesterday = user.lastPlayedDate === yesterdayStr;

    let newStreak: number;
    if (playedYesterday || wasFrozenYesterday) {
      newStreak = user.streak + 1;
    } else {
      newStreak = 1;
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

    const newGameHistory = [...user.gameHistory, historyEntry].slice(-30);

    const newCategoryStats = [...user.categoryStats];
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

    await this.updateUser(sessionId, {
      streak: newStreak,
      highestStreak: newHighestStreak,
      streakCalendar: newStreakCalendar,
      moneyHealth,
      totalScore: user.totalScore + totalScore,
      gamesPlayed: user.gamesPlayed + 1,
      lastPlayedDate: today,
      stats: newStats,
      todayResult: result,
      gameHistory: newGameHistory,
      categoryStats: newCategoryStats,
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
      })
      .from(appSchema.lifestyleUsers)
      .orderBy(desc(appSchema.lifestyleUsers.moneyHealth))
      .limit(limit);

    return users.map((user, index) => ({
      ...user,
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

    // Get all members with their user info
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
    // Get all league IDs where user is a member
    const membershipResults = await db
      .select({ leagueId: appSchema.leagueMembers.leagueId })
      .from(appSchema.leagueMembers)
      .where(eq(appSchema.leagueMembers.userId, userId));

    const userLeagues: League[] = [];
    for (const membership of membershipResults) {
      const league = await this.getLeague(membership.leagueId);
      if (league) userLeagues.push(league);
    }

    return userLeagues;
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
    const challengeResults = await db
      .select({ id: appSchema.challenges.id })
      .from(appSchema.challenges)
      .where(
        or(
          eq(appSchema.challenges.challengerId, userId),
          eq(appSchema.challenges.challengeeId, userId)
        )
      )
      .orderBy(desc(appSchema.challenges.createdAt));

    const challenges: Challenge[] = [];
    for (const result of challengeResults) {
      const challenge = await this.getChallenge(result.id);
      if (challenge) challenges.push(challenge);
    }

    return challenges;
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

    return user.badges;
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

    await this.updateUser(userId, {
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

  async getCommunityScenarios(userId: string, category?: string, sortBy: "latest" | "hot" | "realest" = "hot"): Promise<CommunityScenario[]> {
    let query = db
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
      );

    if (category) {
      query = query.where(eq(appSchema.communityScenarios.category, category as any));
    }

    const scenarios = await query;

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

    // Sort based on sortBy parameter
    if (sortBy === "latest") {
      scenariosWithVotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "hot") {
      // Hot = most votes in the last week
      scenariosWithVotes.sort((a, b) => {
        const aScore = a.upvotes - a.downvotes;
        const bScore = b.upvotes - b.downvotes;
        return bScore - aScore;
      });
    } else if (sortBy === "realest") {
      // Sort by votes but only "real" scenarios
      scenariosWithVotes
        .filter(s => s.type === "real")
        .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }

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
    // Check if user already voted
    const existingVote = await db
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
        await db
          .delete(appSchema.communityVotes)
          .where(eq(appSchema.communityVotes.id, oldVote.id));

        // Update scenario counts
        if (voteType === "up") {
          await db
            .update(appSchema.communityScenarios)
            .set({ upvotes: sql`${appSchema.communityScenarios.upvotes} - 1` })
            .where(eq(appSchema.communityScenarios.id, scenarioId));
        } else {
          await db
            .update(appSchema.communityScenarios)
            .set({ downvotes: sql`${appSchema.communityScenarios.downvotes} - 1` })
            .where(eq(appSchema.communityScenarios.id, scenarioId));
        }
      } else {
        // Change vote
        await db
          .update(appSchema.communityVotes)
          .set({ type: voteType })
          .where(eq(appSchema.communityVotes.id, oldVote.id));

        // Update scenario counts
        if (voteType === "up") {
          await db
            .update(appSchema.communityScenarios)
            .set({
              upvotes: sql`${appSchema.communityScenarios.upvotes} + 1`,
              downvotes: sql`${appSchema.communityScenarios.downvotes} - 1`,
            })
            .where(eq(appSchema.communityScenarios.id, scenarioId));
        } else {
          await db
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
      await db.insert(appSchema.communityVotes).values({
        id: crypto.randomUUID(),
        scenarioId,
        commentId: null,
        userId,
        type: voteType,
      });

      // Update scenario counts
      if (voteType === "up") {
        await db
          .update(appSchema.communityScenarios)
          .set({ upvotes: sql`${appSchema.communityScenarios.upvotes} + 1` })
          .where(eq(appSchema.communityScenarios.id, scenarioId));
      } else {
        await db
          .update(appSchema.communityScenarios)
          .set({ downvotes: sql`${appSchema.communityScenarios.downvotes} + 1` })
          .where(eq(appSchema.communityScenarios.id, scenarioId));
      }
    }

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

    await db.insert(appSchema.communityComments).values({
      id: commentId,
      scenarioId: data.scenarioId,
      parentId: data.parentId || null,
      authorId: userId,
      content: data.content,
      isAdvice: data.isAdvice,
    });

    // Increment comment count on scenario
    await db
      .update(appSchema.communityScenarios)
      .set({ commentCount: sql`${appSchema.communityScenarios.commentCount} + 1` })
      .where(eq(appSchema.communityScenarios.id, data.scenarioId));

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

    return {
      ...commentResult[0],
      userVote: null,
      createdAt: commentResult[0].createdAt.toISOString(),
    };
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

  async createCoopSession(hostId: string): Promise<CoopSession> {
    const host = await this.getUser(hostId);
    if (!host) throw new Error("Host user not found");

    const sessionId = crypto.randomUUID();
    const code = generateInviteCode();
    const drop = await this.getDailyDrop();

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
      status: "waiting",
      dropId: drop.id,
      currentQuestionIndex: 0,
      questionStartTime: 0, // Will be set when game starts
      players: [hostPlayer],
    });

    return this.getCoopSession(sessionId) as Promise<CoopSession>;
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
      status: session.status,
      dropId: session.dropId,
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
        status: "playing",
        players: updatedPlayers,
        startedAt: new Date(),
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

  async submitCoopAnswer(sessionId: string, playerId: string, scenarioId: string, choiceLabel: string): Promise<CoopSession | undefined> {
    const session = await this.getCoopSession(sessionId);
    if (!session) return undefined;

    const drop = await this.getDailyDrop();
    const scenario = drop.scenarios.find(s => s.id === scenarioId);
    if (!scenario) return undefined;

    const choice = scenario.choices.find(c => c.label === choiceLabel);
    if (!choice) return undefined;

    // Update player's answers
    const updatedPlayers = session.players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          answers: { ...p.answers, [scenarioId]: choiceLabel },
          score: p.score + choice.points,
        };
      }
      return p;
    });

    // Check if both players answered
    const allAnswered = updatedPlayers.every(p => p.answers[scenarioId]);

    let updates: any = { players: updatedPlayers };

    if (allAnswered && session.currentQuestionIndex < drop.scenarios.length - 1) {
      // Move to next question
      updates.currentQuestionIndex = session.currentQuestionIndex + 1;
      updates.questionStartTime = Math.floor(Date.now() / 1000); // Store as seconds (Unix timestamp)
    } else if (allAnswered && session.currentQuestionIndex === drop.scenarios.length - 1) {
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

    const drop = await this.getDailyDrop();

    const playerResults = session.players.map(p => {
      const answers = Object.entries(p.answers).map(([scenarioId, choiceLabel]) => {
        const scenario = drop.scenarios.find(s => s.id === scenarioId);
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
      totalQuestions: drop.scenarios.length,
      winner,
    };
  }
}

// Export a singleton instance
export const postgresStorage = new PostgresStorage();
