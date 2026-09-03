const COLORS: Record<string, string> = {
  Regular: "bg-emerald-100 text-emerald-700",
  Atenção: "bg-amber-100 text-amber-800",
  Crítico: "bg-red-100 text-red-700",
  "Aguardando condição-decisão": "bg-violet-100 text-violet-700",
};

// Semáforo is always a governance judgment set by a person — never rendered
// as a computed traffic light from dates/percentages.
export function SemaforoBadge({ semaforo }: { semaforo: string | null }) {
  const label = semaforo ?? "Não avaliado";
  const classes = semaforo ? (COLORS[semaforo] ?? "bg-slate-100 text-slate-600") : "bg-slate-50 text-slate-400 italic";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}
