import { date, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { acoes, responsaveis } from "./core";
import { relatorioCodigoEnum, statusCicloEnum, statusRelatorioEnum } from "./enums";

// Relatórios Gerenciais R1-R15: immutable once `status = 'Fechado'`, enforced
// by a Postgres trigger (see drizzle/0001_relatorio_imutavel.sql) that
// rejects any UPDATE on a row that is already Fechado.
export const relatoriosGerenciais = pgTable("relatorios_gerenciais", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: relatorioCodigoEnum("codigo").notNull().unique(),
  ciclo: text("ciclo"),
  dataPlanejada: date("data_planejada"),
  dataEfetiva: date("data_efetiva"),
  status: statusRelatorioEnum("status").notNull().default("Planejado"),
  referenciaDigital: text("referencia_digital"),
  fechadoEm: timestamp("fechado_em", { withTimezone: true }),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
});

export const relatoriosHistorico = pgTable("relatorios_historico", {
  id: uuid("id").primaryKey().defaultRandom(),
  relatorioId: uuid("relatorio_id")
    .notNull()
    .references(() => relatoriosGerenciais.id),
  evento: text("evento").notNull(), // criado | fechado | reaberto-excepcional
  registradoEm: timestamp("registrado_em", { withTimezone: true }).defaultNow(),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  statusAnterior: statusRelatorioEnum("status_anterior"),
  statusNovo: statusRelatorioEnum("status_novo"),
  referenciaDigital: text("referencia_digital"),
});

export const ciclosGovernanca = pgTable("ciclos_governanca", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull().unique(), // Q01, Q02...
  dataInicio: date("data_inicio"),
  dataFim: date("data_fim"),
  status: statusCicloEnum("status").notNull().default("Aberto"),
});

// Insert-only, one row per cycle-close event: an immutable point-in-time
// copy of the governance state, replacing the old localStorage "close cycle"
// mechanic with a durable, multi-user-consistent record.
export const snapshotsCiclo = pgTable("snapshots_ciclo", {
  id: uuid("id").primaryKey().defaultRandom(),
  cicloId: uuid("ciclo_id")
    .notNull()
    .references(() => ciclosGovernanca.id),
  // Set when this snapshot was produced by closing a specific Relatório
  // Gerencial (the common case) -- nullable because a cycle snapshot could
  // in principle be taken without closing a report.
  relatorioId: uuid("relatorio_id").references(() => relatoriosGerenciais.id),
  geradoEm: timestamp("gerado_em", { withTimezone: true }).defaultNow(),
  geradoPor: uuid("gerado_por").references(() => responsaveis.id),
  payloadJson: jsonb("payload_json"),
  hash: text("hash"),
});

export const fotografiasCiclo = pgTable("fotografias_ciclo", {
  id: uuid("id").primaryKey().defaultRandom(),
  cicloId: uuid("ciclo_id")
    .notNull()
    .references(() => ciclosGovernanca.id),
  atividadeId: text("atividade_id"),
  produtoId: text("produto_id"),
  storagePath: text("storage_path"),
  descricao: text("descricao"),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
});

export const comprovacoesFiscalizacao = pgTable("comprovacoes_fiscalizacao", {
  id: uuid("id").primaryKey().defaultRandom(),
  cicloId: uuid("ciclo_id").references(() => ciclosGovernanca.id),
  acaoId: text("acao_id").references(() => acoes.id),
  tipo: text("tipo"),
  storagePath: text("storage_path"),
  referencia: text("referencia"),
  registradoPor: uuid("registrado_por").references(() => responsaveis.id),
  criadoEm: timestamp("criado_em", { withTimezone: true }).defaultNow(),
});
