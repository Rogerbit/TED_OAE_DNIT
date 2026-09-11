import { date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { acoes, metas, responsaveis } from "./core";
import { statusCondicionanteEnum, statusPendenciaEnum } from "./enums";

// Pendências/Condicionantes are persistent, cross-cycle issue-tracking
// entities — never derived automatically and never limited to a single
// governance cycle. All link columns to Atividade/Produto/Ocorrência/Entrega
// are nullable because a pendência can attach to any level of the hierarchy.
export const pendencias = pgTable("pendencias", {
  id: uuid("id").primaryKey().defaultRandom(),
  acaoId: text("acao_id").references(() => acoes.id),
  metaId: text("meta_id").references(() => metas.id),
  atividadeId: text("atividade_id"),
  produtoId: text("produto_id"),
  ocorrenciaId: text("ocorrencia_id"),
  entregaVersaoId: uuid("entrega_versao_id"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  statusAtual: statusPendenciaEnum("status_atual").notNull().default("Aberta"),
  responsavelAcaoId: uuid("responsavel_acao_id").references(() => responsaveis.id),
  responsavelRegistroId: uuid("responsavel_registro_id").references(() => responsaveis.id),
  responsavelAcompanhamentoId: uuid("responsavel_acompanhamento_id").references(
    () => responsaveis.id,
  ),
  prazo: date("prazo"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
  criadoPor: uuid("criado_por").references(() => responsaveis.id),
}).enableRLS();

export const historicoPendencias = pgTable("historico_pendencias", {
  id: uuid("id").primaryKey().defaultRandom(),
  pendenciaId: uuid("pendencia_id")
    .notNull()
    .references(() => pendencias.id),
  registradoEm: timestamp("registrado_em", { withTimezone: true }).defaultNow(),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  statusAnterior: statusPendenciaEnum("status_anterior"),
  statusNovo: statusPendenciaEnum("status_novo"),
  descricao: text("descricao"),
  justificativa: text("justificativa"),
  prazo: date("prazo"),
  evidenciaId: uuid("evidencia_id"),
}).enableRLS();

export const condicionantes = pgTable("condicionantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  acaoId: text("acao_id").references(() => acoes.id),
  metaId: text("meta_id").references(() => metas.id),
  atividadeId: text("atividade_id"),
  produtoId: text("produto_id"),
  ocorrenciaId: text("ocorrencia_id"),
  entregaVersaoId: uuid("entrega_versao_id"),
  titulo: text("titulo").notNull(),
  descricao: text("descricao"),
  statusAtual: statusCondicionanteEnum("status_atual").notNull().default("Ativa"),
  responsavelId: uuid("responsavel_id").references(() => responsaveis.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
  criadoPor: uuid("criado_por").references(() => responsaveis.id),
}).enableRLS();

export const historicoCondicionantes = pgTable("historico_condicionantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  condicionanteId: uuid("condicionante_id")
    .notNull()
    .references(() => condicionantes.id),
  registradoEm: timestamp("registrado_em", { withTimezone: true }).defaultNow(),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  statusAnterior: statusCondicionanteEnum("status_anterior"),
  statusNovo: statusCondicionanteEnum("status_novo"),
  descricao: text("descricao"),
  justificativa: text("justificativa"),
  evidenciaId: uuid("evidencia_id"),
}).enableRLS();
