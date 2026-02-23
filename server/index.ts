import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import path from "path";
import fs from "fs";

const app = express();
const httpServer = createServer(app);

const isProduction = process.env.NODE_ENV === "production";

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// P0-4: Security headers — replaces the need for helmet in environments where it can't be installed
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Referrer policy — don't leak full URL to third parties
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy — disable unused browser features
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Content Security Policy
  if (isProduction) {
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self' wss: https://app.posthog.com https://us.i.posthog.com",
        "frame-ancestors 'none'",
      ].join("; ")
    );
    // HSTS — enforce HTTPS
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(
  express.json({
    // P2: Limit request body size to prevent abuse
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// P2-2: Request logging — don't log response bodies in production (PII risk + log volume)
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  if (!isProduction) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (!isProduction && capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 500)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Serve service worker with correct headers
  app.get('/sw.js', (req: Request, res: Response) => {
    const swPath = path.resolve(import.meta.dirname, '..', 'public', 'sw.js');
    if (fs.existsSync(swPath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Service-Worker-Allowed', '/');
      res.sendFile(swPath);
    } else {
      res.status(404).send('Service worker not found');
    }
  });

  await setupAuth(app);
  registerAuthRoutes(app);

  await registerRoutes(httpServer, app);

  // Global error handler — never expose stack traces in production
  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = isProduction ? "Internal Server Error" : (err.message || "Internal Server Error");

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (isProduction) {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
