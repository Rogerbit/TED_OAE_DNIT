"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, inArray, max } from "drizzle-orm";
import { db } from "@/db/client";
import {
  acompanhamentosProdutos,
  entregasVersoes,
  evidencias,
  ocorrenciasProdutos,
  produtos,
  produtosEstadoAtual,
} from "@/db/schema";
import { assertJustificativaOnDecrease, normalizePercent } from "@/lib/validation/acompanhamento";
import { uploadEvidencia } from "@/lib/supabase/storage";
import type { ActionResult } from "@/lib/actions/atividades";

export interface AcompanhamentoProdutoInput {
  produtoId: string;
  status: string | null;
  percentual: string | number | null;
  justificativa?: string | null;
  registradoPor?: string | null;
}

export async function registrarAcompanhamentoProduto(input: AcompanhamentoProdutoInput): Promise<ActionResult> {
  try {
    const percentual = normalizePercent(input.percentual);

    const [estadoAtual] = await db
      .select()
      .from(produtosEstadoAtual)
      .where(eq(produtosEstadoAtual.produtoId, input.produtoId));

    const percentualAnterior = estadoAtual?.percentualAtual ? Number(estadoAtual.percentualAtual) : null;
    assertJustificativaOnDecrease(percentualAnterior, percentual, input.justificativa);

    await db.transaction(async (tx) => {
      await tx.insert(acompanhamentosProdutos).values({
        produtoId: input.produtoId,
        registradoPor: input.registradoPor || null,
        percentualAnterior: percentualAnterior !== null ? String(percentualAnterior) : null,
        percentualAtual: percentual !== null ? String(percentual) : null,
        statusAnterior: estadoAtual?.statusAtual ?? null,
        statusAtual: input.status as (typeof produtosEstadoAtual.$inferInsert)["statusAtual"],
        semaforoAnterior: estadoAtual?.semaforoAtual ?? null,
        semaforoAtual: estadoAtual?.semaforoAtual ?? null,
        justificativa: input.justificativa || null,
        origem: "ui",
      });

      await tx
        .insert(produtosEstadoAtual)
        .values({
          produtoId: input.produtoId,
          statusAtual: input.status as (typeof produtosEstadoAtual.$inferInsert)["statusAtual"],
          percentualAtual: percentual !== null ? String(percentual) : null,
          atualizadoPor: input.registradoPor || null,
        })
        .onConflictDoUpdate({
          target: produtosEstadoAtual.produtoId,
          set: {
            statusAtual: input.status as (typeof produtosEstadoAtual.$inferInsert)["statusAtual"],
            percentualAtual: percentual !== null ? String(percentual) : null,
            atualizadoPor: input.registradoPor || null,
            atualizadoEm: new Date(),
          },
        });
    });

    revalidatePath("/produtos");
    revalidatePath("/visao-executiva");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function atualizarSemaforoProduto(input: {
  produtoId: string;
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
      .from(produtosEstadoAtual)
      .where(eq(produtosEstadoAtual.produtoId, input.produtoId));

    await db.transaction(async (tx) => {
      await tx.insert(acompanhamentosProdutos).values({
        produtoId: input.produtoId,
        registradoPor: input.registradoPor || null,
        percentualAnterior: estadoAtual?.percentualAtual ?? null,
        percentualAtual: estadoAtual?.percentualAtual ?? null,
        statusAnterior: estadoAtual?.statusAtual ?? null,
        statusAtual: estadoAtual?.statusAtual ?? null,
        semaforoAnterior: estadoAtual?.semaforoAtual ?? null,
        semaforoAtual: input.semaforo as (typeof produtosEstadoAtual.$inferInsert)["semaforoAtual"],
        justificativa: input.justificativa,
        origem: "ui-semaforo",
      });

      await tx
        .update(produtosEstadoAtual)
        .set({
          semaforoAtual: input.semaforo as (typeof produtosEstadoAtual.$inferInsert)["semaforoAtual"],
          semaforoJustificativa: input.justificativa,
          atualizadoPor: input.registradoPor || null,
          atualizadoEm: new Date(),
        })
        .where(eq(produtosEstadoAtual.produtoId, input.produtoId));
    });

    revalidatePath("/produtos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function listarHistoricoProduto(produtoId: string) {
  return db
    .select()
    .from(acompanhamentosProdutos)
    .where(eq(acompanhamentosProdutos.produtoId, produtoId))
    .orderBy(desc(acompanhamentosProdutos.dataRegistro));
}

export async function listarDetalhesProduto(produtoId: string) {
  const [produto] = await db.select().from(produtos).where(eq(produtos.id, produtoId));
  const ocorrencias = await db
    .select()
    .from(ocorrenciasProdutos)
    .where(eq(ocorrenciasProdutos.produtoId, produtoId))
    .orderBy(ocorrenciasProdutos.numero);
  const versoes = await db
    .select()
    .from(entregasVersoes)
    .where(eq(entregasVersoes.produtoId, produtoId))
    .orderBy(desc(entregasVersoes.criadoEm));
  const versaoIds = versoes.map((v) => v.id);
  const evidenciasList = versaoIds.length
    ? await db.select().from(evidencias).where(inArray(evidencias.entregaVersaoId, versaoIds))
    : [];
  return { produto, ocorrencias, versoes, evidenciasList };
}

export async function criarOcorrenciaProduto(input: {
  produtoId: string;
  numero: number;
  dataPrevista?: string | null;
}): Promise<ActionResult> {
  try {
    const id = `${input.produtoId}-ocorrencia-${input.numero}`;
    await db.insert(ocorrenciasProdutos).values({
      id,
      produtoId: input.produtoId,
      numero: input.numero,
      dataPrevista: input.dataPrevista || null,
      origem: "ui",
    });
    revalidatePath(`/produtos/${input.produtoId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

// A new version is always a new row -- there is no edit/delete path here by
// design (ported invariant: entregas/versões are additive-only).
export async function criarEntregaVersao(input: {
  produtoId: string;
  ocorrenciaId: string;
  dataEntrega?: string | null;
  resumo?: string | null;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ maxVersao: max(entregasVersoes.versaoNumero) })
        .from(entregasVersoes)
        .where(eq(entregasVersoes.ocorrenciaId, input.ocorrenciaId));
      const proximaVersao = (row?.maxVersao ?? 0) + 1;

      await tx.insert(entregasVersoes).values({
        produtoId: input.produtoId,
        ocorrenciaId: input.ocorrenciaId,
        versaoNumero: proximaVersao,
        dataEntrega: input.dataEntrega || null,
        resumo: input.resumo || null,
        registradoPor: input.registradoPor || null,
      });
    });
    revalidatePath(`/produtos/${input.produtoId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

export async function anexarEvidencia(input: {
  produtoId: string;
  entregaVersaoId: string;
  titulo: string;
  referencia?: string | null;
  registradoPor?: string | null;
  arquivo?: File | null;
}): Promise<ActionResult> {
  try {
    let storagePath: string | null = null;
    if (input.arquivo && input.arquivo.size > 0) {
      storagePath = await uploadEvidencia(input.arquivo, input.entregaVersaoId);
    }
    await db.insert(evidencias).values({
      entregaVersaoId: input.entregaVersaoId,
      titulo: input.titulo || "Evidência",
      storagePath,
      referencia: input.referencia || null,
      registradoPor: input.registradoPor || null,
    });
    revalidatePath(`/produtos/${input.produtoId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}
