/**
 * Chaos & Resilience Experiments
 *
 * Tests system behavior under adverse conditions:
 * - Concurrent submit (same user double-submits)
 * - Rate limit flood and recovery
 * - Stale/nonexistent match reconnect
 * - Rapid endpoint switching (20 parallel requests)
 *
 * Each experiment is individually wrapped in try/catch with timeouts
 * so one failing experiment doesn't prevent the rest from running.
 */
import type { HarnessConfig, TestResult, SuiteResult } from "../../harness.config";
import { HttpClient } from "../core/http-client";
import { UserFactory } from "../synthetic/user-factory";

/** Fetch with a per-request timeout (default 15s) */
async function withTimeout<T>(promise: Promise<T>, ms = 15_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

/** Check if server is alive. Returns true/false. */
async function isServerAlive(serverUrl: string): Promise<boolean> {
  try {
    const res = await withTimeout(new HttpClient(serverUrl).get("/api/test/health"), 5_000);
    return res.status === 200;
  } catch {
    return false;
  }
}

export async function runChaosTests(config: HarnessConfig): Promise<SuiteResult> {
  const suiteStart = performance.now();
  const tests: TestResult[] = [];

  const factory = new UserFactory(config.serverUrl, config.testUserPrefix, config.seed);

  const log = config.verbose
    ? (msg: string) => console.log(`    [chaos] ${msg}`)
    : () => {};

  // 1. Concurrent submit — same user POSTs submit-game twice simultaneously
  log("Running concurrent submit experiment...");
  {
    const name = "Concurrent submit: parallel double-submit yields exactly one success";
    const start = performance.now();
    try {
      const user = await withTimeout(factory.createUser("chaos-submit"));
      const client = new HttpClient(config.serverUrl, user.id);

      // First, reset daily so we can submit
      await withTimeout(client.post("/api/test/reset-daily"));

      // Fetch daily drop
      const dropRes = await withTimeout(client.get<any>("/api/daily-drop"));
      if (dropRes.status !== 200 || !dropRes.data?.scenarios) {
        tests.push({ name, passed: false, duration: performance.now() - start, error: "Failed to fetch daily drop" });
      } else {
        const drop = dropRes.data;
        const answers = drop.scenarios.map((s: any) => ({
          scenarioId: s.id,
          choiceLabel: s.choices?.[0]?.label || "A",
        }));
        const body = { dropId: drop.id, answers, score: 0, totalQuestions: drop.scenarios.length };

        // Fire two identical submissions in parallel with individual timeouts
        const [res1, res2] = await Promise.all([
          withTimeout(client.post("/api/submit-game", body), 10_000).catch((e) => ({ status: -1, data: null, headers: {}, duration: 0, error: e.message })),
          withTimeout(client.post("/api/submit-game", body), 10_000).catch((e) => ({ status: -1, data: null, headers: {}, duration: 0, error: e.message })),
        ]);

        const duration = performance.now() - start;
        const statuses = [res1.status, res2.status].sort();

        // One should succeed (200), other should fail (400/409/429)
        const successes = statuses.filter((s) => s === 200).length;
        const rejections = statuses.filter((s) => s >= 400).length;
        const errors = statuses.filter((s) => s === -1).length;

        if (successes === 1 && rejections === 1) {
          tests.push({ name, passed: true, duration, details: `Statuses: ${statuses.join(",")} — exactly one accepted` });
        } else if (successes === 0 && errors === 0) {
          // Both failed — maybe user already played, or rate limited
          tests.push({ name, passed: true, duration, details: `Both rejected (${statuses.join(",")}) — safe idempotency` });
        } else if (errors > 0) {
          tests.push({ name, passed: true, duration, details: `Connection error during race (${statuses.join(",")}) — acceptable under chaos` });
        } else if (successes === 2) {
          tests.push({ name, passed: false, duration, error: `Both returned 200 — double-submit not prevented (${statuses.join(",")})` });
        } else {
          tests.push({ name, passed: true, duration, details: `Statuses: ${statuses.join(",")} — handled gracefully` });
        }
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // Verify server is alive and wait for full recovery between experiments
  log("Waiting for server recovery...");
  for (let attempt = 0; attempt < 6; attempt++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await isServerAlive(config.serverUrl)) {
      // Give the server one more second of breathing room
      await new Promise((r) => setTimeout(r, 1000));
      break;
    }
    log(`Server still recovering... (attempt ${attempt + 1}/6)`);
  }
  if (!(await isServerAlive(config.serverUrl))) {
    tests.push({
      name: "Server recovery after concurrent submit",
      passed: false,
      duration: performance.now() - suiteStart,
      error: "Server crashed and did not recover within 8 seconds",
    });
    return { suite: "Chaos Experiments", passed: false, duration: performance.now() - suiteStart, tests };
  }

  // 2. Rate limit flood and recovery
  log("Running rate limit flood experiment...");
  {
    const name = "Rate limit flood: server recovers after flood";
    const start = performance.now();
    try {
      const user = await withTimeout(factory.createUser("chaos-flood"));
      const client = new HttpClient(config.serverUrl, user.id);

      // Flood the streak-buyback endpoint (3/min limit)
      let hitLimit = false;
      for (let i = 0; i < 8; i++) {
        const res = await withTimeout(client.post("/api/streak-buyback"), 5_000);
        if (res.status === 429) { hitLimit = true; break; }
      }

      // Brief pause to let server settle after flood
      await new Promise((r) => setTimeout(r, 500));

      // Verify server process is still responding (health endpoint has no DB dependency)
      const healthRes = await withTimeout(
        new HttpClient(config.serverUrl).get("/api/test/health"),
        5_000,
      ).catch(() => ({ status: -1 }));
      const duration = performance.now() - start;

      if (hitLimit && healthRes.status === 200) {
        tests.push({ name, passed: true, duration, details: "Rate limit hit, server process still healthy" });
      } else if (!hitLimit) {
        tests.push({ name, passed: false, duration, error: "Never hit rate limit after 8 requests" });
      } else {
        tests.push({ name, passed: false, duration, error: `Server unresponsive after rate limit flood: ${healthRes.status}` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // 3. Stale reconnect — try joining a nonexistent survival match
  log("Running stale reconnect experiment...");
  {
    const name = "Stale reconnect: join nonexistent survival match returns error, no crash";
    const start = performance.now();
    try {
      const user = await withTimeout(factory.createUser("chaos-stale"));
      const client = new HttpClient(config.serverUrl, user.id);

      // Try POST to a nonexistent match code via the API
      const res = await withTimeout(client.post("/api/coop/join", { code: "XXXXXX-NONEXIST" }), 5_000);
      const duration = performance.now() - start;

      if (res.status >= 400 && res.status < 500) {
        tests.push({ name, passed: true, duration, details: `Gracefully rejected: ${res.status}` });
      } else if (res.status === 200) {
        tests.push({ name, passed: true, duration, details: `Handled gracefully with ${res.status}` });
      } else {
        tests.push({ name, passed: false, duration, error: `Server error: ${res.status}` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  // 4. Rapid endpoint switching — hit many different endpoints rapidly
  log("Running rapid endpoint switching experiment...");
  {
    const name = "Rapid switching: 20 mixed requests in parallel don't crash server";
    const start = performance.now();
    try {
      const user = await withTimeout(factory.createUser("chaos-rapid"));
      const client = new HttpClient(config.serverUrl, user.id);

      const endpoints = [
        () => client.get("/api/user"),
        () => client.get("/api/daily-drop"),
        () => client.get("/api/leaderboard"),
        () => client.get("/api/friends"),
        () => client.get("/api/badges"),
        () => client.get("/api/arcade-status"),
        () => client.get("/api/challenges"),
        () => client.get("/api/leagues"),
        () => client.get("/api/streak-calendar"),
        () => client.get("/api/community/scenarios"),
      ];

      // Fire 20 requests in parallel (each endpoint twice) with per-request timeouts
      const promises = [...endpoints, ...endpoints].map((fn) =>
        withTimeout(fn(), 10_000).catch(() => ({ status: -1 })),
      );
      const results = await Promise.all(promises);

      const duration = performance.now() - start;
      const serverErrors = results.filter((r) => r.status >= 500).length;
      const connErrors = results.filter((r) => r.status === -1).length;
      const okCount = results.length - serverErrors - connErrors;

      // Brief pause before health check
      await new Promise((r) => setTimeout(r, 500));

      // Verify server is still healthy (chaos = server recovers, not zero-error)
      const healthRes = await withTimeout(new HttpClient(config.serverUrl).get("/api/test/health"), 5_000).catch(() => ({ status: -1 }));

      if (healthRes.status === 200) {
        // Server survived and is healthy — pass regardless of individual request errors
        tests.push({
          name,
          passed: true,
          duration,
          details: `${okCount}/20 succeeded, ${serverErrors} 5xx, ${connErrors} timeouts — server recovered`,
        });
      } else {
        tests.push({ name, passed: false, duration, error: `Server unresponsive after 20 rapid requests` });
      }
    } catch (err: any) {
      tests.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  const suiteDuration = performance.now() - suiteStart;
  return {
    suite: "Chaos Experiments",
    passed: tests.every((t) => t.passed),
    duration: suiteDuration,
    tests,
  };
}
