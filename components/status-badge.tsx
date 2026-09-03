const COLORS: Record<string, string> = {
  "Não iniciada": "bg-slate-100 text-slate-600",
  "Não iniciado": "bg-slate-100 text-slate-600",
  "Em execução": "bg-blue-50 text-blue-700",
  "Em desenvolvimento": "bg-blue-50 text-blue-700",
  Concluída: "bg-emerald-50 text-emerald-700",
  Concluído: "bg-emerald-50 text-emerald-700",
  Suspensa: "bg-amber-50 text-amber-700",
};

export function StatusBadge({ status }: { status: string | null }) {
  const label = status ?? "Não informado";
  const classes = status ? (COLORS[status] ?? "bg-slate-100 text-slate-600") : "bg-slate-50 text-slate-400 italic";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
