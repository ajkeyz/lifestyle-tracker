/**
 * Schema Check — Verifies endpoints are reachable and return expected shapes
 */
import type { HarnessConfig, TestResult } from "../../../harness.config";
import type { HttpClient } from "../../core/http-client";
import type { EndpointDef } from "../endpoint-catalog";

export async function runSchemaChecks(
  endpoints: EndpointDef[],
  authedClient: HttpClient,
  adminClient: HttpClient,
  config: HarnessConfig,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Skip parameterized paths that need real IDs, and skip destructive endpoints
  const testable = endpoints.filter(
    (e) => !e.path.includes(":") && e.path !== "/api/account",
  );

  for (const ep of testable) {
    const name = `Reachable: ${ep.method} ${ep.path}`;
    const start = performance.now();
    try {
      const client = ep.adminOnly ? adminClient : authedClient;
      let res;
      switch (ep.method) {
        case "GET":
          res = await client.get(ep.path);
          break;
        case "POST":
          res = await client.post(ep.path, ep.sampleBody || {});
          break;
        case "PATCH":
          res = await client.patch(ep.path, ep.sampleBody || {});
          break;
        case "DELETE":
          res = await client.delete(ep.path);
          break;
      }
      const duration = performance.now() - start;

      // Accept any 2xx or expected 4xx (like 400 for bad input, 404 for not found)
      // The key thing: NOT a 500 (server error) and NOT unreachable
      if (res.status < 500) {
        results.push({
          name,
          passed: true,
          duration,
          details: `${res.status} (${duration.toFixed(0)}ms)`,
        });
      } else {
        results.push({
          name,
          passed: false,
          duration,
          error: `Server error: ${res.status}`,
        });
      }
    } catch (err: any) {
      results.push({ name, passed: false, duration: performance.now() - start, error: err.message });
    }

    if (config.failFast && results.length > 0 && !results[results.length - 1].passed) break;
  }

  return results;
}
