"use client";

import { useState, useTransition } from "react";
import { registrarRecebimentoRepasse } from "@/lib/actions/repasses";

export function RepasseRecebimentoForm({
  repasseId,
  valorRepassadoAtual,
}: {
  repasseId: string;
  valorRepassadoAtual: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(valorRepassadoAtual ?? "0");
  const [dataRealizada, setDataRealizada] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-blue-700 hover:underline">
        Registrar recebimento
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registrarRecebimentoRepasse({
        repasseId,
        valorRepassado: valor,
        dataRealizada: dataRealizada || null,
        status: "Recebido",
      });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <input
        type="number"
        step="0.01"
        min={0}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-32 rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <input
        type="date"
        value={dataRealizada}
        onChange={(e) => setDataRealizada(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      />
      <button type="submit" disabled={pending} className="rounded-md bg-blue-800 px-2 py-1 text-xs text-white">
        {pending ? "Salvando…" : "Salvar"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
        Cancelar
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
