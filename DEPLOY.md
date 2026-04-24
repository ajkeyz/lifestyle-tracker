# Deploying to Replit

This is the canonical deploy path. The app is wired for Replit's OIDC auth, so
Replit Deploy is the lowest-friction option for a shareable demo URL.

## TL;DR

1. Push this branch to your Replit project (or open the GitHub repo in Replit).
2. Open the Deploy panel → "Deploy" → confirm.
3. Wait for the build to finish (~2 min).
4. Share the URL Replit gives you.

That's it. Everything below is troubleshooting + the things to know.

## Prerequisites

You need the following set in **Replit Secrets** (not in `.env`, which is for
local dev only):

| Secret | Required? | Where it comes from |
|--------|-----------|---------------------|
| `DATABASE_URL` | ✅ | Neon (or Supabase) connection string |
| `SESSION_SECRET` | ✅ | Any random ≥32-char string |
| `REPL_ID` | ✅ | Auto-injected by Replit when deployed |
| `ISSUER_URL` | optional | Defaults to `https://replit.com/oidc` |
| `OPENAI_API_KEY` | optional | Only for AI scenario generation in admin |
| `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | optional | For push notifications. Generate with `npx web-push generate-vapid-keys` |

⚠️ **Do NOT set `DEV_AUTH_BYPASS`.** The server fail-fasts at startup if it
sees `DEV_AUTH_BYPASS=true` with `NODE_ENV=production`. This is intentional —
that flag bypasses all authentication and would expose the app.

## What `.replit` configures

```toml
[deployment]
deploymentTarget = "autoscale"
build = ["npm", "run", "build"]
run  = ["node", "./dist/index.cjs"]
```

- **Build**: `npm run build` runs Vite (client → `dist/public/`) then esbuild
  bundles the server into `dist/index.cjs` (~1.5 MB).
- **Run**: Node starts the bundled CJS server.

## ⚠️ Autoscale vs. Reserved VM — read this

The current config uses `deploymentTarget = "autoscale"`. That's fine for the
Daily Drop, leaderboards, community, and most of the app. **It's not great for
co-op multiplayer**, which uses WebSockets — autoscale instances can be killed
mid-session, dropping live connections.

**If co-op needs to work reliably for your demo**, switch to a Reserved VM:

```toml
[deployment]
deploymentTarget = "vm"   # was "autoscale"
build = ["npm", "run", "build"]
run  = ["node", "./dist/index.cjs"]
```

Reserved VM costs more but holds WebSocket connections for as long as players
are in a session. If co-op is just a "look, this exists" demo and you don't
expect users to actually start sessions, autoscale is fine.

## Database setup

The Neon DB already has all tables migrated, including the `is_admin` column
added in Phase 1. If you spin up a new Neon database for the deploy:

```bash
# locally, against the new DATABASE_URL:
npm run db:push
```

That applies the full schema. Drizzle will prompt to confirm — say yes.

## What changed since the last deploy

The Phase 1-3 audit added several production-hardening changes that affect
deploy behavior:

- **Strict prod auth guard** — `DEV_AUTH_BYPASS=true` + `NODE_ENV=production`
  → server refuses to start. This is correct.
- **Trust proxy = 1** — `req.ip` now reflects the real client IP behind the
  Replit edge proxy. Required for the IP-based rate limiting.
- **CSP + HSTS headers** — applied automatically when `NODE_ENV=production`.
- **Session cookie** — `secure: true` in production. Replit Deploy serves
  HTTPS, so cookies will set fine. (If you ever deploy somewhere HTTP-only,
  cookies won't set and login will silently fail.)
- **`is_admin` column** — new on `lifestyle_users`. Real admins must have
  `is_admin = true` in the DB. To grant yourself admin:
  ```sql
  UPDATE lifestyle_users SET is_admin = true WHERE id = '<your-replit-sub>';
  ```

## Verifying the deploy

After deploy completes, smoke-check:

```bash
# Replace YOUR-DEPLOY-URL with the URL Replit gave you
curl -i https://YOUR-DEPLOY-URL/api/daily-stats   # expect 200 with JSON
curl -i https://YOUR-DEPLOY-URL/api/user          # expect 401 Unauthorized
curl -i https://YOUR-DEPLOY-URL/                  # expect 200 with HTML
```

Then open the URL in a browser and click "Log in with Replit". The OIDC
round-trip uses `REPL_ID` to identify the app — if it 500s, the most common
cause is `REPL_ID` not being set in Secrets.

## Build smoke test (run locally before pushing if you're paranoid)

```bash
npm run build                          # produces dist/index.cjs + dist/public/
DEV_AUTH_BYPASS= NODE_ENV=production PORT=5099 npm start
# in another terminal:
curl -i http://localhost:5099/api/daily-stats   # expect 200
```

This won't test OIDC (no real Replit auth available locally), but it catches
build failures, DB connection issues, and the dev-bypass guard tripping.

## Rolling back

Replit Deploy keeps the previous deployment around. If a deploy is bad, hit
"Rollback" in the Deploy panel. Schema migrations (like `is_admin`) are
forward-compatible — the previous server version just ignores the new column.
