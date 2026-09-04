import Link from "next/link";
import { notFound } from "next/navigation";
import { listarDetalhesProduto } from "@/lib/actions/produtos";
import { CriarEntregaVersaoForm, CriarOcorrenciaForm, AnexarEvidenciaForm } from "@/components/produto-detail-forms";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProdutoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { produto, ocorrencias, versoes, evidenciasList } = await listarDetalhesProduto(id);

  if (!produto) notFound();

  const proximoNumero = (ocorrencias.at(-1)?.numero ?? 0) + 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/produtos" className="text-sm text-blue-700 hover:underline">
          ← Voltar para Produtos
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-slate-900">
          {produto.id} — {produto.descricao}
        </h1>
        <p className="text-sm text-slate-500">
          Código {produto.codigo} · Ação {produto.acaoId} · Meta {produto.metaId}
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Ocorrências previstas</h2>
        <p className="mt-1 text-xs text-slate-500">
          Nunca criadas automaticamente — cada ocorrência é uma ação deliberada de governança.
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {ocorrencias.map((o) => (
            <li key={o.id} className="flex justify-between rounded-md bg-slate-50 px-3 py-1.5">
              <span>Ocorrência nº {o.numero}</span>
              <span className="text-slate-500">{formatDate(o.dataPrevista)}</span>
            </li>
          ))}
          {ocorrencias.length === 0 && <li className="text-slate-500">Nenhuma ocorrência registrada.</li>}
        </ul>
        <div className="mt-3">
          <CriarOcorrenciaForm produtoId={produto.id} proximoNumero={proximoNumero} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Entregas / versões</h2>
        <p className="mt-1 text-xs text-slate-500">
          Uma nova versão nunca sobrescreve a anterior — cada registro é permanente.
        </p>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {versoes.map((v) => (
            <li key={v.id} className="rounded-md bg-slate-50 px-3 py-1.5">
              <div className="flex justify-between">
                <span>v{v.versaoNumero}</span>
                <span className="text-slate-500">{formatDate(v.dataEntrega)}</span>
              </div>
              {v.resumo && <p className="text-xs text-slate-600">{v.resumo}</p>}
            </li>
          ))}
          {versoes.length === 0 && <li className="text-slate-500">Nenhuma entrega/versão registrada.</li>}
        </ul>
        <div className="mt-3">
          <CriarEntregaVersaoForm
            produtoId={produto.id}
            ocorrencias={ocorrencias.map((o) => ({ id: o.id, numero: o.numero }))}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Evidências</h2>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {evidenciasList.map((e) => (
            <li key={e.id} className="rounded-md bg-slate-50 px-3 py-1.5">
              <span className="font-medium">{e.titulo}</span>
              {e.referencia && <span className="text-slate-500"> · {e.referencia}</span>}
            </li>
          ))}
          {evidenciasList.length === 0 && <li className="text-slate-500">Nenhuma evidência anexada.</li>}
        </ul>
        <div className="mt-3">
          <AnexarEvidenciaForm
            produtoId={produto.id}
            entregasVersoes={versoes.map((v) => ({ id: v.id, versaoNumero: v.versaoNumero }))}
          />
        </div>
      </section>
    </div>
  );
}
