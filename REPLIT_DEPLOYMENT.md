# 🚀 Replit Deployment - Quick Fix Guide

## ✅ Issue Fixed!

The crash with `.env: not found` has been resolved by updating the npm scripts.

### What Was Changed

All scripts now use `-r dotenv/config` instead of `--env-file=.env`:

```json
{
  "dev": "NODE_ENV=development tsx -r dotenv/config server/index.ts"
}
```

This is compatible with both local development and Replit environments.

## 🔧 Quick Setup Steps for Replit

### 1. Set Environment Variables

**In Replit, click the 🔒 Secrets tab and add:**

```
DATABASE_URL = your_postgres_connection_string
```

Example:
```
DATABASE_URL = postgresql://user:pass@host.neon.tech/dbname?sslmode=require
```

### 2. Get a Free PostgreSQL Database

**Recommended: [Neon](https://neon.tech)** (Free, serverless PostgreSQL)
- Sign up at neon.tech
- Create a project
- Copy the connection string
- Paste into Replit Secrets

### 3. Initialize the Database

```bash
npm install
npm run db:push -- --force
```

### 4. Run the App

```bash
npm run dev
```

Or just click the **Run** button in Replit!

## 📝 Create .replit File

Add this file to your project root for automatic configuration:

```toml
run = "npm run dev"
hidden = [".config", "node_modules", ".env", "dist"]

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npm run build && npm start"]

[[ports]]
localPort = 5000
externalPort = 80
```

## 🐛 Troubleshooting

### Still getting "not found" errors?
```bash
# Make sure dotenv is installed
npm install dotenv

# Verify .env file exists (or use Replit Secrets)
ls -la .env
```

### Database connection errors?
- Check that `DATABASE_URL` is set in Replit Secrets
- Verify the database allows external connections
- Ensure the connection string includes `?sslmode=require`

### Port already in use?
```bash
killall node
npm run dev
```

## ✨ That's It!

Your app should now run successfully on Replit. The scripts have been updated to work seamlessly in both local and Replit environments.
