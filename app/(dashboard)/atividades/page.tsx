import { AtividadesTable } from "@/components/tables/atividades-table";
import { listAtividadesComEstado } from "@/db/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function AtividadesPage() {
  const atividades = await listAtividadesComEstado();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Atividades</h1>
        <p className="text-sm text-slate-500">
          Percentual individual de execução por atividade. Ausência de percentual significa
          “Não informado”, nunca 0%.
        </p>
      </div>
      <AtividadesTable items={atividades} />
    </div>
  );
}
