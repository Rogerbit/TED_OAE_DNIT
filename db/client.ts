import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. See .env.local.example.");
}

// Supabase's pooled (transaction-mode) connection string is designed for
// serverless/edge callers like Vercel Functions, so we disable prepared
// statements as recommended for that mode.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
