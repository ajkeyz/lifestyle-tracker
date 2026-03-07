/**
 * ANSI-colored console reporter for production-readiness harness results.
 *
 * Renders a human-readable report to stdout with:
 *  - Pass/fail banner
 *  - Per-suite summary with test counts and duration
 *  - Failed test details with error messages
 *  - Latency percentile bar charts (when metrics are present)
 *  - Overall scorecard with letter grade
 *
 * Uses raw ANSI escape codes — zero external dependencies.
 */

import type { RunResult, SuiteResult, TestResult } from "../../harness.config";

// ---------------------------------------------------------------------------
// ANSI escape helpers
// ---------------------------------------------------------------------------

const ESC = "\x1b[";
const RESET = `${ESC}0m`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const UNDERLINE = `${ESC}4m`;

const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const BLUE = `${ESC}34m`;
const MAGENTA = `${ESC}35m`;
const CYAN = `${ESC}36m`;
const WHITE = `${ESC}37m`;
const GRAY = `${ESC}90m`;

const BG_RED = `${ESC}41m`;
const BG_GREEN = `${ESC}42m`;
const BG_YELLOW = `${ESC}43m`;
const BG_BLUE = `${ESC}44m`;
const BG_MAGENTA = `${ESC}45m`;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function pad(s: string, len: number): string {
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

function padLeft(s: string, len: number): string {
  return s.length >= len ? s : " ".repeat(len - s.length) + s;
}

function ms(n: number): string {
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(2)}s`;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

/**
 * Render a horizontal bar using block characters.
 * `value` is mapped proportionally within [0, max].
 */
function bar(value: number, max: number, width: number = 30): string {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  return `${"█".repeat(filled)}${"░".repeat(empty)}`;
}

function passFailBadge(passed: boolean): string {
  if (passed) {
    return `${BG_GREEN}${BOLD}${WHITE} PASS ${RESET}`;
  }
  return `${BG_RED}${BOLD}${WHITE} FAIL ${RESET}`;
}

function gradeColor(grade: string): string {
  switch (grade) {
    case "A":
      return GREEN;
    case "B":
      return CYAN;
    case "C":
      return YELLOW;
    case "D":
      return MAGENTA;
    case "F":
      return RED;
    default:
      return WHITE;
  }
}

function testIcon(passed: boolean): string {
  return passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
}

// ---------------------------------------------------------------------------
// Dividers
// ---------------------------------------------------------------------------

const THIN_LINE = `${GRAY}${"─".repeat(70)}${RESET}`;
const THICK_LINE = `${GRAY}${"═".repeat(70)}${RESET}`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Print a detailed report for a single suite to stdout.
 */
export function printSuiteReport(result: SuiteResult): void {
  const badge = passFailBadge(result.passed);
  const passedCount = result.tests.filter((t) => t.passed).length;
  const failedCount = result.tests.length - passedCount;

  console.log("");
  console.log(
    `  ${badge} ${BOLD}${result.suite}${RESET}  ` +
      `${GREEN}${passedCount} passed${RESET}` +
      (failedCount > 0 ? `  ${RED}${failedCount} failed${RESET}` : "") +
      `  ${GRAY}${ms(result.duration)}${RESET}`,
  );
  console.log(THIN_LINE);

  // Individual test results
  for (const test of result.tests) {
    const icon = testIcon(test.passed);
    const dur = `${GRAY}(${ms(test.duration)})${RESET}`;
    console.log(`    ${icon} ${test.name} ${dur}`);

    if (!test.passed && test.error) {
      const lines = test.error.split("\n");
      for (const line of lines) {
        console.log(`      ${RED}${line}${RESET}`);
      }
    }

    if (test.details) {
      console.log(`      ${DIM}${test.details}${RESET}`);
    }
  }

  // Latency percentile chart (if metrics are present)
  if (result.metrics) {
    const m = result.metrics;
    const maxLatency = Math.max(
      m.latencyP50 ?? 0,
      m.latencyP95 ?? 0,
      m.latencyP99 ?? 0,
    );

    if (maxLatency > 0) {
      console.log("");
      console.log(`    ${BOLD}${UNDERLINE}Latency Percentiles${RESET}`);
      console.log("");

      if (m.latencyP50 !== undefined) {
        const b = bar(m.latencyP50, maxLatency, 25);
        console.log(
          `    ${CYAN}p50${RESET}  ${b} ${padLeft(ms(m.latencyP50), 8)}`,
        );
      }
      if (m.latencyP95 !== undefined) {
        const b = bar(m.latencyP95, maxLatency, 25);
        console.log(
          `    ${YELLOW}p95${RESET}  ${b} ${padLeft(ms(m.latencyP95), 8)}`,
        );
      }
      if (m.latencyP99 !== undefined) {
        const b = bar(m.latencyP99, maxLatency, 25);
        console.log(
          `    ${RED}p99${RESET}  ${b} ${padLeft(ms(m.latencyP99), 8)}`,
        );
      }
    }

    if (m.errorRate !== undefined && m.errorRate > 0) {
      console.log(`    ${RED}Error rate: ${pct(m.errorRate)}${RESET}`);
    }

    if (m.throughput !== undefined) {
      console.log(
        `    ${BLUE}Throughput: ${m.throughput.toFixed(1)} req/s${RESET}`,
      );
    }

    if (m.peakMemoryMB !== undefined && m.peakMemoryMB > 0) {
      console.log(
        `    ${MAGENTA}Peak memory: ${m.peakMemoryMB.toFixed(1)} MB${RESET}`,
      );
    }
  }

  console.log("");
}

/**
 * Print the full run report: banner, per-suite summaries, scorecard.
 */
export function printConsoleReport(result: RunResult): void {
  const banner = result.overallPassed
    ? `${BG_GREEN}${BOLD}${WHITE}`
    : `${BG_RED}${BOLD}${WHITE}`;

  console.log("");
  console.log(THICK_LINE);
  console.log("");
  console.log(
    `  ${banner}  PRODUCTION READINESS REPORT  ${RESET}`,
  );
  console.log("");
  console.log(
    `  ${GRAY}Server:${RESET}    ${result.serverUrl}`,
  );
  console.log(
    `  ${GRAY}Timestamp:${RESET} ${result.timestamp}`,
  );
  console.log(
    `  ${GRAY}Seed:${RESET}      ${result.seed}`,
  );
  console.log(
    `  ${GRAY}Duration:${RESET}  ${ms(result.duration)}`,
  );
  console.log("");
  console.log(THICK_LINE);

  // Per-suite summaries
  for (const suite of result.suites) {
    printSuiteReport(suite);
  }

  // Failed tests summary (if any failures)
  const allFailed: { suite: string; test: TestResult }[] = [];
  for (const suite of result.suites) {
    for (const test of suite.tests) {
      if (!test.passed) {
        allFailed.push({ suite: suite.suite, test });
      }
    }
  }

  if (allFailed.length > 0) {
    console.log(THICK_LINE);
    console.log("");
    console.log(
      `  ${BG_RED}${BOLD}${WHITE}  FAILURES (${allFailed.length})  ${RESET}`,
    );
    console.log("");

    for (const { suite, test } of allFailed) {
      console.log(
        `  ${RED}✗${RESET} ${BOLD}${suite}${RESET} > ${test.name}`,
      );
      if (test.error) {
        console.log(`    ${RED}${test.error}${RESET}`);
      }
    }
    console.log("");
  }

  // Diff results (if present)
  if (result.diff) {
    const d = result.diff;
    console.log(THIN_LINE);
    console.log(
      `  ${BOLD}${UNDERLINE}Diff vs Previous Run${RESET}  ${GRAY}(${d.previousRun})${RESET}`,
    );
    console.log("");

    const scoreDir = d.scoreChange > 0 ? GREEN : d.scoreChange < 0 ? RED : GRAY;
    const scoreSign = d.scoreChange > 0 ? "+" : "";
    console.log(
      `  Score: ${scoreDir}${scoreSign}${d.scoreChange}${RESET}`,
    );

    if (d.newFailures.length > 0) {
      console.log(
        `  ${RED}New failures:${RESET} ${d.newFailures.join(", ")}`,
      );
    }
    if (d.resolvedFailures.length > 0) {
      console.log(
        `  ${GREEN}Resolved:${RESET} ${d.resolvedFailures.join(", ")}`,
      );
    }

    if (d.metricDeltas.length > 0) {
      console.log("");
      for (const md of d.metricDeltas) {
        const dirColor =
          md.direction === "better"
            ? GREEN
            : md.direction === "worse"
              ? RED
              : GRAY;
        const arrow =
          md.direction === "better"
            ? "v"
            : md.direction === "worse"
              ? "^"
              : "=";
        console.log(
          `    ${dirColor}${arrow}${RESET} ${pad(md.name, 20)} ` +
            `${md.previous.toFixed(1)} -> ${md.current.toFixed(1)}`,
        );
      }
    }
    console.log("");
  }

  // Overall scorecard
  console.log(THICK_LINE);
  console.log("");

  const gc = gradeColor(result.grade);
  const suitesTotal = result.suites.length;
  const suitesPassed = result.suites.filter((s) => s.passed).length;
  const totalTests = result.suites.reduce((n, s) => n + s.tests.length, 0);
  const totalPassed = result.suites.reduce(
    (n, s) => n + s.tests.filter((t) => t.passed).length,
    0,
  );

  console.log(
    `  ${BOLD}Overall Grade:${RESET} ${gc}${BOLD}  ${result.grade}  ${RESET}  ` +
      `${GRAY}(score: ${result.overallScore}/100)${RESET}`,
  );
  console.log(
    `  ${BOLD}Suites:${RESET}        ${suitesPassed}/${suitesTotal} passed`,
  );
  console.log(
    `  ${BOLD}Tests:${RESET}         ${totalPassed}/${totalTests} passed`,
  );
  console.log("");

  if (result.overallPassed) {
    console.log(
      `  ${GREEN}${BOLD}All checks passed. Server is production-ready.${RESET}`,
    );
  } else {
    console.log(
      `  ${RED}${BOLD}Some checks failed. See failures above.${RESET}`,
    );
  }

  console.log("");
  console.log(THICK_LINE);
  console.log("");
}
