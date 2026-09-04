"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  atividades,
  atividadesEstadoAtual,
  ciclosGovernanca,
  condicionantes,
  pendencias,
  produtos,
  produtosEstadoAtual,
  relatoriosGerenciais,
  relatoriosHistorico,
  snapshotsCiclo,
} from "@/db/schema";
import type { ActionResult } from "@/lib/actions/atividades";

export async function listarRelatorios() {
  return db.select().from(relatoriosGerenciais).orderBy(asc(relatoriosGerenciais.codigo));
}

export async function listarSnapshotsRelatorio(relatorioId: string) {
  return db
    .select()
    .from(snapshotsCiclo)
    .where(eq(snapshotsCiclo.relatorioId, relatorioId))
    .orderBy(desc(snapshotsCiclo.geradoEm));
}

export async function criarRelatorio(input: {
  codigo: string;
  ciclo?: string | null;
  dataPlanejada?: string | null;
}): Promise<ActionResult> {
  try {
    await db.insert(relatoriosGerenciais).values({
      codigo: input.codigo as (typeof relatoriosGerenciais.$inferInsert)["codigo"],
      ciclo: input.ciclo || null,
      dataPlanejada: input.dataPlanejada || null,
    });
    revalidatePath("/governanca");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}

async function montarPayloadCiclo() {
  const atividadesAtuais = await db
    .select({
      id: atividades.id,
      descricao: atividades.descricao,
      status: atividadesEstadoAtual.statusAtual,
      percentual: atividadesEstadoAtual.percentualAtual,
      semaforo: atividadesEstadoAtual.semaforoAtual,
    })
    .from(atividades)
    .leftJoin(atividadesEstadoAtual, eq(atividadesEstadoAtual.atividadeId, atividades.id));

  const produtosAtuais = await db
    .select({
      id: produtos.id,
      descricao: produtos.descricao,
      status: produtosEstadoAtual.statusAtual,
      percentual: produtosEstadoAtual.percentualAtual,
      semaforo: produtosEstadoAtual.semaforoAtual,
    })
    .from(produtos)
    .leftJoin(produtosEstadoAtual, eq(produtosEstadoAtual.produtoId, produtos.id));

  const pendenciasAbertas = await db.select().from(pendencias);
  const condicionantesAtuais = await db.select().from(condicionantes);

  return {
    capturadoEm: new Date().toISOString(),
    atividades: atividadesAtuais,
    produtos: produtosAtuais,
    pendencias: pendenciasAbertas,
    condicionantes: condicionantesAtuais,
  };
}

// Closing a report is the one action that produces an immutable snapshot --
// the DB trigger (drizzle/0002_relatorio_imutavel.sql) is what actually
// prevents any further edits to this row once status = 'Fechado'.
export async function fecharRelatorioGerencial(input: {
  relatorioId: string;
  dataEfetiva?: string | null;
  referenciaDigital?: string | null;
  registradoPor?: string | null;
}): Promise<ActionResult> {
  try {
    const [relatorio] = await db.select().from(relatoriosGerenciais).where(eq(relatoriosGerenciais.id, input.relatorioId));
    if (!relatorio) throw new Error("Relatório não encontrado.");
    if (relatorio.status === "Fechado") throw new Error("Relatório já está fechado e é imutável.");

    const payload = await montarPayloadCiclo();
    const cicloCodigo = relatorio.ciclo || `${relatorio.codigo}-ciclo`;

    await db.transaction(async (tx) => {
      let [ciclo] = await tx.select().from(ciclosGovernanca).where(eq(ciclosGovernanca.codigo, cicloCodigo));
      if (!ciclo) {
        [ciclo] = await tx.insert(ciclosGovernanca).values({ codigo: cicloCodigo }).returning();
      }

      await tx
        .update(relatoriosGerenciais)
        .set({
          status: "Fechado",
          dataEfetiva: input.dataEfetiva || null,
          referenciaDigital: input.referenciaDigital || null,
          fechadoEm: new Date(),
        })
        .where(eq(relatoriosGerenciais.id, input.relatorioId));

      await tx.insert(relatoriosHistorico).values({
        relatorioId: input.relatorioId,
        evento: "fechado",
        registradoPor: input.registradoPor || null,
        statusAnterior: relatorio.status,
        statusNovo: "Fechado",
        referenciaDigital: input.referenciaDigital || null,
      });

      await tx.insert(snapshotsCiclo).values({
        cicloId: ciclo.id,
        relatorioId: input.relatorioId,
        geradoPor: input.registradoPor || null,
        payloadJson: payload,
      });
    });

    revalidatePath("/governanca");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}
