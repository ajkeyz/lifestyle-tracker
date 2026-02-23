/**
 * CLI entry point for the Survival Mode test harness.
 *
 * Run via: tsx tools/survival-harness/src/index.ts <command> [options]
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ScenarioRunner, type RunResult } from "./runner";
import { MatchReplayer } from "./replayer";
import { printConsoleReport, generateHtmlReport, printReplayReport } from "./report";
import {
  type ScenarioConfig,
  type MatchConfig,
  type BotConfig,
  type MatchResult,
  DEFAULT_SERVER_URL,
} from "./config";

const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = dirname(__filename_esm);
const RECORDINGS_DIR = resolve(__dirname_esm, "../recordings");

// ---------------------------------------------------------------------------
// Argument parsing (no external dependencies)
// ---------------------------------------------------------------------------

interface ParsedArgs {
  command: string;
  serverUrl: string;
  scenario: string | null;
  recording: string | null;
  bots: number;
  seed: number;
  record: boolean;
  htmlReport: boolean;
  help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  // Strip `node` and script path
  const args = argv.slice(2);

  const parsed: ParsedArgs = {
    command: "",
    serverUrl: DEFAULT_SERVER_URL,
    scenario: null,
    recording: null,
    bots: 4,
    seed: Date.now(),
    record: false,
    htmlReport: false,
    help: false,
  };

  let i = 0;

  // First positional argument is the command
  if (args.length > 0 && !args[0].startsWith("--")) {
    parsed.command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];

    switch (arg) {
      case "--server-url":
        parsed.serverUrl = args[++i] ?? parsed.serverUrl;
        break;
      case "--scenario":
        parsed.scenario = args[++i] ?? null;
        break;
      case "--recording":
        parsed.recording = args[++i] ?? null;
        break;
      case "--bots":
        parsed.bots = parseInt(args[++i], 10) || parsed.bots;
        break;
      case "--seed":
        parsed.seed = parseInt(args[++i], 10) || parsed.seed;
        break;
      case "--record":
        parsed.record = true;
        break;
      case "--html-report":
        parsed.htmlReport = true;
        break;
      case "--help":
        parsed.help = true;
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
        break;
    }

    i++;
  }

  return parsed;
}

// ---------------------------------------------------------------------------
// Help text
// ---------------------------------------------------------------------------

function printHelp(): void {
  const text = `
Usage: tsx tools/survival-harness/src/index.ts <command> [options]

Commands:
  run:single    Run a single match with default bots
  run:batch     Run matches from a scenario config file
  run:concurrent  Run matches concurrently from a scenario config
  run:chaos     Run chaos testing scenario
  run:replay    Replay a recorded match
  run:load      Load test with many concurrent matches
  health        Check if server is ready for testing

Options:
  --server-url <url>     Server URL (default: ${DEFAULT_SERVER_URL})
  --scenario <file>      Scenario JSON config file
  --recording <file>     Recording file for replay
  --bots <count>         Number of bots for single match (default: 4)
  --seed <number>        Random seed (default: current timestamp)
  --record               Record match events
  --html-report          Generate HTML report
  --help                 Show help
`.trimStart();

  console.log(text);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultMatchConfig(botCount: number, record: boolean): MatchConfig {
  // Build a mix of PERFECT and RANDOM bots.
  // At least 1 PERFECT, the rest RANDOM.
  const perfectCount = Math.max(1, Math.floor(botCount / 2));
  const randomCount = botCount - perfectCount;

  const bots: BotConfig[] = [];

  if (perfectCount > 0) {
    bots.push({ profile: "PERFECT", count: perfectCount });
  }
  if (randomCount > 0) {
    bots.push({ profile: "RANDOM", count: randomCount });
  }

  return {
    lobbySize: botCount,
    bots,
    usePrivateLobby: true,
    record,
  };
}

function loadScenarioFile(filePath: string): ScenarioConfig {
  try {
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as ScenarioConfig;
  } catch (err: any) {
    throw new Error(`Failed to load scenario file "${filePath}": ${err.message}`);
  }
}

function buildLoadTestScenario(serverUrl: string, seed: number): ScenarioConfig {
  const matches: MatchConfig[] = [];
  for (let i = 0; i < 10; i++) {
    matches.push(buildDefaultMatchConfig(4, false));
  }

  return {
    name: "Load Test",
    description: "Load test with 10 concurrent matches",
    matches,
    concurrency: 10,
    seed,
    serverUrl,
    thresholds: {
      maxErrorRate: 0.05,
      maxLatencyP99Ms: 5000,
      maxMemoryGrowthMB: 200,
    },
  };
}

/** Wrap a single MatchResult into a RunResult for reporting */
function wrapMatchResult(matchResult: MatchResult, name: string, seed: number): RunResult {
  const hardErrors = matchResult.errors.filter(e => e.severity === "error").length;
  return {
    scenario: name,
    matches: [matchResult],
    validationErrors: matchResult.errors,
    metrics: {
      totalWsMessages: 0,
      totalHttpRequests: 0,
      totalErrors: hardErrors,
      errorBreakdown: {},
      latencyP50: matchResult.duration,
      latencyP95: matchResult.duration,
      latencyP99: matchResult.duration,
      peakMemoryMB: 0,
    },
    passed: hardErrors === 0,
    duration: matchResult.duration,
  };
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function runSingle(args: ParsedArgs): Promise<boolean> {
  const config = buildDefaultMatchConfig(args.bots, args.record);
  const runner = new ScenarioRunner(args.serverUrl, RECORDINGS_DIR);

  console.log(`   Bots: ${args.bots} (${Math.max(1, Math.floor(args.bots / 2))} PERFECT, ${args.bots - Math.max(1, Math.floor(args.bots / 2))} RANDOM)`);
  console.log(`   Record: ${args.record}\n`);

  const matchResult = await runner.runSingle(config, { seed: args.seed, record: args.record });
  const result = wrapMatchResult(matchResult, "Single Match", args.seed);
  printConsoleReport(result);

  if (args.htmlReport) {
    const reportPath = generateHtmlReport([result]);
    console.log(`HTML report: ${reportPath}\n`);
  }

  return result.passed;
}

async function runBatch(args: ParsedArgs): Promise<boolean> {
  if (!args.scenario) {
    throw new Error("--scenario <file> is required for run:batch");
  }

  const scenario = loadScenarioFile(args.scenario);
  if (args.seed) scenario.seed = args.seed;
  scenario.serverUrl = args.serverUrl;

  console.log(`   Scenario: ${scenario.name}`);
  console.log(`   Matches: ${scenario.matches.length}\n`);

  const runner = new ScenarioRunner(args.serverUrl, RECORDINGS_DIR);
  const result = await runner.runBatch(scenario);
  printConsoleReport(result);

  if (args.htmlReport) {
    const reportPath = generateHtmlReport([result]);
    console.log(`HTML report: ${reportPath}\n`);
  }

  return result.passed;
}

async function runConcurrent(args: ParsedArgs): Promise<boolean> {
  if (!args.scenario) {
    throw new Error("--scenario <file> is required for run:concurrent");
  }

  const scenario = loadScenarioFile(args.scenario);
  if (args.seed) scenario.seed = args.seed;
  scenario.serverUrl = args.serverUrl;

  console.log(`   Scenario: ${scenario.name}`);
  console.log(`   Matches: ${scenario.matches.length}`);
  console.log(`   Concurrency: ${scenario.concurrency}\n`);

  const runner = new ScenarioRunner(args.serverUrl, RECORDINGS_DIR);
  const result = await runner.runConcurrent(scenario);
  printConsoleReport(result);

  if (args.htmlReport) {
    const reportPath = generateHtmlReport([result]);
    console.log(`HTML report: ${reportPath}\n`);
  }

  return result.passed;
}

async function runChaos(args: ParsedArgs): Promise<boolean> {
  if (!args.scenario) {
    throw new Error("--scenario <file> is required for run:chaos");
  }

  const scenario = loadScenarioFile(args.scenario);
  if (args.seed) scenario.seed = args.seed;
  scenario.serverUrl = args.serverUrl;

  console.log(`   Scenario: ${scenario.name} (chaos mode)`);
  console.log(`   Matches: ${scenario.matches.length}`);
  console.log(`   Concurrency: ${scenario.concurrency}\n`);

  const runner = new ScenarioRunner(args.serverUrl, RECORDINGS_DIR);
  const result = await runner.runChaos(scenario);
  printConsoleReport(result);

  if (args.htmlReport) {
    const reportPath = generateHtmlReport([result]);
    console.log(`HTML report: ${reportPath}\n`);
  }

  return result.passed;
}

async function runReplay(args: ParsedArgs): Promise<boolean> {
  if (!args.recording) {
    throw new Error("--recording <file> is required for run:replay");
  }

  console.log(`   Recording: ${args.recording}\n`);

  const replayer = new MatchReplayer(args.serverUrl);
  const result = await replayer.replayFromFile(args.recording);
  printReplayReport(result);

  return result.deterministic;
}

async function runLoad(args: ParsedArgs): Promise<boolean> {
  const scenario = buildLoadTestScenario(args.serverUrl, args.seed);

  console.log(`   Matches: ${scenario.matches.length}`);
  console.log(`   Concurrency: ${scenario.concurrency}\n`);

  const runner = new ScenarioRunner(args.serverUrl, RECORDINGS_DIR);
  const result = await runner.runConcurrent(scenario);
  printConsoleReport(result);

  if (args.htmlReport) {
    const reportPath = generateHtmlReport([result]);
    console.log(`HTML report: ${reportPath}\n`);
  }

  return result.passed;
}

async function checkHealth(serverUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${serverUrl}/api/test/health`);
    if (!res.ok) {
      console.error(`Health check failed: HTTP ${res.status} ${res.statusText}`);
      return false;
    }
    const data = await res.json() as any;
    console.log("Server health:");
    console.log(`   Test mode: ${data.testMode ?? "unknown"}`);
    if (data.uptime !== undefined) console.log(`   Uptime: ${data.uptime.toFixed(1)}s`);
    if (data.memoryMB !== undefined) console.log(`   Memory: ${data.memoryMB.toFixed(1)} MB`);
    console.log("");
    return true;
  } catch (err: any) {
    console.error(`Health check failed: could not reach ${serverUrl}`);
    console.error(`   ${err.message}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.help || !args.command) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  // Startup banner
  console.log("");
  console.log("\u{1F3DF}\u{FE0F}  Survival Mode Test Harness");
  console.log(`   Server: ${args.serverUrl}`);
  console.log(`   Command: ${args.command}`);
  console.log(`   Seed: ${args.seed}`);
  console.log("");

  let success = false;

  try {
    switch (args.command) {
      case "run:single":
        success = await runSingle(args);
        break;
      case "run:batch":
        success = await runBatch(args);
        break;
      case "run:concurrent":
        success = await runConcurrent(args);
        break;
      case "run:chaos":
        success = await runChaos(args);
        break;
      case "run:replay":
        success = await runReplay(args);
        break;
      case "run:load":
        success = await runLoad(args);
        break;
      case "health":
        success = await checkHealth(args.serverUrl);
        break;
      default:
        console.error(`Unknown command: "${args.command}"`);
        console.error('Run with --help to see available commands.\n');
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`\nError running "${args.command}":`);
    console.error(`   ${err.message}`);
    if (err.stack) {
      console.error(`\nStack trace:\n${err.stack}`);
    }
    process.exit(1);
  }

  if (success) {
    console.log("\u2705 All checks passed.");
    process.exit(0);
  } else {
    console.error("\u274C Some checks failed. See report above for details.");
    process.exit(1);
  }
}

main();
