/**
 * Test Hooks for Production Readiness Test Harness
 *
 * ONLY active when TEST_MODE=true. Provides:
 * 1. Auth bypass via X-Test-User-Id header
 * 2. Debug endpoints for match state inspection
 * 3. Test data cleanup
 *
 * NEVER enable in production.
 */

import type { Express, Request, Response, NextFunction } from "express";
import type { IncomingMessage } from "http";
import { storage } from "./storage";

const TEST_MODE = process.env.TEST_MODE === "true";
const TEST_HEADER = "x-test-user-id";

/**
 * Middleware: injects a synthetic authenticated user when TEST_MODE is on
 * and the request carries the X-Test-User-Id header.
 */
export function testAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!TEST_MODE) return next();

  const testUserId = req.headers[TEST_HEADER] as string | undefined;
  if (testUserId) {
    // Synthesize a passport-shaped user object on the request
    (req as any).user = {
      claims: { sub: testUserId, email: `${testUserId}@test.local` },
      expires_at: Math.floor(Date.now() / 1000) + 86400,
    };
    // Also mark as authenticated for passport's isAuthenticated()
    req.isAuthenticated = () => true;

    // Ensure session exists with visitorId fallback
    if (req.session) {
      req.session.visitorId = req.session.visitorId || testUserId;
    }
  }
  next();
}

/**
 * Extract test user ID from a WebSocket upgrade request.
 * Returns null if not in test mode or header absent.
 */
export function getTestUserId(req: IncomingMessage): string | null {
  if (!TEST_MODE) return null;
  const val = req.headers[TEST_HEADER];
  return typeof val === "string" ? val : null;
}

/**
 * Register test-only REST endpoints.
 * These are guarded by TEST_MODE — they are no-ops if TEST_MODE is off.
 */
export function registerTestEndpoints(
  app: Express,
  deps: {
    getMatchmaking: () => any; // SurvivalMatchmaking
  },
) {
  if (!TEST_MODE) return;

  console.warn("[TEST MODE] Test hooks are ACTIVE. Do NOT use in production.");

  // Ensure test user exists in storage
  app.post("/api/test/ensure-user", async (req: Request, res: Response) => {
    try {
      const userId = req.headers[TEST_HEADER] as string;
      if (!userId) return res.status(400).json({ error: "Missing X-Test-User-Id" });

      const user = await storage.getOrCreateUser(userId);
      res.json({ id: user.id, username: user.username });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // List all active survival rooms
  app.get("/api/test/matches", (_req: Request, res: Response) => {
    try {
      const mm = deps.getMatchmaking();
      const roomCount = mm.getActiveRoomCount();
      const queueSize = mm.getQueueSize();
      res.json({ roomCount, queueSize });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get detailed match state
  app.get("/api/test/match/:matchId", (req: Request, res: Response) => {
    try {
      const mm = deps.getMatchmaking();
      const room = mm.getRoom(req.params.matchId);
      if (!room) return res.status(404).json({ error: "Room not found" });
      res.json(room.getState());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Force-start a match (bypasses player minimum for testing)
  app.post("/api/test/force-start/:matchId", (req: Request, res: Response) => {
    try {
      const mm = deps.getMatchmaking();
      const room = mm.getRoom(req.params.matchId);
      if (!room) return res.status(404).json({ error: "Room not found" });
      const result = room.startGame();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Health check for test runner
  app.get("/api/test/health", (_req: Request, res: Response) => {
    res.json({
      testMode: true,
      uptime: process.uptime(),
      memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    });
  });

  // Cleanup test data by ID prefix
  app.post("/api/test/cleanup", async (req: Request, res: Response) => {
    try {
      const { prefix } = req.body || {};
      if (!prefix || typeof prefix !== "string") {
        return res.status(400).json({ error: "Missing 'prefix' in request body" });
      }
      const deleted = await storage.deleteUsersByPrefix(prefix);
      res.json({ deleted, prefix });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reset a user's daily game state (allow replaying)
  app.post("/api/test/reset-daily", async (req: Request, res: Response) => {
    try {
      const userId = req.headers[TEST_HEADER] as string;
      if (!userId) return res.status(400).json({ error: "Missing X-Test-User-Id" });

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      await storage.updateUser(userId, {
        lastPlayedDate: null,
        todayResult: null,
      });
      res.json({ success: true, userId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Server process metrics for load/soak testing
  app.get("/api/test/metrics", (_req: Request, res: Response) => {
    try {
      const mem = process.memoryUsage();
      res.json({
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        rss: Math.round(mem.rss / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
        uptime: process.uptime(),
        timestamp: Date.now(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // List active co-op sessions for test inspection
  app.get("/api/test/coop-sessions", async (_req: Request, res: Response) => {
    try {
      // Use a simple approach: get sessions for a known test user, or return empty
      res.json({ sessions: [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

export { TEST_MODE };
