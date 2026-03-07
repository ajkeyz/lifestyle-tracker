/**
 * Configuration types for the Survival Mode test harness.
 */

export type BotProfileType =
  | "PERFECT"
  | "RANDOM"
  | "SLOW"
  | "CHAOS"
  | "DOUBLE_SUBMIT"
  | "LATE_JOIN"
  | "DUP_CONN";

export interface BotConfig {
  profile: BotProfileType;
  count: number;
  accuracy?: number;
  latencyRange?: [number, number];
  disconnectProbability?: number;
  reconnectWindow?: [number, number];
}

export interface MatchConfig {
  lobbySize: number;
  bots: BotConfig[];
  usePrivateLobby: boolean;
  record: boolean;
}

export interface ScenarioConfig {
  name: string;
  description: string;
  matches: MatchConfig[];
  concurrency: number;
  seed?: number;
  serverUrl: string;
  thresholds: {
    maxErrorRate: number;
    maxLatencyP99Ms: number;
    maxMemoryGrowthMB: number;
  };
}

export interface MatchEvent {
  timestamp: number;
  matchId: string;
  botId: string;
  direction: "sent" | "received";
  type: string;
  payload: any;
}

export interface MatchRecording {
  matchId: string;
  seed: number;
  startTime: number;
  endTime: number;
  events: MatchEvent[];
  result: MatchResult;
}

export interface MatchResult {
  matchId: string;
  winnerId: string | null;
  players: PlayerResult[];
  totalRounds: number;
  duration: number;
  errors: ValidationError[];
}

export interface PlayerResult {
  botId: string;
  profile: BotProfileType;
  placement: number | null;
  score: number;
  eliminated: boolean;
  eliminatedRound: number | null;
  livesRemaining: number;
  shieldUsed: boolean;
  answersSubmitted: number;
  correctAnswers: number;
  disconnects: number;
  reconnects: number;
}

export interface ValidationError {
  rule: string;
  severity: "error" | "warning";
  message: string;
  context?: Record<string, any>;
}

export interface MetricsSnapshot {
  timestamp: number;
  activeBots: number;
  activeMatches: number;
  wsMessagesSent: number;
  wsMessagesReceived: number;
  httpRequestsMade: number;
  errorsTotal: number;
  errorsByType: Record<string, number>;
  latencies: number[];
  serverMemoryMB?: number;
  serverUptime?: number;
}

export const DEFAULT_SERVER_URL = "http://localhost:5000";
