/**
 * ScenarioRunner — orchestrates bot creation, lobby formation, match execution,
 * validation, and recording for single/batch/concurrent/chaos scenarios.
 */

import type {
  BotConfig,
  MatchConfig,
  MatchResult,
  MatchEvent,
  PlayerResult,
  ScenarioConfig,
  ValidationError,
} from "./config";
import { resolveBehavior, SeededRandom } from "./profiles";
import { SurvivalBot } from "./bot";
import { EventRecorder } from "./recorder";
import { MetricsCollector } from "./metrics";
import { MatchValidator } from "./validator";

export interface RunResult {
  scenario: string;
  matches: MatchResult[];
  validationErrors: ValidationError[];
  metrics: ReturnType<MetricsCollector["getSummary"]>;
  passed: boolean;
  duration: number;
}

function timestamp(): string {
  return new Date().toISOString();
}

function log(message: string): void {
  console.log(`[${timestamp()}] ${message}`);
}

export class ScenarioRunner {
  private serverUrl: string;
  private recordingsDir: string;

  constructor(serverUrl: string, recordingsDir: string) {
    this.serverUrl = serverUrl;
    this.recordingsDir = recordingsDir;
  }

  /**
   * Run a single match: create bots, form lobby, execute, validate, record.
   */
  async runSingle(
    matchConfig: MatchConfig,
    opts: { seed: number; record: boolean },
  ): Promise<MatchResult> {
    const rng = new SeededRandom(opts.seed);
    const matchStartTime = Date.now();

    // Create bots from config
    const bots: SurvivalBot[] = [];
    let botIndex = 0;
    for (const botCfg of matchConfig.bots) {
      for (let i = 0; i < botCfg.count; i++) {
        const botId = `bot-${opts.seed}-${botIndex}`;
        const botSeed = rng.int(1, 2147483647);
        const bot = new SurvivalBot(botId, botCfg.profile, this.serverUrl, botSeed, {
          accuracy: botCfg.accuracy,
          latencyRange: botCfg.latencyRange,
          disconnectProbability: botCfg.disconnectProbability,
          reconnectWindow: botCfg.reconnectWindow,
        });
        bots.push(bot);
        botIndex++;
      }
    }

    log(`Match seed=${opts.seed}: created ${bots.length} bots`);

    // Resolve behaviors to identify late-join bots and the host
    const behaviors = bots.map((bot) =>
      resolveBehavior(bot.profile, {
        accuracy: matchConfig.bots.find((b) => b.profile === bot.profile)?.accuracy,
        latencyRange: matchConfig.bots.find((b) => b.profile === bot.profile)?.latencyRange,
        disconnectProbability: matchConfig.bots.find((b) => b.profile === bot.profile)?.disconnectProbability,
        reconnectWindow: matchConfig.bots.find((b) => b.profile === bot.profile)?.reconnectWindow,
      }),
    );

    const lateJoinBots: SurvivalBot[] = [];
    const regularBots: SurvivalBot[] = [];
    for (let i = 0; i < bots.length; i++) {
      if (behaviors[i].lateJoin) {
        lateJoinBots.push(bots[i]);
      } else {
        regularBots.push(bots[i]);
      }
    }

    // Find the host: first regular bot whose profile allows hosting
    let hostBot: SurvivalBot | null = null;
    const joiningBots: SurvivalBot[] = [];
    for (const bot of regularBots) {
      const behavior = resolveBehavior(bot.profile);
      if (!hostBot && behavior.canHost) {
        hostBot = bot;
      } else {
        joiningBots.push(bot);
      }
    }

    if (!hostBot) {
      // Fallback: first regular bot is the host regardless
      hostBot = regularBots[0];
      joiningBots.length = 0;
      joiningBots.push(...regularBots.slice(1));
    }

    let matchId = "";
    let lobbyCode = "";

    try {
      // Ensure all bot users exist
      await Promise.all(bots.map((bot) => bot.ensureUser()));

      if (matchConfig.usePrivateLobby) {
        // Host creates the lobby
        log(`Host ${hostBot.id} creating lobby...`);
        const lobby = await hostBot.createLobby();
        matchId = lobby.matchId;
        lobbyCode = lobby.code;
        log(`Lobby created: matchId=${matchId}, code=${lobbyCode}`);

        // Host connects via WebSocket
        await hostBot.connect(matchId);

        // Other regular bots join by code then connect
        for (const bot of joiningBots) {
          const joinedMatchId = await bot.joinLobby(lobbyCode);
          await bot.connect(joinedMatchId);
        }
      } else {
        // Public queue: all regular bots join the queue
        const queueResults = await Promise.all(regularBots.map((bot) => bot.joinQueue()));
        // Use the matchId from the first bot that received one
        for (const qr of queueResults) {
          if (qr.matchId) {
            matchId = qr.matchId;
            break;
          }
        }
        // Connect all regular bots
        for (const bot of regularBots) {
          await bot.connect(matchId);
        }
      }

      log(`All ${regularBots.length} regular bots joined. Starting game...`);

      // Host starts the game
      await hostBot.startGame();

      // Late-join bots connect after a delay (2-5 seconds after game start)
      const lateJoinPromises: Promise<void>[] = [];
      for (const bot of lateJoinBots) {
        const delay = rng.int(2000, 5000);
        const promise = new Promise<void>((resolve) => {
          setTimeout(async () => {
            try {
              if (matchConfig.usePrivateLobby) {
                await bot.joinLobby(lobbyCode);
              }
              await bot.connect(matchId);
              log(`Late-join bot ${bot.id} connected after ${delay}ms`);
            } catch (err: any) {
              log(`Late-join bot ${bot.id} failed to connect: ${err.message}`);
            }
            resolve();
          }, delay);
        });
        lateJoinPromises.push(promise);
      }

      // Wait for all late-joiners to at least attempt connection first
      await Promise.all(lateJoinPromises);

      // Wait for all bots to complete (only connected bots will actually wait)
      log(`Waiting for match completion...`);
      const completionPromises = bots.map((bot) =>
        bot.waitForCompletion().catch((err: Error) => {
          log(`Bot ${bot.id} completion error: ${err.message}`);
          return bot.getResult();
        }),
      );

      const playerResults = await Promise.all(completionPromises);
      const duration = Date.now() - matchStartTime;

      // Collect all events from all bots
      const allEvents: MatchEvent[] = [];
      for (const bot of bots) {
        allEvents.push(...bot.getEvents());
      }
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      // Validate
      const validator = new MatchValidator();
      const validationErrors = validator.validate(allEvents, playerResults, {
        lobbySize: matchConfig.lobbySize,
        matchId,
      });

      // Determine winner
      const winner = playerResults.find((p) => p.placement === 1);
      const maxRound = Math.max(
        0,
        ...playerResults.map((p) => p.eliminatedRound ?? 0),
        ...allEvents
          .filter((e) => e.type === "survival_round_start")
          .map((e) => e.payload?.round ?? 0),
      );

      const matchResult: MatchResult = {
        matchId,
        winnerId: winner?.botId ?? null,
        players: playerResults,
        totalRounds: maxRound,
        duration,
        errors: validationErrors,
      };

      // Record if requested
      if (opts.record) {
        const recorder = new EventRecorder(this.recordingsDir);
        recorder.startMatch(matchId, opts.seed);
        recorder.addBotEvents(matchId, allEvents);
        recorder.finalize(matchId, matchResult);
        log(`Match ${matchId} recorded to ${this.recordingsDir}`);
      }

      const errorCount = validationErrors.filter((e) => e.severity === "error").length;
      const warningCount = validationErrors.filter((e) => e.severity === "warning").length;
      log(
        `Match ${matchId} completed in ${duration}ms: ` +
          `${playerResults.length} players, ${maxRound} rounds, ` +
          `${errorCount} errors, ${warningCount} warnings`,
      );

      return matchResult;
    } finally {
      // Always disconnect all bots
      for (const bot of bots) {
        try {
          bot.disconnect();
        } catch {
          // Ignore disconnect errors during cleanup
        }
      }
    }
  }

  /**
   * Run matches serially according to scenarioConfig.matches.
   */
  async runBatch(scenario: ScenarioConfig): Promise<RunResult> {
    const runStart = Date.now();
    const baseSeed = scenario.seed ?? Date.now();
    const rng = new SeededRandom(baseSeed);
    const metrics = new MetricsCollector(scenario.serverUrl);
    metrics.start();

    const allResults: MatchResult[] = [];
    const allValidationErrors: ValidationError[] = [];

    log(`=== Batch run: "${scenario.name}" — ${scenario.matches.length} matches ===`);
    log(`Description: ${scenario.description}`);

    for (let i = 0; i < scenario.matches.length; i++) {
      const matchConfig = scenario.matches[i];
      const matchSeed = rng.int(1, 2147483647);
      log(`--- Match ${i + 1}/${scenario.matches.length} (seed=${matchSeed}) ---`);

      metrics.setActiveMatches(1);
      const totalBots = matchConfig.bots.reduce((sum, b) => sum + b.count, 0);
      metrics.setActiveBots(totalBots);

      try {
        const result = await this.runSingle(matchConfig, {
          seed: matchSeed,
          record: matchConfig.record,
        });
        allResults.push(result);
        allValidationErrors.push(...result.errors);

        // Feed metrics
        this.feedMetricsFromResult(metrics, result);
      } catch (err: any) {
        log(`Match ${i + 1} failed: ${err.message}`);
        metrics.recordError("match_crash");
        allValidationErrors.push({
          rule: "match_execution",
          severity: "error",
          message: `Match ${i + 1} crashed: ${err.message}`,
        });
      }
    }

    metrics.setActiveMatches(0);
    metrics.setActiveBots(0);
    metrics.stop();

    const summary = metrics.getSummary();
    const duration = Date.now() - runStart;
    const passed = this.evaluatePass(allValidationErrors, summary, scenario.thresholds);

    log(`=== Batch complete: ${passed ? "PASSED" : "FAILED"} in ${duration}ms ===`);

    return {
      scenario: scenario.name,
      matches: allResults,
      validationErrors: allValidationErrors,
      metrics: summary,
      passed,
      duration,
    };
  }

  /**
   * Run matches concurrently (up to scenarioConfig.concurrency).
   */
  async runConcurrent(scenario: ScenarioConfig): Promise<RunResult> {
    const runStart = Date.now();
    const baseSeed = scenario.seed ?? Date.now();
    const rng = new SeededRandom(baseSeed);
    const metrics = new MetricsCollector(scenario.serverUrl);
    metrics.start();

    const allResults: MatchResult[] = [];
    const allValidationErrors: ValidationError[] = [];
    const concurrency = Math.max(1, scenario.concurrency);

    log(
      `=== Concurrent run: "${scenario.name}" — ${scenario.matches.length} matches, ` +
        `concurrency=${concurrency} ===`,
    );
    log(`Description: ${scenario.description}`);

    // Pre-generate seeds for determinism
    const seeds = scenario.matches.map(() => rng.int(1, 2147483647));

    // Process in batches of `concurrency`
    for (let i = 0; i < scenario.matches.length; i += concurrency) {
      const batch = scenario.matches.slice(i, i + concurrency);
      const batchSeeds = seeds.slice(i, i + concurrency);

      metrics.setActiveMatches(batch.length);
      const totalBots = batch.reduce(
        (sum, mc) => sum + mc.bots.reduce((s, b) => s + b.count, 0),
        0,
      );
      metrics.setActiveBots(totalBots);

      log(
        `Starting concurrent batch ${Math.floor(i / concurrency) + 1}: ` +
          `matches ${i + 1}-${Math.min(i + concurrency, scenario.matches.length)}`,
      );

      const batchPromises = batch.map(async (matchConfig, j) => {
        const matchSeed = batchSeeds[j];
        try {
          const result = await this.runSingle(matchConfig, {
            seed: matchSeed,
            record: matchConfig.record,
          });
          return result;
        } catch (err: any) {
          log(`Concurrent match ${i + j + 1} failed: ${err.message}`);
          metrics.recordError("match_crash");
          const errorResult: MatchResult = {
            matchId: `failed-${matchSeed}`,
            winnerId: null,
            players: [],
            totalRounds: 0,
            duration: 0,
            errors: [
              {
                rule: "match_execution",
                severity: "error",
                message: `Match crashed: ${err.message}`,
              },
            ],
          };
          return errorResult;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        allResults.push(result);
        allValidationErrors.push(...result.errors);
        this.feedMetricsFromResult(metrics, result);
      }
    }

    metrics.setActiveMatches(0);
    metrics.setActiveBots(0);
    metrics.stop();

    const summary = metrics.getSummary();
    const duration = Date.now() - runStart;
    const passed = this.evaluatePass(allValidationErrors, summary, scenario.thresholds);

    log(`=== Concurrent complete: ${passed ? "PASSED" : "FAILED"} in ${duration}ms ===`);

    return {
      scenario: scenario.name,
      matches: allResults,
      validationErrors: allValidationErrors,
      metrics: summary,
      passed,
      duration,
    };
  }

  /**
   * Run with chaos: random bot kills and forced disconnects mid-match.
   */
  async runChaos(scenario: ScenarioConfig): Promise<RunResult> {
    const runStart = Date.now();
    const baseSeed = scenario.seed ?? Date.now();
    const rng = new SeededRandom(baseSeed);
    const metrics = new MetricsCollector(scenario.serverUrl);
    metrics.start();

    const allResults: MatchResult[] = [];
    const allValidationErrors: ValidationError[] = [];
    const concurrency = Math.max(1, scenario.concurrency);

    log(
      `=== Chaos run: "${scenario.name}" — ${scenario.matches.length} matches, ` +
        `concurrency=${concurrency} ===`,
    );
    log(`Description: ${scenario.description}`);

    const seeds = scenario.matches.map(() => rng.int(1, 2147483647));

    for (let i = 0; i < scenario.matches.length; i += concurrency) {
      const batch = scenario.matches.slice(i, i + concurrency);
      const batchSeeds = seeds.slice(i, i + concurrency);

      metrics.setActiveMatches(batch.length);
      const totalBots = batch.reduce(
        (sum, mc) => sum + mc.bots.reduce((s, b) => s + b.count, 0),
        0,
      );
      metrics.setActiveBots(totalBots);

      const batchPromises = batch.map(async (matchConfig, j) => {
        const matchSeed = batchSeeds[j];
        return this.runChaosMatch(matchConfig, matchSeed, rng, metrics);
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        allResults.push(result);
        allValidationErrors.push(...result.errors);
        this.feedMetricsFromResult(metrics, result);
      }
    }

    metrics.setActiveMatches(0);
    metrics.setActiveBots(0);
    metrics.stop();

    const summary = metrics.getSummary();
    const duration = Date.now() - runStart;
    const passed = this.evaluatePass(allValidationErrors, summary, scenario.thresholds);

    log(`=== Chaos complete: ${passed ? "PASSED" : "FAILED"} in ${duration}ms ===`);

    return {
      scenario: scenario.name,
      matches: allResults,
      validationErrors: allValidationErrors,
      metrics: summary,
      passed,
      duration,
    };
  }

  /**
   * Run a single match with chaos interventions: random bot kills and forced disconnects.
   */
  private async runChaosMatch(
    matchConfig: MatchConfig,
    seed: number,
    chaosRng: SeededRandom,
    metrics: MetricsCollector,
  ): Promise<MatchResult> {
    const matchRng = new SeededRandom(seed);
    const matchStartTime = Date.now();

    // Create bots
    const bots: SurvivalBot[] = [];
    let botIndex = 0;
    for (const botCfg of matchConfig.bots) {
      for (let i = 0; i < botCfg.count; i++) {
        const botId = `chaos-bot-${seed}-${botIndex}`;
        const botSeed = matchRng.int(1, 2147483647);
        const bot = new SurvivalBot(botId, botCfg.profile, this.serverUrl, botSeed, {
          accuracy: botCfg.accuracy,
          latencyRange: botCfg.latencyRange,
          disconnectProbability: botCfg.disconnectProbability,
          reconnectWindow: botCfg.reconnectWindow,
        });
        bots.push(bot);
        botIndex++;
      }
    }

    log(`Chaos match seed=${seed}: created ${bots.length} bots`);

    // Resolve behaviors
    const behaviors = bots.map((bot) => resolveBehavior(bot.profile));

    // Separate regular and late-join bots
    const lateJoinBots: SurvivalBot[] = [];
    const regularBots: SurvivalBot[] = [];
    for (let i = 0; i < bots.length; i++) {
      if (behaviors[i].lateJoin) {
        lateJoinBots.push(bots[i]);
      } else {
        regularBots.push(bots[i]);
      }
    }

    // Find host
    let hostBot: SurvivalBot | null = null;
    const joiningBots: SurvivalBot[] = [];
    for (const bot of regularBots) {
      const behavior = resolveBehavior(bot.profile);
      if (!hostBot && behavior.canHost) {
        hostBot = bot;
      } else {
        joiningBots.push(bot);
      }
    }
    if (!hostBot) {
      hostBot = regularBots[0];
      joiningBots.length = 0;
      joiningBots.push(...regularBots.slice(1));
    }

    let matchId = "";
    let lobbyCode = "";
    const chaosTimers: NodeJS.Timeout[] = [];

    try {
      // Ensure users
      await Promise.all(bots.map((bot) => bot.ensureUser()));

      if (matchConfig.usePrivateLobby) {
        const lobby = await hostBot.createLobby();
        matchId = lobby.matchId;
        lobbyCode = lobby.code;
        await hostBot.connect(matchId);
        for (const bot of joiningBots) {
          const joinedMatchId = await bot.joinLobby(lobbyCode);
          await bot.connect(joinedMatchId);
        }
      } else {
        const queueResults = await Promise.all(regularBots.map((bot) => bot.joinQueue()));
        for (const qr of queueResults) {
          if (qr.matchId) {
            matchId = qr.matchId;
            break;
          }
        }
        for (const bot of regularBots) {
          await bot.connect(matchId);
        }
      }

      await hostBot.startGame();

      // Late-join bots
      const lateJoinPromises: Promise<void>[] = [];
      for (const bot of lateJoinBots) {
        const delay = matchRng.int(2000, 5000);
        const promise = new Promise<void>((resolve) => {
          const timer = setTimeout(async () => {
            try {
              if (matchConfig.usePrivateLobby) {
                await bot.joinLobby(lobbyCode);
              }
              await bot.connect(matchId);
            } catch (err: any) {
              log(`Chaos late-join bot ${bot.id} failed: ${err.message}`);
            }
            resolve();
          }, delay);
          chaosTimers.push(timer);
        });
        lateJoinPromises.push(promise);
      }

      // Schedule chaos events: random bot kills and forced disconnects
      const activeBots = [...regularBots, ...lateJoinBots];
      const numChaosEvents = chaosRng.int(1, Math.max(1, Math.floor(activeBots.length / 2)));

      for (let c = 0; c < numChaosEvents; c++) {
        const targetBot = chaosRng.pick(activeBots);
        const chaosDelay = chaosRng.int(3000, 15000);
        const killOrDisconnect = chaosRng.chance(0.5);

        const timer = setTimeout(() => {
          if (killOrDisconnect) {
            // Kill: disconnect permanently
            log(`Chaos: killing bot ${targetBot.id} at +${chaosDelay}ms`);
            targetBot.disconnect();
            metrics.recordError("chaos_kill");
          } else {
            // Forced disconnect: disconnect then reconnect after random delay
            log(`Chaos: force-disconnecting bot ${targetBot.id} at +${chaosDelay}ms`);
            targetBot.disconnect();
            metrics.recordError("chaos_disconnect");

            const reconnectDelay = chaosRng.int(2000, 8000);
            const reconnTimer = setTimeout(async () => {
              try {
                await targetBot.connect(matchId);
                log(`Chaos: bot ${targetBot.id} reconnected after ${reconnectDelay}ms`);
              } catch (err: any) {
                log(`Chaos: bot ${targetBot.id} reconnect failed: ${err.message}`);
                metrics.recordError("chaos_reconnect_failed");
              }
            }, reconnectDelay);
            chaosTimers.push(reconnTimer);
          }
        }, chaosDelay);
        chaosTimers.push(timer);
      }

      // Wait for late-joiners to at least attempt connection first
      await Promise.all(lateJoinPromises);

      // Wait for completions (only connected bots will actually wait)
      const completionPromises = bots.map((bot) =>
        bot.waitForCompletion().catch((err: Error) => {
          log(`Chaos bot ${bot.id} completion error: ${err.message}`);
          return bot.getResult();
        }),
      );

      const playerResults = await Promise.all(completionPromises);
      const duration = Date.now() - matchStartTime;

      // Collect events
      const allEvents: MatchEvent[] = [];
      for (const bot of bots) {
        allEvents.push(...bot.getEvents());
      }
      allEvents.sort((a, b) => a.timestamp - b.timestamp);

      // Validate
      const validator = new MatchValidator();
      const validationErrors = validator.validate(allEvents, playerResults, {
        lobbySize: matchConfig.lobbySize,
        matchId,
      });

      const winner = playerResults.find((p) => p.placement === 1);
      const maxRound = Math.max(
        0,
        ...playerResults.map((p) => p.eliminatedRound ?? 0),
        ...allEvents
          .filter((e) => e.type === "survival_round_start")
          .map((e) => e.payload?.round ?? 0),
      );

      const matchResult: MatchResult = {
        matchId,
        winnerId: winner?.botId ?? null,
        players: playerResults,
        totalRounds: maxRound,
        duration,
        errors: validationErrors,
      };

      if (matchConfig.record) {
        const recorder = new EventRecorder(this.recordingsDir);
        recorder.startMatch(matchId, seed);
        recorder.addBotEvents(matchId, allEvents);
        recorder.finalize(matchId, matchResult);
      }

      log(`Chaos match ${matchId} completed in ${duration}ms`);
      return matchResult;
    } catch (err: any) {
      log(`Chaos match seed=${seed} crashed: ${err.message}`);
      metrics.recordError("match_crash");
      return {
        matchId: matchId || `failed-chaos-${seed}`,
        winnerId: null,
        players: bots.map((bot) => bot.getResult()),
        totalRounds: 0,
        duration: Date.now() - matchStartTime,
        errors: [
          {
            rule: "match_execution",
            severity: "error",
            message: `Chaos match crashed: ${err.message}`,
          },
        ],
      };
    } finally {
      // Clear chaos timers
      for (const timer of chaosTimers) {
        clearTimeout(timer);
      }
      // Disconnect all bots
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
   * Feed match-level information into the metrics collector.
   */
  private feedMetricsFromResult(metrics: MetricsCollector, result: MatchResult): void {
    metrics.recordLatency(result.duration);
    for (const err of result.errors) {
      if (err.severity === "error") {
        metrics.recordError(err.rule);
      }
    }
    for (const player of result.players) {
      if (player.disconnects > 0) {
        for (let i = 0; i < player.disconnects; i++) {
          metrics.recordError("bot_disconnect");
        }
      }
    }
  }

  /**
   * Determine whether the run passes based on validation errors and metric thresholds.
   */
  private evaluatePass(
    validationErrors: ValidationError[],
    summary: ReturnType<MetricsCollector["getSummary"]>,
    thresholds: ScenarioConfig["thresholds"],
  ): boolean {
    // Fail if any validation errors with severity "error" exist
    const hasHardErrors = validationErrors.some((e) => e.severity === "error");
    if (hasHardErrors) {
      log(
        `FAIL: ${validationErrors.filter((e) => e.severity === "error").length} validation error(s)`,
      );
      return false;
    }

    // Fail if latency P99 exceeds threshold
    if (summary.latencyP99 > thresholds.maxLatencyP99Ms) {
      log(
        `FAIL: latencyP99 ${summary.latencyP99}ms exceeds threshold ${thresholds.maxLatencyP99Ms}ms`,
      );
      return false;
    }

    // Fail if error rate is too high
    // Error rate = total errors / total messages (ws + http). Guard against division by zero.
    const totalOps = summary.totalWsMessages + summary.totalHttpRequests;
    if (totalOps > 0) {
      const errorRate = summary.totalErrors / totalOps;
      if (errorRate > thresholds.maxErrorRate) {
        log(
          `FAIL: error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ` +
            `${(thresholds.maxErrorRate * 100).toFixed(2)}%`,
        );
        return false;
      }
    }

    return true;
  }
}
