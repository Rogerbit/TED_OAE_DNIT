import { ProdutosTable } from "@/components/tables/produtos-table";
import { listProdutosComEstado } from "@/db/queries/dashboard";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const produtos = await listProdutosComEstado();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Produtos</h1>
        <p className="text-sm text-slate-500">
          Percentual individual de desenvolvimento por produto. 100% de desenvolvimento não
          implica entrega formal, aceite ou comprovação pela fiscalização.
        </p>
      </div>
      <ProdutosTable items={produtos} />
    </div>
  );
}
