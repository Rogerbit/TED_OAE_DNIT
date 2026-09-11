import { boolean, date, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";

// Budget line items, sourced from the "Consolidado" sheet (rubrica broken
// down across Ação 1/2/3 + total). Deliberately has NO foreign key to
// atividades/produtos — financial tracking stays at the global/rubrica
// level and must never be used as a physical-progress proxy (governance
// rule: financial data restricted to documental budget + global DNIT
// disbursements only).
export const orcamento = pgTable("orcamento", {
  id: text("id").primaryKey(),
  escopo: text("escopo").notNull(),
  rubrica: text("rubrica").notNull(),
  item: text("item").notNull(),
  referencia: text("referencia"),
  quantidade: numeric("quantidade", { precision: 12, scale: 2 }),
  meses: integer("meses"),
  valorAcao1: numeric("valor_acao1", { precision: 14, scale: 2 }),
  valorAcao2: numeric("valor_acao2", { precision: 14, scale: 2 }),
  valorAcao3: numeric("valor_acao3", { precision: 14, scale: 2 }),
  valorPlanejado: numeric("valor_planejado", { precision: 14, scale: 2 }).notNull(),
  condicional: boolean("condicional").default(false),
  revisaoFonte: boolean("revisao_fonte").default(false),
  origem: text("origem"),
}).enableRLS();

// The 9 planned disbursement installments (Parcela 1..9). Global-only, per
// governance rule: never distributed down to individual activities/products.
export const repasses = pgTable("repasses", {
  id: text("id").primaryKey(), // R01..R09
  parcelaNumero: integer("parcela_numero").notNull(),
  marco: text("marco").notNull(), // e.g. "assinatura", "R1"..."R8"
  valorPlanejado: numeric("valor_planejado", { precision: 14, scale: 2 }).notNull(),
  valorRepassado: numeric("valor_repassado", { precision: 14, scale: 2 }).default("0"),
  valorReprogramado: numeric("valor_reprogramado", { precision: 14, scale: 2 }).default("0"),
  dataPrevista: date("data_prevista"),
  dataRealizada: date("data_realizada"),
  status: text("status"),
}).enableRLS();
