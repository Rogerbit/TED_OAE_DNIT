import { formatCurrency, formatDate } from "@/lib/format";
import { listOrcamento, listRepasses } from "@/db/queries/dashboard";
import { RepasseRecebimentoForm } from "@/components/repasse-recebimento-form";

export const dynamic = "force-dynamic";

export default async function OrcamentoPage() {
  const [orcamento, repasses] = await Promise.all([listOrcamento(), listRepasses()]);

  const totalAcao1 = orcamento.reduce((s, o) => s + Number(o.valorAcao1 ?? 0), 0);
  const totalAcao2 = orcamento.reduce((s, o) => s + Number(o.valorAcao2 ?? 0), 0);
  const totalAcao3 = orcamento.reduce((s, o) => s + Number(o.valorAcao3 ?? 0), 0);
  const totalGeral = orcamento.reduce((s, o) => s + Number(o.valorPlanejado), 0);

  const totalRepasses = repasses.reduce((s, r) => s + Number(r.valorPlanejado), 0);
  const totalRepassado = repasses.reduce((s, r) => s + Number(r.valorRepassado ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Orçamento</h1>
        <p className="text-sm text-slate-500">
          Orçamento documental por rubrica (Ação 1/2/3) e cronograma de repasses globais do DNIT.
          Os repasses não são distribuídos entre atividades ou produtos.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Orçamento por rubrica
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Rubrica</th>
                <th className="px-4 py-2 text-right">Ação 1</th>
                <th className="px-4 py-2 text-right">Ação 2</th>
                <th className="px-4 py-2 text-right">Ação 3</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orcamento.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-2">{o.rubrica}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(o.valorAcao1)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(o.valorAcao2)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(o.valorAcao3)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatCurrency(o.valorPlanejado)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-2">Totais</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalAcao1)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalAcao2)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalAcao3)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalGeral)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Cronograma de repasses (DNIT)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Parcela</th>
                <th className="px-4 py-2">Marco</th>
                <th className="px-4 py-2 text-right">Planejado</th>
                <th className="px-4 py-2 text-right">Repassado</th>
                <th className="px-4 py-2 text-right">Saldo</th>
                <th className="px-4 py-2">Data prevista</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repasses.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2">{r.parcelaNumero}</td>
                  <td className="px-4 py-2">{r.marco}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(r.valorPlanejado)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(r.valorRepassado)}</td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(Number(r.valorPlanejado) - Number(r.valorRepassado ?? 0))}
                  </td>
                  <td className="px-4 py-2">{formatDate(r.dataPrevista)}</td>
                  <td className="px-4 py-2">
                    <RepasseRecebimentoForm repasseId={r.id} valorRepassadoAtual={r.valorRepassado} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold">
              <tr>
                <td className="px-4 py-2" colSpan={2}>
                  Total
                </td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalRepasses)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalRepassado)}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(totalRepasses - totalRepassado)}</td>
                <td className="px-4 py-2" colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
