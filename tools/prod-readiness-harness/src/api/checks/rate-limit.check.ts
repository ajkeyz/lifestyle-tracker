/**
 * Rate Limit Check — Verifies rate limits are enforced
 */
import type { HarnessConfig, TestResult } from "../../../harness.config";
import type { HttpClient } from "../../core/http-client";
import type { EndpointDef } from "../endpoint-catalog";

export async function runRateLimitChecks(
  rateLimitedEndpoints: EndpointDef[],
  authedClient: HttpClient,
  config: HarnessConfig,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Pick a small subset to test (hitting all would be slow and could interfere)
  // Test the tightest limits: 3/min (buyback, late-pass) and 5/min (submit, create)
  const tightLimits = rateLimitedEndpoints
    .filter((e) => e.rateLimit && e.rateLimit <= 5 && !e.path.includes(":"))
    .slice(0, 3); // Test max 3 endpoints to keep it fast

  for (const ep of tightLimits) {
    const name = `Rate limit: ${ep.method} ${ep.path} (limit: ${ep.rateLimit}/min)`;
    const start = performance.now();
    const limit = ep.rateLimit!;

    try {
      // Fire limit+2 requests rapidly
      const totalRequests = limit + 2;
      let got429 = false;
      let lastStatus = 0;

      for (let i = 0; i < totalRequests; i++) {
        let res;
        switch (ep.method) {
          case "GET":
            res = await authedClient.get(ep.path);
            break;
          case "POST":
            res = await authedClient.post(ep.path, ep.sampleBody || {});
            break;
          case "PATCH":
            res = await authedClient.patch(ep.path, ep.sampleBody || {});
            break;
          case "DELETE":
            res = await authedClient.delete(ep.path);
            break;
        }
        lastStatus = res.status;
        if (res.status === 429) {
          got429 = true;
          break;
        }
      }

      const duration = performance.now() - start;

      if (got429) {
        results.push({
          name,
          passed: true,
          duration,
          details: `429 returned after rapid fire (${totalRequests} attempts)`,
        });
      } else {
        results.push({
          name,
          passed: false,
          duration,
          error: `Sent ${totalRequests} requests but never got 429 (last status: ${lastStatus}). Rate limit may not be enforced.`,
        });
      }
    } catch (err: any) {
      results.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }

    if (config.failFast && results.length > 0 && !results[results.length - 1].passed) break;
  }

  return results;
}
