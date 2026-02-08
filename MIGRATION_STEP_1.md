# Step 1: Database Schema & Connection Setup ✅

## What Was Done

### 1. Created Comprehensive Database Schema
- **File**: `shared/models/db-schema.ts`
- **Contains**: All Drizzle ORM table definitions for:
  - ✅ User profiles and game state
  - ✅ Daily drops and scenarios
  - ✅ Leagues and league members
  - ✅ Challenges
  - ✅ Community scenarios, comments, and votes
  - ✅ Admin scenarios and moderation
  - ✅ Push notifications
  - ✅ Co-op game sessions

### 2. Updated Database Connection
- **File**: `server/db.ts`
- **Changes**:
  - ✅ Imports both auth schema (required for Replit Auth) and new app schema
  - ✅ Added connection pooling for better performance (max 20 connections)
  - ✅ Configured timeouts for reliability

### 3. Updated Drizzle Configuration
- **File**: `drizzle.config.ts`
- **Changes**:
  - ✅ Points to both schema files
  - ✅ Enabled verbose mode for better debugging
  - ✅ Enabled strict mode for type safety

---

## How to Test This Step

### Prerequisites
You need a PostgreSQL database. You have two options:

#### Option A: Use Replit Database (Easiest)
1. Your Replit project should automatically provision a database
2. The `DATABASE_URL` environment variable should already be set

#### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb lifestyle_tracker`
3. Set environment variable:
   ```bash
   export DATABASE_URL="postgresql://localhost:5432/lifestyle_tracker"
   ```

### Step-by-Step Testing

#### 1. Generate Migration Files
```bash
npm run db:push
```

This will:
- Connect to your database
- Create all tables based on the schema
- Show you what tables were created

**Expected Output**:
```
✓ Pulling schema from database...
✓ Generating migrations...
✓ Created tables:
  - lifestyle_users
  - daily_drops
  - leagues
  - league_members
  - challenges
  - community_scenarios
  - community_comments
  - community_votes
  - admin_scenarios
  - moderators
  - banned_users
  - push_subscriptions
  - coop_sessions
```

#### 2. Verify Database Connection
You can verify the connection by running:
```bash
npm run check
```

This will check for TypeScript errors in the schema files.

#### 3. Inspect the Database (Optional)
If you want to see the tables created, you can:

**Using psql (CLI)**:
```bash
psql $DATABASE_URL
\dt  # List all tables
\d lifestyle_users  # Describe the users table
```

**Using a GUI tool**:
- pgAdmin
- DBeaver
- TablePlus
- Replit Database UI

---

## What Tables Were Created

| Table Name | Purpose | Key Columns |
|------------|---------|-------------|
| `lifestyle_users` | Main user profiles and game state | id, username, streak, moneyHealth |
| `daily_drops` | Daily scenario sets | id, dropNumber, date, scenarios |
| `leagues` | Friend leagues/competitions | id, name, inviteCode |
| `league_members` | League membership | leagueId, userId, weeklyScore |
| `challenges` | 1v1 challenges between users | id, challengerId, challengeeId, status |
| `community_scenarios` | User-submitted scenarios | id, authorId, title, context |
| `community_comments` | Comments on scenarios | id, scenarioId, authorId, content |
| `community_votes` | Upvotes/downvotes | id, userId, scenarioId/commentId |
| `admin_scenarios` | Admin-created scenarios | id, title, status, publishDate |
| `moderators` | User moderation access | userId, assignedBy |
| `banned_users` | Banned user list | userId, reason, bannedBy |
| `push_subscriptions` | Web push notifications | id, userId, endpoint |
| `coop_sessions` | Real-time co-op games | id, code, hostId, guestId |

---

## Database Schema Highlights

### Indexes for Performance
- Username lookups (unique index)
- Referral code lookups (unique index)
- Money health (for leaderboard queries)
- Date-based queries for daily drops
- League invite codes
- All foreign keys

### Data Integrity
- Foreign key constraints with cascade deletes
- Unique constraints on usernames, invite codes, referral codes
- JSON validation for complex data types
- Timestamps for all records

### Scalability Features
- Connection pooling (20 max connections)
- Optimized indexes
- JSON columns for flexible data
- Proper data types (integer, varchar, text, timestamp)

---

## Next Steps

Once you've verified that:
- ✅ `npm run db:push` completes successfully
- ✅ All tables are created in your database
- ✅ No TypeScript errors with `npm run check`

We can move to **Step 2**: Creating the PostgreSQL storage implementation that will actually use these tables!

---

## Troubleshooting

### Error: "DATABASE_URL must be set"
**Solution**: Set your database URL:
```bash
export DATABASE_URL="postgresql://user:password@host:5432/database"
```

### Error: "database does not exist"
**Solution**: Create the database first:
```bash
createdb lifestyle_tracker
```

### Error: "permission denied"
**Solution**: Check your database user has CREATE privileges:
```sql
GRANT CREATE ON DATABASE lifestyle_tracker TO your_user;
```

### Tables not showing up
**Solution**: Make sure you ran `npm run db:push` and check for error messages.

---

## Files Changed in This Step

```
✅ NEW: shared/models/db-schema.ts (Complete database schema)
✅ NEW: MIGRATION_STEP_1.md (This file)
✅ MODIFIED: server/db.ts (Updated connection with pooling)
✅ MODIFIED: drizzle.config.ts (Updated schema paths)
```

---

Ready to test? Run `npm run db:push` and let me know the results! 🚀
