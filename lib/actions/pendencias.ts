"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { historicoPendencias, pendencias } from "@/db/schema";
import type { ActionResult } from "@/lib/actions/atividades";

export async function listarPendencias() {
  return db.select().from(pendencias).orderBy(desc(pendencias.criadoEm));
}

export async function listarHistoricoPendencia(pendenciaId: string) {
  return db
    .select()
    .from(historicoPendencias)
    .where(eq(historicoPendencias.pendenciaId, pendenciaId))
    .orderBy(desc(historicoPendencias.registradoEm));
}

export async function criarPendencia(input: {
  titulo?: string | null;
  descricao?: string | null;
  acaoId?: string | null;
  atividadeId?: string | null;
  produtoId?: string | null;
  prazo?: string | null;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    await db.transaction(async (tx) => {
      const [pendencia] = await tx
        .insert(pendencias)
        .values({
          titulo: input.titulo?.trim() || "Pendência sem título",
          descricao: input.descricao || null,
          acaoId: input.acaoId || null,
          atividadeId: input.atividadeId || null,
          produtoId: input.produtoId || null,
          prazo: input.prazo || null,
          criadoPor: input.registradoPor || null,
        })
        .returning();

      await tx.insert(historicoPendencias).values({
        pendenciaId: pendencia.id,
        registradoPor: input.registradoPor || null,
        statusAnterior: null,
        statusNovo: "Aberta",
        descricao: input.descricao || null,
        justificativa: "Criação da pendência.",
        prazo: input.prazo || null,
      });
    });
    revalidatePath("/governanca");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function atualizarPendencia(input: {
  pendenciaId: string;
  status: string;
  descricao?: string | null;
  justificativa?: string | null;
  prazo?: string | null;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    const [atual] = await db.select().from(pendencias).where(eq(pendencias.id, input.pendenciaId));
    if (!atual) throw new Error("Pendência não encontrada.");

    await db.transaction(async (tx) => {
      await tx
        .update(pendencias)
        .set({
          statusAtual: input.status as (typeof pendencias.$inferInsert)["statusAtual"],
          descricao: input.descricao ?? atual.descricao,
          prazo: input.prazo ?? atual.prazo,
        })
        .where(eq(pendencias.id, input.pendenciaId));

      await tx.insert(historicoPendencias).values({
        pendenciaId: input.pendenciaId,
        registradoPor: input.registradoPor || null,
        statusAnterior: atual.statusAtual,
        statusNovo: input.status as (typeof historicoPendencias.$inferInsert)["statusNovo"],
        descricao: input.descricao || null,
        justificativa: input.justificativa || null,
        prazo: input.prazo || null,
      });
    });
    revalidatePath("/governanca");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}
