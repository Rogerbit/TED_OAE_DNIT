import { boolean, date, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { acoes, metas, responsaveis } from "./core";
import { semaforoEnum, statusAtividadeEnum } from "./enums";

export const atividades = pgTable("atividades", {
  id: text("id").primaryKey(),
  acaoId: text("acao_id")
    .notNull()
    .references(() => acoes.id),
  metaId: text("meta_id")
    .notNull()
    .references(() => metas.id),
  descricao: text("descricao").notNull(),
  inicioPrevisto: date("inicio_previsto"),
  fimPrevisto: date("fim_previsto"),
  condicional: boolean("condicional").default(false),
  origem: text("origem"),
}).enableRLS();

// One row per Atividade: the current status/percentual/semáforo, kept as a
// denormalized "latest known state" for fast list reads. Every write to this
// table happens transactionally alongside an insert into
// acompanhamentos_atividades (the audit trail) — never edited in isolation.
// percentualAtual/statusAtual are nullable to distinguish "Não informado"
// from an explicit 0.
export const atividadesEstadoAtual = pgTable("atividades_estado_atual", {
  atividadeId: text("atividade_id")
    .primaryKey()
    .references(() => atividades.id),
  statusAtual: statusAtividadeEnum("status_atual"),
  percentualAtual: numeric("percentual_atual", { precision: 5, scale: 2 }),
  semaforoAtual: semaforoEnum("semaforo_atual"),
  semaforoJustificativa: text("semaforo_justificativa"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).defaultNow(),
  atualizadoPor: uuid("atualizado_por").references(() => responsaveis.id),
}).enableRLS();

// Append-only audit trail (rule: every value change needs who/when/before/after
// and a justification when a percentual decreases). Never updated or deleted.
export const acompanhamentosAtividades = pgTable("acompanhamentos_atividades", {
  id: uuid("id").primaryKey().defaultRandom(),
  atividadeId: text("atividade_id")
    .notNull()
    .references(() => atividades.id),
  dataRegistro: timestamp("data_registro", { withTimezone: true }).defaultNow(),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  percentualAnterior: numeric("percentual_anterior", { precision: 5, scale: 2 }),
  percentualAtual: numeric("percentual_atual", { precision: 5, scale: 2 }),
  statusAnterior: statusAtividadeEnum("status_anterior"),
  statusAtual: statusAtividadeEnum("status_atual"),
  semaforoAnterior: semaforoEnum("semaforo_anterior"),
  semaforoAtual: semaforoEnum("semaforo_atual"),
  justificativa: text("justificativa"),
  origem: text("origem"),
}).enableRLS();
