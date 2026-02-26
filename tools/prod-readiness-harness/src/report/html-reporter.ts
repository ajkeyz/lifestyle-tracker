/**
 * Self-contained HTML report for production readiness results.
 *
 * Generates a single HTML file with embedded CSS (dark theme) and inline JS
 * so it can be opened directly in any browser — no external dependencies.
 */

import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { RunResult, SuiteResult, TestResult } from "../../harness.config";
import { computeScorecard, type ScorecardResult } from "./scorecard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ms(n: number): string {
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(2)}s`;
}

function gradeClass(grade: string): string {
  switch (grade) {
    case "A": return "grade-a";
    case "B": return "grade-b";
    case "C": return "grade-c";
    case "D": return "grade-d";
    default:  return "grade-f";
  }
}

// ---------------------------------------------------------------------------
// HTML sections
// ---------------------------------------------------------------------------

function renderStyles(): string {
  return `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      background: #0d1117;
      color: #c9d1d9;
      line-height: 1.6;
      padding: 2rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    h1, h2, h3 { font-weight: 600; }
    h1 { font-size: 1.5rem; color: #58a6ff; margin-bottom: 0.25rem; }
    h2 { font-size: 1.2rem; color: #8b949e; margin: 2rem 0 1rem; border-bottom: 1px solid #21262d; padding-bottom: 0.5rem; }
    h3 { font-size: 1rem; margin-bottom: 0.5rem; }
    .meta { color: #8b949e; font-size: 0.85rem; margin-bottom: 2rem; }
    .meta span { margin-right: 2rem; }

    /* Grade badge */
    .grade-badge {
      display: inline-block;
      font-size: 3rem;
      font-weight: 700;
      width: 80px;
      height: 80px;
      line-height: 80px;
      text-align: center;
      border-radius: 12px;
      margin-right: 1.5rem;
    }
    .grade-a { background: #238636; color: #fff; }
    .grade-b { background: #1f6feb; color: #fff; }
    .grade-c { background: #d29922; color: #fff; }
    .grade-d { background: #da3633; color: #fff; }
    .grade-f { background: #8b0000; color: #fff; }

    .scorecard {
      display: flex;
      align-items: center;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .scorecard-details { flex: 1; }
    .scorecard-details .score-num { font-size: 2rem; font-weight: 700; color: #f0f6fc; }
    .scorecard-details .score-label { color: #8b949e; font-size: 0.9rem; }

    /* Suite card */
    .suite-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      cursor: pointer;
      user-select: none;
    }
    .suite-header:hover { background: #1c2128; }
    .suite-name { font-weight: 600; font-size: 1rem; }
    .suite-stats { font-size: 0.85rem; color: #8b949e; }
    .badge-pass { color: #3fb950; }
    .badge-fail { color: #f85149; }

    /* Tests table */
    .tests-body { display: none; }
    .tests-body.open { display: block; }
    .test-row {
      display: flex;
      align-items: flex-start;
      padding: 0.5rem 1.25rem;
      border-top: 1px solid #21262d;
      font-size: 0.85rem;
    }
    .test-row:hover { background: #1c2128; }
    .test-icon { width: 24px; flex-shrink: 0; text-align: center; }
    .test-icon.pass { color: #3fb950; }
    .test-icon.fail { color: #f85149; }
    .test-name { flex: 1; }
    .test-dur { color: #8b949e; width: 80px; text-align: right; flex-shrink: 0; }
    .test-error { color: #f85149; font-size: 0.8rem; padding: 0.25rem 0 0.25rem 24px; word-break: break-word; }
    .test-details { color: #8b949e; font-size: 0.8rem; padding: 0.1rem 0 0 24px; }

    /* Breakdown table */
    .breakdown-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1rem; }
    .breakdown-table th { text-align: left; color: #8b949e; padding: 0.5rem 0.75rem; border-bottom: 1px solid #30363d; }
    .breakdown-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #21262d; }
    .breakdown-table .bar-cell { width: 200px; }
    .bar-bg { background: #21262d; border-radius: 4px; height: 12px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
    .bar-fill.pass { background: #238636; }
    .bar-fill.partial { background: #d29922; }
    .bar-fill.fail { background: #da3633; }

    /* Diff section */
    .diff-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
    }
    .diff-new { color: #f85149; }
    .diff-resolved { color: #3fb950; }

    /* Footer */
    .footer { color: #484f58; font-size: 0.75rem; text-align: center; margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #21262d; }
  </style>`;
}

function renderScript(): string {
  return `
  <script>
    document.querySelectorAll('.suite-header').forEach(h => {
      h.addEventListener('click', () => {
        const body = h.nextElementSibling;
        if (body) body.classList.toggle('open');
        const arrow = h.querySelector('.arrow');
        if (arrow) arrow.textContent = body.classList.contains('open') ? '\\u25BC' : '\\u25B6';
      });
    });
  </script>`;
}

function renderSuiteCard(suite: SuiteResult): string {
  const passed = suite.tests.filter((t) => t.passed).length;
  const failed = suite.tests.length - passed;
  const statusClass = suite.passed ? "badge-pass" : "badge-fail";
  const statusText = suite.passed ? "PASS" : "FAIL";

  let testsHtml = "";
  for (const test of suite.tests) {
    const iconClass = test.passed ? "pass" : "fail";
    const icon = test.passed ? "&#10003;" : "&#10007;";
    testsHtml += `
      <div class="test-row">
        <div class="test-icon ${iconClass}">${icon}</div>
        <div class="test-name">${esc(test.name)}</div>
        <div class="test-dur">${ms(test.duration)}</div>
      </div>`;
    if (!test.passed && test.error) {
      testsHtml += `<div class="test-error">${esc(test.error)}</div>`;
    }
    if (test.details) {
      testsHtml += `<div class="test-details">${esc(test.details)}</div>`;
    }
  }

  return `
    <div class="suite-card">
      <div class="suite-header">
        <div>
          <span class="arrow">&#9654;</span>
          <span class="suite-name">${esc(suite.suite)}</span>
        </div>
        <div class="suite-stats">
          <span class="${statusClass}">${statusText}</span>
          &nbsp;|&nbsp; ${passed}/${suite.tests.length} passed
          &nbsp;|&nbsp; ${ms(suite.duration)}
        </div>
      </div>
      <div class="tests-body">${testsHtml}</div>
    </div>`;
}

function renderBreakdown(scorecard: ScorecardResult): string {
  let rows = "";
  for (const b of scorecard.breakdown) {
    const pctWidth = Math.round(b.passRate * 100);
    const barClass = b.passRate >= 1 ? "pass" : b.passRate >= 0.5 ? "partial" : "fail";
    const reqBadge = b.required ? '<span style="color:#d29922"> (required)</span>' : "";
    rows += `
      <tr>
        <td>${esc(b.suite)}${reqBadge}</td>
        <td>${b.weight}</td>
        <td>${Math.round(b.passRate * 100)}%</td>
        <td class="bar-cell">
          <div class="bar-bg"><div class="bar-fill ${barClass}" style="width:${pctWidth}%"></div></div>
        </td>
        <td>${b.weightedScore.toFixed(1)}</td>
      </tr>`;
  }

  return `
    <table class="breakdown-table">
      <thead>
        <tr><th>Suite</th><th>Weight</th><th>Pass Rate</th><th>Bar</th><th>Score</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderDiff(result: RunResult): string {
  if (!result.diff) return "";

  const d = result.diff;
  const scoreDir = d.scoreChange > 0 ? "diff-resolved" : d.scoreChange < 0 ? "diff-new" : "";
  const scoreSign = d.scoreChange > 0 ? "+" : "";

  let html = `
    <h2>Diff vs Previous Run</h2>
    <div class="diff-card">
      <p>Previous: ${esc(d.previousRun)}</p>
      <p>Score change: <span class="${scoreDir}">${scoreSign}${d.scoreChange}</span></p>`;

  if (d.newFailures.length > 0) {
    html += `<p class="diff-new">New failures: ${d.newFailures.map(esc).join(", ")}</p>`;
  }
  if (d.resolvedFailures.length > 0) {
    html += `<p class="diff-resolved">Resolved: ${d.resolvedFailures.map(esc).join(", ")}</p>`;
  }

  html += `</div>`;
  return html;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a self-contained HTML report and write it to disk.
 *
 * @returns The path to the generated HTML file.
 */
export function writeHtmlReport(result: RunResult, reportDir: string): string {
  mkdirSync(reportDir, { recursive: true });

  const scorecard = computeScorecard(result);
  const totalTests = result.suites.reduce((n, s) => n + s.tests.length, 0);
  const totalPassed = result.suites.reduce((n, s) => n + s.tests.filter((t) => t.passed).length, 0);

  const suitesHtml = result.suites.map(renderSuiteCard).join("\n");
  const breakdownHtml = renderBreakdown(scorecard);
  const diffHtml = renderDiff(result);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Production Readiness Report — ${esc(result.timestamp)}</title>
  ${renderStyles()}
</head>
<body>
  <h1>Production Readiness Report</h1>
  <div class="meta">
    <span>Server: ${esc(result.serverUrl)}</span>
    <span>Seed: ${result.seed}</span>
    <span>Duration: ${ms(result.duration)}</span>
    <span>${esc(result.timestamp)}</span>
  </div>

  <div class="scorecard">
    <div class="grade-badge ${gradeClass(scorecard.grade)}">${scorecard.grade}</div>
    <div class="scorecard-details">
      <div class="score-num">${scorecard.score}/100</div>
      <div class="score-label">
        ${result.suites.filter((s) => s.passed).length}/${result.suites.length} suites passed
        &nbsp;&bull;&nbsp;
        ${totalPassed}/${totalTests} tests passed
        ${scorecard.requiredFailed ? ' &bull; <span style="color:#f85149">Required suite(s) failed</span>' : ""}
      </div>
    </div>
  </div>

  <h2>Score Breakdown</h2>
  ${breakdownHtml}

  <h2>Test Suites</h2>
  ${suitesHtml}

  ${diffHtml}

  <div class="footer">
    Generated by Production Readiness Harness v1.0.0
  </div>

  ${renderScript()}
</body>
</html>`;

  const safeTimestamp = result.timestamp.replace(/:/g, "-").replace(/\./g, "-");
  const filename = `report-${safeTimestamp}.html`;
  const filepath = join(reportDir, filename);
  const latestHtmlPath = join(reportDir, "latest.html");

  writeFileSync(filepath, html, "utf-8");
  writeFileSync(latestHtmlPath, html, "utf-8");

  return filepath;
}
