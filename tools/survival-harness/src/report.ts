/**
 * Report generator for the Survival Mode test harness.
 *
 * Produces both pretty-printed console output (with ANSI colors)
 * and a self-contained HTML dashboard report.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import type { ValidationError } from "./config";
import type { RunResult } from "./runner";
import type { ReplayResult } from "./replayer";

const __filename_esm = fileURLToPath(import.meta.url);
const __dirname_esm = path.dirname(__filename_esm);

// ---------------------------------------------------------------------------
// ANSI helpers
// ---------------------------------------------------------------------------

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
};

function bold(text: string): string {
  return `${ANSI.bold}${text}${ANSI.reset}`;
}

function green(text: string): string {
  return `${ANSI.green}${text}${ANSI.reset}`;
}

function red(text: string): string {
  return `${ANSI.red}${text}${ANSI.reset}`;
}

function yellow(text: string): string {
  return `${ANSI.yellow}${text}${ANSI.reset}`;
}

function cyan(text: string): string {
  return `${ANSI.cyan}${text}${ANSI.reset}`;
}

function dim(text: string): string {
  return `${ANSI.dim}${text}${ANSI.reset}`;
}

function statusBadge(passed: boolean): string {
  return passed
    ? `${ANSI.bgGreen}${ANSI.bold} PASS ${ANSI.reset}`
    : `${ANSI.bgRed}${ANSI.bold} FAIL ${ANSI.reset}`;
}

function statusIcon(passed: boolean): string {
  return passed ? green("✅") : red("❌");
}

function pad(str: string, len: number): string {
  return str.padEnd(len);
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function divider(char = "─", length = 60): string {
  return dim(char.repeat(length));
}

// ---------------------------------------------------------------------------
// Console report
// ---------------------------------------------------------------------------

export function printConsoleReport(result: RunResult): void {
  const lines: string[] = [];

  // Header
  lines.push("");
  lines.push(divider("═"));
  lines.push(
    `  ${statusBadge(result.passed)}  ${bold(result.scenario)}`
  );
  lines.push(divider("═"));
  lines.push("");

  // Summary
  const matchesPassed = result.matches.filter(
    (m) => m.errors.filter((e) => e.severity === "error").length === 0
  ).length;
  const passRate =
    result.matches.length > 0
      ? ((matchesPassed / result.matches.length) * 100).toFixed(1)
      : "N/A";

  lines.push(bold("  Summary"));
  lines.push(divider());
  lines.push(
    `  ${cyan("Matches played:")}  ${result.matches.length}`
  );
  lines.push(
    `  ${cyan("Matches passed:")}  ${matchesPassed}/${result.matches.length} (${passRate}%)`
  );
  lines.push(
    `  ${cyan("Total duration:")}  ${formatMs(result.duration)}`
  );
  lines.push(
    `  ${cyan("Overall result:")}  ${statusIcon(result.passed)} ${result.passed ? "PASSED" : "FAILED"}`
  );
  lines.push("");

  // Validation errors grouped by rule
  if (result.validationErrors.length > 0) {
    const grouped = groupValidationErrors(result.validationErrors);
    const sorted = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);

    lines.push(bold("  Validation Errors"));
    lines.push(divider());
    lines.push(
      `  ${dim(pad("Rule", 35))} ${dim(pad("Count", 8))} ${dim("Severity")}`
    );
    lines.push(`  ${dim("─".repeat(55))}`);

    const topN = sorted.slice(0, 10);
    for (const [rule, info] of topN) {
      const severityStr =
        info.severity === "error" ? red(info.severity) : yellow(info.severity);
      lines.push(
        `  ${pad(rule, 35)} ${pad(String(info.count), 8)} ${severityStr}`
      );
    }

    if (sorted.length > 10) {
      lines.push(dim(`  ... and ${sorted.length - 10} more rules`));
    }
    lines.push("");
  }

  // Latency percentiles
  lines.push(bold("  Latency Percentiles"));
  lines.push(divider());
  lines.push(
    `  ${dim(pad("Percentile", 15))} ${dim(pad("Value", 15))} ${dim("Bar")}`
  );
  lines.push(`  ${dim("─".repeat(50))}`);

  const maxLatency = Math.max(
    result.metrics.latencyP50,
    result.metrics.latencyP95,
    result.metrics.latencyP99,
    1
  );
  const latencies = [
    { label: "P50", value: result.metrics.latencyP50 },
    { label: "P95", value: result.metrics.latencyP95 },
    { label: "P99", value: result.metrics.latencyP99 },
  ];

  for (const l of latencies) {
    const barLen = Math.round((l.value / maxLatency) * 25);
    const bar = "█".repeat(barLen) + "░".repeat(25 - barLen);
    const color = l.label === "P99" && l.value > 1000 ? red : l.value > 500 ? yellow : green;
    lines.push(
      `  ${pad(l.label, 15)} ${pad(formatMs(l.value), 15)} ${color(bar)}`
    );
  }
  lines.push("");

  // Memory usage
  lines.push(bold("  Memory Usage"));
  lines.push(divider());
  lines.push(
    `  ${cyan("Peak memory:")}  ${result.metrics.peakMemoryMB.toFixed(1)} MB`
  );
  lines.push("");

  // Error rate breakdown
  const breakdown = result.metrics.errorBreakdown;
  const breakdownEntries = Object.entries(breakdown);
  if (breakdownEntries.length > 0) {
    lines.push(bold("  Error Breakdown"));
    lines.push(divider());
    lines.push(
      `  ${dim(pad("Type", 30))} ${dim(pad("Count", 8))} ${dim("Percentage")}`
    );
    lines.push(`  ${dim("─".repeat(50))}`);

    const totalErrors = result.metrics.totalErrors || 1;
    const sortedBreakdown = breakdownEntries.sort((a, b) => b[1] - a[1]);
    for (const [type, count] of sortedBreakdown) {
      const pct = ((count / totalErrors) * 100).toFixed(1);
      lines.push(
        `  ${pad(type, 30)} ${pad(String(count), 8)} ${red(pct + "%")}`
      );
    }
    lines.push(
      `  ${dim("─".repeat(50))}`
    );
    lines.push(
      `  ${pad("Total", 30)} ${pad(String(result.metrics.totalErrors), 8)}`
    );
    lines.push("");
  }

  // Traffic
  lines.push(bold("  Traffic"));
  lines.push(divider());
  lines.push(
    `  ${cyan("WS messages:")}     ${result.metrics.totalWsMessages.toLocaleString()}`
  );
  lines.push(
    `  ${cyan("HTTP requests:")}   ${result.metrics.totalHttpRequests.toLocaleString()}`
  );
  lines.push("");
  lines.push(divider("═"));
  lines.push("");

  console.log(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// Replay console report
// ---------------------------------------------------------------------------

export function printReplayReport(result: ReplayResult): void {
  const lines: string[] = [];

  lines.push("");
  lines.push(divider("═"));
  lines.push(`  ${bold("Replay Report")}`);
  lines.push(divider("═"));
  lines.push("");
  lines.push(
    `  ${cyan("Original match:")}  ${result.originalMatchId}`
  );
  lines.push(
    `  ${cyan("Replay match:")}   ${result.replayMatchId}`
  );
  lines.push(
    `  ${cyan("Seed:")}            ${result.seed}`
  );
  lines.push(
    `  ${cyan("Deterministic:")}   ${result.deterministic ? green("true") : red("false")}`
  );
  lines.push("");

  if (result.differences.length > 0) {
    lines.push(bold("  Differences"));
    lines.push(divider());
    for (const diff of result.differences) {
      lines.push(`  ${red("•")} ${diff}`);
    }
    lines.push("");
  } else {
    lines.push(`  ${green("No differences detected — replay is deterministic.")}`);
    lines.push("");
  }

  if (result.validationErrors.length > 0) {
    lines.push(bold("  Validation Errors During Replay"));
    lines.push(divider());
    for (const err of result.validationErrors) {
      const sev =
        err.severity === "error" ? red("ERROR") : yellow("WARN ");
      lines.push(`  ${sev}  [${err.rule}] ${err.message}`);
    }
    lines.push("");
  }

  lines.push(divider("═"));
  lines.push("");

  console.log(lines.join("\n"));
}

// ---------------------------------------------------------------------------
// HTML report
// ---------------------------------------------------------------------------

export function generateHtmlReport(
  results: RunResult[],
  replayResults?: ReplayResult[]
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportsDir = path.resolve(
    __dirname_esm,
    "../reports"
  );

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filePath = path.join(reportsDir, `report-${timestamp}.html`);

  const overallPassed = results.every((r) => r.passed);
  const totalMatches = results.reduce((s, r) => s + r.matches.length, 0);
  const totalDuration = results.reduce((s, r) => s + r.duration, 0);

  const scenarioCards = results.map((r) => buildScenarioCard(r)).join("\n");
  const validationTable = buildValidationTable(results);
  const latencyChart = buildLatencyChart(results);
  const replaySection =
    replayResults && replayResults.length > 0
      ? buildReplaySection(replayResults)
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Survival Harness Report — ${new Date().toLocaleString()}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, monospace;
    background: #0d1117;
    color: #c9d1d9;
    line-height: 1.6;
    padding: 24px;
  }
  h1, h2, h3 { color: #e6edf3; }
  .container { max-width: 1100px; margin: 0 auto; }

  /* Banner */
  .banner {
    padding: 20px 28px;
    border-radius: 12px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 1.3rem;
    font-weight: 700;
  }
  .banner.pass { background: #0d2818; border: 1px solid #238636; color: #3fb950; }
  .banner.fail { background: #2d1114; border: 1px solid #da3633; color: #f85149; }
  .banner .icon { font-size: 2rem; }

  /* Stats row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .stat-card {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
  }
  .stat-card .value { font-size: 1.8rem; font-weight: 700; color: #e6edf3; }
  .stat-card .label { font-size: 0.8rem; text-transform: uppercase; color: #8b949e; letter-spacing: 0.5px; }

  /* Section */
  .section {
    background: #161b22;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }
  .section h2 { margin-bottom: 14px; font-size: 1.1rem; }

  /* Scenario cards */
  .scenario { margin-bottom: 16px; padding: 16px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; }
  .scenario.pass { border-left: 4px solid #238636; }
  .scenario.fail { border-left: 4px solid #da3633; }
  .scenario-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .scenario-title { font-weight: 700; font-size: 1rem; }
  .badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }
  .badge.pass { background: #238636; color: #fff; }
  .badge.fail { background: #da3633; color: #fff; }
  .scenario-meta { font-size: 0.85rem; color: #8b949e; }
  .scenario-meta span { margin-right: 18px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { text-align: left; color: #8b949e; border-bottom: 1px solid #30363d; padding: 8px 10px; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }
  td { padding: 8px 10px; border-bottom: 1px solid #21262d; }
  tr:hover td { background: #1c2128; }
  .sev-error { color: #f85149; font-weight: 600; }
  .sev-warning { color: #d29922; font-weight: 600; }

  /* Latency chart */
  .chart-row { display: flex; align-items: center; margin-bottom: 6px; font-size: 0.85rem; }
  .chart-label { width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #8b949e; }
  .chart-bar-container { flex: 1; height: 22px; background: #21262d; border-radius: 4px; overflow: hidden; position: relative; }
  .chart-bar { height: 100%; border-radius: 4px; min-width: 2px; transition: width 0.3s ease; }
  .chart-bar.p50 { background: #3fb950; }
  .chart-bar.p95 { background: #d29922; }
  .chart-bar.p99 { background: #f85149; }
  .chart-value { width: 70px; text-align: right; font-family: monospace; color: #e6edf3; }

  /* Replay */
  .replay-card { margin-bottom: 12px; padding: 12px; border-radius: 6px; background: #0d1117; border: 1px solid #30363d; }
  .replay-card.deterministic { border-left: 4px solid #238636; }
  .replay-card.non-deterministic { border-left: 4px solid #da3633; }
  .diff-item { color: #f85149; font-family: monospace; font-size: 0.82rem; padding: 2px 0; }

  .footer { text-align: center; color: #484f58; font-size: 0.75rem; margin-top: 30px; }
</style>
</head>
<body>
<div class="container">

  <!-- Banner -->
  <div class="banner ${overallPassed ? "pass" : "fail"}">
    <span class="icon">${overallPassed ? "&#x2705;" : "&#x274C;"}</span>
    <span>Survival Harness — ${overallPassed ? "ALL SCENARIOS PASSED" : "SOME SCENARIOS FAILED"}</span>
  </div>

  <!-- Summary stats -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="value">${results.length}</div>
      <div class="label">Scenarios</div>
    </div>
    <div class="stat-card">
      <div class="value">${totalMatches}</div>
      <div class="label">Matches Played</div>
    </div>
    <div class="stat-card">
      <div class="value">${formatMs(totalDuration)}</div>
      <div class="label">Total Duration</div>
    </div>
    <div class="stat-card">
      <div class="value">${results.filter((r) => r.passed).length}/${results.length}</div>
      <div class="label">Passed</div>
    </div>
  </div>

  <!-- Scenario cards -->
  <div class="section">
    <h2>Scenario Results</h2>
    ${scenarioCards}
  </div>

  <!-- Validation error table -->
  ${validationTable}

  <!-- Latency chart -->
  ${latencyChart}

  <!-- Replay results -->
  ${replaySection}

  <div class="footer">Generated by survival-harness at ${new Date().toISOString()}</div>
</div>
</body>
</html>`;

  fs.writeFileSync(filePath, html, "utf-8");
  return filePath;
}

// ---------------------------------------------------------------------------
// HTML builder helpers
// ---------------------------------------------------------------------------

function buildScenarioCard(result: RunResult): string {
  const matchesPassed = result.matches.filter(
    (m) => m.errors.filter((e) => e.severity === "error").length === 0
  ).length;
  const passRate =
    result.matches.length > 0
      ? ((matchesPassed / result.matches.length) * 100).toFixed(1)
      : "N/A";

  return `
    <div class="scenario ${result.passed ? "pass" : "fail"}">
      <div class="scenario-header">
        <span class="scenario-title">${escapeHtml(result.scenario)}</span>
        <span class="badge ${result.passed ? "pass" : "fail"}">${result.passed ? "PASS" : "FAIL"}</span>
      </div>
      <div class="scenario-meta">
        <span>Matches: ${matchesPassed}/${result.matches.length} (${passRate}%)</span>
        <span>Duration: ${formatMs(result.duration)}</span>
        <span>Errors: ${result.metrics.totalErrors}</span>
        <span>P99: ${formatMs(result.metrics.latencyP99)}</span>
        <span>Peak Mem: ${result.metrics.peakMemoryMB.toFixed(1)} MB</span>
      </div>
    </div>`;
}

function buildValidationTable(results: RunResult[]): string {
  const allErrors = results.flatMap((r) => r.validationErrors);
  if (allErrors.length === 0) return "";

  const grouped = groupValidationErrors(allErrors);
  const sorted = [...grouped.entries()].sort((a, b) => b[1].count - a[1].count);

  const rows = sorted
    .map(
      ([rule, info]) => `
      <tr>
        <td>${escapeHtml(rule)}</td>
        <td class="sev-${info.severity}">${info.severity}</td>
        <td>${info.count}</td>
        <td>${escapeHtml(info.sampleMessage)}</td>
      </tr>`
    )
    .join("\n");

  return `
  <div class="section">
    <h2>Validation Errors (${allErrors.length} total)</h2>
    <table>
      <thead><tr><th>Rule</th><th>Severity</th><th>Count</th><th>Sample Message</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function buildLatencyChart(results: RunResult[]): string {
  if (results.length === 0) return "";

  const maxVal = Math.max(
    ...results.map((r) => r.metrics.latencyP99),
    1
  );

  const rows = results
    .map((r) => {
      const p50Pct = ((r.metrics.latencyP50 / maxVal) * 100).toFixed(1);
      const p95Pct = ((r.metrics.latencyP95 / maxVal) * 100).toFixed(1);
      const p99Pct = ((r.metrics.latencyP99 / maxVal) * 100).toFixed(1);

      return `
      <div style="margin-bottom: 16px;">
        <div style="font-weight: 600; margin-bottom: 6px; color: #e6edf3;">${escapeHtml(r.scenario)}</div>
        <div class="chart-row">
          <span class="chart-label">P50</span>
          <div class="chart-bar-container">
            <div class="chart-bar p50" style="width: ${p50Pct}%"></div>
          </div>
          <span class="chart-value">${formatMs(r.metrics.latencyP50)}</span>
        </div>
        <div class="chart-row">
          <span class="chart-label">P95</span>
          <div class="chart-bar-container">
            <div class="chart-bar p95" style="width: ${p95Pct}%"></div>
          </div>
          <span class="chart-value">${formatMs(r.metrics.latencyP95)}</span>
        </div>
        <div class="chart-row">
          <span class="chart-label">P99</span>
          <div class="chart-bar-container">
            <div class="chart-bar p99" style="width: ${p99Pct}%"></div>
          </div>
          <span class="chart-value">${formatMs(r.metrics.latencyP99)}</span>
        </div>
      </div>`;
    })
    .join("\n");

  return `
  <div class="section">
    <h2>Latency Percentiles</h2>
    ${rows}
  </div>`;
}

function buildReplaySection(replayResults: ReplayResult[]): string {
  const cards = replayResults
    .map((r) => {
      const diffItems =
        r.differences.length > 0
          ? r.differences
              .map((d) => `<div class="diff-item">- ${escapeHtml(d)}</div>`)
              .join("\n")
          : '<div style="color: #3fb950;">No differences — deterministic replay confirmed.</div>';

      const errItems =
        r.validationErrors.length > 0
          ? `<div style="margin-top: 8px;">
               <strong style="color: #8b949e;">Validation Errors:</strong>
               ${r.validationErrors
                 .map(
                   (e) =>
                     `<div class="diff-item"><span class="sev-${e.severity}">[${e.severity}]</span> [${escapeHtml(e.rule)}] ${escapeHtml(e.message)}</div>`
                 )
                 .join("\n")}
             </div>`
          : "";

      return `
      <div class="replay-card ${r.deterministic ? "deterministic" : "non-deterministic"}">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span><strong>Original:</strong> ${escapeHtml(r.originalMatchId)}</span>
          <span class="badge ${r.deterministic ? "pass" : "fail"}">${r.deterministic ? "DETERMINISTIC" : "NON-DETERMINISTIC"}</span>
        </div>
        <div class="scenario-meta">
          <span>Replay: ${escapeHtml(r.replayMatchId)}</span>
          <span>Seed: ${r.seed}</span>
        </div>
        <div style="margin-top: 8px;">
          ${diffItems}
        </div>
        ${errItems}
      </div>`;
    })
    .join("\n");

  return `
  <div class="section">
    <h2>Replay Results (${replayResults.length})</h2>
    ${cards}
  </div>`;
}

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

interface GroupedError {
  count: number;
  severity: "error" | "warning";
  sampleMessage: string;
}

function groupValidationErrors(
  errors: ValidationError[]
): Map<string, GroupedError> {
  const map = new Map<string, GroupedError>();

  for (const err of errors) {
    const existing = map.get(err.rule);
    if (existing) {
      existing.count++;
      // Prefer "error" severity if any occurrence is an error
      if (err.severity === "error") {
        existing.severity = "error";
      }
    } else {
      map.set(err.rule, {
        count: 1,
        severity: err.severity,
        sampleMessage: err.message,
      });
    }
  }

  return map;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
