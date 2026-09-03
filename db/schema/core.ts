import { boolean, date, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// A single TED (Termo de Execução Descentralizada). Kept as its own table,
// rather than a hardcoded constant, so the schema does not need to change if
// this instance ever needs to track more than one TED.
export const ted = pgTable("ted", {
  id: text("id").primaryKey(),
  numero: text("numero").notNull(),
  objeto: text("objeto"),
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
});

export const acoes = pgTable("acoes", {
  id: text("id").primaryKey(),
  tedId: text("ted_id")
    .notNull()
    .references(() => ted.id),
  titulo: text("titulo").notNull(),
  origem: text("origem"),
  estado: text("estado"),
});

export const metas = pgTable("metas", {
  id: text("id").primaryKey(),
  acaoId: text("acao_id")
    .notNull()
    .references(() => acoes.id),
  codigo: text("codigo").notNull(),
  descricao: text("descricao"),
  origem: text("origem"),
});

export const responsaveis = pgTable("responsaveis", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  email: text("email"),
  papel: text("papel"),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
});

export const responsabilidadeAcao = pgTable("responsabilidade_acao", {
  id: uuid("id").primaryKey().defaultRandom(),
  acaoId: text("acao_id")
    .notNull()
    .references(() => acoes.id),
  responsavelId: uuid("responsavel_id")
    .notNull()
    .references(() => responsaveis.id),
  papel: text("papel"),
  ativo: boolean("ativo").default(true),
});
