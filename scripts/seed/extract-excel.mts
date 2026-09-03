// ETL step 1/2: reads the source Excel workbook and writes a normalized JSON
// intermediate file (scripts/seed/data/normalized.json). This is the only
// place `xlsx` is imported anywhere in the project — it never ships in the
// deployed Next.js app.
//
// Parsing logic (activity/product date detection via cell fill color,
// Cronograma row-type regexes, Consolidado budget/disbursement slicing) is
// ported from the legacy `ted-oae-bi-web/build_standalone_html.mjs`, which
// is the only place that logic previously existed. One deliberate
// correction: the legacy script hardcoded Ação titles that no longer match
// this workbook (it was written against an earlier revision) — here, titles
// are always read live from the "Cronograma" sheet, the actual source of
// truth, instead of being hardcoded.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import XLSX, { type CellObject } from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_FILE = "BASE_CORRETA_OAE_com_Cronograma_Acao4_FINAL.xlsx";
const sourcePath = path.join(__dirname, "data", SOURCE_FILE);
const outputPath = path.join(__dirname, "data", "normalized.json");

type Row = unknown[];

const wb = XLSX.readFile(sourcePath, { cellDates: true, cellStyles: true });
const cronogramaSheet = wb.Sheets["Cronograma"];
const consolidadoSheet = wb.Sheets["Consolidado"];

if (!cronogramaSheet) throw new Error(`Sheet "Cronograma" not found in ${SOURCE_FILE}`);
if (!consolidadoSheet) throw new Error(`Sheet "Consolidado" not found in ${SOURCE_FILE}`);

const cronogramaRows: Row[] = XLSX.utils.sheet_to_json(cronogramaSheet, {
  header: 1,
  blankrows: false,
  raw: false,
});
const consolidadoRows: Row[] = XLSX.utils.sheet_to_json(consolidadoSheet, {
  header: 1,
  blankrows: false,
  raw: true,
});

// --- Cell-fill-based month detection (ported as-is from build_standalone_html.mjs) ---

function isActivityFill(cell: CellObject | undefined): boolean {
  const style = cell?.s;
  if (!style || style.patternType !== "solid") return false;
  const fill = style.fgColor ?? {};
  return fill.rgb === "D8D8D8" || fill.rgb === "D9D9D9" || (fill.theme === 0 && Number(fill.tint) < -0.1);
}

function isProductMilestone(cell: CellObject | undefined): boolean {
  const style = cell?.s;
  if (!style || style.patternType !== "solid") return false;
  const fill = style.fgColor ?? {};
  return fill.rgb === "000000" || (fill.theme === 1 && fill.rgb === "000000");
}

function dateForCronogramaMonth(monthIndex: number, endOfMonth = false): string {
  const date = new Date(Date.UTC(2026, 8 + monthIndex + (endOfMonth ? 1 : 0), endOfMonth ? 0 : 15));
  return date.toISOString().slice(0, 10);
}

function activityDateRange(sheetRow: number | null): { start: string; end: string } {
  if (sheetRow === null) return { start: "2026-09-15", end: "2031-08-15" };
  const markedMonths: number[] = [];
  for (let column = 2; column < 64; column++) {
    const address = XLSX.utils.encode_cell({ r: sheetRow - 1, c: column });
    if (isActivityFill(cronogramaSheet[address])) markedMonths.push(column - 2);
  }
  if (!markedMonths.length) return { start: "2026-09-15", end: "2031-08-15" };
  return {
    start: dateForCronogramaMonth(Math.min(...markedMonths)),
    end: dateForCronogramaMonth(Math.max(...markedMonths), true),
  };
}

function findCronogramaRow(code: string): number | null {
  const range = XLSX.utils.decode_range(cronogramaSheet["!ref"]!);
  for (let row = range.s.r; row <= range.e.r; row++) {
    const address = XLSX.utils.encode_cell({ r: row, c: 0 });
    if (String(cronogramaSheet[address]?.v ?? "").trim() === code) return row + 1;
  }
  return null;
}

function productDeliveryDates(sheetRow: number | null): string[] {
  if (sheetRow === null) return ["2031-08-31"];
  const markedMonths: number[] = [];
  for (let column = 2; column < 62; column++) {
    const address = XLSX.utils.encode_cell({ r: sheetRow - 1, c: column });
    if (isProductMilestone(cronogramaSheet[address])) markedMonths.push(column - 2);
  }
  if (!markedMonths.length) return ["2031-08-31"];
  return markedMonths.map((monthIndex) => dateForCronogramaMonth(monthIndex, true));
}

// --- Row-type parsing ---

function cleanMeta(text: unknown): string {
  return String(text ?? "").replace(/^Meta\s+[0-9A-Z]+\s*[-—–]\s*/i, "").trim();
}

function parseProductLabel(text: unknown): { code: string; description: string } | null {
  const trimmed = String(text ?? "").trim();
  if (!trimmed.toLowerCase().startsWith("produto")) return null;

  const codeMatch = trimmed.match(/^Produto\s+([1-3][A-Z]+[0-9]*(?:\.[0-9]+)?)/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : "UNKNOWN";

  const descMatch = trimmed.match(/^Produto\s+[1-3][A-Z]+[0-9]*(?:\.[0-9]+)?\s*[-—–]?\s*(.+)?$/i);
  const description = descMatch?.[1] ?? trimmed.replace(/^Produto\s+/i, "");

  return { code, description };
}

interface ParsedAction {
  id: string;
  titulo: string;
}
interface ParsedMeta {
  id: string;
  acaoId: string;
  descricao: string;
}
interface ParsedAtividade {
  id: string;
  acaoId: string;
  metaId: string;
  descricao: string;
  inicioPrevisto: string;
  fimPrevisto: string;
  condicional: boolean;
}
interface ParsedProduto {
  id: string;
  codigo: string;
  ocorrenciaPrevistaNumero: number;
  acaoId: string;
  metaId: string;
  descricao: string;
  entregaPrevista: string;
  condicional: boolean;
}

function parseCronograma(rows: Row[]) {
  const actions: ParsedAction[] = [];
  const metas: ParsedMeta[] = [];
  const activities: ParsedAtividade[] = [];
  const products: ParsedProduto[] = [];

  let currentAction: string | null = null;
  let currentActionTitle = "";
  let currentMeta = "";
  let productIndex = 0;

  for (const row of rows) {
    const col0 = String(row[0] ?? "").trim();
    const col1 = String(row[1] ?? "").trim();

    // Ação header row.
    if (/^0?[1-3]$/.test(col0) && col1) {
      currentAction = String(Number(col0));
      currentActionTitle = col1;
      actions.push({ id: currentAction, titulo: currentActionTitle });
      continue;
    }

    // Meta header row.
    if (/^Meta\s+/i.test(col0)) {
      const match = col0.match(/^Meta\s+([1-3][A-Z])/i);
      currentMeta = match ? match[1].toUpperCase() : "";
      if (currentMeta && currentAction) {
        metas.push({ id: currentMeta, acaoId: currentAction, descricao: cleanMeta(col0) });
      }
      continue;
    }

    // Atividade row.
    if (/^[1-3][A-Z][0-9]+$/.test(col0)) {
      if (currentAction) {
        const dates = activityDateRange(findCronogramaRow(col0));
        activities.push({
          id: col0,
          acaoId: currentAction,
          metaId: currentMeta || col0.slice(0, 2),
          descricao: col1,
          inicioPrevisto: dates.start,
          fimPrevisto: dates.end,
          condicional: false,
        });
      }
      continue;
    }

    // Produto row (may fan out into multiple occurrences, one per marked
    // delivery month).
    const product = parseProductLabel(col0);
    if (product && currentAction) {
      const deliveries = productDeliveryDates(findCronogramaRow(col0));
      for (const delivery of deliveries) {
        productIndex++;
        products.push({
          id: `P${product.code.replace(".", "")}-${String(productIndex).padStart(2, "0")}`,
          codigo: product.code,
          ocorrenciaPrevistaNumero: productIndex,
          acaoId: currentAction,
          metaId: currentMeta || product.code.slice(0, 2),
          descricao: col1 || product.description,
          entregaPrevista: delivery,
          condicional: false,
        });
      }
    }
  }

  return { actions, metas, activities, products };
}

const { actions, metas, activities, products } = parseCronograma(cronogramaRows);

// Ensure every metaId referenced by an atividade/produto has a meta row
// (the source sheet doesn't always carry an explicit "Meta ..." header row
// for every code prefix in use).
const metaIds = new Set(metas.map((m) => m.id));
for (const referenced of [...activities.map((a) => a.metaId), ...products.map((p) => p.metaId)]) {
  if (!metaIds.has(referenced)) {
    metaIds.add(referenced);
    metas.push({ id: referenced, acaoId: referenced.slice(0, 1), descricao: "" });
  }
}

const ocorrenciasProdutos = products.map((p) => ({
  id: `${p.id}-ocorrencia-${p.ocorrenciaPrevistaNumero}`,
  produtoId: p.id,
  numero: p.ocorrenciaPrevistaNumero,
  dataPrevista: p.entregaPrevista,
}));

// --- Consolidado sheet: budget (rows 1-8) + totals (row 9) + disbursements (rows 11-19) ---

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const num = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : null;
}

const orcamento = consolidadoRows.slice(1, 9).map((row, index) => ({
  id: `BC-${String(index + 1).padStart(2, "0")}`,
  escopo: "Ações 1 a 3",
  rubrica: String(row[1] ?? "").trim(),
  item: String(row[1] ?? "").trim(),
  referencia: "Consolidado",
  valorAcao1: numberOrNull(row[2]) ?? 0,
  valorAcao2: numberOrNull(row[3]) ?? 0,
  valorAcao3: numberOrNull(row[4]) ?? 0,
  valorPlanejado: numberOrNull(row[5]) ?? 0,
}));

const budgetTotals = {
  acao1: numberOrNull(consolidadoRows[9]?.[2]) ?? 0,
  acao2: numberOrNull(consolidadoRows[9]?.[3]) ?? 0,
  acao3: numberOrNull(consolidadoRows[9]?.[4]) ?? 0,
  total: numberOrNull(consolidadoRows[9]?.[5]) ?? 0,
};

const repasses = consolidadoRows.slice(11, 20).map((row, index) => ({
  id: `R${String(index + 1).padStart(2, "0")}`,
  parcelaNumero: index + 1,
  // The Consolidado sheet's own description text already documents the
  // Parcela -> assinatura/R1..R8 link (governance rule: preserve this
  // documental link verbatim rather than re-deriving it).
  marco: String(row[1] ?? "").trim(),
  valorPlanejado: numberOrNull(row[2]) ?? 0,
}));

const disbursementTotal = numberOrNull(consolidadoRows[20]?.[2]) ?? budgetTotals.total;

const normalized = {
  generatedAt: new Date().toISOString(),
  source: SOURCE_FILE,
  ted: {
    id: "ted-oae-dnit",
    numero: "TED-OAE-DNIT",
    objeto: "Monitoramento inteligente de Obras de Arte Especiais (OAE) em apoio ao PROARTE/DNIT",
  },
  acoes: actions,
  metas,
  atividades: activities,
  produtos: products,
  ocorrenciasProdutos,
  orcamento,
  budgetTotals,
  repasses,
  disbursementTotal,
};

await fs.writeFile(outputPath, JSON.stringify(normalized, null, 2), "utf8");

console.log(
  `Extraído: ${normalized.acoes.length} ações, ${normalized.metas.length} metas, ` +
    `${normalized.atividades.length} atividades, ${normalized.produtos.length} produtos, ` +
    `${normalized.orcamento.length} itens de orçamento, ${normalized.repasses.length} repasses.`,
);
console.log(`Escrito em ${outputPath}`);
