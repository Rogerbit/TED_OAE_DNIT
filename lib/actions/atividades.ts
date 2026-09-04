"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { acompanhamentosAtividades, atividadesEstadoAtual } from "@/db/schema";
import { assertJustificativaOnDecrease, normalizePercent } from "@/lib/validation/acompanhamento";

export interface AcompanhamentoAtividadeInput {
  atividadeId: string;
  status: string | null;
  percentual: string | number | null;
  justificativa?: string | null;
  registradoPor?: string | null;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registrarAcompanhamentoAtividade(
  input: AcompanhamentoAtividadeInput,
): Promise<ActionResult> {
  try {
    const percentual = normalizePercent(input.percentual);

    const [estadoAtual] = await db
      .select()
      .from(atividadesEstadoAtual)
      .where(eq(atividadesEstadoAtual.atividadeId, input.atividadeId));

    const percentualAnterior = estadoAtual?.percentualAtual ? Number(estadoAtual.percentualAtual) : null;
    assertJustificativaOnDecrease(percentualAnterior, percentual, input.justificativa);

    await db.transaction(async (tx) => {
      await tx.insert(acompanhamentosAtividades).values({
        atividadeId: input.atividadeId,
        registradoPor: input.registradoPor || null,
        percentualAnterior: percentualAnterior !== null ? String(percentualAnterior) : null,
        percentualAtual: percentual !== null ? String(percentual) : null,
        statusAnterior: estadoAtual?.statusAtual ?? null,
        statusAtual: input.status as (typeof atividadesEstadoAtual.$inferInsert)["statusAtual"],
        semaforoAnterior: estadoAtual?.semaforoAtual ?? null,
        semaforoAtual: estadoAtual?.semaforoAtual ?? null,
        justificativa: input.justificativa || null,
        origem: "ui",
      });

      await tx
        .insert(atividadesEstadoAtual)
        .values({
          atividadeId: input.atividadeId,
          statusAtual: input.status as (typeof atividadesEstadoAtual.$inferInsert)["statusAtual"],
          percentualAtual: percentual !== null ? String(percentual) : null,
          atualizadoPor: input.registradoPor || null,
        })
        .onConflictDoUpdate({
          target: atividadesEstadoAtual.atividadeId,
          set: {
            statusAtual: input.status as (typeof atividadesEstadoAtual.$inferInsert)["statusAtual"],
            percentualAtual: percentual !== null ? String(percentual) : null,
            atualizadoPor: input.registradoPor || null,
            atualizadoEm: new Date(),
          },
        });
    });

    revalidatePath("/atividades");
    revalidatePath("/visao-executiva");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

// Semáforo is a separate governance judgment (rule: never auto-derived from
// dates/percentages) -- kept as its own action so it's always a deliberate,
// justified call rather than a side effect of a progress update.
export async function atualizarSemaforoAtividade(input: {
  atividadeId: string;
  semaforo: string;
  justificativa: string;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    if (!String(input.justificativa ?? "").trim()) {
      throw new Error("Justificativa é obrigatória para definir o semáforo.");
    }

    const [estadoAtual] = await db
      .select()
      .from(atividadesEstadoAtual)
      .where(eq(atividadesEstadoAtual.atividadeId, input.atividadeId));

    await db.transaction(async (tx) => {
      await tx.insert(acompanhamentosAtividades).values({
        atividadeId: input.atividadeId,
        registradoPor: input.registradoPor || null,
        percentualAnterior: estadoAtual?.percentualAtual ?? null,
        percentualAtual: estadoAtual?.percentualAtual ?? null,
        statusAnterior: estadoAtual?.statusAtual ?? null,
        statusAtual: estadoAtual?.statusAtual ?? null,
        semaforoAnterior: estadoAtual?.semaforoAtual ?? null,
        semaforoAtual: input.semaforo as (typeof atividadesEstadoAtual.$inferInsert)["semaforoAtual"],
        justificativa: input.justificativa,
        origem: "ui-semaforo",
      });

      await tx
        .update(atividadesEstadoAtual)
        .set({
          semaforoAtual: input.semaforo as (typeof atividadesEstadoAtual.$inferInsert)["semaforoAtual"],
          semaforoJustificativa: input.justificativa,
          atualizadoPor: input.registradoPor || null,
          atualizadoEm: new Date(),
        })
        .where(eq(atividadesEstadoAtual.atividadeId, input.atividadeId));
    });

    revalidatePath("/atividades");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function listarHistoricoAtividade(atividadeId: string) {
  return db
    .select()
    .from(acompanhamentosAtividades)
    .where(eq(acompanhamentosAtividades.atividadeId, atividadeId))
    .orderBy(desc(acompanhamentosAtividades.dataRegistro));
}
