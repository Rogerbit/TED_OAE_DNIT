"use client";

import { useState, useTransition } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { atualizarSemaforoAtividade } from "@/lib/actions/atividades";
import { atualizarSemaforoProduto } from "@/lib/actions/produtos";

const SEMAFORO_OPTIONS = ["Regular", "Atenção", "Crítico", "Aguardando condição-decisão"];

export function EditSemaforoModal({
  tipo,
  itemId,
  itemLabel,
  semaforoAtual,
  onClose,
}: {
  tipo: "atividade" | "produto";
  itemId: string;
  itemLabel: string;
  semaforoAtual: string | null;
  onClose: () => void;
}) {
  const { responsavelId } = useCurrentUser();
  const [semaforo, setSemaforo] = useState(semaforoAtual ?? "Regular");
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = { semaforo, justificativa, registradoPor: responsavelId || null };
      const result =
        tipo === "atividade"
          ? await atualizarSemaforoAtividade({ atividadeId: itemId, ...input })
          : await atualizarSemaforoProduto({ produtoId: itemId, ...input });
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-900">Definir semáforo — {itemLabel}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Julgamento de governança, não um percentual médio. Sempre exige justificativa.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Semáforo
            <select
              value={semaforo}
              onChange={(e) => setSemaforo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              {SEMAFORO_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Justificativa <span className="text-red-600">(obrigatória)</span>
            <textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
