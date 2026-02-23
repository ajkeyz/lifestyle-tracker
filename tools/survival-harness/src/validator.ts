/**
 * Match Validator — asserts correctness invariants for survival matches.
 *
 * IMPORTANT: Events are collected from ALL bots in a match. Server broadcast
 * messages (ACKs, round_start, etc.) appear once per bot. Validation checks
 * that inspect server messages must use a single bot's event stream to avoid
 * false positives from duplicated broadcasts.
 */
import type { MatchEvent, ValidationError, PlayerResult } from "./config";

export class MatchValidator {
  private errors: ValidationError[] = [];

  validate(
    events: MatchEvent[],
    players: PlayerResult[],
    opts: { lobbySize: number; matchId: string },
  ): ValidationError[] {
    this.errors = [];
    this.checkPlayerCount(players);
    this.checkSingleWinner(players);
    this.checkEliminationConsistency(players);
    this.checkLivesIntegrity(players);
    this.checkOneAnswerPerRound(events);
    this.checkTimerFairness(events);
    this.checkStateMachineIntegrity(events);
    this.checkDoubleSubmitRejection(events);
    this.checkScoreConsistency(players);
    return this.errors;
  }

  private err(rule: string, msg: string, sev: "error" | "warning" = "error", ctx?: Record<string, any>) {
    this.errors.push({ rule, severity: sev, message: msg, context: ctx });
  }

  /**
   * Get events from a single bot's perspective to avoid broadcast duplication.
   * Picks the bot with the most received events (most likely the host / longest-lived).
   */
  private getSingleBotEvents(events: MatchEvent[]): MatchEvent[] {
    const byBot = new Map<string, MatchEvent[]>();
    for (const e of events) {
      const arr = byBot.get(e.botId) || [];
      arr.push(e);
      byBot.set(e.botId, arr);
    }

    let bestBot = "";
    let bestCount = 0;
    for (const [botId, botEvents] of byBot) {
      const received = botEvents.filter(e => e.direction === "received").length;
      if (received > bestCount) {
        bestBot = botId;
        bestCount = received;
      }
    }

    return byBot.get(bestBot) || [];
  }

  private checkPlayerCount(players: PlayerResult[]) {
    if (players.length < 2) this.err("player_count", `Only ${players.length} player(s) in match`);
    if (players.length > 20) this.err("player_count", `${players.length} players exceeds max 20`);
  }

  private checkSingleWinner(players: PlayerResult[]) {
    const alive = players.filter(p => !p.eliminated);
    if (alive.length > 0) {
      const winners = players.filter(p => p.placement === 1);
      if (winners.length > 1) this.err("single_winner", `Multiple winners: ${winners.map(w => w.botId).join(", ")}`);
    }
  }

  private checkEliminationConsistency(players: PlayerResult[]) {
    for (const p of players) {
      if (p.eliminated && p.eliminatedRound === null) {
        this.err("elimination", `${p.botId}: eliminated but no eliminatedRound`);
      }
      if (!p.eliminated && p.eliminatedRound !== null) {
        this.err("elimination", `${p.botId}: not eliminated but eliminatedRound=${p.eliminatedRound}`);
      }
    }
  }

  private checkLivesIntegrity(players: PlayerResult[]) {
    for (const p of players) {
      if (p.livesRemaining < 0) this.err("lives", `${p.botId}: negative lives ${p.livesRemaining}`);
      if (p.eliminated && p.livesRemaining > 0) this.err("lives", `${p.botId}: eliminated with ${p.livesRemaining} lives`);
    }
  }

  /**
   * Check that the server only acknowledged one answer per player per round.
   * Uses a single bot's event stream to avoid counting broadcast duplicates.
   */
  private checkOneAnswerPerRound(events: MatchEvent[]) {
    const singleBotEvents = this.getSingleBotEvents(events);
    const acks = new Map<string, number>();
    let currentRound = 0;
    for (const e of singleBotEvents) {
      if (e.direction === "received" && e.type === "survival_round_start") currentRound = e.payload?.round || 0;
      if (e.direction === "received" && e.type === "survival_answer_ack") {
        const key = `${e.payload?.playerId}-${currentRound}`;
        acks.set(key, (acks.get(key) || 0) + 1);
      }
    }
    for (const [key, count] of acks) {
      if (count > 1) this.err("one_answer", `Multiple ACKs for ${key}: ${count}`);
    }
  }

  /**
   * Check that answer ACKs arrive within the round time limit.
   * Uses a single bot's event stream.
   */
  private checkTimerFairness(events: MatchEvent[]) {
    const singleBotEvents = this.getSingleBotEvents(events);
    let roundStart = 0, timeLimit = 20;
    for (const e of singleBotEvents) {
      if (e.direction === "received" && e.type === "survival_round_start") {
        roundStart = e.timestamp; timeLimit = e.payload?.timeLimit || 20;
      }
      if (e.direction === "received" && e.type === "survival_answer_ack" && roundStart > 0) {
        const elapsed = (e.timestamp - roundStart) / 1000;
        if (elapsed > timeLimit + 2) {
          this.err("timer", `ACK ${elapsed.toFixed(1)}s after round start (limit ${timeLimit}s)`, "warning");
        }
      }
    }
  }

  /**
   * Check that server messages follow valid state machine transitions.
   * Uses a single bot's event stream to avoid interleaved broadcast messages.
   */
  private checkStateMachineIntegrity(events: MatchEvent[]) {
    const valid: Record<string, string[]> = {
      survival_state_sync: ["survival_player_joined", "survival_player_left", "survival_countdown", "survival_round_start", "survival_state_sync"],
      survival_player_joined: ["survival_player_joined", "survival_player_left", "survival_countdown", "survival_state_sync"],
      survival_countdown: ["survival_countdown", "survival_round_start"],
      survival_round_start: ["survival_answer_ack", "survival_round_result", "survival_time_up"],
      survival_answer_ack: ["survival_answer_ack", "survival_round_result", "survival_time_up"],
      survival_time_up: ["survival_round_result"],
      survival_round_result: ["survival_round_start", "survival_match_end"],
      survival_match_end: [],
    };
    const singleBotEvents = this.getSingleBotEvents(events);
    const serverEvts = singleBotEvents.filter(e => e.direction === "received" && e.type.startsWith("survival_"));
    let prev = "";
    for (const e of serverEvts) {
      if (prev && valid[prev]?.length && !valid[prev].includes(e.type)) {
        this.err("state_machine", `Invalid: ${prev} → ${e.type}`, "warning");
      }
      prev = e.type;
    }
  }

  private checkDoubleSubmitRejection(events: MatchEvent[]) {
    // Count answer sends per bot per round (across ALL bots, not single-bot)
    const sends = new Map<string, number>();
    for (const e of events) {
      if (e.direction === "sent" && (e.type === "survival_answer" || e.type === "survival_answer_duplicate")) {
        const key = `${e.botId}-${e.payload?.round}`;
        sends.set(key, (sends.get(key) || 0) + 1);
      }
    }

    // For bots that double-submitted, verify they only got ONE ack (using single-bot perspective)
    const singleBotEvents = this.getSingleBotEvents(events);
    for (const [key, count] of sends) {
      if (count > 1) {
        // Extract botId and round from key
        const parts = key.split("-");
        const round = parseInt(parts.pop() || "0");
        const botId = parts.join("-");

        // Count ACKs for this botId in this round from a single observer
        let ackCount = 0;
        let currentRound = 0;
        for (const e of singleBotEvents) {
          if (e.direction === "received" && e.type === "survival_round_start") currentRound = e.payload?.round || 0;
          if (e.direction === "received" && e.type === "survival_answer_ack" && currentRound === round && e.payload?.playerId === botId) {
            ackCount++;
          }
        }
        if (ackCount > 1) {
          this.err("double_submit", `Bot ${botId} sent ${count} answers in round ${round} and received ${ackCount} ACKs (expected 1)`);
        }
      }
    }
  }

  private checkScoreConsistency(players: PlayerResult[]) {
    for (const p of players) {
      if (p.score < 0) this.err("score", `${p.botId}: negative score ${p.score}`);
    }
  }
}
