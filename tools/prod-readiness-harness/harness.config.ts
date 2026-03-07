/**
 * Production Readiness Harness — Configuration & Shared Types
 *
 * Central configuration schema with sensible defaults for every test suite.
 * All result types are co-located here so reporters, runners, and the CLI
 * share a single source of truth without circular imports.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface HarnessConfig {
  serverUrl: string;
  seed: number;
  concurrency: number;
  reportDir: string;
  formats: ("console" | "json" | "html")[];
  diff: boolean;
  failFast: boolean;
  verbose: boolean;
  tags: string[];
  excludeTags: string[];
  timeout: number;
  testUserPrefix: string;
  thresholds: {
    smoke: { maxFailures: number };
    api: { maxFailures: number };
    load: { maxLatencyP99Ms: number; maxErrorRate: number };
    stress: { maxLatencyP99Ms: number; maxErrorRate: number };
    soak: { maxMemoryGrowthMB: number; maxLatencyDriftPercent: number };
    chaos: { mustRecover: boolean; maxRecoveryMs: number };
    security: { maxFailures: number };
  };
}

export const DEFAULT_CONFIG: HarnessConfig = {
  serverUrl: "http://localhost:3000",
  seed: 42,
  concurrency: 4,
  reportDir: "tools/prod-readiness-harness/reports",
  formats: ["console", "json"],
  diff: false,
  failFast: false,
  verbose: false,
  tags: [],
  excludeTags: [],
  timeout: 30000,
  testUserPrefix: "test-harness",
  thresholds: {
    smoke: { maxFailures: 0 },
    api: { maxFailures: 0 },
    load: { maxLatencyP99Ms: 2000, maxErrorRate: 0.01 },
    stress: { maxLatencyP99Ms: 5000, maxErrorRate: 0.05 },
    soak: { maxMemoryGrowthMB: 100, maxLatencyDriftPercent: 20 },
    chaos: { mustRecover: true, maxRecoveryMs: 10000 },
    security: { maxFailures: 0 },
  },
};

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: string;
}

export interface SuiteResult {
  suite: string;
  passed: boolean;
  duration: number;
  tests: TestResult[];
  metrics?: {
    latencyP50?: number;
    latencyP95?: number;
    latencyP99?: number;
    errorRate?: number;
    throughput?: number;
    peakMemoryMB?: number;
  };
}

export interface RunResult {
  timestamp: string;
  seed: number;
  serverUrl: string;
  overallScore: number;
  overallPassed: boolean;
  grade: "A" | "B" | "C" | "D" | "F";
  duration: number;
  suites: SuiteResult[];
  diff?: DiffResult;
}

export interface DiffResult {
  previousRun: string;
  newFailures: string[];
  resolvedFailures: string[];
  scoreChange: number;
  metricDeltas: {
    name: string;
    previous: number;
    current: number;
    direction: "better" | "worse" | "stable";
  }[];
}
