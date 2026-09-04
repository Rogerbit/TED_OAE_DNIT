import { listarCondicionantes } from "@/lib/actions/condicionantes";
import { listarPendencias } from "@/lib/actions/pendencias";
import { listarRelatoriosComSnapshotCount } from "@/lib/actions/relatorios";
import { PendenciasPanel } from "@/components/governanca/pendencias-panel";
import { CondicionantesPanel } from "@/components/governanca/condicionantes-panel";
import { RelatoriosPanel } from "@/components/governanca/relatorios-panel";

export const dynamic = "force-dynamic";

const CICLO_ETAPAS = [
  "Atualizar execução (Atividades e Produtos)",
  "Validar as atualizações registradas",
  "Atualizar informações financeiras (Repasses)",
  "Analisar riscos, Pendências e Condicionantes",
  "Deliberar sobre encaminhamentos",
  "Prestar contas (Relatório Gerencial)",
];

export default async function GovernancaPage() {
  const [pendencias, condicionantes, relatorios] = await Promise.all([
    listarPendencias(),
    listarCondicionantes(),
    listarRelatoriosComSnapshotCount(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Metodologia de governança</h1>
        <p className="text-sm text-slate-500">
          Ciclo mensal de acompanhamento e fechamento de Relatórios Gerenciais (R1–R15).
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Ciclo de governança (6 etapas)</h2>
        <ol className="mt-3 flex flex-col gap-2">
          {CICLO_ETAPAS.map((etapa, index) => (
            <li key={etapa} className="flex items-start gap-3 text-sm text-slate-700">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
                {index + 1}
              </span>
              <span className="pt-0.5">{etapa}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Relatórios Gerenciais (R1–R15)</h2>
        <p className="mt-2 text-sm text-slate-600">
          Cada Relatório Gerencial funciona como uma fotografia histórica e imutável do
          fechamento do ciclo correspondente — uma vez fechado, seu conteúdo não é alterado
          mesmo que o estado real das Atividades/Produtos mude depois (garantido pelo banco de
          dados, não apenas pela interface).
        </p>
        <div className="mt-3">
          <RelatoriosPanel relatorios={relatorios} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Pendências</h2>
        <p className="mt-2 text-xs text-slate-500">
          Entidade persistente entre ciclos — atualizar preserva o histórico, nunca duplica.
        </p>
        <div className="mt-3">
          <PendenciasPanel pendencias={pendencias} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Condicionantes</h2>
        <div className="mt-3">
          <CondicionantesPanel condicionantes={condicionantes} />
        </div>
      </section>
    </div>
  );
}
