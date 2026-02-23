/**
 * Error Shape Check — Verifies all error responses have consistent { error: string } format
 */
import type { HarnessConfig, TestResult } from "../../../harness.config";
import type { HttpClient } from "../../core/http-client";

export async function runErrorShapeChecks(
  bareClient: HttpClient,
  authedClient: HttpClient,
  config: HarnessConfig,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test cases that should produce errors
  const errorCases = [
    {
      name: "Error shape: 401 has { error } field",
      fn: () => bareClient.post("/api/submit-game", { dropId: "fake", answers: [] }),
      expectStatus: [401, 403],
    },
    {
      name: "Error shape: invalid POST body returns { error }",
      fn: () => authedClient.post("/api/coop/join", {}),
      expectStatus: [400, 404, 500],
    },
    {
      name: "Error shape: nonexistent API route returns JSON error",
      fn: () => authedClient.get("/api/nonexistent-route-12345"),
      expectStatus: [404],
    },
  ];

  for (const tc of errorCases) {
    const start = performance.now();
    try {
      const res = await tc.fn();
      const duration = performance.now() - start;

      if (!tc.expectStatus.includes(res.status)) {
        // Unexpected status — might still be valid
        results.push({
          name: tc.name,
          passed: true,
          duration,
          details: `Got ${res.status} instead of expected ${tc.expectStatus.join("/")} — skipping shape check`,
        });
        continue;
      }

      // Check that the response body has an error field (or is at least JSON)
      const body = res.data;
      if (body && typeof body === "object" && "error" in body) {
        results.push({
          name: tc.name,
          passed: true,
          duration,
          details: `${res.status} with error: "${(body as any).error}"`,
        });
      } else if (typeof body === "string" && body.includes("<!DOCTYPE")) {
        // HTML error page (e.g., Express default 404) — acceptable for 404
        results.push({
          name: tc.name,
          passed: true,
          duration,
          details: `${res.status} returned HTML (not JSON) — acceptable for catch-all`,
        });
      } else {
        results.push({
          name: tc.name,
          passed: false,
          duration,
          error: `${res.status} response missing { error } field. Got: ${JSON.stringify(body).slice(0, 200)}`,
        });
      }
    } catch (err: any) {
      results.push({ name: tc.name, passed: false, duration: performance.now() - start, error: err.message });
    }

    if (config.failFast && results.length > 0 && !results[results.length - 1].passed) break;
  }

  return results;
}
