import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as authSchema from "@shared/models/auth";
import * as appSchema from "@shared/models/db-schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Combine auth schema (required for Replit Auth) with app schema
const schema = { ...authSchema, ...appSchema };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings for better performance
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

// Export individual schemas for type inference
export { authSchema, appSchema };
