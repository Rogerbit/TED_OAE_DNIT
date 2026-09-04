"use client";

import { useState, useTransition } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { criarRelatorio, fecharRelatorioGerencial } from "@/lib/actions/relatorios";
import { formatDate } from "@/lib/format";

const REPORT_CODES = Array.from({ length: 15 }, (_, i) => `R${i + 1}`);

export interface RelatorioRow {
  id: string;
  codigo: string;
  ciclo: string | null;
  status: string;
  dataEfetiva: string | null;
  fechadoEm: Date | string | null;
  snapshotCount: number;
}

function CriarRelatorioButton({ codigo }: { codigo: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await criarRelatorio({ codigo });
            if (!result.ok) setError(result.error);
          })
        }
        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        {pending ? "Criando…" : "Planejar " + codigo}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function FecharRelatorioForm({ relatorio }: { relatorio: RelatorioRow }) {
  const { responsavelId } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [dataEfetiva, setDataEfetiva] = useState("");
  const [referenciaDigital, setReferenciaDigital] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-blue-700 hover:underline">
        Fechar relatório
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await fecharRelatorioGerencial({
        relatorioId: relatorio.id,
        dataEfetiva: dataEfetiva || null,
        referenciaDigital: referenciaDigital || null,
        registradoPor: responsavelId || null,
      });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Data efetiva
        <input
          type="date"
          value={dataEfetiva}
          onChange={(e) => setDataEfetiva(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Referência digital
        <input
          value={referenciaDigital}
          onChange={(e) => setReferenciaDigital(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded-md bg-blue-800 px-2 py-1 text-xs text-white">
        {pending ? "Fechando…" : "Confirmar fechamento"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-500">
        Cancelar
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

export function RelatoriosPanel({ relatorios }: { relatorios: RelatorioRow[] }) {
  const byCodigo = new Map(relatorios.map((r) => [r.codigo, r]));

  return (
    <div className="flex flex-col gap-2">
      {REPORT_CODES.map((codigo) => {
        const relatorio = byCodigo.get(codigo);
        return (
          <div key={codigo} className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-900">{codigo}</span>
              {!relatorio && <span className="text-xs text-slate-400 italic">Não planejado</span>}
              {relatorio && (
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    relatorio.status === "Fechado"
                      ? "bg-slate-800 text-white"
                      : relatorio.status === "Entregue"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {relatorio.status}
                </span>
              )}
            </div>
            {!relatorio && <CriarRelatorioButton codigo={codigo} />}
            {relatorio && relatorio.status !== "Fechado" && <FecharRelatorioForm relatorio={relatorio} />}
            {relatorio?.status === "Fechado" && (
              <p className="mt-1 text-xs text-slate-500">
                Fechado em {formatDate(relatorio.dataEfetiva)} · {relatorio.snapshotCount} snapshot(s) imutável(is)
                gerado(s) — este relatório não pode mais ser alterado.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
