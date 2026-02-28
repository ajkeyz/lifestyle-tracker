/**
 * Progressive Unlock System
 *
 * Deterministic, UTC-safe unlock computation.
 * Used on both client and server — keep dependency-free.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UnlockInfo {
  unlocked: boolean;
  /** ISO timestamp when it was unlocked (undefined if still locked) */
  unlockedAt?: string;
  /** Human-readable condition shown on locked cards */
  condition?: string;
  /** 0-1 progress toward unlock */
  progress: number;
}

export interface UnlockState {
  dailyDrop: UnlockInfo;
  playHub: UnlockInfo;
  arcade: UnlockInfo;
  coop: UnlockInfo;
  survival: UnlockInfo;
  simLab: UnlockInfo & { previewOnly: boolean };
}

export type GameModeId = "dailyDrop" | "arcade" | "coop" | "survival" | "simLab";

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  xp: number;
  reward?: { type: "arcade_token" | "streak_shield" | "xp"; amount: number };
  /** Returns true when mission is satisfied */
  check: (ctx: MissionContext) => boolean;
  /** Only show this mission when its prerequisite mode is unlocked */
  requiresUnlock?: GameModeId;
  /** Mission tier — controls when missions appear based on account age.
   *  Tier 1 (Day 0+), Tier 2 (Day 3+), Tier 3 (Day 7+). Defaults to 1. */
  tier?: 1 | 2 | 3;
}

// ─── Level System ─────────────────────────────────────────────────────────────

export interface LevelInfo {
  level: number;
  currentXP: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpRequiredThisLevel: number;
  progress: number;
}

/** Compute Money IQ Level from total XP.  Level = floor(sqrt(XP / 50)). */
export function computeLevel(totalXP: number): LevelInfo {
  const level = Math.floor(Math.sqrt(totalXP / 50));
  const xpForCurrentLevel = level * level * 50;
  const xpForNextLevel = (level + 1) * (level + 1) * 50;
  const xpIntoLevel = totalXP - xpForCurrentLevel;
  const xpRequiredThisLevel = xpForNextLevel - xpForCurrentLevel;
  const progress = xpRequiredThisLevel > 0 ? xpIntoLevel / xpRequiredThisLevel : 0;

  return { level, currentXP: totalXP, xpIntoLevel, xpForNextLevel, xpRequiredThisLevel, progress };
}

/** Human-readable descriptions for each reward type. */
export const REWARD_DESCRIPTIONS: Record<string, string> = {
  xp: "Builds your Money IQ Level",
  streak_shield: "Protects your streak if you miss a day",
  arcade_token: "Grants a bonus Arcade play",
};

/** Compute mission tier from account age in days. */
export function getMissionTier(accountAgeDays: number): 1 | 2 | 3 {
  if (accountAgeDays >= 7) return 3;
  if (accountAgeDays >= 3) return 2;
  return 1;
}

export interface MissionState {
  id: string;
  completedAt: string | null;
  claimed: boolean;
}

export interface MissionContext {
  hasPlayedToday: boolean;
  arcadePlaysToday: number;
  streak: number;
  gamesPlayed: number;
  friendCount: number;
  coopPlayed: boolean;
  survivalPlayed: boolean;
  referralCount: number;
}

export interface ProgressionInput {
  createdAt: string; // ISO timestamp (UTC)
  gamesPlayed: number;
  membershipTier: "free" | "plus" | "pro";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSinceUTC(isoDate: string, now: Date = new Date()): number {
  const created = new Date(isoDate);
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ─── Unlock Computation ──────────────────────────────────────────────────────

export function computeUnlocks(input: ProgressionInput): UnlockState {
  const { gamesPlayed, membershipTier } = input;
  const accountAgeDays = daysSinceUTC(input.createdAt);

  // Daily Drop — always unlocked
  const dailyDrop: UnlockInfo = { unlocked: true, progress: 1 };

  // Play Hub — visible after first drop
  const playHub: UnlockInfo = {
    unlocked: gamesPlayed >= 1,
    progress: Math.min(gamesPlayed / 1, 1),
    condition: "Complete your first Daily Drop",
  };

  // Arcade — Day 1 (after first drop OR 24h since account creation)
  const arcadeUnlocked = gamesPlayed >= 1 || accountAgeDays >= 1;
  const arcade: UnlockInfo = {
    unlocked: arcadeUnlocked,
    progress: arcadeUnlocked ? 1 : Math.max(gamesPlayed / 1, accountAgeDays / 1),
    condition: "Complete your first Daily Drop",
  };

  // Co-op — Day 3 (2+ drops completed)
  const coopUnlocked = gamesPlayed >= 2 && accountAgeDays >= 3;
  const coopDropProgress = Math.min(gamesPlayed / 2, 1);
  const coopDayProgress = Math.min(accountAgeDays / 3, 1);
  const coop: UnlockInfo = {
    unlocked: coopUnlocked,
    progress: coopUnlocked ? 1 : Math.min(coopDropProgress, coopDayProgress),
    condition:
      gamesPlayed < 2
        ? `Complete ${2 - gamesPlayed} more Drop${gamesPlayed === 1 ? "" : "s"}`
        : `Available in ${Math.max(0, 3 - accountAgeDays)} day${3 - accountAgeDays === 1 ? "" : "s"}`,
  };

  // Survival — Day 7 (5+ drops OR 7 calendar days)
  const survivalUnlocked = gamesPlayed >= 5 || accountAgeDays >= 7;
  const survival: UnlockInfo = {
    unlocked: survivalUnlocked,
    progress: survivalUnlocked
      ? 1
      : Math.max(Math.min(gamesPlayed / 5, 1), Math.min(accountAgeDays / 7, 1)),
    condition:
      gamesPlayed < 5
        ? `Complete ${5 - gamesPlayed} more Drop${5 - gamesPlayed === 1 ? "" : "s"}`
        : `Available in ${Math.max(0, 7 - accountAgeDays)} day${7 - accountAgeDays === 1 ? "" : "s"}`,
  };

  // Sim Lab — Day 10 (7+ drops)
  const simUnlocked = gamesPlayed >= 7;
  const simLab: UnlockInfo & { previewOnly: boolean } = {
    unlocked: simUnlocked,
    progress: simUnlocked ? 1 : Math.min(gamesPlayed / 7, 1),
    condition: `Complete ${Math.max(0, 7 - gamesPlayed)} more Drop${7 - gamesPlayed === 1 ? "" : "s"}`,
    previewOnly: simUnlocked && membershipTier === "free",
  };

  return { dailyDrop, playHub, arcade, coop, survival, simLab };
}

/** Find the *next* mode the user will unlock (for "What's Next" card). */
export function getNextUnlock(
  unlocks: UnlockState
): { mode: GameModeId; info: UnlockInfo; label: string } | null {
  const order: { mode: GameModeId; label: string }[] = [
    { mode: "arcade", label: "Arcade Mode" },
    { mode: "coop", label: "Co-op Mode" },
    { mode: "survival", label: "Survival Mode" },
    { mode: "simLab", label: "Sim Lab" },
  ];

  for (const entry of order) {
    const info = unlocks[entry.mode];
    if (!info.unlocked) {
      return { ...entry, info };
    }
  }
  return null;
}

// ─── Mission Definitions ─────────────────────────────────────────────────────

export const MISSION_POOL: MissionDef[] = [
  // ── Tier 1: Day 0+ (beginner missions) ──
  {
    id: "complete_daily",
    title: "Complete today's Drop",
    description: "Play today's 5 money decisions",
    xp: 50,
    reward: { type: "xp", amount: 50 },
    tier: 1,
    check: (ctx) => ctx.hasPlayedToday,
  },
  {
    id: "play_5_drops",
    title: "Complete 5 Drops total",
    description: "Build your money instincts",
    xp: 80,
    reward: { type: "xp", amount: 80 },
    tier: 1,
    check: (ctx) => ctx.gamesPlayed >= 5,
  },
  {
    id: "reach_streak_3",
    title: "Reach a 3-day streak",
    description: "Play 3 days in a row",
    xp: 100,
    reward: { type: "streak_shield", amount: 1 },
    tier: 1,
    check: (ctx) => ctx.streak >= 3,
  },
  // ── Tier 2: Day 3+ (intermediate missions) ──
  {
    id: "play_arcade",
    title: "Play 1 Arcade round",
    description: "Test your skills with extra rounds",
    xp: 30,
    reward: { type: "arcade_token", amount: 1 },
    tier: 2,
    requiresUnlock: "arcade",
    check: (ctx) => ctx.arcadePlaysToday >= 1,
  },
  {
    id: "invite_friend",
    title: "Invite 1 friend",
    description: "Share the game with someone",
    xp: 75,
    reward: { type: "xp", amount: 75 },
    tier: 2,
    requiresUnlock: "coop",
    check: (ctx) => ctx.referralCount >= 1,
  },
  {
    id: "play_coop",
    title: "Play 1 co-op match",
    description: "Team up with a friend",
    xp: 60,
    reward: { type: "xp", amount: 60 },
    tier: 2,
    requiresUnlock: "coop",
    check: (ctx) => ctx.coopPlayed,
  },
  // ── Tier 3: Day 7+ (advanced missions) ──
  {
    id: "play_survival",
    title: "Enter a Survival match",
    description: "Test your nerves in battle royale",
    xp: 60,
    reward: { type: "xp", amount: 60 },
    tier: 3,
    requiresUnlock: "survival",
    check: (ctx) => ctx.survivalPlayed,
  },
];

/** Pick up to `count` relevant missions for this user, avoiding already-completed ones.
 *  When `accountAgeDays` is provided, only missions matching the user's tier are shown. */
export function selectMissions(
  unlocks: UnlockState,
  completedIds: string[],
  count = 3,
  accountAgeDays = 0
): MissionDef[] {
  const userTier = getMissionTier(accountAgeDays);

  const eligible = MISSION_POOL.filter((m) => {
    // Skip already completed
    if (completedIds.includes(m.id)) return false;
    // Skip missions whose mode isn't unlocked
    if (m.requiresUnlock && !unlocks[m.requiresUnlock].unlocked) return false;
    // Skip missions above the user's current tier
    if ((m.tier ?? 1) > userTier) return false;
    return true;
  });

  // Always prioritize "complete_daily" if available
  const daily = eligible.find((m) => m.id === "complete_daily");
  const rest = eligible.filter((m) => m.id !== "complete_daily");
  const ordered = daily ? [daily, ...rest] : rest;

  return ordered.slice(0, count);
}
