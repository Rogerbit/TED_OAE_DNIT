"use client";

import { useState, useTransition } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { registrarAcompanhamentoAtividade } from "@/lib/actions/atividades";
import { registrarAcompanhamentoProduto } from "@/lib/actions/produtos";

const STATUS_OPTIONS: Record<"atividade" | "produto", string[]> = {
  atividade: ["Não iniciada", "Em execução", "Concluída", "Suspensa"],
  produto: ["Não iniciado", "Em desenvolvimento", "Concluído"],
};

export function EditAcompanhamentoModal({
  tipo,
  itemId,
  itemLabel,
  statusAtual,
  percentualAtual,
  onClose,
}: {
  tipo: "atividade" | "produto";
  itemId: string;
  itemLabel: string;
  statusAtual: string | null;
  percentualAtual: string | null;
  onClose: () => void;
}) {
  const { responsavelId } = useCurrentUser();
  const [status, setStatus] = useState(statusAtual ?? "");
  const [percentual, setPercentual] = useState(percentualAtual ?? "");
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const percentualAnteriorNum = percentualAtual !== null ? Number(percentualAtual) : null;
  const percentualNovoNum = percentual === "" ? null : Number(percentual);
  const precisaJustificativa =
    percentualAnteriorNum !== null && percentualNovoNum !== null && percentualNovoNum < percentualAnteriorNum;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const input = {
        status: status || null,
        percentual: percentual === "" ? null : percentual,
        justificativa: justificativa || null,
        registradoPor: responsavelId || null,
      };
      const result =
        tipo === "atividade"
          ? await registrarAcompanhamentoAtividade({ atividadeId: itemId, ...input })
          : await registrarAcompanhamentoProduto({ produtoId: itemId, ...input });

      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-900">Atualizar {itemLabel}</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            >
              <option value="">Não informado</option>
              {STATUS_OPTIONS[tipo].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Percentual (0–100, deixe vazio para “Não informado”)
            <input
              type="number"
              min={0}
              max={100}
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Justificativa{" "}
            {precisaJustificativa ? (
              <span className="text-red-600">(obrigatória — percentual está caindo)</span>
            ) : (
              <span className="text-slate-400">(opcional)</span>
            )}
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
