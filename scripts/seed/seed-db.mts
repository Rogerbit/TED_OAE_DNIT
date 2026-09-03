// ETL step 2/2: reads scripts/seed/data/normalized.json (produced by
// extract-excel.mts) and inserts it into Postgres via Drizzle. Meant to be
// run once against a freshly migrated database, not on every deploy.
//
// Baseline acompanhamentos rows are inserted with percentual/status = null
// ("Não informado") -- the workbook itself carries no progress data; real
// progress only starts accumulating once users interact with the live
// system (a later phase, not part of this read-only MVP).
import { config } from "dotenv";
config({ path: ".env.local" });

import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. See .env.local.example.");
}

interface Normalized {
  generatedAt: string;
  source: string;
  ted: { id: string; numero: string; objeto: string };
  acoes: { id: string; titulo: string }[];
  metas: { id: string; acaoId: string; descricao: string }[];
  atividades: {
    id: string;
    acaoId: string;
    metaId: string;
    descricao: string;
    inicioPrevisto: string;
    fimPrevisto: string;
    condicional: boolean;
  }[];
  produtos: {
    id: string;
    codigo: string;
    ocorrenciaPrevistaNumero: number;
    acaoId: string;
    metaId: string;
    descricao: string;
    entregaPrevista: string;
    condicional: boolean;
  }[];
  ocorrenciasProdutos: { id: string; produtoId: string; numero: number; dataPrevista: string }[];
  orcamento: {
    id: string;
    escopo: string;
    rubrica: string;
    item: string;
    referencia: string;
    valorAcao1: number;
    valorAcao2: number;
    valorAcao3: number;
    valorPlanejado: number;
  }[];
  repasses: { id: string; parcelaNumero: number; marco: string; valorPlanejado: number }[];
  disbursementTotal: number;
}

const normalizedPath = path.join(__dirname, "data", "normalized.json");
const normalized: Normalized = JSON.parse(await fs.readFile(normalizedPath, "utf8"));

// Guard against a corrupted/re-cut workbook silently changing the known
// financial baseline.
const repassesSum = normalized.repasses.reduce((sum, r) => sum + r.valorPlanejado, 0);
const EXPECTED_TOTAL = 31_586_358.9;
if (Math.abs(repassesSum - EXPECTED_TOTAL) > 1) {
  throw new Error(
    `Repasses sum R$ ${repassesSum.toFixed(2)} does not match expected R$ ${EXPECTED_TOTAL.toFixed(2)} -- aborting seed.`,
  );
}
if (normalized.repasses.length !== 9) {
  throw new Error(`Expected 9 repasses (installments), got ${normalized.repasses.length} -- aborting seed.`);
}

const client = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

async function main() {
  console.log("Seeding database from", normalizedPath);

  await db.insert(schema.ted).values(normalized.ted).onConflictDoNothing();

  await db
    .insert(schema.acoes)
    .values(normalized.acoes.map((a) => ({ id: a.id, tedId: normalized.ted.id, titulo: a.titulo })))
    .onConflictDoNothing();

  await db
    .insert(schema.metas)
    .values(normalized.metas.map((m) => ({ id: m.id, acaoId: m.acaoId, codigo: m.id, descricao: m.descricao })))
    .onConflictDoNothing();

  await db.insert(schema.atividades).values(normalized.atividades).onConflictDoNothing();

  await db
    .insert(schema.atividadesEstadoAtual)
    .values(
      normalized.atividades.map((a) => ({
        atividadeId: a.id,
        statusAtual: null,
        percentualAtual: null,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.acompanhamentosAtividades)
    .values(
      normalized.atividades.map((a) => ({
        atividadeId: a.id,
        dataRegistro: new Date(normalized.generatedAt),
        percentualAnterior: null,
        percentualAtual: null,
        statusAnterior: null,
        statusAtual: null,
        origem: "seed-inicial",
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.produtos)
    .values(
      normalized.produtos.map((p) => ({
        id: p.id,
        acaoId: p.acaoId,
        metaId: p.metaId,
        codigo: p.codigo,
        descricao: p.descricao,
        ocorrenciaPrevistaNumero: p.ocorrenciaPrevistaNumero,
        entregaPrevista: p.entregaPrevista,
        condicional: p.condicional,
      })),
    )
    .onConflictDoNothing();

  await db.insert(schema.ocorrenciasProdutos).values(normalized.ocorrenciasProdutos).onConflictDoNothing();

  await db
    .insert(schema.produtosEstadoAtual)
    .values(
      normalized.produtos.map((p) => ({
        produtoId: p.id,
        statusAtual: null,
        percentualAtual: null,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.acompanhamentosProdutos)
    .values(
      normalized.produtos.map((p) => ({
        produtoId: p.id,
        ocorrenciaId: normalized.ocorrenciasProdutos.find((o) => o.produtoId === p.id)?.id,
        dataRegistro: new Date(normalized.generatedAt),
        percentualAnterior: null,
        percentualAtual: null,
        statusAnterior: null,
        statusAtual: null,
        origem: "seed-inicial",
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.orcamento)
    .values(
      normalized.orcamento.map((o) => ({
        ...o,
        valorAcao1: o.valorAcao1.toString(),
        valorAcao2: o.valorAcao2.toString(),
        valorAcao3: o.valorAcao3.toString(),
        valorPlanejado: o.valorPlanejado.toString(),
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(schema.repasses)
    .values(normalized.repasses.map((r) => ({ ...r, valorPlanejado: r.valorPlanejado.toString() })))
    .onConflictDoNothing();

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
