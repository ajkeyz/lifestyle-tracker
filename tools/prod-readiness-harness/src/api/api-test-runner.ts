/**
 * API Contract Test Runner
 *
 * Iterates the endpoint catalog and runs all enabled checks.
 */

import type { HarnessConfig, TestResult, SuiteResult } from "../../harness.config";
import { HttpClient } from "../core/http-client";
import { UserFactory } from "../synthetic/user-factory";
import { ENDPOINT_CATALOG, getAuthEndpoints, getRateLimitedEndpoints, type EndpointDef } from "./endpoint-catalog";
import { runAuthChecks } from "./checks/auth.check";
import { runSchemaChecks } from "./checks/schema.check";
import { runRateLimitChecks } from "./checks/rate-limit.check";
import { runIdempotencyChecks } from "./checks/idempotency.check";
import { runErrorShapeChecks } from "./checks/error-shape.check";

export async function runApiTests(config: HarnessConfig): Promise<SuiteResult> {
  const suiteStart = performance.now();
  const tests: TestResult[] = [];

  // Create test users
  const factory = new UserFactory(config.serverUrl, config.testUserPrefix, config.seed);
  const user = await factory.createUser("api");
  const adminUser = await factory.createAdminUser();

  const authedClient = new HttpClient(config.serverUrl, user.id);
  const adminClient = new HttpClient(config.serverUrl, adminUser.id);

  // Use a dedicated client for idempotency tests (separate user to avoid daily-play interference)
  const idempotencyUser = await factory.createUser("idem");
  const idempotencyClient = new HttpClient(config.serverUrl, idempotencyUser.id);
  const bareClient = new HttpClient(config.serverUrl);

  const log = config.verbose
    ? (msg: string) => console.log(`    [api] ${msg}`)
    : () => {};

  // 1. Schema / reachability checks
  log("Running schema checks...");
  const schemaResults = await runSchemaChecks(ENDPOINT_CATALOG, authedClient, adminClient, config);
  tests.push(...schemaResults);

  // 2. Auth checks
  log("Running auth checks...");
  const authResults = await runAuthChecks(getAuthEndpoints(), bareClient, config);
  tests.push(...authResults);

  // 3. Error shape checks
  log("Running error shape checks...");
  const errorShapeResults = await runErrorShapeChecks(bareClient, authedClient, config);
  tests.push(...errorShapeResults);

  // 4. Idempotency checks
  log("Running idempotency checks...");
  const idempotencyResults = await runIdempotencyChecks(idempotencyClient, config);
  tests.push(...idempotencyResults);

  // 5. Rate limit checks (only if not fail-fast with failures)
  if (!config.failFast || tests.every((t) => t.passed)) {
    log("Running rate limit checks...");
    const rateLimitResults = await runRateLimitChecks(getRateLimitedEndpoints(), authedClient, config);
    tests.push(...rateLimitResults);
  }

  const suiteDuration = performance.now() - suiteStart;
  return {
    suite: "API Contract Tests",
    passed: tests.every((t) => t.passed),
    duration: suiteDuration,
    tests,
  };
}
