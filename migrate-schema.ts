import { Pool } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("🔧 Running database migrations...\n");

    // Add membershipTier column to lifestyle_users
    await client.query(`
      ALTER TABLE "lifestyle_users"
      ADD COLUMN IF NOT EXISTS "membership_tier" varchar(20) DEFAULT 'free' NOT NULL;
    `);
    console.log("✅ Added membership_tier column to lifestyle_users");

    // Add columns to community_comments
    await client.query(`
      ALTER TABLE "community_comments"
      ADD COLUMN IF NOT EXISTS "upvotes" integer DEFAULT 0 NOT NULL;
    `);
    console.log("✅ Added upvotes column to community_comments");

    await client.query(`
      ALTER TABLE "community_comments"
      ADD COLUMN IF NOT EXISTS "downvotes" integer DEFAULT 0 NOT NULL;
    `);
    console.log("✅ Added downvotes column to community_comments");

    // Add columns to community_scenarios
    await client.query(`
      ALTER TABLE "community_scenarios"
      ADD COLUMN IF NOT EXISTS "upvotes" integer DEFAULT 0 NOT NULL;
    `);
    console.log("✅ Added upvotes column to community_scenarios");

    await client.query(`
      ALTER TABLE "community_scenarios"
      ADD COLUMN IF NOT EXISTS "downvotes" integer DEFAULT 0 NOT NULL;
    `);
    console.log("✅ Added downvotes column to community_scenarios");

    await client.query(`
      ALTER TABLE "community_scenarios"
      ADD COLUMN IF NOT EXISTS "comment_count" integer DEFAULT 0 NOT NULL;
    `);
    console.log("✅ Added comment_count column to community_scenarios");

    console.log("\n✨ Migration completed successfully!\n");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
