# TED-OAE-DNIT — Painel de Governança

Painel de governança da execução do TED de monitoramento inteligente de Obras
de Arte Especiais (OAE), em apoio ao PROARTE/DNIT.

Reimplementação em Node.js + React (Next.js, App Router) + PostgreSQL
(Supabase), publicada na Vercel — sucessora do protótipo estático
`ted-oae-bi-web/standalone/index.html`, cujo modelo de dados e regras de
negócio estão preservados em [`docs/business-rules.md`](docs/business-rules.md).

## Escopo desta versão (MVP)

- Schema Postgres completo (19 entidades do modelo normalizado), migrado via
  Drizzle.
- ETL único a partir da planilha oficial (`scripts/seed/`) para popular o
  banco.
- As 5 telas do painel em **modo leitura**: Visão executiva, Atividades,
  Produtos, Orçamento, Metodologia de governança.

Edição com histórico de auditoria, Pendências/Condicionantes, Relatórios
Gerenciais R1–R15 (imutáveis) e snapshots de ciclo são deliberadamente
adiados para uma fase seguinte, a ser aprovada separadamente — ver
`docs/business-rules.md` para as regras que essa fase futura precisa
respeitar.

## Requisitos

- Node.js `>=22.13.0`
- Um projeto Supabase (Postgres)

## Configuração

1. Copie `.env.local.example` para `.env.local` e preencha com as credenciais
   do seu projeto Supabase (Project Settings → API / Database).
2. Instale as dependências:

   ```bash
   npm install
   ```

3. Gere e aplique as migrações do schema:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Rode o ETL (extrai a planilha oficial e popula o banco):

   ```bash
   npm run seed:extract
   npm run seed:db
   ```

5. Suba o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` / `npm run build` / `npm run start` — Next.js.
- `npm run lint` — ESLint.
- `npm run db:generate` / `npm run db:migrate` — migrações Drizzle.
- `npm run seed:extract` — lê `scripts/seed/data/*.xlsx` e escreve
  `scripts/seed/data/normalized.json`.
- `npm run seed:db` — insere `normalized.json` no Postgres (idempotente via
  `onConflictDoNothing`; rode `seed:extract` de novo quando a planilha de
  origem for atualizada).
