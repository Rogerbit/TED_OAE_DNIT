"use client";

import { useRef, useState, useTransition } from "react";
import { useCurrentUser } from "@/lib/current-user";
import { anexarEvidencia, criarEntregaVersao, criarOcorrenciaProduto } from "@/lib/actions/produtos";

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="text-sm text-red-600">{error}</p>;
}

export function CriarOcorrenciaForm({ produtoId, proximoNumero }: { produtoId: string; proximoNumero: number }) {
  const [numero, setNumero] = useState(String(proximoNumero));
  const [dataPrevista, setDataPrevista] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await criarOcorrenciaProduto({
        produtoId,
        numero: Number(numero),
        dataPrevista: dataPrevista || null,
      });
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Número
        <input
          type="number"
          min={1}
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Data prevista
        <input
          type="date"
          value={dataPrevista}
          onChange={(e) => setDataPrevista(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Criando…" : "Nova ocorrência"}
      </button>
      <ErrorText error={error} />
    </form>
  );
}

export function CriarEntregaVersaoForm({
  produtoId,
  ocorrencias,
}: {
  produtoId: string;
  ocorrencias: { id: string; numero: number }[];
}) {
  const { responsavelId } = useCurrentUser();
  const [ocorrenciaId, setOcorrenciaId] = useState(ocorrencias[0]?.id ?? "");
  const [dataEntrega, setDataEntrega] = useState("");
  const [resumo, setResumo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (ocorrencias.length === 0) {
    return <p className="text-sm text-slate-500">Crie uma ocorrência antes de registrar uma entrega/versão.</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await criarEntregaVersao({
        produtoId,
        ocorrenciaId,
        dataEntrega: dataEntrega || null,
        resumo: resumo || null,
        registradoPor: responsavelId || null,
      });
      if (!result.ok) setError(result.error);
      else setResumo("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Ocorrência
        <select
          value={ocorrenciaId}
          onChange={(e) => setOcorrenciaId(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          {ocorrencias.map((o) => (
            <option key={o.id} value={o.id}>
              Nº {o.numero}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Data de entrega
        <input
          type="date"
          value={dataEntrega}
          onChange={(e) => setDataEntrega(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-xs text-slate-600">
        Resumo
        <input
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Registrando…" : "Nova versão"}
      </button>
      <ErrorText error={error} />
    </form>
  );
}

export function AnexarEvidenciaForm({
  produtoId,
  entregasVersoes,
}: {
  produtoId: string;
  entregasVersoes: { id: string; versaoNumero: number }[];
}) {
  const { responsavelId } = useCurrentUser();
  const [entregaVersaoId, setEntregaVersaoId] = useState(entregasVersoes[0]?.id ?? "");
  const [titulo, setTitulo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  if (entregasVersoes.length === 0) {
    return <p className="text-sm text-slate-500">Registre uma entrega/versão antes de anexar evidências.</p>;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await anexarEvidencia({
        produtoId,
        entregaVersaoId,
        titulo,
        referencia: referencia || null,
        registradoPor: responsavelId || null,
        arquivo: fileRef.current?.files?.[0] ?? null,
      });
      if (!result.ok) setError(result.error);
      else {
        setTitulo("");
        setReferencia("");
        if (fileRef.current) fileRef.current.value = "";
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Versão
        <select
          value={entregaVersaoId}
          onChange={(e) => setEntregaVersaoId(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        >
          {entregasVersoes.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.versaoNumero}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Título
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Referência
        <input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-slate-600">
        Arquivo
        <input ref={fileRef} type="file" className="text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-blue-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Anexar"}
      </button>
      <ErrorText error={error} />
    </form>
  );
}
