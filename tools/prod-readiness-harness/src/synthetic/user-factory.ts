/**
 * Synthetic user factory for the production-readiness harness.
 *
 * Creates deterministic test users by POSTing to the server's
 * `/api/test/ensure-user` endpoint. User IDs follow the pattern
 * `{prefix}-{seed}-{index}` so that runs with the same seed always
 * produce the same set of identifiers.
 */

import { HttpClient } from "../core/http-client.js";

export interface TestUser {
  id: string;
  isAdmin: boolean;
}

export class UserFactory {
  private readonly serverUrl: string;
  private readonly prefix: string;
  private readonly seed: number;
  private nextIndex = 0;
  private readonly createdIds: string[] = [];

  /**
   * @param serverUrl  Base URL of the server under test.
   * @param prefix     Prefix for generated user IDs.
   * @param seed       Deterministic seed (embedded in user IDs).
   */
  constructor(serverUrl: string, prefix = "test-harness", seed = 42) {
    this.serverUrl = serverUrl;
    this.seed = seed;
    this.prefix = prefix;
  }

  /**
   * Create a single test user and return a TestUser object.
   * The server reads user ID from the X-Test-User-Id header.
   *
   * @param indexOrSuffix  Optional numeric index or string suffix.
   */
  async createUser(indexOrSuffix?: number | string): Promise<TestUser> {
    const index = this.nextIndex++;
    let userId: string;
    if (typeof indexOrSuffix === "string") {
      userId = `${this.prefix}-${this.seed}-${index}-${indexOrSuffix}`;
    } else {
      userId = `${this.prefix}-${this.seed}-${index}`;
    }

    // The server's /api/test/ensure-user reads user ID from headers, not body
    const client = new HttpClient(this.serverUrl, userId);
    await client.post("/api/test/ensure-user");

    this.createdIds.push(userId);
    return { id: userId, isAdmin: false };
  }

  /**
   * Create an admin test user. Uses the known admin ID from the server's
   * MemStorage default admin set (e.g. "admin").
   */
  async createAdminUser(): Promise<TestUser> {
    const adminId = "admin";
    const client = new HttpClient(this.serverUrl, adminId);
    await client.post("/api/test/ensure-user");
    this.createdIds.push(adminId);
    return { id: adminId, isAdmin: true };
  }

  /**
   * Create `count` users in parallel and return their TestUser objects.
   */
  async createUsers(count: number): Promise<TestUser[]> {
    const startIndex = this.nextIndex;
    this.nextIndex += count;

    const users: TestUser[] = [];
    const promises: Promise<void>[] = [];

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      const userId = `${this.prefix}-${this.seed}-${index}`;
      users.push({ id: userId, isAdmin: false });

      const client = new HttpClient(this.serverUrl, userId);
      promises.push(
        client.post("/api/test/ensure-user").then(() => {}),
      );
    }

    await Promise.all(promises);

    this.createdIds.push(...users.map((u) => u.id));
    return users;
  }

  /** Return a copy of every user ID created by this factory so far. */
  getCreatedIds(): string[] {
    return [...this.createdIds];
  }
}
