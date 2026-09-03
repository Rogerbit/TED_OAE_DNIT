"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/visao-executiva", label: "Visão executiva" },
  { href: "/atividades", label: "Atividades" },
  { href: "/produtos", label: "Produtos" },
  { href: "/orcamento", label: "Orçamento" },
  { href: "/governanca", label: "Metodologia de governança" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-t-md border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-white text-white"
                : "border-transparent text-blue-100 hover:border-blue-200 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
