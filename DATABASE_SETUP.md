# 🗄️ Database Setup Guide

## Step 1: Create Your `.env` File

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Open `.env` and paste your Replit PostgreSQL URL:**
   ```bash
   DATABASE_URL="your-replit-postgres-url-here"
   ```

   Your `.env` file should look like:
   ```env
   DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
   SESSION_SECRET="your-random-secret"
   NODE_ENV="development"
   ```

   **⚠️ Important:** The `.env` file is already in `.gitignore` so your credentials won't be committed to git.

---

## Step 2: Load Environment Variables

Since you're running locally (not on Replit), you need to load the `.env` file.

**Option A: Use dotenv (Recommended)**

I've already installed `dotenv` for you. Now just run:

```bash
# For development
node --env-file=.env -r dotenv/config --import tsx server/index.ts

# OR use the npm script (I'll update this for you)
npm run dev
```

**Option B: Export manually (temporary)**

```bash
export DATABASE_URL="your-replit-postgres-url"
npm run db:push
```

---

## Step 3: Run Database Migration

Once your `.env` is set up:

```bash
npm run db:push
```

You should see:
```
✓ Pulling schema from database...
✓ Generating migrations...
✓ Successfully pushed schema!
```

---

## 📝 Quick Setup Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Paste your Replit PostgreSQL URL into `.env`
- [ ] Run `npm run db:push`
- [ ] Verify tables were created (13 tables total)
- [ ] Ready for Step 2! 🎉

---

## 🔍 Verify It Worked

After running `npm run db:push`, check that tables exist:

```bash
# If you have psql installed:
psql "$DATABASE_URL" -c "\dt"

# You should see:
# - lifestyle_users
# - daily_drops
# - leagues
# - league_members
# - challenges
# ... and 8 more tables
```

---

## ⚠️ Troubleshooting

### "DATABASE_URL must be set"
**Solution:** Make sure you:
1. Created the `.env` file
2. Added your database URL
3. The URL is on a line starting with `DATABASE_URL=`

### "Connection refused"
**Solution:** Your database might not be accessible from your local machine. Check:
1. The database is running on Replit
2. Firewall settings allow external connections
3. The URL includes `?sslmode=require` at the end

### "SSL connection required"
**Solution:** Add `?sslmode=require` to the end of your DATABASE_URL:
```
DATABASE_URL="postgresql://...?sslmode=require"
```

---

## 🎯 Next Steps

Once you see "Successfully pushed schema!", you're ready to:
1. ✅ Verify tables in your database
2. ✅ Move to Step 2: PostgreSQL Storage Implementation
3. ✅ Test the full migration

Let me know when you're ready to continue! 🚀
