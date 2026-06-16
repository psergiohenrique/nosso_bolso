# Controle Financeiro do Casal — Breakdown de Tarefas

> Baseado em `SPEC.md`. Fases F0→F6. Cada tarefa com escopo claro e critério de pronto.
> Marcação: `[ ]` aberto · `[~]` em progresso · `[x]` feito.

---

## F0 — Fundação

### F0.1 Setup do projeto
- [ ] Criar projeto Next.js (App Router, TypeScript estrito, Tailwind).
- [ ] Instalar shadcn/ui + componentes base (button, input, dialog, sheet, card, tabs, select, toast).
- [ ] Configurar ESLint/Prettier, path aliases, env (`.env.local`).
- [ ] Estrutura de pastas conforme SPEC §8.1.
- [ ] Deploy inicial Vercel (preview na main).

### F0.2 Supabase
- [ ] Criar projeto Supabase; conectar via `@supabase/ssr` (client server + browser + middleware).
- [ ] Migrations: todas as tabelas do SPEC §5.
- [ ] RLS em todas as tabelas de dados (SPEC §5.1).
- [ ] Seed de categorias pt-BR (Moradia, Mercado, Transporte, Lazer, Saúde, Educação, Assinaturas, Renda...).
- [ ] Helpers `lib/money.ts` (centavos ⇄ R$) e `lib/dates.ts` (date-fns pt-BR).
- [ ] Validators Zod base em `lib/validators/`.

### F0.3 Auth & Household
- [ ] Telas login / signup (email+senha + magic link).
- [ ] Middleware de sessão (redirect não-autenticado).
- [ ] Criar household no primeiro acesso.
- [ ] Convidar parceiro(a) por e-mail/link; aceitar convite vira `member`.
- [ ] Tela de membros (listar, papel, cor do membro).
- [ ] **Pronto quando:** dois usuários logam, entram no mesmo household, RLS isola dados.

### F0.4 Layout & navegação
- [ ] Bottom tab bar mobile (Início, Lançar FAB, Cartões, Relatórios, Mais).
- [ ] Sidebar desktop (mesmos itens).
- [ ] Tema (light/dark), tokens de cor, tipografia.
- [ ] Shell responsivo + estados loading/empty/erro padrão.

---

## F1 — Lançar & ver

### F1.1 Contas (accounts)
- [ ] CRUD contas (corrente, poupança, dinheiro, carteira).
- [ ] Saldo inicial; saldo atual derivado das transações.
- [ ] Arquivar conta.

### F1.2 Transações — core
- [ ] Server actions: create/update/delete transaction (Zod + RLS).
- [ ] FAB → bottom sheet de lançamento rápido (valor → categoria → conta/cartão → data → quem pagou).
- [ ] Toggle despesa / receita / transferência.
- [ ] Regra: transferência não conta como gasto/receita (SPEC decisão #2).
- [ ] Otimista UI + Realtime (sync entre o casal).

### F1.3 Lista & filtros
- [ ] Lista de transações agrupada por dia.
- [ ] Filtros: período, categoria, conta, cartão, membro, texto.
- [ ] Editar/duplicar/excluir a partir da lista.

### F1.4 Início (dashboard básico)
- [ ] Card saldo do mês (entradas, saídas, saldo).
- [ ] Atalhos rápidos + alertas (placeholder).

---

## F2 — Cartões & faturas

### F2.1 Cartões
- [ ] CRUD cartão (nome, bandeira, last4, limite, `closing_day`, `due_day`, conta padrão de pagamento).
- [ ] Indicador limite usado/disponível.

### F2.2 Faturas (invoices)
- [ ] `assign_invoice(transaction)` — calcula fatura pela data da compra vs fechamento.
- [ ] `recompute_invoice_total` — trigger soma transações da fatura.
- [ ] Tela da fatura: lançamentos do período, total, status (open/closed/paid).
- [ ] `pay_invoice(invoice, account)` — marca paga + cria transferência da conta.

### F2.3 Parcelamento
- [ ] `create_installment_purchase` — gera N filhos (`purchase_id`, `installment_no/total`).
- [ ] Valor da parcela = total/N (último ajusta centavos).
- [ ] Parcelas futuras visíveis por fatura + como comprometido nos meses seguintes.

---

## F3 — Recorrências (contas fixas)

- [ ] CRUD `recurring_rules` (mensal/semanal/anual, dia, início/fim).
- [ ] `generate_recurring(month)` idempotente (não duplica).
- [ ] Supabase Cron (pg_cron) dispara no início do mês + geração sob demanda ao abrir o mês.
- [ ] Visão "contas do mês": pagas vs a pagar, com vencimento.
- [ ] Flag `is_recurring` + link à regra nas transações geradas.

---

## F4 — Planejamento

### F4.1 Orçamentos
- [ ] CRUD orçamento mensal por categoria (`budgets`).
- [ ] Barra de progresso (gasto vs limite).
- [ ] Alertas in-app a 80% e 100%.

### F4.2 Metas
- [ ] CRUD metas (valor alvo, prazo, conta vinculada).
- [ ] Aportes manuais; progresso visual; projeção de prazo.

---

## F5 — Inteligência (dashboards & relatórios)

- [ ] Filtro global de período (mês atual/passado/custom/ano).
- [ ] Gráfico por categoria (pizza/treemap).
- [ ] Tendência mensal (linha/barra, 6/12 meses).
- [ ] Por membro (quem gastou quanto) + por forma de pagamento (conta vs cartão).
- [ ] **Toggle competência ⇄ caixa** nos relatórios de cartão (SPEC decisão #1).
- [ ] Fluxo de caixa projetado (recorrências + parcelas futuras).
- [ ] Acerto do casal — informativo, saldo de splits no período (SPEC decisão #3).
- [ ] Export CSV.

---

## F6 — Polimento

- [ ] PWA (manifest + service worker, instalável).
- [ ] Comprovantes (foto via Supabase Storage).
- [ ] Notificações push/email (fatura, orçamento, conta a vencer).
- [ ] Dark mode fino + acessibilidade AA (foco, labels, contraste).
- [ ] Testes: unit (fatura/parcela/split/recorrência) + e2e lançar (Playwright).
- [ ] Performance (< 2s em 4G), revisão de queries/índices.

---

## Dependências (ordem crítica)
```
F0 ──> F1 ──> F2 ──┐
        └──> F3 ───┼──> F5 ──> F6
             F4 ───┘
```
- F2/F3/F4 dependem de F1 (transações + contas).
- F5 (relatórios) depende de cartões, recorrências e orçamentos existirem.
- F6 fecha tudo.
