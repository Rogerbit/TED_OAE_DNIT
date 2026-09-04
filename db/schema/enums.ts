import { pgEnum } from "drizzle-orm/pg-core";

// Fixed PT-BR vocabularies mandated by the project's governance rules.
// Never add "aggregated" or "weighted" values here — percentages/status only
// exist at Atividade/Produto level, never at Meta/Ação/TED level.

export const statusAtividadeEnum = pgEnum("status_atividade", [
  "Não iniciada",
  "Em execução",
  "Concluída",
  "Suspensa",
]);

export const statusProdutoEnum = pgEnum("status_produto", [
  "Não iniciado",
  "Em desenvolvimento",
  "Concluído",
]);

// Semáforo is a governance judgment set by a person, never auto-derived
// purely from dates or percentages.
export const semaforoEnum = pgEnum("semaforo", [
  "Regular",
  "Atenção",
  "Crítico",
  "Aguardando condição-decisão",
]);

export const statusPendenciaEnum = pgEnum("status_pendencia", [
  "Aberta",
  "Em tratamento",
  "Aguardando DNIT",
  "Resolvida",
  "Encerrada",
]);

export const statusCondicionanteEnum = pgEnum("status_condicionante", [
  "Ativa",
  "Em atendimento",
  "Atendida",
  "Encerrada",
]);

export const statusRelatorioEnum = pgEnum("status_relatorio", [
  "Planejado",
  "Entregue",
  "Fechado",
]);

export const statusCicloEnum = pgEnum("status_ciclo", ["Aberto", "Fechado"]);

// Fixed catalog of Relatórios Gerenciais — the TED has exactly R1..R15, never
// an arbitrary free-text code.
export const relatorioCodigoEnum = pgEnum("relatorio_codigo", [
  "R1",
  "R2",
  "R3",
  "R4",
  "R5",
  "R6",
  "R7",
  "R8",
  "R9",
  "R10",
  "R11",
  "R12",
  "R13",
  "R14",
  "R15",
]);
