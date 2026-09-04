"use client";

import { useState, useTransition } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { atualizarPendencia, criarPendencia } from "@/lib/actions/pendencias";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = ["Aberta", "Em tratamento", "Aguardando DNIT", "Resolvida", "Encerrada"];

export interface PendenciaRow {
  id: string;
  titulo: string;
  descricao: string | null;
  statusAtual: string;
  prazo: string | null;
  criadoEm: Date | string | null;
}

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Aberta: "bg-red-100 text-red-700",
    "Em tratamento": "bg-amber-100 text-amber-800",
    "Aguardando DNIT": "bg-violet-100 text-violet-700",
    Resolvida: "bg-emerald-100 text-emerald-700",
    Encerrada: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-slate-100"}`}>
      {status}
    </span>
  );
}

function AtualizarPendenciaForm({ pendencia }: { pendencia: PendenciaRow }) {
  const { responsavelId } = useCurrentUser();
  const [status, setStatus] = useState(pendencia.statusAtual);
  const [justificativa, setJustificativa] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-blue-700 hover:underline">
        Atualizar status
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await atualizarPendencia({
        pendenciaId: pendencia.id,
        status,
        justificativa: justificativa || null,
        registradoPor: responsavelId || null,
      });
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-wrap items-end gap-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={justificativa}
        onChange={(e) => setJustificativa(e.target.value)}
        placeholder="Observação (opcional)"
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

function CriarPendenciaForm() {
  const { responsavelId } = useCurrentUser();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await criarPendencia({
        titulo,
        descricao: descricao || null,
        prazo: prazo || null,
        registradoPor: responsavelId || null,
      });
      if (result.ok) {
        setTitulo("");
        setDescricao("");
        setPrazo("");
      } else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Título
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-56 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-1 min-w-[200px] flex-col gap-1 text-xs text-slate-600">
        Descrição
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Prazo
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Criando…" : "Nova pendência"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

export function PendenciasPanel({ pendencias }: { pendencias: PendenciaRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {pendencias.map((p) => (
        <div key={p.id} className="rounded-lg border border-slate-200 p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-medium text-slate-900">{p.titulo}</span>
              {p.descricao && <p className="text-xs text-slate-500">{p.descricao}</p>}
              {p.prazo && <p className="text-xs text-slate-500">Prazo: {formatDate(p.prazo)}</p>}
            </div>
            <StatusChip status={p.statusAtual} />
          </div>
          <AtualizarPendenciaForm pendencia={p} />
        </div>
      ))}
      {pendencias.length === 0 && <p className="text-sm text-slate-500">Nenhuma pendência registrada.</p>}
      <CriarPendenciaForm />
    </div>
  );
}
