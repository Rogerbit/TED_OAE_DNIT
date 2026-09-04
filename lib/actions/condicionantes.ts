"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { condicionantes, historicoCondicionantes } from "@/db/schema";
import type { ActionResult } from "@/lib/actions/atividades";

export async function listarCondicionantes() {
  return db.select().from(condicionantes).orderBy(desc(condicionantes.criadoEm));
}

export async function listarHistoricoCondicionante(condicionanteId: string) {
  return db
    .select()
    .from(historicoCondicionantes)
    .where(eq(historicoCondicionantes.condicionanteId, condicionanteId))
    .orderBy(desc(historicoCondicionantes.registradoEm));
}

export async function criarCondicionante(input: {
  titulo?: string | null;
  descricao?: string | null;
  acaoId?: string | null;
  atividadeId?: string | null;
  produtoId?: string | null;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    await db.transaction(async (tx) => {
      const [condicionante] = await tx
        .insert(condicionantes)
        .values({
          titulo: input.titulo?.trim() || "Condicionante sem título",
          descricao: input.descricao || null,
          acaoId: input.acaoId || null,
          atividadeId: input.atividadeId || null,
          produtoId: input.produtoId || null,
          criadoPor: input.registradoPor || null,
        })
        .returning();

      await tx.insert(historicoCondicionantes).values({
        condicionanteId: condicionante.id,
        registradoPor: input.registradoPor || null,
        statusAnterior: null,
        statusNovo: "Ativa",
        descricao: input.descricao || null,
        justificativa: "Criação da condicionante.",
      });
    });
    revalidatePath("/governanca");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function atualizarCondicionante(input: {
  condicionanteId: string;
  status: string;
  descricao?: string | null;
  justificativa?: string | null;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    const [atual] = await db.select().from(condicionantes).where(eq(condicionantes.id, input.condicionanteId));
    if (!atual) throw new Error("Condicionante não encontrada.");

    await db.transaction(async (tx) => {
      await tx
        .update(condicionantes)
        .set({
          statusAtual: input.status as (typeof condicionantes.$inferInsert)["statusAtual"],
          descricao: input.descricao ?? atual.descricao,
        })
        .where(eq(condicionantes.id, input.condicionanteId));

      await tx.insert(historicoCondicionantes).values({
        condicionanteId: input.condicionanteId,
        registradoPor: input.registradoPor || null,
        statusAnterior: atual.statusAtual,
        statusNovo: input.status as (typeof historicoCondicionantes.$inferInsert)["statusNovo"],
        descricao: input.descricao || null,
        justificativa: input.justificativa || null,
      });
    });
    revalidatePath("/governanca");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}
