import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitGameSchema, setModeSchema, updateProfileSchema, createLeagueSchema, joinLeagueSchema, createChallengeSchema, addFreezeTokenSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    visitorId: string;
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

  return httpServer;
}
