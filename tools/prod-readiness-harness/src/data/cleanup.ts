/**
 * Test data cleanup utilities for the production-readiness harness.
 *
 * Calls server-side test hooks to remove synthetic data created during a
 * harness run.  All endpoints are guarded by TEST_MODE on the server,
 * so they will 404 if the server is not running in test mode.
 *
 * When a cleanup endpoint returns 404, we log a warning and continue
 * gracefully — the endpoint may simply not be implemented yet.
 */

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

/**
 * Request bulk cleanup of test data created with the given user-id prefix.
 *
 * Calls POST /api/test/cleanup with `{ prefix }` in the body and the prefix
 * as the X-Test-User-Id header (so the test-auth middleware lets it through).
 *
 * Returns the number of records deleted according to the server, or 0 if
 * the endpoint is not yet implemented (404).
 */
export async function cleanup(
  serverUrl: string,
  prefix: string,
): Promise<{ deleted: number }> {
  const url = `${serverUrl.replace(/\/+$/, "")}/api/test/cleanup`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-User-Id": `${prefix}-cleanup`,
      },
      body: JSON.stringify({ prefix }),
    });

    if (res.status === 404) {
      console.warn(
        "[cleanup] POST /api/test/cleanup returned 404 — endpoint not implemented yet. Skipping.",
      );
      return { deleted: 0 };
    }

    if (!res.ok) {
      const text = await res.text();
      console.warn(
        `[cleanup] POST /api/test/cleanup returned ${res.status}: ${text}`,
      );
      return { deleted: 0 };
    }

    const data = await res.json();
    return { deleted: typeof data.deleted === "number" ? data.deleted : 0 };
  } catch (err: any) {
    console.warn(`[cleanup] Failed to reach cleanup endpoint: ${err.message}`);
    return { deleted: 0 };
  }
}

/**
 * Reset daily-drop state for a specific test user so they can re-play.
 *
 * Calls POST /api/test/reset-daily with the userId in the body.
 * Silently ignores 404 (endpoint not yet implemented).
 */
export async function resetDaily(
  serverUrl: string,
  userId: string,
): Promise<void> {
  const url = `${serverUrl.replace(/\/+$/, "")}/api/test/reset-daily`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-User-Id": userId,
      },
      body: JSON.stringify({ userId }),
    });

    if (res.status === 404) {
      console.warn(
        "[cleanup] POST /api/test/reset-daily returned 404 — endpoint not implemented yet. Skipping.",
      );
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      console.warn(
        `[cleanup] POST /api/test/reset-daily returned ${res.status}: ${text}`,
      );
    }
  } catch (err: any) {
    console.warn(
      `[cleanup] Failed to reach reset-daily endpoint: ${err.message}`,
    );
  }
}
