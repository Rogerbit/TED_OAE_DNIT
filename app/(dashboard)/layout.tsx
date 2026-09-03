import { NavTabs } from "@/components/nav-tabs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 px-4 pt-6 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">TED · OAE · DNIT</p>
          <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
            Painel de Governança da Execução do TED — OAE
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-blue-100">
            Monitoramento inteligente de Obras de Arte Especiais em apoio ao PROARTE/DNIT.
          </p>
          <div className="mt-4">
            <NavTabs />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 sm:px-8">
        Painel TED-OAE-DNIT · dados de origem: BASE_CORRETA_OAE_com_Cronograma_Acao4_FINAL.xlsx
      </footer>
    </div>
  );
}
