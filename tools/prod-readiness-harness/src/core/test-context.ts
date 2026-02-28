/**
 * Shared context object threaded through every test suite and utility.
 *
 * Provides access to the server URL, deterministic RNG, harness
 * configuration, and a structured logger.
 */

import { SeededRandom } from "./seeded-random.js";

// ---------------------------------------------------------------------------
// HarnessConfig -- top-level configuration for the entire harness run.
// ---------------------------------------------------------------------------

export interface HarnessConfig {
  /** Base URL of the server under test (e.g. "http://localhost:5000"). */
  serverUrl: string;

  /** Deterministic seed for reproducible randomness. */
  seed: number;

  /** Number of synthetic users to create for load / journey tests. */
  userCount: number;

  /** Maximum time (ms) to wait for any single HTTP request. */
  requestTimeoutMs: number;

  /** Whether to run destructive / chaos experiments. */
  enableChaos: boolean;

  /** Whether to collect and report per-endpoint latency histograms. */
  enableLatencyHistograms: boolean;

  /** Polling interval (ms) for server memory snapshots. 0 = disabled. */
  memoryPollIntervalMs: number;

  /** Arbitrary key-value pairs that individual suites can read. */
  extra: Record<string, unknown>;
}

/** Sensible defaults -- callers override only what they need. */
export const DEFAULT_HARNESS_CONFIG: HarnessConfig = {
  serverUrl: "http://localhost:5000",
  seed: 42,
  userCount: 10,
  requestTimeoutMs: 10_000,
  enableChaos: false,
  enableLatencyHistograms: true,
  memoryPollIntervalMs: 0,
  extra: {},
};

// ---------------------------------------------------------------------------
// TestContext
// ---------------------------------------------------------------------------

export interface TestContext {
  /** Base URL of the server under test. */
  serverUrl: string;

  /** The seed used for this run (handy for log messages). */
  seed: number;

  /** Deterministic RNG seeded for this run. */
  rng: SeededRandom;

  /** Full harness configuration. */
  config: HarnessConfig;

  /** Structured logger -- all output is prefixed with a timestamp. */
  log: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Build a `TestContext` from a (possibly partial) config.
 *
 * Missing fields fall back to `DEFAULT_HARNESS_CONFIG`.
 */
export function createTestContext(
  overrides: Partial<HarnessConfig> = {},
): TestContext {
  const config: HarnessConfig = { ...DEFAULT_HARNESS_CONFIG, ...overrides };

  const rng = new SeededRandom(config.seed);

  const log = (message: string): void => {
    const ts = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log(`[harness ${ts}] ${message}`);
  };

  return {
    serverUrl: config.serverUrl,
    seed: config.seed,
    rng,
    config,
    log,
  };
}
