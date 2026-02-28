/**
 * Scorecard — Weighted scoring and grading for production readiness.
 *
 * Each suite has a weight and a "required" flag. The overall score is
 * a weighted average of per-suite pass rates. If a required suite fails,
 * the grade is capped at C regardless of score.
 */

import type { RunResult, SuiteResult } from "../../harness.config";

// ---------------------------------------------------------------------------
// Suite weight configuration
// ---------------------------------------------------------------------------

interface SuiteWeight {
  /** Pattern to match suite name (case-insensitive substring) */
  pattern: string;
  /** Weight 0–100 (weights are normalised at runtime) */
  weight: number;
  /** If true, any failure in this suite caps the grade at C */
  required: boolean;
}

const SUITE_WEIGHTS: SuiteWeight[] = [
  { pattern: "smoke",    weight: 15, required: true },
  { pattern: "api",      weight: 25, required: true },
  { pattern: "security", weight: 20, required: true },
  { pattern: "load",     weight: 15, required: false },
  { pattern: "chaos",    weight: 10, required: false },
  { pattern: "stress",   weight: 10, required: false },
  { pattern: "soak",     weight: 5,  required: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchWeight(suiteName: string): SuiteWeight | undefined {
  const lower = suiteName.toLowerCase();
  return SUITE_WEIGHTS.find((w) => lower.includes(w.pattern));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScorecardResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: {
    suite: string;
    weight: number;
    passRate: number;
    weightedScore: number;
    required: boolean;
    passed: boolean;
  }[];
  requiredFailed: boolean;
}

/**
 * Compute a weighted 0-100 score and letter grade from run results.
 */
export function computeScorecard(result: RunResult): ScorecardResult {
  const breakdown: ScorecardResult["breakdown"] = [];
  let totalWeight = 0;
  let weightedSum = 0;
  let requiredFailed = false;

  for (const suite of result.suites) {
    const w = matchWeight(suite.suite);
    const weight = w?.weight ?? 5; // default weight for unknown suites
    const required = w?.required ?? false;

    const totalTests = suite.tests.length;
    const passedTests = suite.tests.filter((t) => t.passed).length;
    const passRate = totalTests > 0 ? passedTests / totalTests : 0;
    const weightedScore = passRate * weight;

    totalWeight += weight;
    weightedSum += weightedScore;

    if (required && !suite.passed) {
      requiredFailed = true;
    }

    breakdown.push({
      suite: suite.suite,
      weight,
      passRate,
      weightedScore,
      required,
      passed: suite.passed,
    });
  }

  // Normalise to 0-100
  const rawScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;

  // Cap grade at C if a required suite failed
  let grade: "A" | "B" | "C" | "D" | "F";
  if (rawScore >= 95) grade = "A";
  else if (rawScore >= 80) grade = "B";
  else if (rawScore >= 65) grade = "C";
  else if (rawScore >= 50) grade = "D";
  else grade = "F";

  if (requiredFailed && (grade === "A" || grade === "B")) {
    grade = "C";
  }

  return {
    score: rawScore,
    grade,
    breakdown,
    requiredFailed,
  };
}
