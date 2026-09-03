"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { SemaforoBadge } from "@/components/semaforo-badge";
import { formatDate, formatPercent } from "@/lib/format";

export interface ProdutoRow {
  id: string;
  acaoId: string;
  metaId: string;
  codigo: string;
  descricao: string;
  ocorrenciaPrevistaNumero: number | null;
  entregaPrevista: string | null;
  statusAtual: string | null;
  percentualAtual: string | null;
  semaforoAtual: string | null;
}

export function ProdutosTable({ items }: { items: ProdutoRow[] }) {
  const [search, setSearch] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("todas");

  const acoes = useMemo(() => Array.from(new Set(items.map((i) => i.acaoId))).sort(), [items]);

  const filtered = items.filter((item) => {
    if (acaoFiltro !== "todas" && item.acaoId !== acaoFiltro) return false;
    if (!search) return true;
    const haystack = `${item.id} ${item.codigo} ${item.descricao}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar por código ou descrição…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        />
        <select
          value={acaoFiltro}
          onChange={(e) => setAcaoFiltro(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="todas">Todas as ações</option>
          {acoes.map((id) => (
            <option key={id} value={id}>
              Ação {id}
            </option>
          ))}
        </select>
        <span className="self-center text-xs text-slate-500">{filtered.length} produto(s)</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Código / Ação-Meta</th>
              <th className="px-4 py-2">Descrição</th>
              <th className="px-4 py-2">Entrega prevista</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">% Desenvolvimento</th>
              <th className="px-4 py-2">Semáforo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 font-mono text-xs">{item.id}</td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {item.codigo} · Ação {item.acaoId} · Meta {item.metaId}
                </td>
                <td className="px-4 py-2">{item.descricao}</td>
                <td className="px-4 py-2 whitespace-nowrap text-xs">{formatDate(item.entregaPrevista)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={item.statusAtual} />
                </td>
                <td className="px-4 py-2">{formatPercent(item.percentualAtual)}</td>
                <td className="px-4 py-2">
                  <SemaforoBadge semaforo={item.semaforoAtual} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
