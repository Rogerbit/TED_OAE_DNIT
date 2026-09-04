"use client";

import { useEffect, useState } from "react";
import { listarHistoricoAtividade } from "@/lib/actions/atividades";
import { listarHistoricoProduto } from "@/lib/actions/produtos";
import { formatPercent } from "@/lib/format";

type HistoricoRow = {
  id: string;
  dataRegistro: Date | string | null;
  registradoPor: string | null;
  statusAnterior: string | null;
  statusAtual: string | null;
  percentualAnterior: string | null;
  percentualAtual: string | null;
  justificativa: string | null;
};

export function AuditHistoryDrawer({
  tipo,
  itemId,
  itemLabel,
  onClose,
}: {
  tipo: "atividade" | "produto";
  itemId: string;
  itemLabel: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<HistoricoRow[] | null>(null);

  useEffect(() => {
    let active = true;
    const fetcher = tipo === "atividade" ? listarHistoricoAtividade : listarHistoricoProduto;
    fetcher(itemId).then((data) => {
      if (active) setRows(data as HistoricoRow[]);
    });
    return () => {
      active = false;
    };
  }, [tipo, itemId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Histórico — {itemLabel}</h2>
          <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Fechar
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {rows === null && <p className="text-sm text-slate-500">Carregando…</p>}
          {rows?.length === 0 && <p className="text-sm text-slate-500">Nenhum registro ainda.</p>}
          {rows?.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{row.dataRegistro ? new Date(row.dataRegistro).toLocaleString("pt-BR") : "—"}</span>
                <span>{row.registradoPor ?? "—"}</span>
              </div>
              <div className="mt-1">
                Status: <span className="text-slate-500">{row.statusAnterior ?? "—"}</span> →{" "}
                <span className="font-medium">{row.statusAtual ?? "Não informado"}</span>
              </div>
              <div>
                Percentual: <span className="text-slate-500">{formatPercent(row.percentualAnterior)}</span> →{" "}
                <span className="font-medium">{formatPercent(row.percentualAtual)}</span>
              </div>
              {row.justificativa && (
                <p className="mt-1 text-slate-600 italic">“{row.justificativa}”</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
