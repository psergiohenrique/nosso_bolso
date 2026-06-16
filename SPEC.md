# Controle Financeiro do Casal — Especificação Técnica

> **Status:** Draft v1
> **Stack alvo:** Next.js (App Router) + Supabase (Postgres, Auth, RLS, Realtime) + TypeScript
> **Modelo de uso:** Workspace compartilhado (1 household, 2 membros) — ambos editam tudo, todo lançamento registra autor.
> **Escopo:** Completo desde o v1 (orçamentos, metas, recorrências, alertas, relatórios).
> **Moeda padrão:** BRL (multi-moeda preparado, mas opcional no v1).
> **Locale:** pt-BR (datas, números, R$).

---

## 1. Visão geral

App **mobile-first** para um casal organizar a vida financeira em conjunto. Centraliza:

- Contas **fixas** (recorrentes previsíveis) e **variáveis** (avulsas).
- **Cartões de crédito** com lançamentos, **parcelas** e fechamento/vencimento de fatura.
- **Categorias** e **subcategorias** de gasto/receita.
- **Orçamentos** por categoria, **metas** de economia, **alertas**.
- **Dashboards** com gráficos por mês, por categoria, por membro, por forma de pagamento.

Princípios:

1. **Rápido de lançar** — adicionar um gasto leva < 5 segundos no celular.
2. **Justiça do casal** — sempre dá pra ver quem pagou o quê e dividir despesas.
3. **Previsibilidade** — ver o que já comprometeu do mês (fixas + parcelas futuras) antes de gastar.
4. **Mobile-first, desktop-pleno** — mesma base, layout adaptativo.

---

## 2. Personas & papéis

| Papel    | Descrição                                          | Permissões                                  |
|----------|----------------------------------------------------|---------------------------------------------|
| `owner`  | Quem criou o household (ex.: você)                 | Tudo + gerenciar membros + apagar household |
| `member` | Parceiro(a) convidado(a)                            | Tudo (CRUD lançamentos, cartões, orçamentos)|

> No v1 ambos têm poder quase igual. Diferença só em gestão do household (convidar/remover, excluir tudo).

---

## 3. Glossário de domínio

- **Household** — espaço compartilhado do casal. Dono de todos os dados.
- **Account (Conta)** — onde o dinheiro vive: conta corrente, poupança, carteira/dinheiro, vale. (Cartão de crédito NÃO é account — ver Card.)
- **Card (Cartão)** — cartão de crédito, com limite, dia de fechamento e dia de vencimento.
- **Category / Subcategory** — classificação do lançamento (ex.: Moradia > Aluguel).
- **Transaction (Lançamento)** — movimento de dinheiro: despesa, receita ou transferência.
- **Recurring (Recorrência)** — regra que gera lançamentos repetidos (conta fixa).
- **Installment (Parcela)** — fração de uma compra parcelada no cartão.
- **Invoice (Fatura)** — agrupamento mensal dos lançamentos de um cartão entre fechamentos.
- **Budget (Orçamento)** — limite de gasto por categoria por mês.
- **Goal (Meta)** — objetivo de economia/poupança com valor alvo e prazo.

---

## 4. Conceitos financeiros (regras)

### 4.1 Tipos de lançamento
- `expense` (despesa) — sai dinheiro.
- `income` (receita) — entra dinheiro.
- `transfer` — move entre contas próprias (não conta como gasto/receita nos dashboards).

### 4.2 Fixas vs variáveis
- **Fixa** = lançamento gerado por uma **recorrência** (`recurring_rule`). Ex.: aluguel, internet, academia.
- **Variável** = lançamento avulso, sem recorrência. Ex.: mercado, uber, restaurante.
- Distinção é uma flag derivada (`is_recurring`) + link pra regra, não tabela separada.

### 4.3 Cartão de crédito — modelo de fatura
- Cartão tem `closing_day` (fechamento) e `due_day` (vencimento).
- Cada lançamento no cartão cai numa **fatura** (invoice) conforme a data da compra vs dia de fechamento.
  - Compra em data > fechamento do mês corrente → entra na fatura do mês seguinte.
- A **fatura** tem um período (data inicial/final), valor total, status (`open`, `closed`, `paid`).
- **Pagar a fatura** = transferência de uma `account` que quita o invoice. Não duplica como novo gasto (os gastos já foram contados nos lançamentos do cartão).
- Dashboards permitem **alternar** entre as duas visões (toggle no relatório):
  - **Competência** — gasto na data da compra (consumo real do mês). Visão padrão.
  - **Caixa** — gasto na data do pagamento da fatura (saída real de dinheiro).
- Implicação técnica: relatórios precisam de duas agregações; transação de cartão guarda `date` (compra) e a fatura guarda `paid_at` (caixa).

### 4.4 Parcelamento
- Compra parcelada gera **N lançamentos filhos** (installments) ligados a um `purchase_id` pai.
- Cada parcela tem `installment_no` (1..N), `installment_total` (N), e cai numa fatura futura distinta.
- Valor da parcela = total / N (último ajusta centavos de arredondamento).
- Parcelas futuras aparecem como **comprometido** nos meses seguintes (impacta previsão de saldo).

### 4.5 Divisão entre o casal (split)
- Todo lançamento tem `paid_by` (quem pagou) e um **split** opcional.
- Split modos: `none` (pessoal), `equal` (50/50), `custom` (percentual/valor por membro).
- Gera o "quem deve a quem" — saldo de acerto do casal por período.

### 4.6 Moeda
- v1: tudo em BRL. Campo `currency` existe em transações pra futuro multi-moeda; conversão fica fora do v1.

---

## 5. Modelo de dados (Postgres / Supabase)

> Convenções: `id uuid pk default gen_random_uuid()`, `created_at`, `updated_at timestamptz`. Valores monetários em **inteiro de centavos** (`bigint`) pra evitar erro de float. Toda tabela de dados tem `household_id` pra RLS.

```sql
-- Identidade (auth.users gerenciado pelo Supabase Auth)

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_currency text not null default 'BRL',
  created_at timestamptz default now()
);

create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  display_name text not null,
  color text,                      -- cor do membro nos gráficos
  joined_at timestamptz default now(),
  primary key (household_id, user_id)
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in ('checking','savings','cash','wallet','other')),
  initial_balance_cents bigint not null default 0,
  currency text not null default 'BRL',
  archived boolean not null default false,
  created_at timestamptz default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  brand text,                      -- visa, master, elo...
  last4 text,
  limit_cents bigint,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  default_account_id uuid references accounts(id), -- conta que paga a fatura
  archived boolean not null default false,
  created_at timestamptz default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  parent_id uuid references categories(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('expense','income')),
  icon text,
  color text,
  created_at timestamptz default now()
);

create table recurring_rules (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  description text not null,
  amount_cents bigint not null,
  type text not null check (type in ('expense','income')),
  category_id uuid references categories(id),
  account_id uuid references accounts(id),
  card_id uuid references cards(id),
  frequency text not null check (frequency in ('monthly','weekly','yearly','custom')),
  day_of_month int,                -- pra monthly
  start_date date not null,
  end_date date,                   -- null = indefinido
  active boolean not null default true,
  created_at timestamptz default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  type text not null check (type in ('expense','income','transfer')),
  amount_cents bigint not null,
  currency text not null default 'BRL',
  date date not null,              -- data de competência (compra)
  description text,
  category_id uuid references categories(id),

  -- origem do dinheiro: OU account OU card (xor)
  account_id uuid references accounts(id),
  card_id uuid references cards(id),

  -- transferência
  transfer_account_id uuid references accounts(id),

  -- autoria / casal
  paid_by uuid references auth.users(id),
  split_mode text not null default 'none' check (split_mode in ('none','equal','custom')),

  -- recorrência
  recurring_rule_id uuid references recurring_rules(id) on delete set null,
  is_recurring boolean not null default false,

  -- parcelamento
  purchase_id uuid,               -- agrupa parcelas da mesma compra
  installment_no int,             -- 1..N
  installment_total int,          -- N

  -- fatura (quando card_id != null)
  invoice_id uuid references invoices(id),

  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table transaction_splits (
  transaction_id uuid references transactions(id) on delete cascade,
  user_id uuid references auth.users(id),
  share_cents bigint not null,     -- quanto desse lançamento é "desta pessoa"
  primary key (transaction_id, user_id)
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  period_start date not null,
  period_end date not null,        -- = fechamento
  due_date date not null,
  total_cents bigint not null default 0,
  status text not null default 'open' check (status in ('open','closed','paid')),
  paid_at timestamptz,
  paid_from_account_id uuid references accounts(id),
  created_at timestamptz default now()
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  month date not null,             -- primeiro dia do mês de referência
  limit_cents bigint not null,
  created_at timestamptz default now(),
  unique (household_id, category_id, month)
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  target_cents bigint not null,
  saved_cents bigint not null default 0,
  target_date date,
  account_id uuid references accounts(id),  -- conta vinculada (opcional)
  created_at timestamptz default now()
);
```

### 5.1 Row Level Security (RLS) — núcleo da segurança
Cada usuário só acessa dados do household ao qual pertence. Política base aplicada a **todas** as tabelas de dados:

```sql
alter table transactions enable row level security;

create policy "membros do household leem"
  on transactions for select
  using (
    household_id in (
      select household_id from household_members
      where user_id = auth.uid()
    )
  );

create policy "membros do household escrevem"
  on transactions for all
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  )
  with check (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );
```
> Replicar pra `accounts`, `cards`, `categories`, `recurring_rules`, `transaction_splits` (via join), `invoices`, `budgets`, `goals`. `household_members` tem política própria (ver só os do próprio household).

### 5.2 Lógica de servidor (Edge Functions / Server Actions)
- **`generate_recurring(month)`** — materializa lançamentos das `recurring_rules` ativas para o mês. Idempotente (não duplica).
- **`create_installment_purchase(...)`** — cria N transações filhas + associa cada uma à fatura correta.
- **`assign_invoice(transaction)`** — calcula `invoice_id` pela data da compra vs `closing_day`.
- **`recompute_invoice_total(invoice_id)`** — soma transações da fatura. Trigger em insert/update/delete de transações com `card_id`.
- **`pay_invoice(invoice_id, account_id)`** — marca fatura `paid`, cria transferência da conta.
- **`couple_settlement(period)`** — calcula saldo "quem deve a quem" a partir dos splits.

---

## 6. Funcionalidades (épicos)

### E1 — Onboarding & Household
- Signup/login (Supabase Auth: email+senha, magic link, Google opcional).
- Criar household no primeiro acesso; convidar parceiro(a) por e-mail/link.
- Setup inicial guiado: criar contas, cartões, categorias padrão (seed pt-BR).

### E2 — Lançamentos
- Adicionar despesa/receita rápido (FAB no mobile): valor → categoria → conta/cartão → data → quem pagou → salvar.
- Editar, excluir, duplicar.
- Marcar como recorrente (cria regra) ou avulso.
- Compra parcelada no cartão (define N parcelas).
- Anexar nota/observação; (futuro: foto do comprovante via Supabase Storage).
- Busca e filtros (período, categoria, conta, cartão, membro, texto).

### E3 — Contas fixas (recorrências)
- CRUD de regras recorrentes.
- Visão "contas do mês": pagas vs a pagar, com vencimento.
- Geração automática dos lançamentos do mês.

### E4 — Cartões & faturas
- CRUD de cartões (limite, fechamento, vencimento).
- Tela da fatura: lançamentos do período, total, status.
- Parcelas futuras visíveis por fatura.
- Pagar fatura (vincula à conta).
- Indicador de limite usado/disponível.

### E5 — Categorias & orçamentos
- CRUD categorias/subcategorias com ícone e cor.
- Orçamento mensal por categoria.
- Barra de progresso do orçamento; alerta ao passar de 80% / 100%.

### E6 — Metas de economia
- Criar meta (valor alvo, prazo, conta vinculada).
- Aportes manuais; progresso visual; projeção de prazo.

### E7 — Dashboards & relatórios
- **Resumo do mês:** entradas, saídas, saldo, comprometido (fixas+parcelas).
- **Gráfico por categoria** (pizza/treemap) no período.
- **Tendência mensal** (linha/barra — últimos 6/12 meses).
- **Por membro** (quem gastou quanto) e **por forma de pagamento** (conta vs cartão).
- **Fluxo de caixa projetado** (considerando recorrências + parcelas futuras).
- **Acerto do casal** (saldo de splits no período).
- Filtro global de período (mês atual, mês passado, custom, ano).
- Export CSV (futuro: PDF).

### E8 — Alertas & notificações
- Fatura fechando / vencendo.
- Orçamento estourado.
- Conta fixa a vencer.
- (Entrega: in-app no v1; push/email depois.)

---

## 7. UX / Telas (mobile-first)

Navegação mobile: **bottom tab bar** com 5 itens.

```
[ Início ]  [ Lançar (FAB +) ]  [ Cartões ]  [ Relatórios ]  [ Mais ]
```

| Tela              | Conteúdo principal                                                        |
|-------------------|---------------------------------------------------------------------------|
| **Início**        | Saldo do mês, resumo entradas/saídas, contas a pagar, atalhos, alertas    |
| **Lançar**        | Formulário rápido (FAB abre bottom sheet). Toggle despesa/receita/transf. |
| **Transações**    | Lista agrupada por dia, filtros, busca                                    |
| **Cartões**       | Lista de cartões → fatura → lançamentos/parcelas                          |
| **Relatórios**    | Dashboards e gráficos com filtro de período                               |
| **Orçamentos**    | Categorias com barras de progresso                                        |
| **Metas**         | Cards de metas com progresso                                              |
| **Mais/Config**   | Contas, categorias, household/membros, preferências, export               |

Desktop: bottom bar vira **sidebar**; telas usam grid de 2–3 colunas; dashboards ganham mais densidade.

Diretrizes:
- Componentes: **shadcn/ui** + Tailwind. Gráficos: **Recharts** (ou visx).
- Inputs monetários com máscara R$; teclado numérico no mobile.
- Dark mode.
- Acessibilidade: contraste AA, foco visível, labels.
- Otimista UI nos lançamentos (Realtime do Supabase sincroniza o casal).

---

## 8. Arquitetura técnica

- **Next.js App Router** (RSC + Server Actions). TypeScript estrito.
- **Supabase**: Postgres, Auth, RLS, Realtime (sync entre os dois), Storage (comprovantes), Edge Functions (jobs/lógica).
- **Data layer:** Supabase client (server) nos Server Components/Actions; `@supabase/ssr` pra sessão via cookies.
- **Validação:** Zod (schemas compartilhados client/server).
- **Estado servidor:** Server Actions + revalidate; Realtime pra updates ao vivo. (TanStack Query opcional pra listas filtradas.)
- **Charts:** Recharts.
- **Datas:** date-fns (locale pt-BR).
- **Dinheiro:** sempre centavos (bigint) no banco; formatação só na borda (Intl.NumberFormat 'pt-BR').
- **Recorrências:** Supabase Cron (pg_cron) chama `generate_recurring` no início do mês; também sob demanda ao abrir o mês.
- **Deploy:** Vercel (front) + Supabase (dados).

### 8.1 Estrutura de pastas (proposta)
```
app/
  (auth)/login, signup
  (app)/
    dashboard/        # Início
    transactions/
    cards/[id]/invoice/[invoiceId]
    budgets/
    goals/
    reports/
    settings/
  layout.tsx
components/  (ui shadcn + domínio)
lib/
  supabase/ (server, client, middleware)
  money.ts, dates.ts, validators/ (zod)
  queries/ (data access), actions/ (server actions)
supabase/
  migrations/  functions/  seed.sql
```

---

## 9. Requisitos não-funcionais

- **Performance:** carregamento inicial < 2s em 4G; lançar gasto sem reload (otimista).
- **Offline-light:** ao menos cache de leitura (PWA, futuro). Lançar offline → fila (futuro).
- **PWA:** instalável no celular (manifest + service worker).
- **Segurança:** RLS obrigatória em toda tabela; nada de query sem `household_id`; segredos só server-side.
- **Privacidade:** dados financeiros sensíveis — sem terceiros de analytics com PII; backups Supabase.
- **i18n:** pt-BR no v1, estrutura pronta pra outros locales.
- **Testes:** unit (lógica de fatura/parcela/split) + e2e fluxo de lançar (Playwright).

---

## 10. Roadmap sugerido (fases de entrega, mesmo com escopo completo)

1. **F0 — Fundação:** auth, household + convite, schema + RLS, seed de categorias, layout/navegação.
2. **F1 — Lançar & ver:** transações (CRUD), contas, lista/filtros, Início básico.
3. **F2 — Cartões:** cartões, faturas, parcelas, pagar fatura.
4. **F3 — Recorrências:** regras fixas, geração mensal (cron), contas a pagar.
5. **F4 — Planejamento:** orçamentos + alertas, metas.
6. **F5 — Inteligência:** dashboards completos, fluxo projetado, acerto do casal, export.
7. **F6 — Polimento:** PWA, push/email, comprovantes, dark mode fino, testes e2e.

---

## 11. Decisões (fechadas)

1. **Cartão — data do gasto:** relatórios **alternam** competência (data da compra, padrão) ⇄ caixa (data do pagamento da fatura). Ver §4.3.
2. **Transferência entre contas próprias:** **não** conta como gasto/receita; só ajusta saldos.
3. **Acerto do casal:** **informativo** no v1 (mostra saldo de quem deve a quem; não gera lançamento de quitação).
4. **Categorias:** **seed pt-BR editável** (app já vem com categorias comuns; casal edita/apaga).
5. **Moeda:** **só BRL** no v1. Campo `currency` permanece no schema para multi-moeda futura, sem conversão agora.
```
