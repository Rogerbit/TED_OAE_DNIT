// One-time seed of generic placeholder "Responsáveis" so the "Registrado
// por" picker has options. Replace with real names/emails later by editing
// the `responsaveis` table directly -- no code depends on these specific
// rows.
import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. See .env.local.example.");
}

const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

const PLACEHOLDERS = [
  { nome: "Equipe LabTrans", papel: "LabTrans" },
  { nome: "Fiscal DNIT", papel: "DNIT" },
];

async function main() {
  const existing = await db.select().from(schema.responsaveis);
  if (existing.length > 0) {
    console.log(`Já existem ${existing.length} responsável(is) cadastrado(s) -- nada a fazer.`);
    return;
  }
  const inserted = await db.insert(schema.responsaveis).values(PLACEHOLDERS).returning();
  console.log(`Inseridos ${inserted.length} responsáveis placeholder:`, inserted.map((r) => r.nome));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
