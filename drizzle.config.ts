import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// Migrations run over the direct/session connection (port 5432), not the
// transaction pooler (port 6543) that the app uses at runtime -- DDL and
// drizzle-kit's introspection queries are unreliable through transaction
// pooling.
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error("DIRECT_URL (or DATABASE_URL) is not set. See .env.local.example.");
}

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});
