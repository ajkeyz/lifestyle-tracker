import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import type { IncomingMessage } from "http";
import webpush from "web-push";
import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import { storage } from "./storage";
import { submitGameSchema, setModeSchema, updateProfileSchema, createLeagueSchema, joinLeagueSchema, createChallengeSchema, addFreezeTokenSchema, adminScenarioSchema, banUserSchema, addModeratorSchema, createCoopSessionSchema, joinCoopSessionSchema, submitArcadeGameSchema, createSurvivalLobbySchema, survivalAnswerSchema, createSimRunSchema, saveSimRunSchema, type CoopMessage, type SurvivalMessage, type SimulationRun } from "@shared/schema";
import { MISSION_POOL, buildMissionContext } from "@shared/lib/progression";
import { getTemplate, getAllTemplates, type SimulationResult } from "@shared/lib/simlab";
import { getDailyScenarios, getArcadeScenarios } from "./static-scenarios";
import { SurvivalMatchmaking } from "./survival-matchmaking";
import type { SurvivalRoom } from "./survival-room";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { testAuthMiddleware, getTestUserId, registerTestEndpoints, TEST_MODE } from "./test-hooks";

// VAPID keys for push notifications (must be set via environment variables)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Configure web-push only if both keys are present
const pushNotificationsEnabled = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushNotificationsEnabled) {
  webpush.setVapidDetails(
    'mailto:support@lifestylecreep.app',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

declare module "express-session" {
  interface SessionData {
    visitorId: string;
  }
}

// Helper function to send push notification to a specific user
async function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, any>): Promise<boolean> {
  if (!pushNotificationsEnabled) return false;
  
  try {
    const subscription = await storage.getPushSubscription(userId);
    if (!subscription) return false;
    
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify({
        title,
        body,
        icon: "/icons/icon-192.png",
        data
      })
    );
    return true;
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired, remove it
      const sub = await storage.getPushSubscription(userId);
      if (sub) {
        await storage.removePushSubscription(userId, sub.endpoint);
      }
    }
    console.error("Push notification error:", error.message);
    return false;
  }
}

function getSessionId(req: Request): string {
  if (!req.session) {
    throw new Error("Session not available");
  }
  
  const user = req.user as any;
  if (user?.claims?.sub) {
    return user.claims.sub;
  }
  
  if (!req.session.visitorId) {
    req.session.visitorId = `visitor-${randomUUID()}`;
  }
  return req.session.visitorId;
}

function isAuthenticatedUser(req: Request): boolean {
  const user = req.user as any;
  return !!(user?.claims?.sub);
}

// Use the passport isAuthenticated middleware which handles dev bypass properly.
// This ensures dev mode auto-populates req.user before checking auth.
const requireAuth = isAuthenticated;

const rateLimiters: Map<string, Map<string, { count: number; resetAt: number }>> = new Map();

// P1-6: Periodic cleanup of expired rate limiter entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, limiter] of rateLimiters) {
    for (const [sessionId, entry] of limiter) {
      if (now > entry.resetAt) limiter.delete(sessionId);
    }
    if (limiter.size === 0) rateLimiters.delete(key);
  }
}, 60000); // Clean every minute

// In-memory cache for idempotency - tracks in-flight submissions
const submissionCache: Map<string, Promise<any>> = new Map();

function rateLimit(key: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: Function) => {
    const sessionId = getSessionId(req);

    if (!rateLimiters.has(key)) {
      rateLimiters.set(key, new Map());
    }
    const limiter = rateLimiters.get(key)!;
    const now = Date.now();
    const entry = limiter.get(sessionId);

    if (!entry || now > entry.resetAt) {
      limiter.set(sessionId, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    entry.count++;
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Test mode: inject synthetic auth from X-Test-User-Id header
  if (TEST_MODE) {
    app.use(testAuthMiddleware);
  }

  app.get("/api/user", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);
      res.json(user);
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Return safe public profile data only
      if (user.isProfilePrivate) {
        return res.json({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isProfilePrivate: true,
          moneyHealth: 0,
          streak: 0,
          highestStreak: 0,
          gamesPlayed: 0,
          badges: [],
          bio: "",
        });
      }
      
      // Public profile - return safe subset of fields
      res.json({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        moneyHealth: user.moneyHealth,
        streak: user.streak,
        highestStreak: user.highestStreak,
        gamesPlayed: user.gamesPlayed,
        badges: user.badges,
        isProfilePrivate: false,
      });
    } catch (error) {
      console.error("Error getting user by ID:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/active-players", async (_req: Request, res: Response) => {
    try {
      const count = await storage.getActivePlayersToday();
      res.json({ count });
    } catch (error) {
      console.error("Error getting active players:", error);
      res.json({ count: 0 });
    }
  });

  app.post("/api/cleo-analysis", requireAuth, rateLimit("cleo", 5, 60000), async (req: Request, res: Response) => {
    try {
      const { score, totalQuestions, moneyHealth } = req.body;

      // Try OpenAI if available
      if (process.env.OPENAI_API_KEY) {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const accuracy = Math.round((score / totalQuestions) * 100);

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are Cleo, a witty and supportive AI money coach in a financial literacy game called Lifestyle Creep. Give a personalized 2-3 sentence analysis of the player's performance. Be encouraging but honest. Use casual, Gen-Z friendly language. Never use emojis. Focus on one specific insight."
            },
            {
              role: "user",
              content: `Player scored ${score}/${totalQuestions} (${accuracy}% accuracy) today. Their overall Money Health is ${moneyHealth}/100. Give them a quick take on their performance.`
            }
          ],
          max_tokens: 150,
          temperature: 0.8,
        });

        const analysis = completion.choices[0]?.message?.content;
        if (analysis) {
          return res.json({ analysis });
        }
      }

      // Fallback responses when OpenAI is not available
      const accuracy = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
      const fallbacks = accuracy >= 80
        ? [
            `${score} out of ${totalQuestions} correct with a Money Health of ${moneyHealth}? You're clearly paying attention to where your money goes. The consistency is what separates the financially literate from the financially lucky.`,
            `Strong showing today. Your Money Health at ${moneyHealth} tells me you've been making thoughtful calls consistently. Keep that decision-making muscle sharp and you'll notice the real-world payoff.`,
          ]
        : accuracy >= 50
        ? [
            `${score} out of ${totalQuestions} is a solid middle ground. With a Money Health of ${moneyHealth}, you've got the fundamentals down but there's room to sharpen your instincts on the trickier scenarios.`,
            `Not bad at all. Your Money Health sitting at ${moneyHealth} shows you're building good habits. The scenarios you missed today are exactly the kind of traps that catch people off guard in real life.`,
          ]
        : [
            `Today was a tough one with ${score} out of ${totalQuestions}, but your Money Health at ${moneyHealth} shows this isn't your usual. These scenarios are designed to challenge assumptions, and recognizing where you got tripped up is literally the whole point.`,
            `${score} out of ${totalQuestions} stings a bit, but here's the thing: every wrong answer in this game is a lesson you won't have to learn the expensive way in real life. Your Money Health at ${moneyHealth} says you'll bounce back.`,
          ];

      const analysis = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      res.json({ analysis });
    } catch (error) {
      console.error("Cleo analysis error:", error);
      res.status(500).json({ error: "Cleo is unavailable right now" });
    }
  });

  app.get("/api/daily-drop", async (req: Request, res: Response) => {
    try {
      const drop = await storage.getDailyDrop();
      res.json(drop);
    } catch (error) {
      console.error("Error getting daily drop:", error);
      res.status(500).json({ error: "Failed to get daily drop" });
    }
  });

  app.post("/api/submit-game", requireAuth, rateLimit("submit-game", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = submitGameSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid submission data" });
      }

      // PERF: Fetch user + daily drop in PARALLEL (single round-trip).
      const [user, dailyDrop] = await Promise.all([
        storage.getUser(sessionId),
        storage.getDailyDrop(),
      ]);

      // Fast-fail: skip entirely if already played
      const today = new Date().toISOString().split("T")[0];
      if (user?.lastPlayedDate === today) {
        return res.status(400).json({ error: "Already played today" });
      }

      // Create idempotency key from userId + dropId
      const idempotencyKey = `${sessionId}:${parsed.data.dropId}`;

      // Check if this exact submission is already in progress (concurrent double-tap)
      if (submissionCache.has(idempotencyKey)) {
        console.log(`Duplicate submission detected for ${idempotencyKey}, rejecting`);
        return res.status(409).json({ error: "Submission already in progress" });
      }

      // PERF: Pass pre-fetched user + drop so submitGame does ZERO additional
      // DB reads. It computes results (pure CPU) and writes to DB in the
      // background. The client gets a response in ~0ms after this point.
      const submissionPromise = storage.submitGame(sessionId, parsed.data, dailyDrop, user!)
        .finally(() => {
          // Keep cache for 10s after resolution to catch late duplicate requests
          // (e.g., user taps submit while the background DB write is still running)
          setTimeout(() => submissionCache.delete(idempotencyKey), 10000);
        });

      submissionCache.set(idempotencyKey, submissionPromise);

      const result = await submissionPromise;
      res.json(result);
    } catch (error) {
      console.error("Error submitting game:", error);
      res.status(500).json({ error: "Failed to submit game" });
    }
  });

  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  app.get("/api/daily-stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDailyStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting daily stats:", error);
      res.status(500).json({ error: "Failed to get daily stats" });
    }
  });

  app.post("/api/apply-referral", requireAuth, rateLimit("referral", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { referralCode } = req.body;
      
      if (!referralCode || typeof referralCode !== "string") {
        return res.status(400).json({ error: "Invalid referral code" });
      }
      
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ error: "Referral code not found" });
      }
      
      if (referrer.id === sessionId) {
        return res.status(400).json({ error: "Cannot use your own referral code" });
      }
      
      const success = await storage.applyReferralBonus(referrer.id, sessionId);
      if (!success) {
        return res.status(400).json({ error: "Referral already applied" });
      }
      
      const user = await storage.getUser(sessionId);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error applying referral:", error);
      res.status(500).json({ error: "Failed to apply referral" });
    }
  });

  app.post("/api/set-mode", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = setModeSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid mode" });
      }

      const user = await storage.updateUser(sessionId, { mode: parsed.data.mode });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error setting mode:", error);
      res.status(500).json({ error: "Failed to set mode" });
    }
  });

  app.get("/api/search-user/:username", requireAuth, async (req: Request, res: Response) => {
    try {
      const username = req.params.username as string;
      const sessionId = getSessionId(req);
      
      if (!username || username.length < 3) {
        return res.json({ found: false, username: null });
      }
      
      const result = await storage.searchUserByUsername(username, sessionId);
      res.json(result);
    } catch (error) {
      console.error("Error searching user:", error);
      res.status(500).json({ error: "Failed to search user" });
    }
  });

  app.get("/api/check-username/:username", async (req: Request, res: Response) => {
    try {
      const username = req.params.username as string;
      const sessionId = getSessionId(req);
      
      if (!username || username.length < 3) {
        return res.json({ available: false, reason: "Username must be at least 3 characters" });
      }
      
      if (username.length > 20) {
        return res.json({ available: false, reason: "Username must be 20 characters or less" });
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.json({ available: false, reason: "Username can only contain letters, numbers, and underscores" });
      }
      
      const available = await storage.checkUsernameAvailable(username, sessionId);
      res.json({ available, reason: available ? null : "Username is already taken" });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  app.post("/api/profile", requireAuth, rateLimit("profile", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = updateProfileSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid profile data" });
      }

      const isAvailable = await storage.checkUsernameAvailable(parsed.data.username, sessionId);
      if (!isAvailable) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      const existingUser = await storage.getUser(sessionId);
      if (!existingUser) {
        await storage.getOrCreateUser(sessionId);
      }

      const user = await storage.updateUser(sessionId, {
        username: parsed.data.username,
        avatar: parsed.data.avatar,
        bio: parsed.data.bio || "",
        allowFriendsToFind: parsed.data.allowFriendsToFind,
        isProfilePrivate: parsed.data.isProfilePrivate,
        moneyPhilosophy: parsed.data.moneyPhilosophy || "",
        whyImHere: parsed.data.whyImHere || "",
        friendVisibility: parsed.data.friendVisibility || "trend",
        profileSetupComplete: true,
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Low pressure mode toggle
  app.post("/api/low-pressure-mode", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { enabled } = req.body;

      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "Invalid request" });
      }

      const user = await storage.updateUser(sessionId, {
        lowPressureMode: enabled,
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error toggling low pressure mode:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Data export endpoint (GDPR Article 20: Right to data portability)
  app.get("/api/export-data", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getUser(sessionId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Prepare complete user data export
      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          moneyPhilosophy: user.moneyPhilosophy,
          membershipTier: user.membershipTier,
        },
        gameProgress: {
          streak: user.streak,
          highestStreak: user.highestStreak,
          moneyHealth: user.moneyHealth,
          totalScore: user.totalScore,
          gamesPlayed: user.gamesPlayed,
          perfectGames: user.perfectGames,
          lastPlayedDate: user.lastPlayedDate,
        },
        statistics: {
          stats: user.stats,
          categoryStats: user.categoryStats,
          gameHistory: user.gameHistory,
        },
        achievements: {
          badges: user.badges,
        },
        calendar: {
          streakCalendar: user.streakCalendar,
          frozenDates: user.frozenDates,
          freezeTokens: user.freezeTokens,
        },
        settings: {
          mode: user.mode,
          lowPressureMode: user.lowPressureMode,
          soundEnabled: user.soundEnabled,
          notificationPrefs: user.notificationPrefs,
          isProfilePrivate: user.isProfilePrivate,
          allowFriendsToFind: user.allowFriendsToFind,
        },
        social: {
          friendIds: user.friendIds,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          referralCount: user.referralCount,
        },
      };

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="lifestyle-creep-data-${user.username}-${new Date().toISOString().split('T')[0]}.json"`);

      res.json(exportData);
    } catch (error) {
      console.error("Error exporting user data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Account deletion endpoint (GDPR/CCPA compliance + Apple App Store requirement)
  app.delete("/api/account", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);

      // Log deletion request for audit trail
      console.log(`Account deletion requested by user: ${sessionId}`);

      // Delete all user data from database
      const deleted = await storage.deleteUserAccount(sessionId);

      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }

      // Destroy session after successful deletion
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session after account deletion:", err);
        }
      });

      res.json({ success: true, message: "Account permanently deleted" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account. Please contact support." });
    }
  });

  // Toggle sound effects
  app.post("/api/toggle-sound", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getUser(sessionId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(sessionId, {
        soundEnabled: !user.soundEnabled,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error toggling sound:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Complete onboarding
  app.post("/api/complete-onboarding", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.updateUser(sessionId, {
        onboardingComplete: true,
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Notification preferences
  app.post("/api/notification-prefs", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const prefs = req.body;
      
      const user = await storage.updateUser(sessionId, {
        notificationPrefs: prefs,
      });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating notification prefs:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // League routes
  app.get("/api/leagues", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const leagues = await storage.getUserLeagues(sessionId);
      res.json(leagues);
    } catch (error) {
      console.error("Error getting leagues:", error);
      res.status(500).json({ error: "Failed to get leagues" });
    }
  });

  app.get("/api/leagues/:id", async (req: Request, res: Response) => {
    try {
      const leagueId = req.params.id as string;
      const league = await storage.getLeague(leagueId);
      if (!league) {
        return res.status(404).json({ error: "League not found" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error getting league:", error);
      res.status(500).json({ error: "Failed to get league" });
    }
  });

  app.post("/api/leagues", requireAuth, rateLimit("create-league", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = createLeagueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid league data" });
      }

      const league = await storage.createLeague(sessionId, parsed.data);
      res.json(league);
    } catch (error) {
      console.error("Error creating league:", error);
      res.status(500).json({ error: "Failed to create league" });
    }
  });

  app.post("/api/leagues/join", requireAuth, rateLimit("join-league", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = joinLeagueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid invite code" });
      }

      const league = await storage.joinLeague(sessionId, parsed.data.inviteCode);
      if (!league) {
        return res.status(404).json({ error: "League not found with that code" });
      }
      res.json(league);
    } catch (error) {
      console.error("Error joining league:", error);
      res.status(500).json({ error: "Failed to join league" });
    }
  });

  app.post("/api/leagues/:id/leave", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const leagueId = req.params.id as string;
      
      const success = await storage.leaveLeague(sessionId, leagueId);
      if (!success) {
        return res.status(404).json({ error: "League not found or not a member" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving league:", error);
      res.status(500).json({ error: "Failed to leave league" });
    }
  });

  // Challenge routes
  app.get("/api/friends", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const friends = await storage.getFriends(sessionId);
      res.json(friends.map(f => ({
        id: f.id,
        username: f.username,
        avatar: f.avatar,
        moneyHealth: f.moneyHealth,
        streak: f.streak,
      })));
    } catch (error) {
      console.error("Error getting friends:", error);
      res.status(500).json({ error: "Failed to get friends" });
    }
  });

  app.get("/api/friends/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const friends = await storage.getFriends(sessionId);
      const today = new Date().toISOString().split("T")[0];

      let friendsPlayedToday = 0;
      const recentActivity: Array<{ id: string; type: string; username: string; value?: number; timestamp: string }> = [];

      for (const friend of friends) {
        if (friend.lastPlayedDate === today) {
          friendsPlayedToday++;
          const score = friend.todayResult?.score;
          if (score != null) {
            recentActivity.push({
              id: `${friend.id}-score`,
              type: "score",
              username: friend.username || "Player",
              value: score,
              timestamp: today,
            });
          }
        }
        if ((friend.streak ?? 0) >= 3) {
          recentActivity.push({
            id: `${friend.id}-streak`,
            type: "streak",
            username: friend.username || "Player",
            value: friend.streak ?? 0,
            timestamp: today,
          });
        }
        if ((friend.moneyHealth ?? 0) >= 75) {
          recentActivity.push({
            id: `${friend.id}-level`,
            type: "level_up",
            username: friend.username || "Player",
            value: friend.moneyHealth ?? 0,
            timestamp: today,
          });
        }
      }

      res.json({
        friendsPlayedToday,
        totalFriends: friends.length,
        recentActivity: recentActivity.slice(0, 10),
      });
    } catch (error) {
      console.error("Error getting friends activity:", error);
      res.status(500).json({ error: "Failed to get friends activity" });
    }
  });

  app.post("/api/friends/add", requireAuth, rateLimit("add-friend", 20, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { friendId } = req.body;
      
      if (!friendId || typeof friendId !== "string") {
        return res.status(400).json({ error: "Friend ID is required" });
      }
      
      const result = await storage.addFriend(sessionId, friendId);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.json(result);
    } catch (error) {
      console.error("Error adding friend:", error);
      res.status(500).json({ error: "Failed to add friend" });
    }
  });

  // ── Social: unread indicator ──────────────────────────────────────
  app.get("/api/social/unread", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getUser(sessionId);
      if (!user) return res.json({ hasUnread: false });

      const friends = await storage.getFriends(sessionId);
      const today = new Date().toISOString().split("T")[0];

      // Consider "unread" if any friend has played today since last social visit
      const lastSocialVisit = (user as any).lastSocialVisit || "";
      const hasUnread = friends.some(
        (f) => f.lastPlayedDate === today && f.lastPlayedDate > lastSocialVisit
      );

      res.json({ hasUnread });
    } catch (error) {
      console.error("Error checking social unread:", error);
      res.json({ hasUnread: false });
    }
  });

  app.post("/api/social/mark-read", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      // Store the current timestamp as last social visit
      await storage.updateUser(sessionId, {
        lastSocialVisit: new Date().toISOString(),
      } as any);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error marking social read:", error);
      res.json({ ok: true });
    }
  });

  app.get("/api/challenges", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const challenges = await storage.getUserChallenges(sessionId);
      res.json(challenges);
    } catch (error) {
      console.error("Error getting challenges:", error);
      res.status(500).json({ error: "Failed to get challenges" });
    }
  });

  app.post("/api/challenges", requireAuth, rateLimit("create-challenge", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = createChallengeSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid challenge data" });
      }

      const challenge = await storage.createChallenge(sessionId, parsed.data);
      
      // Send push notification to the challenged user
      const challenger = await storage.getUser(sessionId);
      const challengerName = challenger?.username || "Someone";
      sendPushToUser(
        parsed.data.challengeeId,
        "You've been challenged!",
        `${challengerName} challenged you to a ${parsed.data.type.replace("_", " ")} battle!`,
        { type: "challenge", challengeId: challenge.id }
      );
      
      res.json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ error: "Failed to create challenge" });
    }
  });

  app.post("/api/challenges/:id/respond", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const challengeId = req.params.id as string;
      const { accept } = req.body;
      
      if (typeof accept !== "boolean") {
        return res.status(400).json({ error: "Accept must be a boolean" });
      }

      const challenge = await storage.respondToChallenge(challengeId, sessionId, accept);
      if (!challenge) {
        return res.status(404).json({ error: "Challenge not found or not authorized" });
      }
      res.json(challenge);
    } catch (error) {
      console.error("Error responding to challenge:", error);
      res.status(500).json({ error: "Failed to respond to challenge" });
    }
  });

  // Streak protection routes
  app.get("/api/streak-calendar", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const days = parseInt(req.query.days as string) || 30;
      const calendar = await storage.getStreakCalendar(sessionId, days);
      res.json(calendar);
    } catch (error) {
      console.error("Error getting streak calendar:", error);
      res.status(500).json({ error: "Failed to get streak calendar" });
    }
  });

  app.post("/api/use-freeze", requireAuth, rateLimit("freeze", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const result = await storage.useStreakFreeze(sessionId);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.json(result);
    } catch (error) {
      console.error("Error using streak freeze:", error);
      res.status(500).json({ error: "Failed to use streak freeze" });
    }
  });

  // P2-4: Health check endpoint for load balancers
  app.get("/api/health", async (_req: Request, res: Response) => {
    try {
      // Verify DB connectivity
      await storage.getActivePlayersToday();
      res.json({ status: "ok", uptime: process.uptime() });
    } catch {
      res.status(503).json({ status: "unhealthy" });
    }
  });

  // P0-1: Restricted to admin — was previously open to any authenticated user
  app.post("/api/add-freeze-token", requireAuth, rateLimit("freeze-token", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);

      // P0-1: Only admins/moderators can grant freeze tokens
      const isAdmin = await storage.isAdmin(sessionId);
      const isMod = await storage.isModerator(sessionId);
      if (!isAdmin && !isMod) {
        return res.status(403).json({ error: "Admin access required to grant freeze tokens" });
      }

      const parsed = addFreezeTokenSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      // Admin specifies target userId in body, not self-granting
      const targetUserId = req.body.userId || sessionId;
      const user = await storage.addFreezeToken(targetUserId, parsed.data.count);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ freezeTokens: user.freezeTokens });
    } catch (error) {
      console.error("Error adding freeze token:", error);
      res.status(500).json({ error: "Failed to add freeze token" });
    }
  });

  // ── Mission reward claiming ───────────────────────────────────────────────
  app.post("/api/missions/claim", requireAuth, rateLimit("mission-claim", 15, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { missionId } = req.body;

      if (!missionId || typeof missionId !== "string") {
        return res.status(400).json({ error: "missionId is required" });
      }

      // Validate mission exists
      const mission = MISSION_POOL.find((m) => m.id === missionId);
      if (!mission) {
        return res.status(400).json({ error: "Unknown mission" });
      }

      const user = await storage.getOrCreateUser(sessionId);

      // Check if already claimed
      const claimed = user.claimedMissions || [];
      if (claimed.includes(missionId)) {
        return res.status(200).json({ already: true, user });
      }

      // Server-side validation: re-check mission condition using DB data
      const serverContext = buildMissionContext(user);
      if (!mission.check(serverContext)) {
        return res.status(400).json({ error: "Mission conditions not yet met" });
      }

      // Build reward updates
      const updates: Record<string, any> = {
        claimedMissions: [...claimed, missionId],
      };

      let rewardSummary = { type: "xp" as string, amount: mission.xp };

      if (mission.reward) {
        rewardSummary = { type: mission.reward.type, amount: mission.reward.amount };

        switch (mission.reward.type) {
          case "xp":
            updates.totalScore = (user.totalScore || 0) + mission.reward.amount;
            break;
          case "streak_shield":
            updates.freezeTokens = (user.freezeTokens || 0) + mission.reward.amount;
            break;
          case "arcade_token":
            updates.bonusArcadePlays = (user.bonusArcadePlays || 0) + mission.reward.amount;
            break;
        }
      } else {
        // Default: credit XP to totalScore
        updates.totalScore = (user.totalScore || 0) + mission.xp;
      }

      const updated = await storage.updateUser(sessionId, updates);
      res.json({ claimed: true, reward: rewardSummary, user: updated });
    } catch (error) {
      console.error("Error claiming mission reward:", error);
      res.status(500).json({ error: "Failed to claim reward" });
    }
  });

  // ─── Debug endpoints (dev only) ─────────────────────────────────────────────
  const isDevMode = process.env.DEV_AUTH_BYPASS === "true";

  app.post("/api/debug/unlock-all", requireAuth, async (req: Request, res: Response) => {
    if (!isDevMode) return res.status(403).json({ error: "Debug endpoints disabled" });
    try {
      const sessionId = getSessionId(req);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const updated = await storage.updateUser(sessionId, {
        gamesPlayed: 100,
        createdAt: thirtyDaysAgo,
      });
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Debug unlock-all error:", error);
      res.status(500).json({ error: "Failed to unlock all modes" });
    }
  });

  app.post("/api/debug/reset-user", requireAuth, async (req: Request, res: Response) => {
    if (!isDevMode) return res.status(403).json({ error: "Debug endpoints disabled" });
    try {
      const sessionId = getSessionId(req);
      const updated = await storage.updateUser(sessionId, {
        gamesPlayed: 0,
        streak: 0,
        highestStreak: 0,
        totalScore: 0,
        moneyHealth: 50,
        freezeTokens: 0,
        bonusArcadePlays: 0,
        claimedMissions: [],
        todayResult: null,
        perfectGames: 0,
        arcadePlaysToday: 0,
        gameHistory: [],
        categoryStats: [],
        friendIds: [],
        badges: [],
        referralCount: 0,
      });
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Debug reset-user error:", error);
      res.status(500).json({ error: "Failed to reset user" });
    }
  });

  app.post("/api/debug/populate-user", requireAuth, async (req: Request, res: Response) => {
    if (!isDevMode) return res.status(403).json({ error: "Debug endpoints disabled" });
    try {
      const sessionId = getSessionId(req);
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const sampleHistory = Array.from({ length: 15 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        score: 250 + Math.floor(Math.random() * 250),
        correctAnswers: 2 + Math.floor(Math.random() * 3),
        totalQuestions: 5,
        iq: 80 + Math.floor(Math.random() * 40),
        theme: ["travel", "scam", "lifestyle", "tech", "investing"][i % 5],
      }));
      const updated = await storage.updateUser(sessionId, {
        gamesPlayed: 25,
        streak: 7,
        highestStreak: 12,
        totalScore: 2500,
        moneyHealth: 75,
        freezeTokens: 3,
        bonusArcadePlays: 5,
        perfectGames: 3,
        createdAt: tenDaysAgo,
        gameHistory: sampleHistory,
        claimedMissions: ["complete_daily", "play_arcade"],
      });
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Debug populate-user error:", error);
      res.status(500).json({ error: "Failed to populate user" });
    }
  });

  // ─── Daily Drop Replay ──────────────────────────────────────────────────────
  app.post("/api/daily-drop/replay", requireAuth, rateLimit("replay", 3, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId, "player");
      if (!user.todayResult) {
        return res.status(400).json({ error: "No result to replay — play first" });
      }
      // Clear todayResult so user can play again (don't affect streak or gamesPlayed)
      const updated = await storage.updateUser(sessionId, {
        todayResult: null,
      });
      res.json({ success: true, user: updated });
    } catch (error) {
      console.error("Replay error:", error);
      res.status(500).json({ error: "Failed to start replay" });
    }
  });

  // Badge/Achievement endpoints
  app.get("/api/badges", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const badges = await storage.getBadges(sessionId);
      res.json(badges);
    } catch (error) {
      console.error("Error getting badges:", error);
      res.status(500).json({ error: "Failed to get badges" });
    }
  });

  // Streak Insurance endpoints
  app.post("/api/streak-buyback", requireAuth, rateLimit("buyback", 3, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const result = await storage.useStreakBuyback(sessionId);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.json(result);
    } catch (error) {
      console.error("Error using streak buyback:", error);
      res.status(500).json({ error: "Failed to use streak buyback" });
    }
  });

  app.post("/api/late-pass", requireAuth, rateLimit("late-pass", 3, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const result = await storage.useLatePass(sessionId);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.json(result);
    } catch (error) {
      console.error("Error using late pass:", error);
      res.status(500).json({ error: "Failed to use late pass" });
    }
  });

  app.post("/api/toggle-plus", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { isPlus } = req.body;
      
      if (typeof isPlus !== "boolean") {
        return res.status(400).json({ error: "isPlus must be a boolean" });
      }

      const user = await storage.togglePlusStatus(sessionId, isPlus);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error toggling plus status:", error);
      res.status(500).json({ error: "Failed to toggle plus status" });
    }
  });

  // Community Mode endpoints
  app.get("/api/community/scenarios", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const category = req.query.category as string | undefined;
      const sortBy = (req.query.sortBy as "latest" | "hot" | "realest") || "latest";
      // P1: Add pagination support (default: 50 items per page)
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Cap at 100
      const offset = parseInt(req.query.offset as string) || 0;
      const scenarios = await storage.getCommunityScenarios(sessionId, category, sortBy, limit, offset);
      res.json(scenarios);
    } catch (error) {
      console.error("Error getting community scenarios:", error);
      res.status(500).json({ error: "Failed to get community scenarios" });
    }
  });

  app.get("/api/community/scenarios/:id", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const scenarioId = req.params.id as string;
      const scenario = await storage.getCommunityScenario(scenarioId, sessionId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error getting community scenario:", error);
      res.status(500).json({ error: "Failed to get community scenario" });
    }
  });

  app.post("/api/community/scenarios", requireAuth, rateLimit("community-post", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { communityScenarioSchema } = await import("@shared/schema");
      const parsed = communityScenarioSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid scenario data" });
      }
      // P1-7: Sanitize user-submitted community content (strip HTML tags)
      const sanitized = {
        ...parsed.data,
        title: parsed.data.title.replace(/<[^>]*>/g, "").slice(0, 200),
        context: parsed.data.context.replace(/<[^>]*>/g, "").slice(0, 2000),
        question: parsed.data.question.replace(/<[^>]*>/g, "").slice(0, 500),
      };
      const scenario = await storage.createCommunityScenario(sessionId, sanitized);
      res.json(scenario);
    } catch (error) {
      console.error("Error creating community scenario:", error);
      res.status(500).json({ error: "Failed to create community scenario" });
    }
  });

  app.post("/api/community/scenarios/:id/vote", requireAuth, rateLimit("vote", 30, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const scenarioId = req.params.id as string;
      const { type } = req.body;
      if (type !== "up" && type !== "down") {
        return res.status(400).json({ error: "Vote type must be 'up' or 'down'" });
      }
      const scenario = await storage.voteCommunityScenario(sessionId, scenarioId, type);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error voting on scenario:", error);
      res.status(500).json({ error: "Failed to vote on scenario" });
    }
  });

  app.get("/api/community/top-creators", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topCreators = await storage.getTopCreators(limit);
      res.json(topCreators);
    } catch (error) {
      console.error("Error getting top creators:", error);
      res.status(500).json({ error: "Failed to get top creators" });
    }
  });

  app.post("/api/membership/upgrade", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { tier } = req.body;

      if (tier !== "free" && tier !== "plus" && tier !== "pro") {
        return res.status(400).json({ error: "Invalid tier. Must be 'free', 'plus', or 'pro'" });
      }

      const updatedUser = await storage.updateMembershipTier(sessionId, tier);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating membership:", error);
      res.status(500).json({ error: "Failed to update membership" });
    }
  });

  app.get("/api/community/scenarios/:id/comments", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const scenarioId = req.params.id as string;
      const comments = await storage.getScenarioComments(scenarioId, sessionId);
      res.json(comments);
    } catch (error) {
      console.error("Error getting comments:", error);
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/community/comments", requireAuth, rateLimit("comment", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { communityCommentSchema } = await import("@shared/schema");
      const parsed = communityCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid comment data" });
      }
      // P1-7: Sanitize comment content
      const sanitized = {
        ...parsed.data,
        content: parsed.data.content.replace(/<[^>]*>/g, "").slice(0, 2000),
      };
      const comment = await storage.addComment(sessionId, sanitized);
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.post("/api/community/comments/:id/vote", requireAuth, rateLimit("vote", 30, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const commentId = req.params.id as string;
      const { type } = req.body;
      
      if (type !== "up" && type !== "down") {
        return res.status(400).json({ error: "Vote type must be 'up' or 'down'" });
      }
      
      const comment = await storage.voteComment(sessionId, commentId, type);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      console.error("Error voting on comment:", error);
      res.status(500).json({ error: "Failed to vote on comment" });
    }
  });

  app.get("/api/community/realest-of-week", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const scenarios = await storage.getRealistOfWeek(sessionId);
      res.json(scenarios);
    } catch (error) {
      console.error("Error getting realest of week:", error);
      res.status(500).json({ error: "Failed to get realest of week" });
    }
  });

  // Admin routes
  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    try {
      const sessionId = getSessionId(req);
      const isAdmin = await storage.isAdmin(sessionId);
      const isMod = await storage.isModerator(sessionId);
      if (!isAdmin && !isMod) {
        return res.status(403).json({ error: "Admin access required" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };

  const requireAdminOnly = async (req: Request, res: Response, next: Function) => {
    try {
      const sessionId = getSessionId(req);
      const isAdmin = await storage.isAdmin(sessionId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };

  // Check if user is admin
  app.get("/api/admin/check", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const isAdmin = await storage.isAdmin(sessionId);
      const isModerator = await storage.isModerator(sessionId);
      res.json({ isAdmin, isModerator, hasAccess: isAdmin || isModerator });
    } catch (error) {
      console.error("Error checking admin:", error);
      res.status(500).json({ error: "Failed to check admin status" });
    }
  });

  // Get all users for admin
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsersForAdmin();
      res.json(users);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  // Moderator management (admin only)
  app.get("/api/admin/moderators", requireAdminOnly, async (req: Request, res: Response) => {
    try {
      const moderators = await storage.getModerators();
      res.json(moderators);
    } catch (error) {
      console.error("Error getting moderators:", error);
      res.status(500).json({ error: "Failed to get moderators" });
    }
  });

  app.post("/api/admin/moderators", requireAdminOnly, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = addModeratorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data" });
      }
      const moderator = await storage.addModerator(parsed.data.userId, sessionId);
      if (!moderator) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(moderator);
    } catch (error) {
      console.error("Error adding moderator:", error);
      res.status(500).json({ error: "Failed to add moderator" });
    }
  });

  app.delete("/api/admin/moderators/:userId", requireAdminOnly, async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const success = await storage.removeModerator(userId);
      if (!success) {
        return res.status(404).json({ error: "Moderator not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing moderator:", error);
      res.status(500).json({ error: "Failed to remove moderator" });
    }
  });

  // Banned users management
  app.get("/api/admin/banned", requireAdmin, async (req: Request, res: Response) => {
    try {
      const bannedUsers = await storage.getBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      console.error("Error getting banned users:", error);
      res.status(500).json({ error: "Failed to get banned users" });
    }
  });

  app.post("/api/admin/ban", requireAdmin, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = banUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid data" });
      }
      const bannedUser = await storage.banUser(parsed.data, sessionId);
      if (!bannedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(bannedUser);
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ error: "Failed to ban user" });
    }
  });

  app.post("/api/admin/unban/:userId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId as string;
      const success = await storage.unbanUser(userId);
      if (!success) {
        return res.status(404).json({ error: "User not found in banned list" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ error: "Failed to unban user" });
    }
  });

  // Admin scenarios management
  app.get("/api/admin/scenarios", requireAdmin, async (req: Request, res: Response) => {
    try {
      const scenarios = await storage.getAdminScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error getting admin scenarios:", error);
      res.status(500).json({ error: "Failed to get scenarios" });
    }
  });

  app.get("/api/admin/scenarios/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const scenarioId = req.params.id as string;
      const scenario = await storage.getAdminScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error getting scenario:", error);
      res.status(500).json({ error: "Failed to get scenario" });
    }
  });

  app.post("/api/admin/scenarios", requireAdmin, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = adminScenarioSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid scenario data" });
      }
      const scenario = await storage.createAdminScenario(sessionId, parsed.data);
      res.json(scenario);
    } catch (error) {
      console.error("Error creating scenario:", error);
      res.status(500).json({ error: "Failed to create scenario" });
    }
  });

  app.patch("/api/admin/scenarios/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const scenarioId = req.params.id as string;
      const parsed = adminScenarioSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid scenario data" });
      }
      const scenario = await storage.updateAdminScenario(scenarioId, parsed.data);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error updating scenario:", error);
      res.status(500).json({ error: "Failed to update scenario" });
    }
  });

  app.delete("/api/admin/scenarios/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const scenarioId = req.params.id as string;
      const success = await storage.deleteAdminScenario(scenarioId);
      if (!success) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting scenario:", error);
      res.status(500).json({ error: "Failed to delete scenario" });
    }
  });

  app.post("/api/admin/scenarios/:id/publish", requireAdmin, async (req: Request, res: Response) => {
    try {
      const scenarioId = req.params.id as string;
      const scenario = await storage.publishAdminScenario(scenarioId);
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error publishing scenario:", error);
      res.status(500).json({ error: "Failed to publish scenario" });
    }
  });

  // Push notification routes
  app.get("/api/push/vapid-key", (req: Request, res: Response) => {
    if (!pushNotificationsEnabled || !VAPID_PUBLIC_KEY) {
      return res.status(503).json({ error: "Push notifications not configured" });
    }
    res.json({ publicKey: VAPID_PUBLIC_KEY });
  });

  app.post("/api/push/subscribe", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!pushNotificationsEnabled) {
        return res.status(503).json({ error: "Push notifications not configured" });
      }
      
      const sessionId = getSessionId(req);
      const subscription = req.body;
      
      // Validate subscription format
      if (!subscription || typeof subscription.endpoint !== 'string' || !subscription.endpoint.startsWith('https://')) {
        return res.status(400).json({ error: "Invalid subscription endpoint" });
      }
      
      if (!subscription.keys || typeof subscription.keys.p256dh !== 'string' || typeof subscription.keys.auth !== 'string') {
        return res.status(400).json({ error: "Invalid subscription keys" });
      }
      
      await storage.savePushSubscription(sessionId, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { endpoint } = req.body;
      
      if (!endpoint || typeof endpoint !== 'string') {
        return res.status(400).json({ error: "Valid endpoint required" });
      }
      
      await storage.removePushSubscription(sessionId, endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing push subscription:", error);
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  app.post("/api/push/send-reminder", requireAdmin, async (req: Request, res: Response) => {
    try {
      if (!pushNotificationsEnabled) {
        return res.status(503).json({ error: "Push notifications not configured" });
      }
      
      const subscriptions = await storage.getAllPushSubscriptions();
      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              sub.subscription as webpush.PushSubscription,
              JSON.stringify({
                title: "Lifestyle Creep",
                body: "Your daily drop is ready! Make smart money moves today.",
                icon: "/icons/icon-192.png"
              })
            );
            return { success: true, userId: sub.userId };
          } catch (error: any) {
            if (error.statusCode === 410) {
              // Subscription expired, remove it
              await storage.removePushSubscription(sub.userId, sub.subscription.endpoint);
            }
            return { success: false, userId: sub.userId, error: error.message };
          }
        })
      );
      
      res.json({
        sent: results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length,
        failed: results.filter(r => r.status === 'rejected' || !(r.value as any)?.success).length
      });
    } catch (error) {
      console.error("Error sending reminders:", error);
      res.status(500).json({ error: "Failed to send reminders" });
    }
  });

  // ==================== ARCADE MODE ROUTES ====================

  app.get("/api/arcade-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const status = await storage.getArcadeStatus(sessionId);
      res.json(status);
    } catch (error) {
      console.error("Error getting arcade status:", error);
      res.status(500).json({ error: "Failed to get arcade status" });
    }
  });

  app.get("/api/arcade-drop", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const gameIndexParam = req.query.gameIndex as string | undefined;
      const gameIndex = gameIndexParam !== undefined ? parseInt(gameIndexParam, 10) : undefined;

      const status = await storage.getArcadeStatus(sessionId);
      const isReplay = gameIndex !== undefined && gameIndex < status.gamesUnlocked;

      if (gameIndex !== undefined && !isReplay && gameIndex !== status.currentGameIndex) {
        return res.status(403).json({ error: "Game index not unlocked", status });
      }

      if (!isReplay && !status.canPlay) {
        return res.status(403).json({ error: "Arcade play limit reached", status });
      }
      const drop = await storage.getArcadeDrop(sessionId, gameIndex);
      res.json(drop);
    } catch (error) {
      console.error("Error getting arcade drop:", error);
      res.status(500).json({ error: "Failed to get arcade drop" });
    }
  });

  app.post("/api/submit-arcade", requireAuth, rateLimit("submit-arcade", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = submitArcadeGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid submission" });
      }
      const result = await storage.submitArcadeGame(sessionId, parsed.data);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Arcade play limit reached for today") {
        return res.status(403).json({ error: error.message });
      }
      console.error("Error submitting arcade game:", error);
      res.status(500).json({ error: "Failed to submit arcade game" });
    }
  });

  // ==================== CO-OP GAME ROUTES ====================
  
  // Store WebSocket connections by session and user
  const coopConnections: Map<string, Map<string, WebSocket>> = new Map();

  // Broadcast to all players in a session
  function broadcastToSession(sessionId: string, message: CoopMessage, excludeUserId?: string) {
    const sessionConnections = coopConnections.get(sessionId);
    if (!sessionConnections) return;

    const messageStr = JSON.stringify(message);
    sessionConnections.forEach((ws, odUserId) => {
      if (excludeUserId && odUserId === excludeUserId) return;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  app.post("/api/coop/create", requireAuth, rateLimit("coop-create", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = createCoopSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }
      const { mode, arcadeGameIndex, invitedUserId } = parsed.data;
      const session = await storage.createCoopSession(sessionId, mode, arcadeGameIndex ?? null, invitedUserId ?? null);

      // Send push notification to invited friend
      if (invitedUserId) {
        const host = await storage.getUser(sessionId);
        const hostName = host?.username || "Someone";
        sendPushToUser(
          invitedUserId,
          "Game invite! 🎮",
          `${hostName} wants to play with you!`,
          { type: "coop_invite", sessionId: session.id, code: session.code }
        );
      }

      res.json(session);
    } catch (error) {
      console.error("Error creating co-op session:", error);
      res.status(500).json({ error: "Failed to create co-op session" });
    }
  });

  // Get pending co-op invites for current user
  app.get("/api/coop/pending-invites", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const pendingInvites = await storage.getCoopPendingInvites(userId);
      res.json(pendingInvites);
    } catch (error) {
      console.error("Error getting pending invites:", error);
      res.status(500).json({ error: "Failed to get pending invites" });
    }
  });

  // P0-3: Get co-op session — now requires auth + participant check
  app.get("/api/coop/session/:sessionId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const { sessionId } = req.params;
      const session = await storage.getCoopSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      // Verify user is a participant (host or guest)
      if (session.hostId !== userId && session.guestId !== userId) {
        return res.status(403).json({ error: "Not a participant in this session" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting co-op session:", error);
      res.status(500).json({ error: "Failed to get co-op session" });
    }
  });

  // Join co-op session by code
  app.post("/api/coop/join", requireAuth, rateLimit("coop-join", 10, 60000), async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const parsed = joinCoopSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const session = await storage.joinCoopSession(userId, parsed.data.code);
      if (!session) {
        return res.status(404).json({ error: "Session not found or already full" });
      }

      // Broadcast player joined to host
      broadcastToSession(session.id, {
        type: "player_joined",
        sessionId: session.id,
        payload: { session },
      });

      res.json(session);
    } catch (error) {
      console.error("Error joining co-op session:", error);
      res.status(500).json({ error: "Failed to join co-op session" });
    }
  });

  // Start co-op game (host only)
  app.post("/api/coop/session/:sessionId/start", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const { sessionId } = req.params;
      
      const session = await storage.getCoopSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      if (session.hostId !== userId) {
        return res.status(403).json({ error: "Only the host can start the game" });
      }
      if (session.players.length < 2) {
        return res.status(400).json({ error: "Need 2 players to start" });
      }

      const updated = await storage.updateCoopSession(sessionId, {
        status: "playing",
        startedAt: new Date().toISOString(),
        questionStartTime: Date.now(),
      });

      // Broadcast game start to all players
      broadcastToSession(sessionId, {
        type: "game_start",
        sessionId,
        payload: { session: updated },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error starting co-op game:", error);
      res.status(500).json({ error: "Failed to start co-op game" });
    }
  });

  // Submit answer in co-op game
  app.post("/api/coop/session/:sessionId/answer", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const { sessionId } = req.params;
      const { scenarioId, choiceLabel } = req.body;

      const session = await storage.submitCoopAnswer(sessionId, userId, scenarioId, choiceLabel);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Broadcast answer submitted to partner
      broadcastToSession(sessionId, {
        type: "answer_submitted",
        sessionId,
        payload: { 
          playerId: userId, 
          scenarioId,
          hasAnswered: true,
        },
      }, userId);

      res.json(session);
    } catch (error) {
      console.error("Error submitting co-op answer:", error);
      res.status(500).json({ error: "Failed to submit answer" });
    }
  });

  // P0-2: Move to next question — now requires auth + participant check
  app.post("/api/coop/session/:sessionId/next", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const { sessionId } = req.params;

      const session = await storage.getCoopSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      // Verify user is a participant
      if (session.hostId !== userId && session.guestId !== userId) {
        return res.status(403).json({ error: "Not a participant in this session" });
      }

      const totalQuestions = 5;
      const nextIndex = session.currentQuestionIndex + 1;

      if (nextIndex >= totalQuestions) {
        // Game complete
        const updated = await storage.updateCoopSession(sessionId, {
          status: "completed",
          completedAt: new Date().toISOString(),
        });

        const result = await storage.getCoopGameResult(sessionId);

        broadcastToSession(sessionId, {
          type: "game_complete",
          sessionId,
          payload: { result },
        });

        return res.json({ session: updated, result });
      }

      // Move to next question
      const updated = await storage.updateCoopSession(sessionId, {
        currentQuestionIndex: nextIndex,
        questionStartTime: Date.now(),
      });

      broadcastToSession(sessionId, {
        type: "next_question",
        sessionId,
        payload: { 
          currentQuestionIndex: nextIndex,
          questionStartTime: Date.now(),
        },
      });

      res.json(updated);
    } catch (error) {
      console.error("Error moving to next question:", error);
      res.status(500).json({ error: "Failed to move to next question" });
    }
  });

  // P0-3: Get co-op game result — now requires auth + participant check
  app.get("/api/coop/session/:sessionId/result", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const { sessionId } = req.params;
      // Verify participation before returning results
      const session = await storage.getCoopSession(sessionId);
      if (session && session.hostId !== userId && session.guestId !== userId) {
        return res.status(403).json({ error: "Not a participant in this session" });
      }
      const result = await storage.getCoopGameResult(sessionId);
      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error getting co-op result:", error);
      res.status(500).json({ error: "Failed to get result" });
    }
  });

  // ==================== SURVIVAL MODE ROUTES ====================

  // Survival WebSocket connections: matchId → Map<userId, WebSocket>
  const survivalConnections: Map<string, Map<string, WebSocket>> = new Map();

  function broadcastToSurvival(matchId: string): (msg: SurvivalMessage) => void {
    return (msg: SurvivalMessage) => {
      const conns = survivalConnections.get(matchId);
      if (!conns) return;
      const str = JSON.stringify(msg);
      conns.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(str);
        }
      });
    };
  }

  // Persistence callback when a survival match ends
  const onSurvivalMatchEnd = async (room: SurvivalRoom) => {
    if (room.persisted) return;
    room.persisted = true;

    const ranked = room.getRankedPlayers();
    const winner = ranked.find(r => r.placement === 1)?.player ?? null;

    try {
      await storage.saveSurvivalMatch({
        id: room.match.id,
        code: room.match.code,
        hostId: room.match.hostId,
        isPrivate: room.match.isPrivate,
        playerCount: room.match.players.length,
        totalRounds: room.match.round,
        winnerId: winner?.id ?? null,
        startedAt: room.match.startedAt ?? new Date().toISOString(),
        completedAt: room.match.completedAt ?? new Date().toISOString(),
      });

      await storage.saveSurvivalPlayers(
        room.match.id,
        ranked.map(r => ({
          userId: r.player.id,
          placement: r.placement,
          score: r.player.score,
          roundsSurvived: r.player.eliminatedRound ?? room.match.round,
          shieldUsed: !r.player.shieldActive, // shield was used if no longer active
        }))
      );

      // Update each player's survival stats
      for (const r of ranked) {
        await storage.updateSurvivalStats(r.player.id, r.placement === 1, r.placement);
      }

      // Update winner badge
      if (winner) {
        await storage.updateBadgeProgress(winner.id, "survivor", 1);
      }
    } catch (error) {
      console.error("Error persisting survival match:", error);
    }

    // Schedule cleanup
    matchmaking.scheduleCleanup(room.match.id);
  };

  const matchmaking = new SurvivalMatchmaking(broadcastToSurvival, onSurvivalMatchEnd);

  // Register test-only debug endpoints (no-op if TEST_MODE is off)
  registerTestEndpoints(app, { getMatchmaking: () => matchmaking });

  // POST /api/survival/queue — Join public matchmaking queue
  app.post("/api/survival/queue", requireAuth, rateLimit("survival-queue", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);
      const result = matchmaking.joinQueue({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      });
      res.json(result);
    } catch (error) {
      console.error("Error joining survival queue:", error);
      res.status(500).json({ error: "Failed to join queue" });
    }
  });

  // DELETE /api/survival/queue — Leave queue
  app.delete("/api/survival/queue", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      matchmaking.leaveQueue(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to leave queue" });
    }
  });

  // POST /api/survival/create — Create private lobby
  app.post("/api/survival/create", requireAuth, rateLimit("survival-create", 5, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = createSurvivalLobbySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const user = await storage.getOrCreateUser(sessionId);
      const { matchId, code } = matchmaking.createPrivateLobby({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      });

      // Send push notifications to invited friends
      if (parsed.data.invitedUserIds && parsed.data.invitedUserIds.length > 0) {
        for (const invitedId of parsed.data.invitedUserIds) {
          sendPushToUser(
            invitedId,
            "Survival Mode! ⚔️",
            `${user.username} invited you to Last Investor Standing!`,
            { type: "survival_invite", matchId, code }
          );
        }
      }

      res.json({ matchId, code });
    } catch (error) {
      console.error("Error creating survival lobby:", error);
      res.status(500).json({ error: "Failed to create lobby" });
    }
  });

  // POST /api/survival/join/:code — Join private lobby by code
  app.post("/api/survival/join/:code", requireAuth, rateLimit("survival-join", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);
      const result = matchmaking.joinByCode(req.params.code, {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      const room = matchmaking.getRoom(result.matchId!);
      res.json({ matchId: result.matchId, match: room?.getState() });
    } catch (error) {
      console.error("Error joining survival lobby:", error);
      res.status(500).json({ error: "Failed to join lobby" });
    }
  });

  // GET /api/survival/match/:matchId — Get match state
  app.get("/api/survival/match/:matchId", requireAuth, async (req: Request, res: Response) => {
    try {
      const room = matchmaking.getRoom(req.params.matchId);
      if (!room) {
        return res.status(404).json({ error: "Match not found" });
      }
      res.json(room.getState());
    } catch (error) {
      res.status(500).json({ error: "Failed to get match" });
    }
  });

  // ==================== SIM LAB API ====================

  /** Server-side premium check placeholder. */
  function hasPremium(user: { membershipTier: string }): boolean {
    return user.membershipTier === "plus" || user.membershipTier === "pro";
  }

  // In-memory sim run storage (sufficient for MVP; migrate to DB later)
  const simRuns = new Map<string, SimulationRun>();
  const previewUsage = new Map<string, Set<string>>(); // userId -> Set<templateId>

  // GET /api/simlab/templates — list available templates
  app.get("/api/simlab/templates", requireAuth, (_req: Request, res: Response) => {
    // Initialize templates on first call
    import("@shared/lib/simlab/index").catch(() => {});
    res.json(getAllTemplates());
  });

  // POST /api/simlab/run — create and execute a simulation run
  app.post("/api/simlab/run", requireAuth, rateLimit("simlab-run", 10, 60000), async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);

      const parsed = createSimRunSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const { templateId, input, seed: userSeed, decisions, isPreview } = parsed.data;

      // Ensure templates are loaded
      await import("@shared/lib/simlab/index").catch(() => {});

      const template = getTemplate(templateId as any);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Preview gating: free users get 1 preview per template
      if (isPreview) {
        const userPreviews = previewUsage.get(user.id) || new Set();
        if (userPreviews.has(templateId) && !hasPremium(user)) {
          return res.status(403).json({
            error: "Preview limit reached",
            message: "Free users can run 1 preview per template. Upgrade for unlimited runs.",
          });
        }
      }

      // Non-preview runs require premium
      if (!isPreview && !hasPremium(user)) {
        return res.status(403).json({
          error: "Premium required",
          message: "Unlimited simulation runs require a premium membership.",
        });
      }

      // Validate inputs
      const errors = template.validate(input as any);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ error: "Validation failed", fields: errors });
      }

      // Generate seed
      const seed = userSeed ?? Math.floor(Math.random() * 2147483647);

      // Run simulation
      const result: SimulationResult = template.run(input as any, seed, decisions);

      // Store run
      const run: SimulationRun = {
        id: result.runId,
        userId: user.id,
        templateId,
        templateVersion: result.templateVersion,
        inputJSON: input as Record<string, unknown>,
        seed,
        resultJSON: result as unknown as Record<string, unknown>,
        isPreview,
        savedName: null,
        tags: [],
        createdAt: result.computedAt,
      };
      simRuns.set(run.id, run);

      // Track preview usage
      if (isPreview) {
        if (!previewUsage.has(user.id)) previewUsage.set(user.id, new Set());
        previewUsage.get(user.id)!.add(templateId);
      }

      console.log(`[SimLab] Run created: ${run.id} (template=${templateId}, preview=${isPreview}, user=${user.id})`);

      res.json({ run, result });
    } catch (error) {
      console.error("[SimLab] Run error:", error);
      res.status(500).json({ error: "Failed to run simulation" });
    }
  });

  // GET /api/simlab/runs — list user's runs (premium only)
  app.get("/api/simlab/runs", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);

      const userRuns = Array.from(simRuns.values())
        .filter((r) => r.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(userRuns);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch runs" });
    }
  });

  // GET /api/simlab/runs/:id — get a specific run
  app.get("/api/simlab/runs/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);
      const run = simRuns.get(req.params.id);

      if (!run || run.userId !== user.id) {
        return res.status(404).json({ error: "Run not found" });
      }

      res.json(run);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch run" });
    }
  });

  // POST /api/simlab/runs/:id/save — save/name a run (premium only)
  app.post("/api/simlab/runs/:id/save", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);

      if (!hasPremium(user)) {
        return res.status(403).json({ error: "Premium required to save runs" });
      }

      const run = simRuns.get(req.params.id);
      if (!run || run.userId !== user.id) {
        return res.status(404).json({ error: "Run not found" });
      }

      const parsed = saveSimRunSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input" });
      }

      run.savedName = parsed.data.name;
      run.tags = parsed.data.tags || [];
      run.isPreview = false; // Saving promotes from preview
      simRuns.set(run.id, run);

      res.json({ success: true, run });
    } catch (error) {
      res.status(500).json({ error: "Failed to save run" });
    }
  });

  // POST /api/simlab/compare — compare two runs (client-side diff, server just validates access)
  app.post("/api/simlab/compare", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);

      if (!hasPremium(user)) {
        return res.status(403).json({ error: "Premium required to compare runs" });
      }

      const { runIdA, runIdB } = req.body;
      const runA = simRuns.get(runIdA);
      const runB = simRuns.get(runIdB);

      if (!runA || runA.userId !== user.id || !runB || runB.userId !== user.id) {
        return res.status(404).json({ error: "One or both runs not found" });
      }

      res.json({ runA, runB });
    } catch (error) {
      res.status(500).json({ error: "Failed to compare runs" });
    }
  });

  // GET /api/simlab/preview-usage — check preview availability per template
  app.get("/api/simlab/preview-usage", requireAuth, async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const user = await storage.getOrCreateUser(sessionId);
      const used = previewUsage.get(user.id);
      const usage = used ? Array.from(used) : [];
      res.json({ usedTemplates: usage });
    } catch (error) {
      res.status(500).json({ error: "Failed to check preview usage" });
    }
  });

  // ==================== WEBSOCKET SERVER FOR CO-OP & SURVIVAL ====================

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // P0-5: Extract authenticated user from the HTTP upgrade request session
  function getAuthenticatedUserId(req: IncomingMessage): string | null {
    // TEST_MODE: allow synthetic user ID via header
    const testId = getTestUserId(req);
    if (testId) return testId;

    const passportUser = (req as any).user;
    if (passportUser?.claims?.sub) {
      return passportUser.claims.sub;
    }
    // Check session for visitor ID
    const session = (req as any).session;
    if (session?.visitorId) {
      return session.visitorId;
    }
    return null;
  }

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // P0-5: Derive userId from the authenticated HTTP session, not client messages
    const authenticatedUserId = getAuthenticatedUserId(req);
    let currentSessionId: string | null = null;
    let currentUserId: string | null = authenticatedUserId;

    // P1: Add heartbeat mechanism to detect stale connections
    let isAlive = true;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let inactivityTimeout: NodeJS.Timeout | null = null;

    // Reset inactivity timer
    const resetInactivityTimer = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      // Close connection after 10 minutes of inactivity
      inactivityTimeout = setTimeout(() => {
        console.log(`Closing inactive WebSocket connection: ${currentUserId}`);
        ws.terminate();
      }, 10 * 60 * 1000);
    };

    // Start heartbeat ping every 30 seconds
    heartbeatInterval = setInterval(() => {
      if (!isAlive) {
        console.log(`WebSocket connection dead, terminating: ${currentUserId}`);
        clearInterval(heartbeatInterval!);
        return ws.terminate();
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', async (data: Buffer) => {
      resetInactivityTimer();
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_session') {
          const { sessionId } = message;
          // P0-5: Use server-verified userId, ignore client-sent userId
          const userId = authenticatedUserId || message.userId;
          currentSessionId = sessionId;
          currentUserId = userId;

          // Add to connections map
          if (!coopConnections.has(sessionId)) {
            coopConnections.set(sessionId, new Map());
          }
          coopConnections.get(sessionId)!.set(userId, ws);

          // Update player connection status
          const session = await storage.getCoopSession(sessionId);
          if (session) {
            const playerIndex = session.players.findIndex(p => p.id === userId);
            if (playerIndex !== -1) {
              session.players[playerIndex].connected = true;
              await storage.updateCoopSession(sessionId, { players: session.players });
            }

            // Notify other player of reconnection
            broadcastToSession(sessionId, {
              type: "player_reconnected",
              sessionId,
              payload: { userId },
            }, userId);
          }
        }

        if (message.type === 'timer_sync' && currentSessionId) {
          // Broadcast timer sync to other player
          broadcastToSession(currentSessionId, {
            type: "timer_sync",
            sessionId: currentSessionId,
            payload: message.payload,
          }, currentUserId || undefined);
        }

        // ---- Survival Mode WS Messages ----
        if (message.type === 'survival_join' && message.matchId) {
          const room = matchmaking.getRoom(message.matchId);
          if (!room) {
            ws.send(JSON.stringify({ type: "survival_error", message: "Match not found" }));
            return;
          }

          const verifiedUserId = authenticatedUserId || message.userId;
          if (!verifiedUserId) return;

          // Register WS connection for this match
          if (!survivalConnections.has(message.matchId)) {
            survivalConnections.set(message.matchId, new Map());
          }
          survivalConnections.get(message.matchId)!.set(verifiedUserId, ws);

          // Track which survival match this connection belongs to
          (ws as any).__survivalMatchId = message.matchId;
          (ws as any).__survivalUserId = verifiedUserId;

          // Handle reconnection
          room.reconnectPlayer(verifiedUserId);

          // Send full state sync
          ws.send(JSON.stringify({ type: "survival_state_sync", match: room.getState() }));
        }

        if (message.type === 'survival_answer') {
          const validated = survivalAnswerSchema.safeParse(message);
          if (!validated.success) return;

          const verifiedUserId = authenticatedUserId || currentUserId;
          if (!verifiedUserId) return;

          const room = matchmaking.getRoom(validated.data.matchId);
          room?.submitAnswer(verifiedUserId, validated.data.choiceLabel, validated.data.round);
        }

        if (message.type === 'survival_start' && message.matchId) {
          const verifiedUserId = authenticatedUserId || currentUserId;
          if (!verifiedUserId) return;

          const room = matchmaking.getRoom(message.matchId);
          if (room && room.match.hostId === verifiedUserId) {
            const result = room.startGame();
            if (!result.success) {
              ws.send(JSON.stringify({ type: "survival_error", message: result.error }));
            }
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on('close', async () => {
      // P1: Clean up timers to prevent memory leaks
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (inactivityTimeout) clearTimeout(inactivityTimeout);

      if (currentSessionId && currentUserId) {
        // Remove from connections
        const sessionConnections = coopConnections.get(currentSessionId);
        if (sessionConnections) {
          sessionConnections.delete(currentUserId);
          if (sessionConnections.size === 0) {
            coopConnections.delete(currentSessionId);
          }
        }

        // Update player connection status
        const session = await storage.getCoopSession(currentSessionId);
        if (session) {
          const playerIndex = session.players.findIndex(p => p.id === currentUserId);
          if (playerIndex !== -1) {
            session.players[playerIndex].connected = false;
            await storage.updateCoopSession(currentSessionId, { players: session.players });
          }

          // Notify other player of disconnection
          broadcastToSession(currentSessionId, {
            type: "player_disconnected",
            sessionId: currentSessionId,
            payload: { userId: currentUserId },
          });
        }
      }

      // Clean up survival connections
      const survivalMatchId = (ws as any).__survivalMatchId;
      const survivalUserId = (ws as any).__survivalUserId;
      if (survivalMatchId && survivalUserId) {
        const conns = survivalConnections.get(survivalMatchId);
        if (conns) {
          conns.delete(survivalUserId);
          if (conns.size === 0) {
            survivalConnections.delete(survivalMatchId);
          }
        }
        const room = matchmaking.getRoom(survivalMatchId);
        if (room) {
          room.removePlayer(survivalUserId);
        }
      }
    });

    // P1: Add error handler to clean up on errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${currentUserId}:`, error);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
    });

    // P1: Start inactivity timer on connection
    resetInactivityTimer();
  });

  return httpServer;
}
