"use client";

import { useState, useTransition } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { atualizarCondicionante, criarCondicionante } from "@/lib/actions/condicionantes";

const STATUS_OPTIONS = ["Ativa", "Em atendimento", "Atendida", "Encerrada"];

export interface CondicionanteRow {
  id: string;
  titulo: string;
  descricao: string | null;
  statusAtual: string;
}

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Ativa: "bg-red-100 text-red-700",
    "Em atendimento": "bg-amber-100 text-amber-800",
    Atendida: "bg-emerald-100 text-emerald-700",
    Encerrada: "bg-slate-100 text-slate-500",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-slate-100"}`}>
      {status}
    </span>
  );
}

function AtualizarCondicionanteForm({ condicionante }: { condicionante: CondicionanteRow }) {
  const { responsavelId } = useCurrentUser();
  const [status, setStatus] = useState(condicionante.statusAtual);
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
      const result = await atualizarCondicionante({
        condicionanteId: condicionante.id,
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

function CriarCondicionanteForm() {
  const { responsavelId } = useCurrentUser();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await criarCondicionante({
        titulo,
        descricao: descricao || null,
        registradoPor: responsavelId || null,
      });
      if (result.ok) {
        setTitulo("");
        setDescricao("");
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
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Criando…" : "Nova condicionante"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

export function CondicionantesPanel({ condicionantes }: { condicionantes: CondicionanteRow[] }) {
  return (
    <div className="flex flex-col gap-3">
      {condicionantes.map((c) => (
        <div key={c.id} className="rounded-lg border border-slate-200 p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-medium text-slate-900">{c.titulo}</span>
              {c.descricao && <p className="text-xs text-slate-500">{c.descricao}</p>}
            </div>
            <StatusChip status={c.statusAtual} />
          </div>
          <AtualizarCondicionanteForm condicionante={c} />
        </div>
      ))}
      {condicionantes.length === 0 && <p className="text-sm text-slate-500">Nenhuma condicionante registrada.</p>}
      <CriarCondicionanteForm />
    </div>
  );
}
