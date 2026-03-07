/**
 * Auth Check — Verifies auth-required endpoints reject unauthenticated requests
 */
import type { HarnessConfig, TestResult } from "../../../harness.config";
import type { HttpClient } from "../../core/http-client";
import type { EndpointDef } from "../endpoint-catalog";

export async function runAuthChecks(
  authEndpoints: EndpointDef[],
  bareClient: HttpClient,
  config: HarnessConfig,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Skip endpoints that need path params (we can't test them without real IDs)
  const testable = authEndpoints.filter(
    (e) => !e.path.includes(":") && !e.adminOnly,
  );

  for (const ep of testable) {
    const name = `Auth gate: ${ep.method} ${ep.path}`;
    const start = performance.now();
    try {
      let res;
      switch (ep.method) {
        case "GET":
          res = await bareClient.get(ep.path);
          break;
        case "POST":
          res = await bareClient.post(ep.path, ep.sampleBody || {});
          break;
        case "PATCH":
          res = await bareClient.patch(ep.path, ep.sampleBody || {});
          break;
        case "DELETE":
          res = await bareClient.delete(ep.path);
          break;
      }
      const duration = performance.now() - start;

      if (res.status === 401 || res.status === 403) {
        results.push({ name, passed: true, duration, details: `Blocked with ${res.status}` });
      } else {
        results.push({
          name,
          passed: false,
          duration,
          error: `Expected 401/403, got ${res.status}. Auth gate may be bypassed.`,
        });
      }
    } catch (err: any) {
      results.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }

    if (config.failFast && results.length > 0 && !results[results.length - 1].passed) break;
  }

  return results;
}
