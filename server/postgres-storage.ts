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
      onboardingComplete: false,
      mode: null,
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

    // Get actual friends
    const friends = await db
      .select()
      .from(appSchema.lifestyleUsers)
      .where(sql`${appSchema.lifestyleUsers.id} = ANY(${friendIds})`);

    return friends.map(u => this.dbUserToAppUser(u));
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
    };
  }

  // ============================================
  // PLACEHOLDER METHODS (To be implemented in next steps)
  // ============================================

  async getDailyDrop(): Promise<DailyDrop> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async submitGame(sessionId: string, submission: SubmitGame): Promise<UserGameResult> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async createLeague(userId: string, data: CreateLeague): Promise<League> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async getLeague(leagueId: string): Promise<League | undefined> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async getLeagueByCode(inviteCode: string): Promise<League | undefined> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async joinLeague(userId: string, inviteCode: string): Promise<League | undefined> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async leaveLeague(userId: string, leagueId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async getUserLeagues(userId: string): Promise<League[]> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async createChallenge(challengerId: string, data: CreateChallenge): Promise<Challenge> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async getChallenge(challengeId: string): Promise<Challenge | undefined> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async respondToChallenge(challengeId: string, userId: string, accept: boolean): Promise<Challenge | undefined> {
    throw new Error("Not implemented yet - Step 2c");
  }

  async useStreakFreeze(userId: string): Promise<{ success: boolean; message: string }> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async addFreezeToken(userId: string, count?: number): Promise<User | undefined> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async getStreakCalendar(userId: string, days?: number): Promise<StreakDay[]> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async getBadges(userId: string): Promise<UserBadge[]> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async updateBadgeProgress(userId: string, badgeId: BadgeId, progress: number): Promise<UserBadge | undefined> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async useStreakBuyback(userId: string): Promise<{ success: boolean; message: string; restoredStreak?: number }> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async useLatePass(userId: string): Promise<{ success: boolean; message: string; drop?: DailyDrop }> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async togglePlusStatus(userId: string, isPlus: boolean): Promise<User | undefined> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async createCommunityScenario(userId: string, data: CreateCommunityScenario): Promise<CommunityScenario> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getCommunityScenarios(userId: string, category?: string, sortBy?: "latest" | "hot" | "realest"): Promise<CommunityScenario[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getCommunityScenario(scenarioId: string, userId: string): Promise<CommunityScenario | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async voteCommunityScenario(userId: string, scenarioId: string, voteType: "up" | "down"): Promise<CommunityScenario | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getScenarioComments(scenarioId: string, userId: string): Promise<CommunityComment[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async addComment(userId: string, data: CreateCommunityComment): Promise<CommunityComment> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async voteComment(userId: string, commentId: string, voteType: "up" | "down"): Promise<CommunityComment | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getRealistOfWeek(userId: string): Promise<CommunityScenario[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async isAdmin(userId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async isModerator(userId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getModerators(): Promise<Moderator[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async addModerator(userId: string, assignedBy: string): Promise<Moderator | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async removeModerator(userId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getBannedUsers(): Promise<BannedUser[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async banUser(data: BanUser, bannedBy: string): Promise<BannedUser | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async unbanUser(userId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async isUserBanned(userId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getAdminScenarios(): Promise<AdminScenario[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getAdminScenario(scenarioId: string): Promise<AdminScenario | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async createAdminScenario(userId: string, data: CreateAdminScenario): Promise<AdminScenario> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async updateAdminScenario(scenarioId: string, data: Partial<CreateAdminScenario>): Promise<AdminScenario | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async deleteAdminScenario(scenarioId: string): Promise<boolean> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async publishAdminScenario(scenarioId: string): Promise<AdminScenario | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getAllUsersForAdmin(): Promise<Pick<User, "id" | "username" | "avatar" | "moneyHealth" | "gamesPlayed">[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getDailyStats(): Promise<{ playersToday: number; totalPlayers: number }> {
    throw new Error("Not implemented yet - Step 2b");
  }

  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getPushSubscription(userId: string): Promise<any> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getAllPushSubscriptions(): Promise<{ userId: string; subscription: any }[]> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async createCoopSession(hostId: string): Promise<CoopSession> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getCoopSession(sessionId: string): Promise<CoopSession | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getCoopSessionByCode(code: string): Promise<CoopSession | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async joinCoopSession(guestId: string, code: string): Promise<CoopSession | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async updateCoopSession(sessionId: string, updates: Partial<CoopSession>): Promise<CoopSession | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async submitCoopAnswer(sessionId: string, playerId: string, scenarioId: string, choiceLabel: string): Promise<CoopSession | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }

  async getCoopGameResult(sessionId: string): Promise<CoopGameResult | undefined> {
    throw new Error("Not implemented yet - Step 2d");
  }
}

// Export a singleton instance
export const postgresStorage = new PostgresStorage();
