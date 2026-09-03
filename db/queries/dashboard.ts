import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "../client";
import {
  acoes,
  atividades,
  atividadesEstadoAtual,
  metas,
  ocorrenciasProdutos,
  orcamento,
  produtos,
  produtosEstadoAtual,
  repasses,
} from "../schema";

export async function listAcoes() {
  return db.select().from(acoes).orderBy(asc(acoes.id));
}

export async function listMetas() {
  return db.select().from(metas).orderBy(asc(metas.id));
}

export async function listAtividadesComEstado() {
  return db
    .select({
      id: atividades.id,
      acaoId: atividades.acaoId,
      metaId: atividades.metaId,
      descricao: atividades.descricao,
      inicioPrevisto: atividades.inicioPrevisto,
      fimPrevisto: atividades.fimPrevisto,
      condicional: atividades.condicional,
      statusAtual: atividadesEstadoAtual.statusAtual,
      percentualAtual: atividadesEstadoAtual.percentualAtual,
      semaforoAtual: atividadesEstadoAtual.semaforoAtual,
    })
    .from(atividades)
    .leftJoin(atividadesEstadoAtual, eq(atividadesEstadoAtual.atividadeId, atividades.id))
    .orderBy(asc(atividades.id));
}

export async function listProdutosComEstado() {
  return db
    .select({
      id: produtos.id,
      acaoId: produtos.acaoId,
      metaId: produtos.metaId,
      codigo: produtos.codigo,
      descricao: produtos.descricao,
      ocorrenciaPrevistaNumero: produtos.ocorrenciaPrevistaNumero,
      entregaPrevista: produtos.entregaPrevista,
      condicional: produtos.condicional,
      statusAtual: produtosEstadoAtual.statusAtual,
      percentualAtual: produtosEstadoAtual.percentualAtual,
      semaforoAtual: produtosEstadoAtual.semaforoAtual,
    })
    .from(produtos)
    .leftJoin(produtosEstadoAtual, eq(produtosEstadoAtual.produtoId, produtos.id))
    .orderBy(asc(produtos.id));
}

export async function listOcorrenciasProdutos() {
  return db.select().from(ocorrenciasProdutos);
}

export async function listOrcamento() {
  return db.select().from(orcamento).orderBy(asc(orcamento.id));
}

export async function listRepasses() {
  return db.select().from(repasses).orderBy(asc(repasses.parcelaNumero));
}
