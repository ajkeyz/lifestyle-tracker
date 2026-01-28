import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import webpush from "web-push";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { submitGameSchema, setModeSchema, updateProfileSchema, createLeagueSchema, joinLeagueSchema, createChallengeSchema, addFreezeTokenSchema, adminScenarioSchema, banUserSchema, addModeratorSchema, joinCoopSessionSchema, type CoopMessage } from "@shared/schema";

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
    req.session.visitorId = `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return req.session.visitorId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  app.get("/api/daily-drop", async (req: Request, res: Response) => {
    try {
      const drop = await storage.getDailyDrop();
      res.json(drop);
    } catch (error) {
      console.error("Error getting daily drop:", error);
      res.status(500).json({ error: "Failed to get daily drop" });
    }
  });

  app.post("/api/submit-game", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = submitGameSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid submission data", details: parsed.error });
      }

      const user = await storage.getUser(sessionId);
      if (user?.todayResult) {
        return res.status(400).json({ error: "Already played today" });
      }

      const result = await storage.submitGame(sessionId, parsed.data);
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

  app.post("/api/apply-referral", async (req: Request, res: Response) => {
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

  app.post("/api/set-mode", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = setModeSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid mode", details: parsed.error });
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

  app.get("/api/search-user/:username", async (req: Request, res: Response) => {
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

  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = updateProfileSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid profile data", details: parsed.error });
      }

      const isAvailable = await storage.checkUsernameAvailable(parsed.data.username, sessionId);
      if (!isAvailable) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      const user = await storage.updateUser(sessionId, {
        username: parsed.data.username,
        avatar: parsed.data.avatar,
        bio: parsed.data.bio || "",
        allowFriendsToFind: parsed.data.allowFriendsToFind,
        isProfilePrivate: parsed.data.isProfilePrivate,
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
  app.post("/api/low-pressure-mode", async (req: Request, res: Response) => {
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

  // Toggle sound effects
  app.post("/api/toggle-sound", async (req: Request, res: Response) => {
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
  app.post("/api/complete-onboarding", async (req: Request, res: Response) => {
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
  app.post("/api/notification-prefs", async (req: Request, res: Response) => {
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
  app.get("/api/leagues", async (req: Request, res: Response) => {
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

  app.post("/api/leagues", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = createLeagueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid league data", details: parsed.error });
      }

      const league = await storage.createLeague(sessionId, parsed.data);
      res.json(league);
    } catch (error) {
      console.error("Error creating league:", error);
      res.status(500).json({ error: "Failed to create league" });
    }
  });

  app.post("/api/leagues/join", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = joinLeagueSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid invite code", details: parsed.error });
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

  app.post("/api/leagues/:id/leave", async (req: Request, res: Response) => {
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
  app.get("/api/friends", async (req: Request, res: Response) => {
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

  app.post("/api/friends/add", async (req: Request, res: Response) => {
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

  app.get("/api/challenges", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const challenges = await storage.getUserChallenges(sessionId);
      res.json(challenges);
    } catch (error) {
      console.error("Error getting challenges:", error);
      res.status(500).json({ error: "Failed to get challenges" });
    }
  });

  app.post("/api/challenges", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = createChallengeSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid challenge data", details: parsed.error });
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

  app.post("/api/challenges/:id/respond", async (req: Request, res: Response) => {
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
  app.get("/api/streak-calendar", async (req: Request, res: Response) => {
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

  app.post("/api/use-freeze", async (req: Request, res: Response) => {
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

  app.post("/api/add-freeze-token", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const parsed = addFreezeTokenSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error });
      }
      
      const user = await storage.addFreezeToken(sessionId, parsed.data.count);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ freezeTokens: user.freezeTokens });
    } catch (error) {
      console.error("Error adding freeze token:", error);
      res.status(500).json({ error: "Failed to add freeze token" });
    }
  });

  // Badge/Achievement endpoints
  app.get("/api/badges", async (req: Request, res: Response) => {
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
  app.post("/api/streak-buyback", async (req: Request, res: Response) => {
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

  app.post("/api/late-pass", async (req: Request, res: Response) => {
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

  app.post("/api/toggle-plus", async (req: Request, res: Response) => {
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
      const scenarios = await storage.getCommunityScenarios(sessionId, category, sortBy);
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

  app.post("/api/community/scenarios", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { communityScenarioSchema } = await import("@shared/schema");
      const parsed = communityScenarioSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid scenario data", details: parsed.error.issues });
      }
      const scenario = await storage.createCommunityScenario(sessionId, parsed.data);
      res.json(scenario);
    } catch (error) {
      console.error("Error creating community scenario:", error);
      res.status(500).json({ error: "Failed to create community scenario" });
    }
  });

  app.post("/api/community/scenarios/:id/vote", async (req: Request, res: Response) => {
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

  app.post("/api/community/comments", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const { communityCommentSchema } = await import("@shared/schema");
      const parsed = communityCommentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid comment data", details: parsed.error.issues });
      }
      const comment = await storage.addComment(sessionId, parsed.data);
      res.json(comment);
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  app.post("/api/community/comments/:id/vote", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const commentId = req.params.id as string;
      const comment = await storage.voteComment(sessionId, commentId);
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
        return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
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
        return res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
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
        return res.status(400).json({ error: "Invalid scenario data", details: parsed.error.issues });
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
        return res.status(400).json({ error: "Invalid scenario data", details: parsed.error.issues });
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

  app.post("/api/push/subscribe", async (req: Request, res: Response) => {
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

  app.post("/api/push/unsubscribe", async (req: Request, res: Response) => {
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

  // Create co-op session
  app.post("/api/coop/create", async (req: Request, res: Response) => {
    try {
      const sessionId = getSessionId(req);
      const session = await storage.createCoopSession(sessionId);
      res.json(session);
    } catch (error) {
      console.error("Error creating co-op session:", error);
      res.status(500).json({ error: "Failed to create co-op session" });
    }
  });

  // Get co-op session
  app.get("/api/coop/session/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getCoopSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error getting co-op session:", error);
      res.status(500).json({ error: "Failed to get co-op session" });
    }
  });

  // Join co-op session by code
  app.post("/api/coop/join", async (req: Request, res: Response) => {
    try {
      const userId = getSessionId(req);
      const parsed = joinCoopSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
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
  app.post("/api/coop/session/:sessionId/start", async (req: Request, res: Response) => {
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
  app.post("/api/coop/session/:sessionId/answer", async (req: Request, res: Response) => {
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

  // Move to next question (both must have answered)
  app.post("/api/coop/session/:sessionId/next", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      
      const session = await storage.getCoopSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const dailyDrop = await storage.getDailyDrop();
      const totalQuestions = dailyDrop.scenarios.length;
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

  // Get co-op game result
  app.get("/api/coop/session/:sessionId/result", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
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

  // ==================== WEBSOCKET SERVER FOR CO-OP ====================
  
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentSessionId: string | null = null;
    let currentUserId: string | null = null;

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join_session') {
          const { sessionId, userId } = message;
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
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on('close', async () => {
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
    });
  });

  return httpServer;
}
