import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { acoes, metas, responsaveis } from "./core";
import { semaforoEnum, statusProdutoEnum } from "./enums";

export const produtos = pgTable("produtos", {
  id: text("id").primaryKey(),
  acaoId: text("acao_id")
    .notNull()
    .references(() => acoes.id),
  metaId: text("meta_id")
    .notNull()
    .references(() => metas.id),
  codigo: text("codigo").notNull(),
  descricao: text("descricao").notNull(),
  ocorrenciaPrevistaNumero: integer("ocorrencia_prevista_numero").default(1),
  entregaPrevista: date("entrega_prevista"),
  condicional: boolean("condicional").default(false),
  origem: text("origem"),
}).enableRLS();

// Occurrences are explicit, planned instances of a Produto — never
// auto-created by the application.
export const ocorrenciasProdutos = pgTable(
  "ocorrencias_produtos",
  {
    id: text("id").primaryKey(),
    produtoId: text("produto_id")
      .notNull()
      .references(() => produtos.id),
    numero: integer("numero").notNull(),
    dataPrevista: date("data_prevista"),
    origem: text("origem"),
  },
  (table) => [unique().on(table.produtoId, table.numero)],
).enableRLS();

export const produtosEstadoAtual = pgTable("produtos_estado_atual", {
  produtoId: text("produto_id")
    .primaryKey()
    .references(() => produtos.id),
  statusAtual: statusProdutoEnum("status_atual"),
  percentualAtual: numeric("percentual_atual", { precision: 5, scale: 2 }),
  semaforoAtual: semaforoEnum("semaforo_atual"),
  semaforoJustificativa: text("semaforo_justificativa"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow(),
  atualizadoPor: uuid("atualizado_por").references(() => responsaveis.id),
}).enableRLS();

export const acompanhamentosProdutos = pgTable("acompanhamentos_produtos", {
  id: uuid("id").primaryKey().defaultRandom(),
  produtoId: text("produto_id")
    .notNull()
    .references(() => produtos.id),
  ocorrenciaId: text("ocorrencia_id").references(() => ocorrenciasProdutos.id),
  dataRegistro: timestamp("data_registro", { withTimezone: true }).defaultNow(),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  percentualAnterior: numeric("percentual_anterior", { precision: 5, scale: 2 }),
  percentualAtual: numeric("percentual_atual", { precision: 5, scale: 2 }),
  statusAnterior: statusProdutoEnum("status_anterior"),
  statusAtual: statusProdutoEnum("status_atual"),
  semaforoAnterior: semaforoEnum("semaforo_anterior"),
  semaforoAtual: semaforoEnum("semaforo_atual"),
  justificativa: text("justificativa"),
  origem: text("origem"),
}).enableRLS();

// Insert-only: a new version is a new row, never an overwrite of a prior one.
export const entregasVersoes = pgTable(
  "entregas_versoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    produtoId: text("produto_id")
      .notNull()
      .references(() => produtos.id),
    ocorrenciaId: text("ocorrencia_id")
      .notNull()
      .references(() => ocorrenciasProdutos.id),
    versaoNumero: integer("versao_numero").notNull(),
    dataEntrega: date("data_entrega"),
    resumo: text("resumo"),
    registradoPor: uuid("registrado_por").references(() => responsaveis.id),
    criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.ocorrenciaId, table.versaoNumero)],
).enableRLS();

export const evidencias = pgTable("evidencias", {
  id: uuid("id").primaryKey().defaultRandom(),
  entregaVersaoId: uuid("entrega_versao_id").references(() => entregasVersoes.id),
  atividadeId: text("atividade_id"),
  pendenciaId: uuid("pendencia_id"),
  condicionanteId: uuid("condicionante_id"),
  titulo: text("titulo").notNull(),
  storagePath: text("storage_path"),
  referencia: text("referencia"),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
}).enableRLS();
