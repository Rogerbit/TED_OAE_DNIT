import { KpiCard } from "@/components/kpi-card";
import { HorizontalBarChart } from "@/components/charts/horizontal-bar-chart";
import { ColumnChart } from "@/components/charts/column-chart";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  listAcoes,
  listAtividadesComEstado,
  listOrcamento,
  listProdutosComEstado,
  listRepasses,
} from "@/db/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function VisaoExecutivaPage() {
  const [acoes, atividades, produtos, orcamento, repasses] = await Promise.all([
    listAcoes(),
    listAtividadesComEstado(),
    listProdutosComEstado(),
    listOrcamento(),
    listRepasses(),
  ]);

  const totalOrcamento = orcamento.reduce((sum, o) => sum + Number(o.valorPlanejado), 0);
  const totalRepassado = repasses.reduce((sum, r) => sum + Number(r.valorRepassado ?? 0), 0);
  const totalPlanejadoRepasses = repasses.reduce((sum, r) => sum + Number(r.valorPlanejado), 0);
  const saldoARepassar = totalPlanejadoRepasses - totalRepassado;

  const itensComProgresso = [...atividades, ...produtos].filter((i) => i.percentualAtual !== null).length;
  const totalItens = atividades.length + produtos.length;
  const coberturaProgresso = totalItens > 0 ? Math.round((itensComProgresso / totalItens) * 100) : 0;

  const hoje = new Date();
  const atividadesVencidas = atividades.filter(
    (a) => a.fimPrevisto && new Date(a.fimPrevisto) < hoje && a.statusAtual !== "Concluída",
  );
  const produtosVencidos = produtos.filter(
    (p) => p.entregaPrevista && new Date(p.entregaPrevista) < hoje && p.statusAtual !== "Concluído",
  );
  const alertas = [...atividadesVencidas, ...produtosVencidos];

  const budgetChartData = orcamento
    .map((o) => ({ label: o.rubrica, value: Number(o.valorPlanejado) }))
    .sort((a, b) => b.value - a.value);

  const productsByYear: Record<string, number> = {};
  for (let year = 2026; year <= 2031; year++) productsByYear[year] = 0;
  for (const p of produtos) {
    if (!p.entregaPrevista) continue;
    const year = new Date(p.entregaPrevista).getUTCFullYear();
    if (year in productsByYear) productsByYear[year] += 1;
  }
  const productsPerYearData = Object.entries(productsByYear).map(([year, count]) => ({
    label: year,
    quantidade: count,
  }));

  const acoesSummary = acoes.map((acao) => ({
    id: acao.id,
    titulo: acao.titulo,
    atividades: atividades.filter((a) => a.acaoId === acao.id).length,
    produtos: produtos.filter((p) => p.acaoId === acao.id).length,
  }));
  const itemsByActionData = acoesSummary.map((a) => ({
    label: `Ação ${a.id}`,
    atividades: a.atividades,
    produtos: a.produtos,
  }));

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Orçamento total" value={formatCurrency(totalOrcamento)} />
        <KpiCard label="Total repassado" value={formatCurrency(totalRepassado)} />
        <KpiCard label="Saldo a repassar" value={formatCurrency(saldoARepassar)} />
        <KpiCard label="Cobertura de progresso reportado" value={`${coberturaProgresso}%`} accent />
        <KpiCard label="Alertas de prazo" value={String(alertas.length)} />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Orçamento por rubrica</h2>
          <HorizontalBarChart data={budgetChartData} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Entregas de produtos previstas por ano</h2>
          <ColumnChart data={productsPerYearData} series={[{ key: "quantidade", label: "Produtos" }]} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Itens de governança por ação</h2>
        <ColumnChart
          data={itemsByActionData}
          series={[
            { key: "atividades", label: "Atividades" },
            { key: "produtos", label: "Produtos" },
          ]}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Resumo por ação
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Ação</th>
                <th className="px-4 py-2">Atividades</th>
                <th className="px-4 py-2">Produtos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {acoesSummary.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2">
                    <span className="font-medium text-slate-900">Ação {a.id}</span>
                    <span className="block text-xs text-slate-500">{a.titulo}</span>
                  </td>
                  <td className="px-4 py-2">{a.atividades}</td>
                  <td className="px-4 py-2">{a.produtos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Alertas de prazo ({alertas.length})
        </h2>
        {alertas.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">Nenhum item com prazo vencido no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Item</th>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Prazo previsto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {atividadesVencidas.map((a) => (
                  <tr key={`atv-${a.id}`}>
                    <td className="px-4 py-2 font-mono text-xs">{a.id}</td>
                    <td className="px-4 py-2">{a.descricao}</td>
                    <td className="px-4 py-2">{formatDate(a.fimPrevisto)}</td>
                  </tr>
                ))}
                {produtosVencidos.map((p) => (
                  <tr key={`prd-${p.id}`}>
                    <td className="px-4 py-2 font-mono text-xs">{p.id}</td>
                    <td className="px-4 py-2">{p.descricao}</td>
                    <td className="px-4 py-2">{formatDate(p.entregaPrevista)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
