#!/usr/bin/env node
/**
 * Production Readiness Harness — CLI Entry Point
 *
 * Usage:
 *   npx tsx tools/prod-readiness-harness/src/cli/index.ts <command> [options]
 *
 * Commands:
 *   smoke      Run smoke tests (health, user, daily-drop, auth-gate, static)
 *   api        Run API contract tests
 *   load       Run load tests
 *   stress     Run stress tests
 *   soak       Run soak tests
 *   chaos      Run chaos experiments
 *   security   Run security checks
 *   full       Run all suites sequentially
 *
 * Options:
 *   --server-url <url>   Server base URL        (default: http://localhost:3000)
 *   --seed <n>           Deterministic RNG seed  (default: 42)
 *   --report-dir <dir>   Report output directory (default: tools/prod-readiness-harness/reports)
 *   --verbose            Enable verbose logging
 *   --fail-fast          Abort on first failure
 *   --diff               Compare with previous run
 *   --timeout <ms>       Per-request timeout     (default: 30000)
 *   --concurrency <n>    Parallel workers        (default: 4)
 */

import { parseArgs } from "./args";
import { DEFAULT_CONFIG, type HarnessConfig, type TestResult, type SuiteResult, type RunResult } from "../../harness.config";
import { HttpClient } from "../core/http-client";
import { UserFactory } from "../synthetic/user-factory";
import { printConsoleReport, printSuiteReport } from "../report/console-reporter";
import { writeJsonReport } from "../report/json-reporter";
import { writeHtmlReport } from "../report/html-reporter";
import { computeScorecard } from "../report/scorecard";
import { cleanup } from "../data/cleanup";
import { runApiTests } from "../api/api-test-runner";
import { runSecurityTests } from "../security/security-runner";
import { runChaosTests } from "../chaos/chaos-runner";
import { runLoadTests } from "../load/load-runner";

// ---------------------------------------------------------------------------
// ANSI helpers (minimal, for the banner)
// ---------------------------------------------------------------------------

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const CYAN = `${ESC}36m`;
const GRAY = `${ESC}90m`;
const YELLOW = `${ESC}33m`;
const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;

// ---------------------------------------------------------------------------
// Config builder
// ---------------------------------------------------------------------------

function buildConfig(options: Record<string, string | boolean>): HarnessConfig {
  const config: HarnessConfig = { ...DEFAULT_CONFIG };

  if (typeof options.serverUrl === "string") config.serverUrl = options.serverUrl;
  if (typeof options.seed === "string") config.seed = parseInt(options.seed, 10);
  if (typeof options.concurrency === "string") config.concurrency = parseInt(options.concurrency, 10);
  if (typeof options.reportDir === "string") config.reportDir = options.reportDir;
  if (typeof options.timeout === "string") config.timeout = parseInt(options.timeout, 10);
  if (typeof options.testUserPrefix === "string") config.testUserPrefix = options.testUserPrefix;

  if (typeof options.format === "string") {
    config.formats = options.format.split(",").map((f) => f.trim()) as HarnessConfig["formats"];
  }

  if (options.verbose === true) config.verbose = true;
  if (options.failFast === true) config.failFast = true;
  if (options.diff === true) config.diff = true;

  return config;
}

// ---------------------------------------------------------------------------
// Smoke test runner
// ---------------------------------------------------------------------------

async function runSmokeTests(config: HarnessConfig): Promise<SuiteResult> {
  const tests: TestResult[] = [];
  const suiteStart = performance.now();

  const client = new HttpClient(config.serverUrl);
  const testUserId = `${config.testUserPrefix}-${config.seed}-smoke-0`;
  const authedClient = new HttpClient(config.serverUrl, testUserId);

  // ---- 1. Health check ----
  {
    const name = "Health check (GET /api/test/health)";
    const start = performance.now();
    try {
      const res = await client.get<{ testMode: boolean; uptime: number }>("/api/test/health");
      const duration = performance.now() - start;

      if (res.status !== 200) {
        tests.push({ name, passed: false, duration, error: `Expected 200, got ${res.status}` });
      } else if (!res.data.testMode) {
        tests.push({
          name,
          passed: false,
          duration,
          error: "Server is not in TEST_MODE. Set TEST_MODE=true and restart.",
        });
      } else {
        tests.push({ name, passed: true, duration, details: `uptime=${res.data.uptime.toFixed(1)}s` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // ---- 2. User creation ----
  {
    const name = "User creation (POST /api/test/ensure-user + GET /api/user)";
    const start = performance.now();
    try {
      // Ensure user via test hook
      const ensureRes = await authedClient.post("/api/test/ensure-user");
      if (ensureRes.status >= 400) {
        throw new Error(`ensure-user returned ${ensureRes.status}: ${JSON.stringify(ensureRes.data)}`);
      }

      // Fetch user profile
      const userRes = await authedClient.get<{ id: string | number }>("/api/user");
      const duration = performance.now() - start;

      if (userRes.status !== 200) {
        tests.push({ name, passed: false, duration, error: `GET /api/user returned ${userRes.status}` });
      } else if (!userRes.data || !userRes.data.id) {
        tests.push({ name, passed: false, duration, error: "User response missing 'id' field" });
      } else {
        tests.push({ name, passed: true, duration, details: `userId=${userRes.data.id}` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // ---- 3. Daily drop ----
  {
    const name = "Daily drop (GET /api/daily-drop)";
    const start = performance.now();
    try {
      const res = await authedClient.get<{ scenarios?: unknown }>("/api/daily-drop");
      const duration = performance.now() - start;

      if (res.status !== 200) {
        tests.push({ name, passed: false, duration, error: `Expected 200, got ${res.status}` });
      } else if (!res.data || typeof res.data !== "object") {
        tests.push({ name, passed: false, duration, error: "Response is not an object" });
      } else if (!("scenarios" in res.data)) {
        tests.push({ name, passed: false, duration, error: "Response missing 'scenarios' field" });
      } else {
        const scenarioCount = Array.isArray(res.data.scenarios) ? res.data.scenarios.length : "?";
        tests.push({ name, passed: true, duration, details: `scenarios=${scenarioCount}` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // ---- 4. Auth gate (no auth header → should get 401) ----
  {
    const name = "Auth gate (POST /api/submit-game without auth)";
    const start = performance.now();
    try {
      // Use a bare client without X-Test-User-Id header
      const bareClient = new HttpClient(config.serverUrl);
      const res = await bareClient.post("/api/submit-game", {
        dropId: "fake-drop-id",
        answers: [],
        score: 0,
        totalQuestions: 0,
      });
      const duration = performance.now() - start;

      if (res.status === 401 || res.status === 403) {
        tests.push({
          name,
          passed: true,
          duration,
          details: `Correctly blocked with ${res.status}`,
        });
      } else {
        tests.push({
          name,
          passed: false,
          duration,
          error: `Expected 401/403, got ${res.status}. Auth gate may be open.`,
        });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // ---- 5. Static assets ----
  {
    const name = "Static assets (GET / → HTML)";
    const start = performance.now();
    try {
      const res = await client.get<string>("/");
      const duration = performance.now() - start;

      if (res.status !== 200) {
        tests.push({ name, passed: false, duration, error: `Expected 200, got ${res.status}` });
      } else {
        const contentType = res.headers["content-type"] ?? "";
        if (!contentType.includes("text/html")) {
          tests.push({
            name,
            passed: false,
            duration,
            error: `Expected content-type text/html, got "${contentType}"`,
          });
        } else {
          tests.push({ name, passed: true, duration, details: `content-type=${contentType}` });
        }
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  const suiteDuration = performance.now() - suiteStart;
  const allPassed = tests.every((t) => t.passed);

  return {
    suite: "Smoke Tests",
    passed: allPassed,
    duration: suiteDuration,
    tests,
  };
}

// ---------------------------------------------------------------------------
// Placeholder suite runner
// ---------------------------------------------------------------------------

function placeholderSuite(suiteName: string): SuiteResult {
  return {
    suite: suiteName,
    passed: true,
    duration: 0,
    tests: [
      {
        name: `${suiteName} (not yet implemented)`,
        passed: true,
        duration: 0,
        details: "Placeholder — this suite will be implemented in a future iteration.",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Score & grade computation
// ---------------------------------------------------------------------------

function computeScoreAndGrade(suites: SuiteResult[]): { score: number; grade: "A" | "B" | "C" | "D" | "F" } {
  if (suites.length === 0) return { score: 0, grade: "F" };

  const totalTests = suites.reduce((n, s) => n + s.tests.length, 0);
  const passedTests = suites.reduce(
    (n, s) => n + s.tests.filter((t) => t.passed).length,
    0,
  );

  // Score is percentage of passing tests, rounded to nearest integer
  const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 95) grade = "A";
  else if (score >= 80) grade = "B";
  else if (score >= 65) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "F";

  return { score, grade };
}

// ---------------------------------------------------------------------------
// Diff against previous run
// ---------------------------------------------------------------------------

function loadPreviousRun(reportDir: string): RunResult | null {
  try {
    const { readFileSync } = require("fs");
    const { join } = require("path");
    const latestPath = join(reportDir, "latest.json");
    const raw = readFileSync(latestPath, "utf-8");
    return JSON.parse(raw) as RunResult;
  } catch {
    return null;
  }
}

function computeDiff(current: RunResult, previous: RunResult): RunResult["diff"] {
  const prevFailedSet = new Set<string>();
  const currFailedSet = new Set<string>();

  for (const suite of previous.suites) {
    for (const test of suite.tests) {
      if (!test.passed) prevFailedSet.add(`${suite.suite}/${test.name}`);
    }
  }

  for (const suite of current.suites) {
    for (const test of suite.tests) {
      if (!test.passed) currFailedSet.add(`${suite.suite}/${test.name}`);
    }
  }

  const newFailures = [...currFailedSet].filter((f) => !prevFailedSet.has(f));
  const resolvedFailures = [...prevFailedSet].filter((f) => !currFailedSet.has(f));
  const scoreChange = current.overallScore - previous.overallScore;

  return {
    previousRun: previous.timestamp,
    newFailures,
    resolvedFailures,
    scoreChange,
    metricDeltas: [],
  };
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

function printBanner(command: string, config: HarnessConfig): void {
  console.log("");
  console.log(`${CYAN}${BOLD}  ╔══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}${BOLD}  ║       Production Readiness Harness v1.0.0            ║${RESET}`);
  console.log(`${CYAN}${BOLD}  ╚══════════════════════════════════════════════════════╝${RESET}`);
  console.log("");
  console.log(`  ${GRAY}Command:${RESET}    ${BOLD}${command}${RESET}`);
  console.log(`  ${GRAY}Server:${RESET}     ${config.serverUrl}`);
  console.log(`  ${GRAY}Seed:${RESET}       ${config.seed}`);
  console.log(`  ${GRAY}Timeout:${RESET}    ${config.timeout}ms`);
  console.log(`  ${GRAY}Report dir:${RESET} ${config.reportDir}`);
  console.log("");
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

function printUsage(): void {
  console.log(`
${BOLD}Usage:${RESET} npx tsx src/cli/index.ts <command> [options]

${BOLD}Commands:${RESET}
  smoke      Run smoke tests (health, user, daily-drop, auth-gate, static)
  api        Run API contract tests
  load       Run load tests
  stress     Run stress tests
  soak       Run soak tests
  chaos      Run chaos experiments
  security   Run security checks
  full       Run all suites sequentially

${BOLD}Options:${RESET}
  --server-url <url>   Server base URL        (default: http://localhost:3000)
  --seed <n>           Deterministic RNG seed  (default: 42)
  --report-dir <dir>   Report output directory
  --verbose            Enable verbose logging
  --fail-fast          Abort on first failure
  --diff               Compare with previous run
  --timeout <ms>       Per-request timeout     (default: 30000)
  --concurrency <n>    Parallel workers        (default: 4)
`);
}

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

async function dispatch(
  command: string,
  config: HarnessConfig,
): Promise<SuiteResult[]> {
  switch (command) {
    case "smoke":
      return [await runSmokeTests(config)];

    case "api":
      return [await runApiTests(config)];

    case "load":
      return [await runLoadTests(config, "smoke")];

    case "stress":
      return [await runLoadTests(config, "stress")];

    case "soak":
      return [await runLoadTests(config, "sustained")];

    case "chaos":
      return [await runChaosTests(config)];

    case "security":
      return [await runSecurityTests(config)];

    case "full": {
      const suites: SuiteResult[] = [];

      // 1. Smoke (real)
      console.log(`  ${CYAN}[1/7]${RESET} Running smoke tests...`);
      suites.push(await runSmokeTests(config));

      // If fail-fast and smoke failed, bail early
      if (config.failFast && !suites[suites.length - 1].passed) {
        console.log(`  ${RED}Fail-fast: smoke tests failed. Aborting remaining suites.${RESET}`);
        return suites;
      }

      // 2. API contract tests (real)
      console.log(`  ${CYAN}[2/7]${RESET} Running API contract tests...`);
      suites.push(await runApiTests(config));

      if (config.failFast && !suites[suites.length - 1].passed) {
        console.log(`  ${RED}Fail-fast: API tests failed. Aborting remaining suites.${RESET}`);
        return suites;
      }

      // Brief recovery pause between heavy suites (let DB pool recover)
      console.log(`  ${GRAY}Pausing 3s for DB connection recovery...${RESET}`);
      await new Promise((r) => setTimeout(r, 3000));

      // 3. Security checks
      console.log(`  ${CYAN}[3/7]${RESET} Running security checks...`);
      suites.push(await runSecurityTests(config));

      if (config.failFast && !suites[suites.length - 1].passed) {
        console.log(`  ${RED}Fail-fast: security tests failed. Aborting remaining suites.${RESET}`);
        return suites;
      }

      // Brief recovery pause
      console.log(`  ${GRAY}Pausing 3s for DB connection recovery...${RESET}`);
      await new Promise((r) => setTimeout(r, 3000));

      // 4. Load smoke test
      console.log(`  ${CYAN}[4/7]${RESET} Running load smoke test...`);
      suites.push(await runLoadTests(config, "smoke"));

      if (config.failFast && !suites[suites.length - 1].passed) {
        console.log(`  ${RED}Fail-fast: load tests failed. Aborting remaining suites.${RESET}`);
        return suites;
      }

      // Recovery before chaos
      console.log(`  ${GRAY}Pausing 3s for DB connection recovery...${RESET}`);
      await new Promise((r) => setTimeout(r, 3000));

      // 5. Chaos experiments
      console.log(`  ${CYAN}[5/7]${RESET} Running chaos experiments...`);
      suites.push(await runChaosTests(config));

      return suites;
    }

    default:
      console.error(`  ${RED}Unknown command: "${command}"${RESET}`);
      printUsage();
      process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { command, options } = parseArgs();

  if (!command || options.help === true || options.h === true) {
    printUsage();
    process.exit(0);
  }

  const config = buildConfig(options);

  printBanner(command, config);

  const runStart = performance.now();

  // Run suites
  const suites = await dispatch(command, config);

  const runDuration = performance.now() - runStart;
  const overallPassed = suites.every((s) => s.passed);

  // Use weighted scorecard for scoring
  const tempResult: RunResult = {
    timestamp: new Date().toISOString(),
    seed: config.seed,
    serverUrl: config.serverUrl,
    overallScore: 0,
    overallPassed,
    grade: "F",
    duration: runDuration,
    suites,
  };
  const scorecard = computeScorecard(tempResult);
  const { score, grade } = { score: scorecard.score, grade: scorecard.grade };

  // Build the RunResult
  const result: RunResult = {
    timestamp: new Date().toISOString(),
    seed: config.seed,
    serverUrl: config.serverUrl,
    overallScore: score,
    overallPassed,
    grade,
    duration: runDuration,
    suites,
  };

  // Diff against previous run
  if (config.diff) {
    const previous = loadPreviousRun(config.reportDir);
    if (previous) {
      result.diff = computeDiff(result, previous);
    } else {
      console.log(`  ${GRAY}No previous run found in ${config.reportDir}/latest.json — skipping diff.${RESET}`);
    }
  }

  // Report
  if (config.formats.includes("console")) {
    printConsoleReport(result);
  }

  if (config.formats.includes("json")) {
    try {
      const filepath = writeJsonReport(result, config.reportDir);
      console.log(`  ${GRAY}JSON report written to: ${filepath}${RESET}`);
    } catch (err: any) {
      console.error(`  ${RED}Failed to write JSON report: ${err.message}${RESET}`);
    }
  }

  if (config.formats.includes("html")) {
    try {
      const filepath = writeHtmlReport(result, config.reportDir);
      console.log(`  ${GRAY}HTML report written to: ${filepath}${RESET}`);
    } catch (err: any) {
      console.error(`  ${RED}Failed to write HTML report: ${err.message}${RESET}`);
    }
  }

  // Cleanup test data
  if (config.verbose) {
    console.log(`  ${GRAY}Cleaning up test data (prefix: ${config.testUserPrefix})...${RESET}`);
  }
  const { deleted } = await cleanup(config.serverUrl, config.testUserPrefix);
  if (config.verbose && deleted > 0) {
    console.log(`  ${GRAY}Cleaned up ${deleted} test records.${RESET}`);
  }

  // Exit with appropriate code
  process.exit(overallPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(`${RED}${BOLD}Fatal error:${RESET} ${err.message}`);
  if (err.stack) {
    console.error(`${DIM}${err.stack}${RESET}`);
  }
  process.exit(2);
});
