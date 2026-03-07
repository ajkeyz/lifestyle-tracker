import type { Scenario, SurvivalMatch, SurvivalPlayer, SurvivalMessage, SurvivalDifficulty } from "@shared/schema";
import { getSurvivalScenarios } from "./static-scenarios";
import { randomBytes } from "crypto";

const LIVES_START = 3;
const MAX_PLAYERS = 20;
const MIN_PLAYERS_TO_START = 2;

// Time limits per difficulty (seconds)
const TIME_LIMITS: Record<SurvivalDifficulty, number> = {
  easy: 20,
  medium: 15,
  hard: 12,
};

// Speed bonus: answer in first 30% of time → +10 points
const SPEED_BONUS = 10;
const CORRECT_POINTS = 100;

// Delay between phases (ms)
const COUNTDOWN_SECONDS = 3;
const REVEAL_DELAY = 4000; // 4s to show results before next round

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  return Array.from(bytes).map(b => chars[b % chars.length]).join("");
}

export type OnMatchEnd = (room: SurvivalRoom) => void;

export class SurvivalRoom {
  match: SurvivalMatch;
  private scenarios: { easy: Scenario[]; medium: Scenario[]; hard: Scenario[] };
  private scenarioIndex: { easy: number; medium: number; hard: number } = { easy: 0, medium: 0, hard: 0 };
  private roundTimer: NodeJS.Timeout | null = null;
  private phaseTimer: NodeJS.Timeout | null = null;
  private broadcast: (msg: SurvivalMessage) => void;
  private onMatchEnd: OnMatchEnd | null = null;
  persisted = false;

  constructor(
    hostId: string,
    isPrivate: boolean,
    broadcast: (msg: SurvivalMessage) => void,
    onMatchEnd?: OnMatchEnd,
  ) {
    this.broadcast = broadcast;
    this.onMatchEnd = onMatchEnd ?? null;
    this.scenarios = getSurvivalScenarios();

    this.match = {
      id: randomBytes(16).toString("hex"),
      code: generateCode(),
      hostId,
      isPrivate,
      status: "lobby",
      round: 0,
      maxRounds: 10, // adjusted when game starts based on player count
      difficulty: "easy",
      currentScenario: null,
      questionStartTime: 0,
      timeLimit: TIME_LIMITS.easy,
      players: [],
      eliminatedThisRound: [],
      roundAnswers: {},
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
    };
  }

  getState(): SurvivalMatch {
    return { ...this.match };
  }

  /** Add a player to the lobby */
  addPlayer(user: { id: string; username: string; avatar: string }): { success: boolean; error?: string } {
    if (this.match.status !== "lobby") {
      return { success: false, error: "Game already started" };
    }
    if (this.match.players.length >= MAX_PLAYERS) {
      return { success: false, error: "Room is full" };
    }
    if (this.match.players.some(p => p.id === user.id)) {
      return { success: false, error: "Already in room" };
    }

    const player: SurvivalPlayer = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      lives: LIVES_START,
      shieldActive: true,
      eliminated: false,
      eliminatedRound: null,
      score: 0,
      streak: 0,
      connected: true,
    };

    this.match.players.push(player);
    this.broadcast({ type: "survival_player_joined", player });
    return { success: true };
  }

  /** Remove a player from the lobby or mark disconnected during game */
  removePlayer(userId: string): void {
    if (this.match.status === "lobby") {
      this.match.players = this.match.players.filter(p => p.id !== userId);
      this.broadcast({ type: "survival_player_left", playerId: userId });
    } else if (this.match.status !== "results") {
      const player = this.match.players.find(p => p.id === userId);
      if (player) {
        player.connected = false;
        this.broadcast({ type: "survival_player_left", playerId: userId });

        // Check if match should end due to insufficient connected players
        this.checkConnectedPlayersForEnd();
      }
    }
  }

  /** Check if match should end because too few players are connected + alive */
  private checkConnectedPlayersForEnd(): void {
    if (this.match.status === "results" || this.match.status === "lobby") return;

    const aliveConnected = this.match.players.filter(
      p => !p.eliminated && p.connected
    );

    if (aliveConnected.length <= 1) {
      // 0 or 1 connected alive players — end the match immediately
      // First, if we're in question phase, end the round to process any pending answers
      if (this.match.status === "question") {
        this.endRound();
      } else {
        // In reveal/countdown/elimination phase, skip to match end
        this.clearTimers();
        this.endMatch();
      }
    } else if (this.match.status === "question") {
      // Check if all remaining connected alive players have answered → end round early
      const allAnswered = aliveConnected.every(p => this.match.roundAnswers[p.id]);
      if (allAnswered) {
        this.clearTimers();
        this.endRound();
      }
    }
  }

  /** Mark a player as reconnected */
  reconnectPlayer(userId: string): void {
    const player = this.match.players.find(p => p.id === userId);
    if (player) {
      player.connected = true;
    }
  }

  /** Start the game (host only) */
  startGame(): { success: boolean; error?: string } {
    if (this.match.players.length < MIN_PLAYERS_TO_START) {
      return { success: false, error: `Need at least ${MIN_PLAYERS_TO_START} players` };
    }
    if (this.match.status !== "lobby") {
      return { success: false, error: "Game already started" };
    }

    // Calculate max rounds based on player count (more players = more rounds)
    this.match.maxRounds = Math.min(
      Math.max(8, this.match.players.length + 2),
      15,
    );

    this.match.status = "countdown";
    this.match.startedAt = new Date().toISOString();

    // Countdown: 3, 2, 1, GO
    let countdown = COUNTDOWN_SECONDS;
    this.broadcast({ type: "survival_countdown", seconds: countdown });

    const countdownInterval = setInterval(() => {
      countdown--;
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        this.startRound();
      } else {
        this.broadcast({ type: "survival_countdown", seconds: countdown });
      }
    }, 1000);

    return { success: true };
  }

  /** Start a new round */
  private startRound(): void {
    this.match.round++;
    this.match.eliminatedThisRound = [];
    this.match.roundAnswers = {};

    // Determine difficulty based on round
    if (this.match.round <= 3) {
      this.match.difficulty = "easy";
    } else if (this.match.round <= 6) {
      this.match.difficulty = "medium";
    } else {
      this.match.difficulty = "hard";
    }

    this.match.timeLimit = TIME_LIMITS[this.match.difficulty];

    // Pick a scenario from the appropriate difficulty bucket
    const scenario = this.pickScenario(this.match.difficulty);
    if (!scenario) {
      // Ran out of scenarios — end the game
      this.endMatch();
      return;
    }

    this.match.currentScenario = scenario;
    this.match.questionStartTime = Date.now();
    this.match.status = "question";

    this.broadcast({
      type: "survival_round_start",
      round: this.match.round,
      scenario,
      timeLimit: this.match.timeLimit,
      difficulty: this.match.difficulty,
    });

    // Server-authoritative timer
    this.roundTimer = setTimeout(() => {
      this.endRound();
    }, this.match.timeLimit * 1000);
  }

  /** Pick a scenario from the appropriate difficulty bucket, falling back to other buckets */
  private pickScenario(difficulty: SurvivalDifficulty): Scenario | null {
    const order: SurvivalDifficulty[] =
      difficulty === "easy" ? ["easy", "medium", "hard"] :
      difficulty === "medium" ? ["medium", "easy", "hard"] :
      ["hard", "medium", "easy"];

    for (const d of order) {
      if (this.scenarioIndex[d] < this.scenarios[d].length) {
        return this.scenarios[d][this.scenarioIndex[d]++];
      }
    }

    return null; // completely exhausted
  }

  /** Submit an answer for the current round */
  submitAnswer(userId: string, choiceLabel: string, round: number): { success: boolean; error?: string } {
    if (this.match.status !== "question") {
      return { success: false, error: "Not in question phase" };
    }
    if (round !== this.match.round) {
      return { success: false, error: "Wrong round" };
    }

    const player = this.match.players.find(p => p.id === userId);
    if (!player || player.eliminated) {
      return { success: false, error: "Player not active" };
    }
    if (this.match.roundAnswers[userId]) {
      return { success: false, error: "Already answered" };
    }

    this.match.roundAnswers[userId] = choiceLabel;

    // Broadcast answer acknowledgment (no reveal yet)
    this.broadcast({ type: "survival_answer_ack", playerId: userId });

    // Check if all alive + connected players have answered → end round early
    const alivePlayers = this.match.players.filter(p => !p.eliminated && p.connected);
    const allAnswered = alivePlayers.every(p => this.match.roundAnswers[p.id]);
    if (allAnswered) {
      this.clearTimers();
      this.endRound();
    }

    return { success: true };
  }

  /** End the current round — evaluate answers, apply lives/shield, check for eliminations */
  private endRound(): void {
    this.clearTimers();

    if (!this.match.currentScenario) return;

    const correctChoice = this.match.currentScenario.choices.find(c => c.isCorrect);
    const correctLabel = correctChoice?.label ?? "";
    const eliminatedThisRound: string[] = [];

    for (const player of this.match.players) {
      if (player.eliminated) continue;

      const answer = this.match.roundAnswers[player.id];
      const isCorrect = answer === correctLabel;

      if (isCorrect) {
        // Award points: base + speed bonus
        const answerTime = Date.now() - this.match.questionStartTime;
        const timeLimitMs = this.match.timeLimit * 1000;
        const speedRatio = 1 - (answerTime / timeLimitMs);
        const speedBonus = speedRatio > 0.7 ? SPEED_BONUS : 0;

        player.score += CORRECT_POINTS + speedBonus;
        player.streak++;
      } else {
        // Wrong or no answer
        player.streak = 0;

        if (player.shieldActive) {
          // Shield absorbs the hit
          player.shieldActive = false;
        } else {
          player.lives--;
          if (player.lives <= 0) {
            player.eliminated = true;
            player.eliminatedRound = this.match.round;
            eliminatedThisRound.push(player.id);
          }
        }
      }
    }

    this.match.eliminatedThisRound = eliminatedThisRound;
    this.match.status = "reveal";

    // Broadcast round results
    this.broadcast({
      type: "survival_round_result",
      correctAnswer: correctLabel,
      players: [...this.match.players],
      eliminatedThisRound,
    });

    // Check if game should end
    const alivePlayers = this.match.players.filter(p => !p.eliminated);
    if (alivePlayers.length <= 1 || this.match.round >= this.match.maxRounds) {
      // Delay before showing final results
      this.phaseTimer = setTimeout(() => {
        this.endMatch();
      }, REVEAL_DELAY);
    } else {
      // Delay before next round
      this.phaseTimer = setTimeout(() => {
        this.startRound();
      }, REVEAL_DELAY);
    }
  }

  /** End the match — calculate placements, broadcast results */
  private endMatch(): void {
    this.clearTimers();
    this.match.status = "results";
    this.match.completedAt = new Date().toISOString();

    // Calculate placements
    // Alive players ranked by score (higher = better placement)
    // Eliminated players ranked by elimination round (later = better placement)
    const alive = this.match.players
      .filter(p => !p.eliminated)
      .sort((a, b) => b.score - a.score);

    const eliminated = this.match.players
      .filter(p => p.eliminated)
      .sort((a, b) => (b.eliminatedRound ?? 0) - (a.eliminatedRound ?? 0));

    const ranked = [...alive, ...eliminated];

    // Assign placements (1-indexed)
    // Note: we don't modify SurvivalPlayer interface directly for placement
    // The placement is derived from the order in the ranked array

    const winner = alive.length > 0 ? alive[0] : null;

    this.broadcast({
      type: "survival_match_end",
      players: ranked,
      winner,
    });

    // Notify persistence layer
    if (this.onMatchEnd) {
      this.onMatchEnd(this);
    }
  }

  /** Get ranked players (for persistence) */
  getRankedPlayers(): { player: SurvivalPlayer; placement: number }[] {
    const alive = this.match.players
      .filter(p => !p.eliminated)
      .sort((a, b) => b.score - a.score);

    const eliminated = this.match.players
      .filter(p => p.eliminated)
      .sort((a, b) => (b.eliminatedRound ?? 0) - (a.eliminatedRound ?? 0));

    return [...alive, ...eliminated].map((player, idx) => ({
      player,
      placement: idx + 1,
    }));
  }

  private clearTimers(): void {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = null;
    }
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
  }

  /** Clean up all timers when room is destroyed */
  destroy(): void {
    this.clearTimers();
  }
}
