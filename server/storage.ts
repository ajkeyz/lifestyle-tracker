import type {
  User,
  UserStats,
  UserGameResult,
  DailyDrop,
  Scenario,
  LeaderboardEntry,
  SubmitGame,
  SubmitArcadeGame,
  ArcadeGameResult,
  ArcadeStatus,
  GameMode,
  League,
  LeagueMember,
  CreateLeague,
  Challenge,
  ChallengeType,
  CreateChallenge,
  StreakDay,
  UserBadge,
  BadgeId,
  CommunityScenario,
  CommunityComment,
  CommunityVote,
  CreateCommunityScenario,
  CreateCommunityComment,
  AdminScenario,
  CreateAdminScenario,
  Moderator,
  BannedUser,
  BanUser,
  GameHistoryEntry,
  CategoryStats,
  CoopSession,
  CoopPlayer,
  CoopGameResult,
  CoopMode,
} from "@shared/schema";
import { BADGE_DEFINITIONS, ARCADE_LIMITS, defaultNotificationPrefs, defaultStreakInsurance } from "@shared/schema";
import { randomUUID } from "crypto";
import { getDailyScenarios, getArcadeScenarios } from "./static-scenarios";

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayNumber(): number {
  const start = new Date("2024-01-01");
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

const defaultStats: UserStats = {
  cash: 3000,
  debt: 500,
  credit: 680,
  stress: 50,
  investment: 2000,
};

export interface IStorage {
  getUser(sessionId: string): Promise<User | undefined>;
  getOrCreateUser(sessionId: string): Promise<User>;
  updateUser(sessionId: string, updates: Partial<User>): Promise<User | undefined>;
  checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean>;
  searchUserByUsername(username: string, excludeUserId?: string): Promise<{ found: boolean; username: string | null; userId: string | null }>;
  getDailyDrop(): Promise<DailyDrop>;
  submitGame(sessionId: string, submission: SubmitGame): Promise<UserGameResult>;
  getLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  // League methods
  createLeague(userId: string, data: CreateLeague): Promise<League>;
  getLeague(leagueId: string): Promise<League | undefined>;
  getLeagueByCode(inviteCode: string): Promise<League | undefined>;
  joinLeague(userId: string, inviteCode: string): Promise<League | undefined>;
  leaveLeague(userId: string, leagueId: string): Promise<boolean>;
  getUserLeagues(userId: string): Promise<League[]>;
  // Challenge methods
  createChallenge(challengerId: string, data: CreateChallenge): Promise<Challenge>;
  getChallenge(challengeId: string): Promise<Challenge | undefined>;
  getUserChallenges(userId: string): Promise<Challenge[]>;
  respondToChallenge(challengeId: string, userId: string, accept: boolean): Promise<Challenge | undefined>;
  getFriends(userId: string): Promise<User[]>;
  addFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }>;
  // Streak protection methods
  useStreakFreeze(userId: string): Promise<{ success: boolean; message: string }>;
  addFreezeToken(userId: string, count?: number): Promise<User | undefined>;
  getStreakCalendar(userId: string, days?: number): Promise<StreakDay[]>;
  // Badge methods
  getBadges(userId: string): Promise<UserBadge[]>;
  updateBadgeProgress(userId: string, badgeId: BadgeId, progress: number): Promise<UserBadge | undefined>;
  // Streak Insurance methods
  useStreakBuyback(userId: string): Promise<{ success: boolean; message: string; restoredStreak?: number }>;
  useLatePass(userId: string): Promise<{ success: boolean; message: string; drop?: DailyDrop }>;
  togglePlusStatus(userId: string, isPlus: boolean): Promise<User | undefined>;
  // Community methods
  createCommunityScenario(userId: string, data: CreateCommunityScenario): Promise<CommunityScenario>;
  getCommunityScenarios(userId: string, category?: string, sortBy?: "latest" | "hot" | "realest"): Promise<CommunityScenario[]>;
  getCommunityScenario(scenarioId: string, userId: string): Promise<CommunityScenario | undefined>;
  voteCommunityScenario(userId: string, scenarioId: string, voteType: "up" | "down"): Promise<CommunityScenario | undefined>;
  getScenarioComments(scenarioId: string, userId: string): Promise<CommunityComment[]>;
  addComment(userId: string, data: CreateCommunityComment): Promise<CommunityComment>;
  voteComment(userId: string, commentId: string, voteType: "up" | "down"): Promise<CommunityComment | undefined>;
  getRealistOfWeek(userId: string): Promise<CommunityScenario[]>;
  getTopCreators(limit: number): Promise<any[]>;
  // Membership methods
  updateMembershipTier(userId: string, tier: "free" | "plus" | "pro"): Promise<User>;
  // Admin methods
  isAdmin(userId: string): Promise<boolean>;
  isModerator(userId: string): Promise<boolean>;
  getModerators(): Promise<Moderator[]>;
  addModerator(userId: string, assignedBy: string): Promise<Moderator | undefined>;
  removeModerator(userId: string): Promise<boolean>;
  getBannedUsers(): Promise<BannedUser[]>;
  banUser(data: BanUser, bannedBy: string): Promise<BannedUser | undefined>;
  unbanUser(userId: string): Promise<boolean>;
  isUserBanned(userId: string): Promise<boolean>;
  getAdminScenarios(): Promise<AdminScenario[]>;
  getAdminScenario(scenarioId: string): Promise<AdminScenario | undefined>;
  createAdminScenario(userId: string, data: CreateAdminScenario): Promise<AdminScenario>;
  updateAdminScenario(scenarioId: string, data: Partial<CreateAdminScenario>): Promise<AdminScenario | undefined>;
  deleteAdminScenario(scenarioId: string): Promise<boolean>;
  publishAdminScenario(scenarioId: string): Promise<AdminScenario | undefined>;
  getAllUsersForAdmin(): Promise<Pick<User, "id" | "username" | "avatar" | "moneyHealth" | "gamesPlayed">[]>;
  // Daily stats for social proof
  getDailyStats(): Promise<{ playersToday: number; totalPlayers: number }>;
  // Referral system
  getUserByReferralCode(code: string): Promise<User | undefined>;
  applyReferralBonus(referrerId: string, referredUserId: string): Promise<boolean>;
  // Push notification methods
  savePushSubscription(userId: string, subscription: PushSubscriptionJSON): Promise<void>;
  getPushSubscription(userId: string): Promise<PushSubscriptionJSON | null>;
  removePushSubscription(userId: string, endpoint: string): Promise<void>;
  getAllPushSubscriptions(): Promise<{ userId: string; subscription: PushSubscriptionJSON }[]>;
  // Co-op game session methods
  createCoopSession(hostId: string, mode?: CoopMode, arcadeGameIndex?: number | null): Promise<CoopSession>;
  getCoopSession(sessionId: string): Promise<CoopSession | undefined>;
  getCoopSessionByCode(code: string): Promise<CoopSession | undefined>;
  joinCoopSession(guestId: string, code: string): Promise<CoopSession | undefined>;
  updateCoopSession(sessionId: string, updates: Partial<CoopSession>): Promise<CoopSession | undefined>;
  submitCoopAnswer(sessionId: string, playerId: string, scenarioId: string, choiceLabel: string): Promise<CoopSession | undefined>;
  getCoopGameResult(sessionId: string): Promise<CoopGameResult | undefined>;
  // Arcade mode methods
  getArcadeDrop(userId: string, gameIndex?: number): Promise<DailyDrop>;
  submitArcadeGame(userId: string, submission: SubmitArcadeGame): Promise<ArcadeGameResult>;
  getArcadeStatus(userId: string): Promise<ArcadeStatus>;
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
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

function createInitialBadges(): UserBadge[] {
  return BADGE_DEFINITIONS.map(def => ({
    badgeId: def.id,
    unlocked: false,
    unlockedAt: null,
    progress: 0,
  }));
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
}

interface StoredCommunityScenario {
  id: string;
  authorId: string;
  title: string;
  context: string;
  question: string;
  type: "real" | "hypothetical";
  category: "tech" | "travel" | "lifestyle" | "scam" | "investing" | "debt" | "career" | "relationships";
  createdAt: string;
  weekNumber: number;
  isRealistOfWeek: boolean;
}

interface StoredCommunityComment {
  id: string;
  scenarioId: string;
  parentId: string | null;
  authorId: string;
  content: string;
  isAdvice: boolean;
  createdAt: string;
}

interface StoredCommunityVote {
  id: string;
  scenarioId: string | null;
  commentId: string | null;
  userId: string;
  type: "up" | "down";
  createdAt: string;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private leagues: Map<string, League> = new Map();
  private challenges: Map<string, Challenge> = new Map();
  private communityScenarios: Map<string, StoredCommunityScenario> = new Map();
  private communityComments: Map<string, StoredCommunityComment> = new Map();
  private communityVotes: Map<string, StoredCommunityVote> = new Map();
  private dailyDrop: DailyDrop;
  // Admin data
  private adminScenarios: Map<string, AdminScenario> = new Map();
  private moderators: Map<string, Moderator> = new Map();
  private bannedUsers: Map<string, BannedUser> = new Map();
  private adminUserIds: Set<string> = new Set(["admin", "608498"]); // Default admin users
  // Push notification subscriptions
  private pushSubscriptions: Map<string, PushSubscriptionJSON[]> = new Map();
  // Co-op game sessions
  private coopSessions: Map<string, CoopSession> = new Map();

  constructor() {
    const today = getTodayDateString();
    // Shuffle choices for each scenario so correct answer isn't always in same position
    // Use static scenarios based on the day number (cycles through 30 days)
    const dropNumber = getDayNumber();
    const todayScenarios = getDailyScenarios(dropNumber);
    const shuffledScenarios = todayScenarios.map(scenario => 
      shuffleScenarioChoices(scenario, today)
    );
    
    this.dailyDrop = {
      id: randomUUID(),
      dropNumber: dropNumber,
      date: today,
      scenarios: shuffledScenarios,
    };
    console.log(`Initialized with static scenarios for day ${dropNumber} (${today})`);

    this.seedLeaderboard();
    this.seedCommunityScenarios();
  }

  private seedCommunityScenarios() {
    const sampleCommunityScenarios: StoredCommunityScenario[] = [
      {
        id: "comm-1",
        authorId: "seed-0",
        title: "Friend asked me to split Airbnb but wants the master bedroom",
        context: "Going on a trip with 4 friends. One friend found a $2000/night Airbnb and wants to split evenly but also wants the master bedroom with private bathroom. Is this fair?",
        question: "Should I push back on the uneven split or just go with it to keep the peace?",
        type: "real",
        category: "relationships",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        weekNumber: getWeekNumber(),
        isRealistOfWeek: true,
      },
      {
        id: "comm-2",
        authorId: "seed-1",
        title: "Got a raise but my lifestyle is already maxed out",
        context: "Just got a 20% raise but I'm already living paycheck to paycheck. I want to celebrate but know I should save. My friends all expect me to upgrade my lifestyle now.",
        question: "How do I resist lifestyle creep when everyone expects me to spend more?",
        type: "real",
        category: "lifestyle",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        weekNumber: getWeekNumber(),
        isRealistOfWeek: false,
      },
      {
        id: "comm-3",
        authorId: "seed-2",
        title: "Crypto bro at work keeps pushing me to invest",
        context: "A coworker won't stop telling me about his crypto gains. He says I'm 'missing out' on generational wealth. I have $5k in savings and no emergency fund yet.",
        question: "Should I put some money in crypto or focus on building my emergency fund first?",
        type: "real",
        category: "investing",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        weekNumber: getWeekNumber(),
        isRealistOfWeek: false,
      },
      {
        id: "comm-4",
        authorId: "seed-3",
        title: "What if I just ignored all my student loans?",
        context: "Hypothetically, what would actually happen if I just never paid my student loans? Like, what's the worst case scenario?",
        question: "Is ignoring student loans ever a viable strategy?",
        type: "hypothetical",
        category: "debt",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        weekNumber: getWeekNumber(),
        isRealistOfWeek: false,
      },
      {
        id: "comm-5",
        authorId: "seed-4",
        title: "Boss offered equity instead of a raise",
        context: "My startup boss said they can't afford raises but offered 0.5% equity. Company is pre-revenue but has 'big potential'. I need the cash but don't want to miss out.",
        question: "Should I take the equity or push for actual money?",
        type: "real",
        category: "career",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        weekNumber: getWeekNumber(),
        isRealistOfWeek: false,
      },
    ];

    sampleCommunityScenarios.forEach(s => {
      this.communityScenarios.set(s.id, s);
    });

    // Add some sample votes
    const sampleVotes: StoredCommunityVote[] = [
      { id: "vote-1", scenarioId: "comm-1", commentId: null, userId: "seed-1", type: "up", createdAt: new Date().toISOString() },
      { id: "vote-2", scenarioId: "comm-1", commentId: null, userId: "seed-2", type: "up", createdAt: new Date().toISOString() },
      { id: "vote-3", scenarioId: "comm-1", commentId: null, userId: "seed-3", type: "up", createdAt: new Date().toISOString() },
      { id: "vote-4", scenarioId: "comm-2", commentId: null, userId: "seed-0", type: "up", createdAt: new Date().toISOString() },
      { id: "vote-5", scenarioId: "comm-3", commentId: null, userId: "seed-0", type: "up", createdAt: new Date().toISOString() },
      { id: "vote-6", scenarioId: "comm-3", commentId: null, userId: "seed-1", type: "down", createdAt: new Date().toISOString() },
    ];
    sampleVotes.forEach(v => this.communityVotes.set(v.id, v));

    // Add some sample comments
    const sampleComments: StoredCommunityComment[] = [
      {
        id: "comment-1",
        scenarioId: "comm-1",
        parentId: null,
        authorId: "seed-1",
        content: "Master bedroom should cost more. Suggest a 60/40 split or find a different Airbnb with equal rooms.",
        isAdvice: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "comment-2",
        scenarioId: "comm-1",
        parentId: null,
        authorId: "seed-2",
        content: "Been there! We rotated rooms each night. Fairest solution.",
        isAdvice: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "comment-3",
        scenarioId: "comm-3",
        parentId: null,
        authorId: "seed-4",
        content: "Emergency fund FIRST. Always. Crypto can wait - your peace of mind can't.",
        isAdvice: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ];
    sampleComments.forEach(c => this.communityComments.set(c.id, c));
  }

  private seedLeaderboard() {
    const names = ["Jade", "Sipho", "Max", "Luna", "Kai"];
    const modes: GameMode[] = ["tech", "global", "scam", "student", "boss"];
    const avatars = ["cat", "dog", "bird", "robot", "ghost"];
    names.forEach((name, i) => {
      const id = `seed-${i}`;
      const streak = Math.floor(Math.random() * 15) + 1;
      this.users.set(id, {
        id,
        username: name,
        avatar: avatars[i],
        bio: "",
        allowFriendsToFind: true,
        isProfilePrivate: false,
        profileSetupComplete: true,
        onboardingComplete: true,
        mode: modes[i % modes.length],
        streak,
        highestStreak: streak + Math.floor(Math.random() * 5),
        freezeTokens: Math.floor(Math.random() * 3),
        frozenDates: [],
        streakCalendar: [],
        moneyHealth: 90 - i * 8,
        totalScore: 1000 - i * 100,
        gamesPlayed: Math.floor(Math.random() * 20) + 5,
        lastPlayedDate: getTodayDateString(),
        stats: {
          cash: 5000 + Math.random() * 3000,
          debt: Math.random() * 1000,
          credit: 700 + Math.random() * 50,
          stress: 30 + Math.random() * 30,
          investment: 10000 + Math.random() * 20000,
        },
        todayResult: null,
        badges: createInitialBadges(),
        perfectGames: 0,
        scamStreak: 0,
        hadPreviousStreak: false,
        lowPressureMode: false,
        soundEnabled: true,
        notificationPrefs: { ...defaultNotificationPrefs },
        streakInsurance: { ...defaultStreakInsurance, isPlus: i < 2 },
        gameHistory: [],
        categoryStats: [],
        referralCode: generateInviteCode(),
        referredBy: null,
        referralCount: 0,
        friendIds: [],
        membershipTier: "free" as const,
        arcadePlaysToday: 0,
        arcadeLastPlayedDate: null,
      });
    });
  }

  async getUser(sessionId: string): Promise<User | undefined> {
    return this.users.get(sessionId);
  }

  async getOrCreateUser(sessionId: string): Promise<User> {
    let user = this.users.get(sessionId);
    if (!user) {
      user = {
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
        stats: { ...defaultStats },
        todayResult: null,
        badges: createInitialBadges(),
        perfectGames: 0,
        scamStreak: 0,
        hadPreviousStreak: false,
        lowPressureMode: false,
        soundEnabled: true,
        notificationPrefs: { ...defaultNotificationPrefs },
        streakInsurance: { ...defaultStreakInsurance },
        gameHistory: [],
        categoryStats: [],
        referralCode: generateInviteCode(),
        referredBy: null,
        referralCount: 0,
        friendIds: [],
        membershipTier: "free" as const,
        arcadePlaysToday: 0,
        arcadeLastPlayedDate: null,
        moneyPhilosophy: "",
        whyImHere: "",
        friendVisibility: "trend" as const,
      };
      this.users.set(sessionId, user);
    }
    return user;
  }

  async checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const lowerUsername = username.toLowerCase();
    const entries = Array.from(this.users.entries());
    for (const [id, user] of entries) {
      if (excludeUserId && id === excludeUserId) continue;
      if (user.username.toLowerCase() === lowerUsername) {
        return false;
      }
    }
    return true;
  }

  async searchUserByUsername(username: string, excludeUserId?: string): Promise<{ found: boolean; username: string | null; userId: string | null }> {
    const lowerUsername = username.toLowerCase();
    const entries = Array.from(this.users.entries());
    for (const [id, user] of entries) {
      if (excludeUserId && id === excludeUserId) continue;
      if (user.allowFriendsToFind && user.username.toLowerCase().includes(lowerUsername)) {
        return { found: true, username: user.username, userId: user.id };
      }
    }
    return { found: false, username: null, userId: null };
  }

  async updateUser(sessionId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(sessionId);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(sessionId, updated);
    return updated;
  }

  async getDailyDrop(): Promise<DailyDrop> {
    const today = getTodayDateString();
    
    // Check if we need to load new scenarios for today
    if (this.dailyDrop.date !== today) {
      // Get the day number (cycles 1-30)
      const dropNumber = getDayNumber();
      
      // Get static scenarios for this day (cycles through 30 days of content)
      const todayScenarios = getDailyScenarios(dropNumber);
      
      // Shuffle the choices for each scenario to prevent memorization
      const shuffledScenarios = todayScenarios.map(scenario => 
        shuffleScenarioChoices(scenario, today)
      );
      
      this.dailyDrop = {
        id: randomUUID(),
        dropNumber: dropNumber,
        date: today,
        scenarios: shuffledScenarios,
      };
      
      console.log(`Loaded static scenarios for day ${dropNumber} (${today})`);
      
      // Reset today's results for all users
      this.users.forEach((user, id) => {
        this.users.set(id, { ...user, todayResult: null });
      });
    }
    return this.dailyDrop;
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
    const users = Array.from(this.users.values());
    return users
      .sort((a, b) => b.moneyHealth - a.moneyHealth)
      .slice(0, limit)
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        moneyHealth: user.moneyHealth,
        streak: user.streak,
        rank: index + 1,
      }));
  }

  async createLeague(userId: string, data: CreateLeague): Promise<League> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const league: League = {
      id: randomUUID(),
      name: data.name,
      emoji: data.emoji,
      privacy: data.privacy,
      inviteCode: generateInviteCode(),
      createdBy: userId,
      createdAt: new Date().toISOString(),
      members: [{
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        weeklyScore: user.todayResult?.score || 0,
        weeklyRank: 1,
        isWeeklyWinner: false,
      }],
      weekStartDate: getWeekStartDate(),
      previousWeekWinner: null,
    };

    this.leagues.set(league.id, league);
    return league;
  }

  async getLeague(leagueId: string): Promise<League | undefined> {
    const league = this.leagues.get(leagueId);
    if (!league) return undefined;

    // Update weekly ranks
    const sortedMembers = [...league.members].sort((a, b) => b.weeklyScore - a.weeklyScore);
    sortedMembers.forEach((m, i) => {
      m.weeklyRank = i + 1;
      m.isWeeklyWinner = i === 0 && m.weeklyScore > 0;
    });

    return { ...league, members: sortedMembers };
  }

  async getLeagueByCode(inviteCode: string): Promise<League | undefined> {
    const upperCode = inviteCode.toUpperCase();
    const allLeagues = Array.from(this.leagues.values());
    for (const league of allLeagues) {
      if (league.inviteCode === upperCode) {
        return this.getLeague(league.id);
      }
    }
    return undefined;
  }

  async joinLeague(userId: string, inviteCode: string): Promise<League | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const league = await this.getLeagueByCode(inviteCode);
    if (!league) return undefined;

    // Check if already a member
    if (league.members.some(m => m.userId === userId)) {
      return league;
    }

    const newMember: LeagueMember = {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      weeklyScore: user.todayResult?.score || 0,
      weeklyRank: league.members.length + 1,
      isWeeklyWinner: false,
    };

    league.members.push(newMember);
    this.leagues.set(league.id, league);
    return this.getLeague(league.id);
  }

  async leaveLeague(userId: string, leagueId: string): Promise<boolean> {
    const league = this.leagues.get(leagueId);
    if (!league) return false;

    const memberIndex = league.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) return false;

    league.members.splice(memberIndex, 1);

    // Delete league if empty
    if (league.members.length === 0) {
      this.leagues.delete(leagueId);
    } else {
      this.leagues.set(leagueId, league);
    }

    return true;
  }

  async getUserLeagues(userId: string): Promise<League[]> {
    const userLeagues: League[] = [];
    const allLeagues = Array.from(this.leagues.values());
    for (const league of allLeagues) {
      if (league.members.some((m: LeagueMember) => m.userId === userId)) {
        const fullLeague = await this.getLeague(league.id);
        if (fullLeague) userLeagues.push(fullLeague);
      }
    }
    return userLeagues;
  }

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
      challengerValue = challenger.todayResult ? Math.round((challenger.todayResult.score / 500) * 100) : 0;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const challenge: Challenge = {
      id: randomUUID(),
      challengerId,
      challengerUsername: challenger.username,
      challengerAvatar: challenger.avatar,
      challengeeId: data.challengeeId,
      challengeeUsername: challengee.username,
      challengeeAvatar: challengee.avatar,
      type: data.type,
      trashTalk: data.trashTalk,
      customMessage: data.customMessage || null,
      status: "pending",
      challengerValue,
      challengeeValue: null,
      winnerId: null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      completedAt: null,
      badgeAwarded: null,
    };

    this.challenges.set(challenge.id, challenge);
    return challenge;
  }

  async getChallenge(challengeId: string): Promise<Challenge | undefined> {
    return this.challenges.get(challengeId);
  }

  async getUserChallenges(userId: string): Promise<Challenge[]> {
    const userChallenges: Challenge[] = [];
    const allChallenges = Array.from(this.challenges.values());
    for (const challenge of allChallenges) {
      if (challenge.challengerId === userId || challenge.challengeeId === userId) {
        userChallenges.push(challenge);
      }
    }
    return userChallenges.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async respondToChallenge(challengeId: string, userId: string, accept: boolean): Promise<Challenge | undefined> {
    const challenge = this.challenges.get(challengeId);
    if (!challenge) return undefined;
    if (challenge.challengeeId !== userId) return undefined;
    if (challenge.status !== "pending") return undefined;

    if (!accept) {
      challenge.status = "declined";
      this.challenges.set(challengeId, challenge);
      return challenge;
    }

    const challengee = await this.getUser(userId);
    if (!challengee) return undefined;

    let challengeeValue = 0;
    if (challenge.type === "money_health") {
      challengeeValue = challengee.moneyHealth;
    } else if (challenge.type === "streak") {
      challengeeValue = challengee.streak;
    } else if (challenge.type === "accuracy") {
      challengeeValue = challengee.todayResult ? Math.round((challengee.todayResult.score / 500) * 100) : 0;
    }

    challenge.status = "completed";
    challenge.challengeeValue = challengeeValue;
    challenge.completedAt = new Date().toISOString();

    if (challengeeValue > challenge.challengerValue) {
      challenge.winnerId = challenge.challengeeId;
      if (challenge.type === "money_health") challenge.badgeAwarded = "money_master";
      else if (challenge.type === "streak") challenge.badgeAwarded = "streak_keeper";
      else if (challenge.type === "accuracy") challenge.badgeAwarded = "sharp_shooter";
    } else if (challenge.challengerValue > challengeeValue) {
      challenge.winnerId = challenge.challengerId;
      if (challenge.type === "money_health") challenge.badgeAwarded = "money_master";
      else if (challenge.type === "streak") challenge.badgeAwarded = "streak_keeper";
      else if (challenge.type === "accuracy") challenge.badgeAwarded = "sharp_shooter";
    }

    this.challenges.set(challengeId, challenge);
    return challenge;
  }

  async getFriends(userId: string): Promise<User[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const friends: User[] = [];
    for (const friendId of user.friendIds || []) {
      const friend = await this.getUser(friendId);
      if (friend) {
        friends.push(friend);
      }
    }
    
    if (friends.length === 0) {
      const allUsers = Array.from(this.users.values());
      for (const u of allUsers) {
        if (u.id !== userId && u.allowFriendsToFind && u.profileSetupComplete) {
          friends.push(u);
        }
      }
    }
    
    return friends;
  }

  async addFriend(userId: string, friendId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    const friend = await this.getUser(friendId);
    if (!friend) {
      return { success: false, message: "Friend not found" };
    }
    
    if (userId === friendId) {
      return { success: false, message: "Cannot add yourself as a friend" };
    }
    
    if (!user.friendIds) {
      user.friendIds = [];
    }
    
    if (user.friendIds.includes(friendId)) {
      return { success: false, message: "Already friends" };
    }
    
    user.friendIds.push(friendId);
    this.users.set(userId, user);
    
    if (!friend.friendIds) {
      friend.friendIds = [];
    }
    if (!friend.friendIds.includes(userId)) {
      friend.friendIds.push(userId);
      this.users.set(friendId, friend);
    }
    
    return { success: true, message: "Friend added successfully" };
  }

  async useStreakFreeze(userId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.freezeTokens <= 0) {
      return { success: false, message: "No freeze tokens available" };
    }

    const today = getTodayDateString();
    
    if (user.frozenDates.includes(today)) {
      return { success: false, message: "Already used a freeze today" };
    }

    if (user.todayResult) {
      return { success: false, message: "Already played today, no need for freeze" };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (user.lastPlayedDate !== yesterdayStr && user.lastPlayedDate !== today) {
      const newFrozenDates = [...user.frozenDates, yesterdayStr];
      const newStreakCalendar = [...user.streakCalendar];
      
      const existingDayIndex = newStreakCalendar.findIndex(d => d.date === yesterdayStr);
      if (existingDayIndex >= 0) {
        newStreakCalendar[existingDayIndex] = { date: yesterdayStr, played: false, frozen: true };
      } else {
        newStreakCalendar.push({ date: yesterdayStr, played: false, frozen: true });
      }

      await this.updateUser(userId, {
        freezeTokens: user.freezeTokens - 1,
        frozenDates: newFrozenDates,
        streakCalendar: newStreakCalendar,
        lastPlayedDate: yesterdayStr,
      });

      return { success: true, message: "Streak freeze applied! Your streak is protected." };
    }

    return { success: false, message: "Your streak is already active, no freeze needed" };
  }

  async addFreezeToken(userId: string, count: number = 1): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    return this.updateUser(userId, {
      freezeTokens: user.freezeTokens + count,
    });
  }

  async getStreakCalendar(userId: string, days: number = 30): Promise<StreakDay[]> {
    const user = await this.getUser(userId);
    if (!user) return [];

    const calendar: StreakDay[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const existingDay = user.streakCalendar.find(d => d.date === dateStr);
      if (existingDay) {
        calendar.push(existingDay);
      } else {
        calendar.push({
          date: dateStr,
          played: false,
          frozen: user.frozenDates.includes(dateStr),
        });
      }
    }

    return calendar;
  }

  async getBadges(userId: string): Promise<UserBadge[]> {
    const user = await this.getUser(userId);
    if (!user) return [];
    
    if (!user.badges || user.badges.length === 0) {
      const badges = createInitialBadges();
      await this.updateUser(userId, { badges });
      return badges;
    }
    
    return user.badges;
  }

  async updateBadgeProgress(userId: string, badgeId: BadgeId, progress: number): Promise<UserBadge | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const badges = [...(user.badges || createInitialBadges())];
    const badgeIndex = badges.findIndex(b => b.badgeId === badgeId);
    
    if (badgeIndex === -1) return undefined;

    const definition = BADGE_DEFINITIONS.find(d => d.id === badgeId);
    if (!definition) return undefined;

    const currentBadge = badges[badgeIndex];
    const newProgress = Math.min(progress, definition.maxProgress);
    const shouldUnlock = newProgress >= definition.maxProgress && !currentBadge.unlocked;

    badges[badgeIndex] = {
      ...currentBadge,
      progress: newProgress,
      unlocked: currentBadge.unlocked || shouldUnlock,
      unlockedAt: shouldUnlock ? new Date().toISOString() : currentBadge.unlockedAt,
    };

    await this.updateUser(userId, { badges });
    return badges[badgeIndex];
  }

  async useStreakBuyback(userId: string): Promise<{ success: boolean; message: string; restoredStreak?: number }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.streakInsurance.isPlus) {
      return { success: false, message: "Streak Buyback is a Plus feature" };
    }

    if (!user.streakInsurance.lostStreak || user.streakInsurance.lostStreak === 0) {
      return { success: false, message: "No lost streak to restore" };
    }

    const today = getTodayDateString();
    const currentMonth = today.slice(0, 7);
    
    if (user.streakInsurance.lastBuybackDate) {
      const lastBuybackMonth = user.streakInsurance.lastBuybackDate.slice(0, 7);
      if (lastBuybackMonth === currentMonth) {
        return { success: false, message: "Buyback already used this month. Resets next month." };
      }
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
      message: `Streak restored to ${restoredStreak} days!`,
      restoredStreak,
    };
  }

  async useLatePass(userId: string): Promise<{ success: boolean; message: string; drop?: DailyDrop }> {
    const user = await this.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.streakInsurance.isPlus) {
      return { success: false, message: "Late Pass is a Plus feature" };
    }

    if (!user.streakInsurance.latePassAvailable) {
      return { success: false, message: "Late Pass not available. You need to have missed yesterday to use it." };
    }

    const today = getTodayDateString();
    if (user.lastPlayedDate === today) {
      return { success: false, message: "You've already played today" };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const yesterdayDropNumber = getDayNumber() - 1;
    const yesterdayScenarios = getDailyScenarios(yesterdayDropNumber);
    
    const yesterdayDrop: DailyDrop = {
      id: `yesterday-${yesterdayStr}`,
      dropNumber: yesterdayDropNumber,
      date: yesterdayStr,
      scenarios: yesterdayScenarios,
    };

    await this.updateUser(userId, {
      streakInsurance: {
        ...user.streakInsurance,
        latePassAvailable: false,
      },
    });

    return { 
      success: true, 
      message: "Late Pass activated! Play yesterday's drop now.",
      drop: yesterdayDrop,
    };
  }

  async togglePlusStatus(userId: string, isPlus: boolean): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    return this.updateUser(userId, {
      streakInsurance: {
        ...user.streakInsurance,
        isPlus,
      },
      freezeTokens: isPlus ? Math.max(user.freezeTokens, 3) : user.freezeTokens,
    });
  }

  private enrichCommunityScenario(scenario: StoredCommunityScenario, currentUserId: string): CommunityScenario {
    const author = this.users.get(scenario.authorId);
    const votes = Array.from(this.communityVotes.values()).filter(v => v.scenarioId === scenario.id);
    const upvotes = votes.filter(v => v.type === "up").length;
    const downvotes = votes.filter(v => v.type === "down").length;
    const userVote = votes.find(v => v.userId === currentUserId)?.type || null;
    const commentCount = Array.from(this.communityComments.values()).filter(c => c.scenarioId === scenario.id).length;

    return {
      ...scenario,
      authorUsername: author?.username || "Unknown",
      authorAvatar: author?.avatar || "ghost",
      authorBadges: author?.badges || [],
      authorMoneyHealth: author?.moneyHealth || 0,
      upvotes,
      downvotes,
      commentCount,
      userVote,
    };
  }

  private enrichCommunityComment(comment: StoredCommunityComment, currentUserId: string, includeReplies: boolean = false): CommunityComment {
    const author = this.users.get(comment.authorId);
    const votes = Array.from(this.communityVotes.values()).filter(v => v.commentId === comment.id);
    const upvotes = votes.filter(v => v.type === "up").length;
    const downvotes = votes.filter(v => v.type === "down").length;
    const userVoteEntry = votes.find(v => v.userId === currentUserId);
    const userVote = userVoteEntry ? userVoteEntry.type : null;

    const enriched: CommunityComment = {
      ...comment,
      authorUsername: author?.username || "Unknown",
      authorAvatar: author?.avatar || "ghost",
      authorBadges: author?.badges || [],
      authorMoneyHealth: author?.moneyHealth || 0,
      upvotes,
      downvotes,
      userVote,
    };

    if (includeReplies) {
      const replies = Array.from(this.communityComments.values())
        .filter(c => c.parentId === comment.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map(c => this.enrichCommunityComment(c, currentUserId, false));
      enriched.replies = replies;
    }

    return enriched;
  }

  async createCommunityScenario(userId: string, data: CreateCommunityScenario): Promise<CommunityScenario> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const scenario: StoredCommunityScenario = {
      id: randomUUID(),
      authorId: userId,
      title: data.title,
      context: data.context,
      question: data.question,
      type: data.type,
      category: data.category,
      createdAt: new Date().toISOString(),
      weekNumber: getWeekNumber(),
      isRealistOfWeek: false,
    };

    this.communityScenarios.set(scenario.id, scenario);
    return this.enrichCommunityScenario(scenario, userId);
  }

  async getCommunityScenarios(userId: string, category?: string, sortBy: "latest" | "hot" | "realest" = "latest"): Promise<CommunityScenario[]> {
    let scenarios = Array.from(this.communityScenarios.values());

    if (category && category !== "all") {
      scenarios = scenarios.filter(s => s.category === category);
    }

    const enriched = scenarios.map(s => this.enrichCommunityScenario(s, userId));

    switch (sortBy) {
      case "hot":
        // Hot = upvotes - downvotes, with recency boost
        enriched.sort((a, b) => {
          const scoreA = a.upvotes - a.downvotes;
          const scoreB = b.upvotes - b.downvotes;
          return scoreB - scoreA;
        });
        break;
      case "realest":
        // Filter to current week and sort by votes
        const currentWeek = getWeekNumber();
        return enriched
          .filter(s => s.weekNumber === currentWeek)
          .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      case "latest":
      default:
        enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return enriched;
  }

  async getCommunityScenario(scenarioId: string, userId: string): Promise<CommunityScenario | undefined> {
    const scenario = this.communityScenarios.get(scenarioId);
    if (!scenario) return undefined;
    return this.enrichCommunityScenario(scenario, userId);
  }

  async voteCommunityScenario(userId: string, scenarioId: string, voteType: "up" | "down"): Promise<CommunityScenario | undefined> {
    const scenario = this.communityScenarios.get(scenarioId);
    if (!scenario) return undefined;

    // Find existing vote
    const existingVote = Array.from(this.communityVotes.values()).find(
      v => v.scenarioId === scenarioId && v.userId === userId
    );

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote if clicking same type
        this.communityVotes.delete(existingVote.id);
      } else {
        // Change vote type
        existingVote.type = voteType;
        this.communityVotes.set(existingVote.id, existingVote);
      }
    } else {
      // Add new vote
      const vote: StoredCommunityVote = {
        id: randomUUID(),
        scenarioId,
        commentId: null,
        userId,
        type: voteType,
        createdAt: new Date().toISOString(),
      };
      this.communityVotes.set(vote.id, vote);
    }

    return this.enrichCommunityScenario(scenario, userId);
  }

  async getScenarioComments(scenarioId: string, userId: string): Promise<CommunityComment[]> {
    // Get top-level comments only (parentId is null)
    const comments = Array.from(this.communityComments.values())
      .filter(c => c.scenarioId === scenarioId && c.parentId === null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Include replies for each top-level comment
    return comments.map(c => this.enrichCommunityComment(c, userId, true));
  }

  async addComment(userId: string, data: CreateCommunityComment): Promise<CommunityComment> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const comment: StoredCommunityComment = {
      id: randomUUID(),
      scenarioId: data.scenarioId,
      parentId: data.parentId || null,
      authorId: userId,
      content: data.content,
      isAdvice: data.isAdvice,
      createdAt: new Date().toISOString(),
    };

    this.communityComments.set(comment.id, comment);
    return this.enrichCommunityComment(comment, userId);
  }

  async voteComment(userId: string, commentId: string, voteType: "up" | "down"): Promise<CommunityComment | undefined> {
    const comment = this.communityComments.get(commentId);
    if (!comment) return undefined;

    // Find existing vote
    const existingVote = Array.from(this.communityVotes.values()).find(
      v => v.commentId === commentId && v.userId === userId
    );

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Same vote type, toggle off
        this.communityVotes.delete(existingVote.id);
      } else {
        // Different vote type, update the vote
        existingVote.type = voteType;
        this.communityVotes.set(existingVote.id, existingVote);
      }
    } else {
      // Add new vote
      const vote: StoredCommunityVote = {
        id: randomUUID(),
        scenarioId: null,
        commentId,
        userId,
        type: voteType,
        createdAt: new Date().toISOString(),
      };
      this.communityVotes.set(vote.id, vote);
    }

    return this.enrichCommunityComment(comment, userId);
  }

  async getRealistOfWeek(userId: string): Promise<CommunityScenario[]> {
    const currentWeek = getWeekNumber();
    const scenarios = Array.from(this.communityScenarios.values())
      .filter(s => s.weekNumber === currentWeek || s.isRealistOfWeek)
      .map(s => this.enrichCommunityScenario(s, userId))
      .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));

    // Mark top scenario as "Realest of Week"
    if (scenarios.length > 0) {
      const topScenario = this.communityScenarios.get(scenarios[0].id);
      if (topScenario) {
        topScenario.isRealistOfWeek = true;
        this.communityScenarios.set(topScenario.id, topScenario);
      }
    }

    return scenarios.slice(0, 3); // Return top 3
  }

  async getTopCreators(limit: number = 10): Promise<any[]> {
    // Calculate scenario counts and total upvotes per creator
    const creatorStats = new Map<string, { user: User; scenarioCount: number; totalUpvotes: number }>();

    const scenarios = Array.from(this.communityScenarios.values());
    for (const scenario of scenarios) {
      const user = this.users.get(scenario.authorId);
      if (!user) continue;

      // Calculate upvotes for this scenario
      const votes = Array.from(this.communityVotes.values()).filter(v => v.scenarioId === scenario.id);
      const upvotes = votes.filter(v => v.type === "up").length;

      const existing = creatorStats.get(scenario.authorId);
      if (existing) {
        existing.scenarioCount++;
        existing.totalUpvotes += upvotes;
      } else {
        creatorStats.set(scenario.authorId, {
          user,
          scenarioCount: 1,
          totalUpvotes: upvotes,
        });
      }
    }

    // Convert to array and sort by total upvotes
    const creators = Array.from(creatorStats.values())
      .sort((a, b) => b.totalUpvotes - a.totalUpvotes)
      .slice(0, limit)
      .map((stats, index) => ({
        id: stats.user.id,
        username: stats.user.username,
        avatar: stats.user.avatar,
        scenarioCount: stats.scenarioCount,
        totalUpvotes: stats.totalUpvotes,
        rank: index + 1,
      }));

    return creators;
  }

  async updateMembershipTier(userId: string, tier: "free" | "plus" | "pro"): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found");

    user.membershipTier = tier;
    this.users.set(userId, user);
    return user;
  }

  // Admin methods implementation
  async isAdmin(userId: string): Promise<boolean> {
    return this.adminUserIds.has(userId);
  }

  async isModerator(userId: string): Promise<boolean> {
    return this.moderators.has(userId) || this.adminUserIds.has(userId);
  }

  async getModerators(): Promise<Moderator[]> {
    return Array.from(this.moderators.values());
  }

  async addModerator(userId: string, assignedBy: string): Promise<Moderator | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    if (this.moderators.has(userId)) return this.moderators.get(userId);

    const moderator: Moderator = {
      userId,
      username: user.username,
      avatar: user.avatar,
      assignedAt: new Date().toISOString(),
      assignedBy,
    };
    this.moderators.set(userId, moderator);
    return moderator;
  }

  async removeModerator(userId: string): Promise<boolean> {
    return this.moderators.delete(userId);
  }

  async getBannedUsers(): Promise<BannedUser[]> {
    return Array.from(this.bannedUsers.values());
  }

  async banUser(data: BanUser, bannedBy: string): Promise<BannedUser | undefined> {
    const user = this.users.get(data.userId);
    if (!user) return undefined;

    const bannedByUser = this.users.get(bannedBy);
    const bannedUser: BannedUser = {
      userId: data.userId,
      username: user.username,
      avatar: user.avatar,
      reason: data.reason,
      bannedAt: new Date().toISOString(),
      bannedBy,
      bannedByUsername: bannedByUser?.username || "Admin",
    };
    this.bannedUsers.set(data.userId, bannedUser);
    return bannedUser;
  }

  async unbanUser(userId: string): Promise<boolean> {
    return this.bannedUsers.delete(userId);
  }

  async isUserBanned(userId: string): Promise<boolean> {
    return this.bannedUsers.has(userId);
  }

  async getAdminScenarios(): Promise<AdminScenario[]> {
    return Array.from(this.adminScenarios.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getAdminScenario(scenarioId: string): Promise<AdminScenario | undefined> {
    return this.adminScenarios.get(scenarioId);
  }

  async createAdminScenario(userId: string, data: CreateAdminScenario): Promise<AdminScenario> {
    const now = new Date().toISOString();
    const scenario: AdminScenario = {
      id: randomUUID(),
      title: data.title,
      context: data.context,
      question: data.question,
      choices: data.choices,
      category: data.category,
      difficulty: data.difficulty,
      publishDate: data.publishDate,
      status: data.status,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      deepDive: data.deepDive || null,
    };
    this.adminScenarios.set(scenario.id, scenario);
    return scenario;
  }

  async updateAdminScenario(scenarioId: string, data: Partial<CreateAdminScenario>): Promise<AdminScenario | undefined> {
    const scenario = this.adminScenarios.get(scenarioId);
    if (!scenario) return undefined;

    const updated: AdminScenario = {
      ...scenario,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.adminScenarios.set(scenarioId, updated);
    return updated;
  }

  async deleteAdminScenario(scenarioId: string): Promise<boolean> {
    return this.adminScenarios.delete(scenarioId);
  }

  async publishAdminScenario(scenarioId: string): Promise<AdminScenario | undefined> {
    const scenario = this.adminScenarios.get(scenarioId);
    if (!scenario) return undefined;

    const updated: AdminScenario = {
      ...scenario,
      status: "published",
      publishDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.adminScenarios.set(scenarioId, updated);
    return updated;
  }

  async getAllUsersForAdmin(): Promise<Pick<User, "id" | "username" | "avatar" | "moneyHealth" | "gamesPlayed">[]> {
    return Array.from(this.users.values()).map(user => ({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      moneyHealth: user.moneyHealth,
      gamesPlayed: user.gamesPlayed,
    }));
  }

  async getDailyStats(): Promise<{ playersToday: number; totalPlayers: number }> {
    const today = getTodayDateString();
    let playersToday = 0;
    
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.lastPlayedDate === today) {
        playersToday++;
      }
    }
    
    return {
      playersToday,
      totalPlayers: this.users.size,
    };
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    for (const user of users) {
      if (user.referralCode === code) {
        return user;
      }
    }
    return undefined;
  }

  async applyReferralBonus(referrerId: string, referredUserId: string): Promise<boolean> {
    const referrer = this.users.get(referrerId);
    const referredUser = this.users.get(referredUserId);
    
    if (!referrer || !referredUser) return false;
    if (referredUser.referredBy) return false; // Already referred
    
    // Give referrer a freeze token
    referrer.freezeTokens += 1;
    referrer.referralCount += 1;
    this.users.set(referrerId, referrer);
    
    // Mark referred user
    referredUser.referredBy = referrerId;
    referredUser.freezeTokens += 1; // Bonus for new user too
    this.users.set(referredUserId, referredUser);
    
    return true;
  }

  async savePushSubscription(userId: string, subscription: PushSubscriptionJSON): Promise<void> {
    const existing = this.pushSubscriptions.get(userId) || [];
    // Check if already subscribed with this endpoint
    const alreadyExists = existing.some(sub => sub.endpoint === subscription.endpoint);
    if (!alreadyExists) {
      existing.push(subscription);
      this.pushSubscriptions.set(userId, existing);
    }
  }

  async getPushSubscription(userId: string): Promise<PushSubscriptionJSON | null> {
    const subscriptions = this.pushSubscriptions.get(userId);
    if (!subscriptions || subscriptions.length === 0) return null;
    // Return the first (most recent) subscription
    return subscriptions[0];
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    const existing = this.pushSubscriptions.get(userId) || [];
    const filtered = existing.filter(sub => sub.endpoint !== endpoint);
    if (filtered.length > 0) {
      this.pushSubscriptions.set(userId, filtered);
    } else {
      this.pushSubscriptions.delete(userId);
    }
  }

  async getAllPushSubscriptions(): Promise<{ userId: string; subscription: PushSubscriptionJSON }[]> {
    const result: { userId: string; subscription: PushSubscriptionJSON }[] = [];
    const entries = Array.from(this.pushSubscriptions.entries());
    for (const [userId, subs] of entries) {
      for (const subscription of subs) {
        result.push({ userId, subscription });
      }
    }
    return result;
  }

  // Co-op Game Session Methods
  private generateCoopCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createCoopSession(hostId: string, mode: CoopMode = "daily", arcadeGameIndex: number | null = null): Promise<CoopSession> {
    const host = await this.getUser(hostId);
    if (!host) throw new Error("Host user not found");

    let code = this.generateCoopCode();
    while (await this.getCoopSessionByCode(code)) {
      code = this.generateCoopCode();
    }

    const today = getTodayDateString();
    let dropId: string;
    if (mode === "arcade") {
      dropId = `arcade-${today}-${arcadeGameIndex}`;
    } else {
      dropId = this.dailyDrop.id;
    }

    const session: CoopSession = {
      id: randomUUID(),
      code,
      hostId,
      guestId: null,
      status: "waiting",
      mode,
      dropId,
      arcadeGameIndex,
      currentQuestionIndex: 0,
      questionStartTime: 0,
      players: [
        {
          id: hostId,
          username: host.username,
          avatar: host.avatar,
          answers: {},
          currentQuestionIndex: 0,
          score: 0,
          connected: true,
        },
      ],
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };

    this.coopSessions.set(session.id, session);
    return session;
  }

  async getCoopSession(sessionId: string): Promise<CoopSession | undefined> {
    return this.coopSessions.get(sessionId);
  }

  async getCoopSessionByCode(code: string): Promise<CoopSession | undefined> {
    const sessions = Array.from(this.coopSessions.values());
    return sessions.find(s => s.code === code.toUpperCase() && s.status === "waiting");
  }

  async joinCoopSession(guestId: string, code: string): Promise<CoopSession | undefined> {
    const session = await this.getCoopSessionByCode(code);
    if (!session) return undefined;
    if (session.guestId) return undefined; // Already has a guest
    if (session.hostId === guestId) return undefined; // Can't join your own session

    const guest = await this.getUser(guestId);
    if (!guest) return undefined;

    session.guestId = guestId;
    session.players.push({
      id: guestId,
      username: guest.username,
      avatar: guest.avatar,
      answers: {},
      currentQuestionIndex: 0,
      score: 0,
      connected: true,
    });

    this.coopSessions.set(session.id, session);
    return session;
  }

  async updateCoopSession(sessionId: string, updates: Partial<CoopSession>): Promise<CoopSession | undefined> {
    const session = this.coopSessions.get(sessionId);
    if (!session) return undefined;

    const updated = { ...session, ...updates };
    this.coopSessions.set(sessionId, updated);
    return updated;
  }

  async submitCoopAnswer(sessionId: string, playerId: string, scenarioId: string, choiceLabel: string): Promise<CoopSession | undefined> {
    const session = this.coopSessions.get(sessionId);
    if (!session) return undefined;

    const playerIndex = session.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return undefined;

    // Get the scenario to calculate points
    const scenario = this.dailyDrop.scenarios.find(s => s.id === scenarioId);
    if (!scenario) return undefined;

    const choice = scenario.choices.find(c => c.label === choiceLabel);
    const points = choice?.points || 0;

    // Update player's answer
    session.players[playerIndex].answers[scenarioId] = choiceLabel;
    session.players[playerIndex].score += points;

    this.coopSessions.set(sessionId, session);
    return session;
  }

  async getCoopGameResult(sessionId: string): Promise<CoopGameResult | undefined> {
    const session = this.coopSessions.get(sessionId);
    if (!session || session.status !== "completed") return undefined;

    const scenarios = this.dailyDrop.scenarios;
    
    const playerResults = session.players.map(player => {
      const answers = scenarios.map(scenario => {
        const choiceLabel = player.answers[scenario.id] || "";
        const choice = scenario.choices.find(c => c.label === choiceLabel);
        return {
          scenarioId: scenario.id,
          choiceLabel,
          points: choice?.points || 0,
          isCorrect: choice?.isCorrect || false,
        };
      });

      return {
        id: player.id,
        username: player.username,
        avatar: player.avatar,
        score: player.score,
        correctAnswers: answers.filter(a => a.isCorrect).length,
        answers,
      };
    });

    // Determine winner
    let winner: string | null = null;
    if (playerResults.length === 2) {
      if (playerResults[0].score > playerResults[1].score) {
        winner = playerResults[0].id;
      } else if (playerResults[1].score > playerResults[0].score) {
        winner = playerResults[1].id;
      }
      // null if tie
    }

    return {
      sessionId,
      players: playerResults,
      totalQuestions: scenarios.length,
      winner,
    };
  }

  // Arcade mode methods
  async getArcadeDrop(userId: string, gameIndex?: number): Promise<DailyDrop> {
    const user = await this.getOrCreateUser(userId);
    const today = getTodayDateString();
    const dayNumber = getDayNumber();

    if (user.arcadeLastPlayedDate !== today) {
      user.arcadePlaysToday = 0;
      user.arcadeLastPlayedDate = today;
      this.users.set(userId, user);
    }

    const arcadeGameIndex = gameIndex !== undefined ? gameIndex : user.arcadePlaysToday;
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

    // Reset arcade plays if it's a new day
    if (user.arcadeLastPlayedDate !== today) {
      user.arcadePlaysToday = 0;
      user.arcadeLastPlayedDate = today;
    }

    const maxPlays = ARCADE_LIMITS[user.membershipTier] || 1;

    const parts = submission.arcadeDropId.split("-");
    const arcadeGameIndex = parseInt(parts[parts.length - 1]) || 0;

    const isReplay = arcadeGameIndex < user.arcadePlaysToday;
    const isNewGameUnlock = arcadeGameIndex === user.arcadePlaysToday;

    if (isNewGameUnlock && user.arcadePlaysToday >= maxPlays) {
      throw new Error("Arcade play limit reached for today");
    }

    const dayNumber = getDayNumber();
    const scenarios = getArcadeScenarios(dayNumber, arcadeGameIndex);

    let totalScore = 0;
    let correctAnswers = 0;
    for (const answer of submission.answers) {
      const scenario = scenarios.find(s => s.id === answer.scenarioId);
      if (!scenario) continue;
      const choice = scenario.choices.find(c => c.label === answer.choiceLabel);
      if (choice) {
        totalScore += choice.points;
        if (choice.isCorrect) correctAnswers++;
      }
    }

    if (isNewGameUnlock) {
      user.arcadePlaysToday += 1;
      user.arcadeLastPlayedDate = today;
      this.users.set(userId, user);
    }

    const playsRemaining = Math.max(0, maxPlays - user.arcadePlaysToday);

    return {
      score: totalScore,
      correctAnswers,
      totalQuestions: scenarios.length,
      playsUsedToday: user.arcadePlaysToday,
      playsRemaining,
    };
  }

  async getArcadeStatus(userId: string): Promise<ArcadeStatus> {
    const user = await this.getOrCreateUser(userId);
    const today = getTodayDateString();

    let playsToday = user.arcadePlaysToday;
    if (user.arcadeLastPlayedDate !== today) {
      playsToday = 0;
    }

    const maxPlays = ARCADE_LIMITS[user.membershipTier] || 1;
    const playsRemaining = Math.max(0, maxPlays - playsToday);

    return {
      playsUsedToday: playsToday,
      maxPlaysToday: maxPlays,
      playsRemaining,
      canPlay: playsRemaining > 0,
      canReplay: playsToday > 0,
      gamesUnlocked: playsToday,
      currentGameIndex: playsToday,
      membershipTier: user.membershipTier,
    };
  }
}

// Import PostgreSQL storage
import { postgresStorage } from "./postgres-storage";

// Export PostgreSQL storage instead of MemStorage
export const storage = postgresStorage;

// Keep MemStorage class for reference/fallback
// export const storage = new MemStorage();
