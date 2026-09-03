export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(num)) return "—";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Não informado";
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "Não informado";
  return `${num.toFixed(0)}%`;
}
