/**
 * Deterministic Match Replayer — reads a recording JSON file and replays the
 * same actions against a running server to validate that identical seeds
 * produce identical outcomes.
 */
import { readFileSync } from "fs";
import type {
  MatchRecording,
  MatchResult,
  MatchEvent,
  ValidationError,
  BotProfileType,
} from "./config";
import { SurvivalBot } from "./bot";
import { MatchValidator } from "./validator";

export interface ReplayResult {
  originalMatchId: string;
  replayMatchId: string;
  seed: number;
  deterministic: boolean;
  differences: string[];
  validationErrors: ValidationError[];
}

interface BotSpec {
  botId: string;
  profile: BotProfileType;
  seed: number;
}

export class MatchReplayer {
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  /**
   * Load a MatchRecording from a JSON file on disk and replay it.
   */
  async replayFromFile(filePath: string): Promise<ReplayResult> {
    let recording: MatchRecording;
    try {
      const raw = readFileSync(filePath, "utf-8");
      recording = JSON.parse(raw) as MatchRecording;
    } catch (err: any) {
      return {
        originalMatchId: "unknown",
        replayMatchId: "",
        seed: 0,
        deterministic: false,
        differences: [`Failed to load recording file: ${err.message}`],
        validationErrors: [],
      };
    }
    return this.replay(recording);
  }

  /**
   * Replay a MatchRecording object against the server and compare results.
   */
  async replay(recording: MatchRecording): Promise<ReplayResult> {
    const bots: SurvivalBot[] = [];
    try {
      // --- Extract bot specifications from the original events ---
      const botSpecs = this.extractBotSpecs(recording);
      if (botSpecs.length === 0) {
        return {
          originalMatchId: recording.matchId,
          replayMatchId: "",
          seed: recording.seed,
          deterministic: false,
          differences: ["No bot specifications could be extracted from recording events"],
          validationErrors: [],
        };
      }

      // --- Create bots with the same IDs, profiles, and seeds ---
      for (const spec of botSpecs) {
        const bot = new SurvivalBot(
          spec.botId,
          spec.profile,
          this.serverUrl,
          spec.seed,
        );
        bots.push(bot);
      }

      // --- Ensure users exist on the server ---
      await Promise.all(bots.map((bot) => bot.ensureUser()));

      // --- Replay lobby creation and joining ---
      // The first bot that sent a lobby-creating action is the host.
      const hostBot = bots[0];
      const lobby = await hostBot.createLobby();
      const replayMatchId = lobby.matchId;

      // Remaining bots join the lobby
      for (let i = 1; i < bots.length; i++) {
        await bots[i].joinLobby(lobby.code);
      }

      // --- Connect all bots via WebSocket ---
      await Promise.all(bots.map((bot) => bot.connect(replayMatchId)));

      // --- Start the match (host starts the game) ---
      // Brief delay for lobby state to settle
      await this.delay(500);
      await hostBot.startGame();

      // --- Wait for all bots to finish the match ---
      const playerResults = await Promise.all(
        bots.map((bot) => bot.waitForCompletion()),
      );

      // --- Collect all events for validation ---
      const allEvents: MatchEvent[] = [];
      for (const bot of bots) {
        allEvents.push(...bot.getEvents());
      }
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      // --- Build the replay MatchResult ---
      const replayResult: MatchResult = {
        matchId: replayMatchId,
        winnerId: this.findWinner(playerResults),
        players: playerResults,
        totalRounds: this.countRounds(allEvents),
        duration: this.computeDuration(allEvents),
        errors: [],
      };

      // --- Run structural validation on the replay ---
      const validator = new MatchValidator();
      const validationErrors = validator.validate(allEvents, playerResults, {
        lobbySize: bots.length,
        matchId: replayMatchId,
      });

      // --- Compare original vs replay results ---
      const differences = this.compareResults(recording.result, replayResult);

      return {
        originalMatchId: recording.matchId,
        replayMatchId,
        seed: recording.seed,
        deterministic: differences.length === 0,
        differences,
        validationErrors,
      };
    } catch (err: any) {
      return {
        originalMatchId: recording.matchId,
        replayMatchId: "",
        seed: recording.seed,
        deterministic: false,
        differences: [`Replay failed with error: ${err.message}`],
        validationErrors: [],
      };
    } finally {
      // --- Cleanup: disconnect all bots regardless of outcome ---
      for (const bot of bots) {
        try {
          bot.disconnect();
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Extract bot specifications from the recording.
   * Uses the sent events to determine which bots participated,
   * their profiles (from the result), and uses per-bot deterministic seeds
   * derived from the match seed.
   */
  private extractBotSpecs(recording: MatchRecording): BotSpec[] {
    const specs: BotSpec[] = [];
    const seenBots = new Set<string>();

    // Build a profile lookup from the result's player data
    const profileMap = new Map<string, BotProfileType>();
    for (const player of recording.result.players) {
      profileMap.set(player.botId, player.profile);
    }

    // Walk through sent events to determine participation order
    const sentEvents = recording.events.filter((e) => e.direction === "sent");
    for (const event of sentEvents) {
      if (seenBots.has(event.botId)) continue;
      seenBots.add(event.botId);

      const profile = profileMap.get(event.botId) || "RANDOM";
      // Derive a per-bot seed from the match seed and the bot's index.
      // This mirrors how the harness would have created bots originally:
      // each bot gets a seed that is a deterministic function of the match seed.
      const botIndex = specs.length;
      const botSeed = recording.seed + botIndex;

      specs.push({
        botId: event.botId,
        profile,
        seed: botSeed,
      });
    }

    return specs;
  }

  /**
   * Determine the winner from player results.
   */
  private findWinner(players: import("./config").PlayerResult[]): string | null {
    const winner = players.find((p) => p.placement === 1);
    return winner?.botId ?? null;
  }

  /**
   * Count the number of rounds from events by tracking round_start messages.
   */
  private countRounds(events: MatchEvent[]): number {
    let maxRound = 0;
    for (const e of events) {
      if (
        e.direction === "received" &&
        e.type === "survival_round_start" &&
        e.payload?.round
      ) {
        maxRound = Math.max(maxRound, e.payload.round);
      }
    }
    return maxRound;
  }

  /**
   * Compute the match duration from the first to last event.
   */
  private computeDuration(events: MatchEvent[]): number {
    if (events.length === 0) return 0;
    const first = events[0].timestamp;
    const last = events[events.length - 1].timestamp;
    return last - first;
  }

  /**
   * Compare original recording result against the replay result.
   * Returns a list of human-readable differences. An empty list means
   * the replay was fully deterministic.
   */
  private compareResults(
    original: MatchResult,
    replay: MatchResult,
  ): string[] {
    const diffs: string[] = [];

    // --- Winner comparison ---
    if (original.winnerId !== replay.winnerId) {
      diffs.push(
        `Winner mismatch: original="${original.winnerId}" vs replay="${replay.winnerId}"`,
      );
    }

    // --- Round count comparison ---
    if (original.totalRounds !== replay.totalRounds) {
      diffs.push(
        `Round count mismatch: original=${original.totalRounds} vs replay=${replay.totalRounds}`,
      );
    }

    // --- Elimination order comparison ---
    const originalElimOrder = this.getEliminationOrder(original.players);
    const replayElimOrder = this.getEliminationOrder(replay.players);

    if (originalElimOrder.length !== replayElimOrder.length) {
      diffs.push(
        `Elimination count mismatch: original=${originalElimOrder.length} vs replay=${replayElimOrder.length}`,
      );
    } else {
      for (let i = 0; i < originalElimOrder.length; i++) {
        if (originalElimOrder[i] !== replayElimOrder[i]) {
          diffs.push(
            `Elimination order differs at position ${i}: original="${originalElimOrder[i]}" vs replay="${replayElimOrder[i]}"`,
          );
        }
      }
    }

    // --- Per-player score comparison ---
    const originalScores = new Map(
      original.players.map((p) => [p.botId, p.score]),
    );
    const replayScores = new Map(
      replay.players.map((p) => [p.botId, p.score]),
    );

    Array.from(originalScores.entries()).forEach(([botId, origScore]) => {
      const replayScore = replayScores.get(botId);
      if (replayScore === undefined) {
        diffs.push(`Bot "${botId}" present in original but missing from replay`);
      } else if (origScore !== replayScore) {
        diffs.push(
          `Score mismatch for "${botId}": original=${origScore} vs replay=${replayScore}`,
        );
      }
    });

    Array.from(replayScores.keys()).forEach((botId) => {
      if (!originalScores.has(botId)) {
        diffs.push(`Bot "${botId}" present in replay but missing from original`);
      }
    });

    return diffs;
  }

  /**
   * Build the elimination order: players sorted by the round in which
   * they were eliminated (earliest first). Non-eliminated players are excluded.
   */
  private getEliminationOrder(
    players: import("./config").PlayerResult[],
  ): string[] {
    return players
      .filter((p) => p.eliminated && p.eliminatedRound !== null)
      .sort((a, b) => (a.eliminatedRound ?? 0) - (b.eliminatedRound ?? 0))
      .map((p) => p.botId);
  }

  /**
   * Utility: wait for a given number of milliseconds.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
