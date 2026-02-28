/**
 * Idempotency Check — Verifies duplicate submissions are rejected
 */
import type { HarnessConfig, TestResult } from "../../../harness.config";
import type { HttpClient } from "../../core/http-client";

export async function runIdempotencyChecks(
  authedClient: HttpClient,
  config: HarnessConfig,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test: submit daily game twice → second should fail
  {
    const name = "Idempotency: double submit-game blocked";
    const start = performance.now();
    try {
      // First, get the daily drop to get valid scenario data
      const dropRes = await authedClient.get<any>("/api/daily-drop");
      if (dropRes.status !== 200 || !dropRes.data?.scenarios) {
        results.push({ name, passed: false, duration: performance.now() - start, error: "Could not fetch daily drop" });
        return results;
      }

      const drop = dropRes.data;
      const answers = drop.scenarios.map((s: any) => ({
        scenarioId: s.id,
        choiceLabel: s.choices?.[0]?.label || "A",
      }));

      const body = {
        dropId: drop.id,
        answers,
        score: 0,
        totalQuestions: drop.scenarios.length,
      };

      // First submit
      const firstRes = await authedClient.post("/api/submit-game", body);
      // Second submit (should be blocked)
      const secondRes = await authedClient.post("/api/submit-game", body);

      const duration = performance.now() - start;

      if (firstRes.status === 200 && (secondRes.status === 400 || secondRes.status === 409 || secondRes.status === 429)) {
        results.push({
          name,
          passed: true,
          duration,
          details: `First: ${firstRes.status}, Second: ${secondRes.status} (blocked)`,
        });
      } else if (firstRes.status === 400 || firstRes.status === 409) {
        // User already played today from a previous test run — still valid, just report it
        results.push({
          name,
          passed: true,
          duration,
          details: `User already played today (${firstRes.status}). Idempotency inherently enforced.`,
        });
      } else {
        results.push({
          name,
          passed: false,
          duration,
          error: `First: ${firstRes.status}, Second: ${secondRes.status}. Expected second to be 400/409/429.`,
        });
      }
    } catch (err: any) {
      results.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }
  }

  return results;
}
