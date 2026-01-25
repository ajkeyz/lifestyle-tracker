import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { submitGameSchema, setModeSchema, updateProfileSchema } from "@shared/schema";

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

  return httpServer;
}
