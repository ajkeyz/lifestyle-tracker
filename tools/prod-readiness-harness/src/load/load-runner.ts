/**
 * Load Test Runner
 *
 * Orchestrates HTTP load testing with concurrent virtual users.
 * Tests throughput, latency, and error rates under sustained load.
 */
import type { HarnessConfig, TestResult, SuiteResult } from "../../harness.config";
import { HttpClient } from "../core/http-client";
import { UserFactory } from "../synthetic/user-factory";

interface LoadConfig {
  virtualUsers: number;
  durationMs: number;
  label: string;
  thresholds: {
    maxP99Ms: number;
    maxErrorRate: number;
  };
}

const LOAD_PROFILES: Record<string, LoadConfig> = {
  smoke: {
    virtualUsers: 1,
    durationMs: 10_000,
    label: "Load Smoke (1 VU, 10s)",
    thresholds: { maxP99Ms: 3000, maxErrorRate: 0.20 },
  },
  sustained: {
    virtualUsers: 3,
    durationMs: 20_000,
    label: "Sustained Load (3 VUs, 20s)",
    thresholds: { maxP99Ms: 5000, maxErrorRate: 0.30 },
  },
  stress: {
    virtualUsers: 10,
    durationMs: 15_000,
    label: "Stress Test (10 VUs, 15s)",
    thresholds: { maxP99Ms: 10000, maxErrorRate: 0.50 },
  },
};

// Weighted endpoint mix for load testing — focused on reliable read endpoints
const ENDPOINT_MIX = [
  // Core reads (60%) — these are the most stable endpoints
  { weight: 15, fn: (c: HttpClient) => c.get("/api/user") },
  { weight: 15, fn: (c: HttpClient) => c.get("/api/daily-drop") },
  { weight: 15, fn: (c: HttpClient) => c.get("/api/leaderboard") },
  { weight: 15, fn: (c: HttpClient) => c.get("/api/daily-stats") },
  // Game reads (20%)
  { weight: 10, fn: (c: HttpClient) => c.get("/api/badges") },
  { weight: 10, fn: (c: HttpClient) => c.get("/api/active-players") },
  // Community reads (20%) — no auth required
  { weight: 10, fn: (c: HttpClient) => c.get("/api/community/scenarios") },
  { weight: 10, fn: (c: HttpClient) => c.get("/api/community/top-creators") },
];

function pickEndpoint(rng: () => number): (c: HttpClient) => Promise<any> {
  const totalWeight = ENDPOINT_MIX.reduce((sum, e) => sum + e.weight, 0);
  let r = rng() * totalWeight;
  for (const ep of ENDPOINT_MIX) {
    r -= ep.weight;
    if (r <= 0) return ep.fn;
  }
  return ENDPOINT_MIX[0].fn;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export async function runLoadTests(config: HarnessConfig, profile = "smoke"): Promise<SuiteResult> {
  const suiteStart = performance.now();
  const tests: TestResult[] = [];

  const loadConfig = LOAD_PROFILES[profile] || LOAD_PROFILES.smoke;
  const factory = new UserFactory(config.serverUrl, config.testUserPrefix, config.seed);

  const log = config.verbose
    ? (msg: string) => console.log(`    [load] ${msg}`)
    : () => {};

  log(`Starting ${loadConfig.label}...`);

  // Create virtual users
  const userCount = Math.min(loadConfig.virtualUsers, 20); // cap at 20 actual users
  const users = await factory.createUsers(userCount);
  const clients = users.map((u) => new HttpClient(config.serverUrl, u.id));

  // Simple seeded RNG
  let seed = config.seed;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // Run load test
  const latencies: number[] = [];
  let totalRequests = 0;
  let errorCount = 0;
  const startTime = Date.now();

  const runWorker = async (clientIdx: number) => {
    const client = clients[clientIdx % clients.length];
    while (Date.now() - startTime < loadConfig.durationMs) {
      const endpoint = pickEndpoint(rng);
      const reqStart = performance.now();
      try {
        const res = await endpoint(client);
        const duration = performance.now() - reqStart;
        latencies.push(duration);
        totalRequests++;
        if (res.status >= 500) errorCount++;
      } catch {
        totalRequests++;
        errorCount++;
        latencies.push(performance.now() - reqStart);
      }
      // Simulate realistic user think-time (100-300ms between requests)
      const thinkTime = 100 + Math.floor(rng() * 200);
      await new Promise((r) => setTimeout(r, thinkTime));
    }
  };

  // Launch workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < loadConfig.virtualUsers; i++) {
    workers.push(runWorker(i));
  }
  await Promise.all(workers);

  // Compute metrics
  latencies.sort((a, b) => a - b);
  const p50 = percentile(latencies, 50);
  const p95 = percentile(latencies, 95);
  const p99 = percentile(latencies, 99);
  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
  const rps = totalRequests / (loadConfig.durationMs / 1000);

  log(`Results: ${totalRequests} requests, ${rps.toFixed(1)} req/s, p50=${p50.toFixed(0)}ms, p95=${p95.toFixed(0)}ms, p99=${p99.toFixed(0)}ms, errors=${(errorRate * 100).toFixed(2)}%`);

  // Throughput test
  {
    const name = `Throughput: ${loadConfig.label}`;
    const duration = performance.now() - suiteStart;
    tests.push({
      name,
      passed: true,
      duration,
      details: `${totalRequests} requests, ${rps.toFixed(1)} req/s, ${loadConfig.virtualUsers} VUs`,
    });
  }

  // P99 latency test
  {
    const name = `P99 latency < ${loadConfig.thresholds.maxP99Ms}ms`;
    const duration = performance.now() - suiteStart;
    if (p99 <= loadConfig.thresholds.maxP99Ms) {
      tests.push({ name, passed: true, duration, details: `p50=${p50.toFixed(0)}ms, p95=${p95.toFixed(0)}ms, p99=${p99.toFixed(0)}ms` });
    } else {
      tests.push({ name, passed: false, duration, error: `P99 latency ${p99.toFixed(0)}ms exceeds threshold ${loadConfig.thresholds.maxP99Ms}ms` });
    }
  }

  // Error rate test
  {
    const name = `Error rate < ${(loadConfig.thresholds.maxErrorRate * 100).toFixed(1)}%`;
    const duration = performance.now() - suiteStart;
    if (errorRate <= loadConfig.thresholds.maxErrorRate) {
      tests.push({ name, passed: true, duration, details: `${(errorRate * 100).toFixed(2)}% errors (${errorCount}/${totalRequests})` });
    } else {
      tests.push({ name, passed: false, duration, error: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(loadConfig.thresholds.maxErrorRate * 100).toFixed(1)}%` });
    }
  }

  // Server health after load
  {
    const name = "Server healthy after load test";
    const start = performance.now();
    try {
      const res = await new HttpClient(config.serverUrl).get("/api/test/health");
      const duration = performance.now() - start;
      if (res.status === 200) {
        tests.push({ name, passed: true, duration, details: `Server OK, memory: ${(res.data as any)?.memoryMB}MB` });
      } else {
        tests.push({ name, passed: false, duration, error: `Health check returned ${res.status}` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  const suiteDuration = performance.now() - suiteStart;
  return {
    suite: loadConfig.label,
    passed: tests.every((t) => t.passed),
    duration: suiteDuration,
    tests,
  };
}
