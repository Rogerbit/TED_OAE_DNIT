// Ported verbatim (rules, not code) from
// ted-oae-bi-web/standalone/fase3a-acompanhamento.mjs -- the one validated
// business rule around percentuais, reused identically for Atividades and
// Produtos.

export function normalizePercent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error("Percentual inválido.");
  }
  if (numeric < 0 || numeric > 100) {
    throw new Error("Percentual fora do intervalo permitido: 0% a 100%.");
  }
  return numeric;
}

export function assertJustificativaOnDecrease(
  previousPercent: number | null,
  nextPercent: number | null,
  justificativa: string | null | undefined,
) {
  if (
    nextPercent !== null &&
    previousPercent !== null &&
    nextPercent < previousPercent &&
    !String(justificativa ?? "").trim()
  ) {
    throw new Error("Redução de percentual exige justificativa.");
  }
}
