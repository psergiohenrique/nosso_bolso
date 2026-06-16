# Prompt para Claude Design — Telas do app

> Cole o bloco abaixo no Claude Design. Ajuste o que quiser (cores, nome).

---

Design a **mobile-first personal finance app for a couple** (web app, also great on desktop). Name: **"Nosso Bolso"** (placeholder). Language: **Brazilian Portuguese (pt-BR)**, currency **R$ (BRL)**. Built with Next.js + Tailwind + shadcn/ui, charts with Recharts. Produce a clean, modern, trustworthy fintech look — calm, not flashy. Support **light and dark mode**.

## Product context
A couple shares one financial workspace. Both log expenses/income, register credit cards with installments, track fixed (recurring) and variable expenses, set budgets and savings goals, and view dashboards by month / category / member / payment method. Every transaction records **who paid**. Each member has an accent color used across charts.

## Design system
- **Style:** soft, airy fintech. Rounded cards (radius ~16px), subtle shadows, generous spacing, large legible numbers for money.
- **Color:** one calm primary (deep teal or indigo). Semantic: green = income/positive, red = expense/negative, amber = warning (budget near limit). Two member accent colors (e.g. one warm, one cool).
- **Typography:** clean sans (Inter/Geist). Money values prominent and tabular.
- **Money format:** always `R$ 1.234,56` (pt-BR). Negative in red with minus.
- **Components:** shadcn/ui — cards, tabs, sheets (bottom sheet on mobile), dialogs, selects, progress bars, badges, segmented controls.
- **Accessibility:** AA contrast, visible focus, clear labels.

## Layout
- **Mobile:** bottom tab bar with 5 items — `Início`, `Cartões`, **center FAB `+` (Lançar)**, `Relatórios`, `Mais`. FAB opens a bottom sheet.
- **Desktop:** left sidebar with the same items + secondary nav (Contas, Orçamentos, Metas, Categorias, Membros). Content in 2–3 column grids; denser dashboards.

## Screens to design (mobile + desktop for each)

1. **Início (Home / Dashboard)**
   - Header: greeting + month selector.
   - Big summary card: month balance, total income, total expenses, "comprometido" (fixed bills + future installments).
   - "Contas a pagar" list (upcoming fixed bills, due dates, paid/unpaid).
   - Mini chart: spending by category (donut) + quick alerts (budget over limit, invoice closing).
   - Quick-add shortcuts.

2. **Lançar (Add transaction — bottom sheet)**
   - Segmented control: Despesa / Receita / Transferência.
   - Large numeric amount input (R$), category picker (icons), account or card selector, date, "quem pagou" (member toggle with avatars/colors), optional split (50/50 or custom), notes.
   - For card + parceled purchase: number of installments selector showing "12x de R$ 100,00".

3. **Transações (list)**
   - Grouped by day, each row: icon, description, category, member color dot, amount (colored). Filters bar (period, category, account, card, member, search). Swipe/edit actions.

4. **Cartões (list + invoice detail)**
   - Card list: visual credit-card tiles with limit-used progress, closing/due dates.
   - Invoice detail: period, total, status (open/closed/paid), list of transactions + installments, "Pagar fatura" button.

5. **Relatórios (Reports)**
   - Period filter. Toggle **Competência ⇄ Caixa** for card spending.
   - Charts: spending by category (donut/treemap), monthly trend (bar/line, 6–12 months), by member (stacked bar), by payment method (account vs card).
   - "Fluxo projetado" line including future recurring + installments.
   - "Acerto do casal" card: who owes whom this period (informational).

6. **Orçamentos (Budgets)**
   - Per-category cards with progress bars (spent / limit), color states (ok / 80% amber / over red). Add/edit budget.

7. **Metas (Goals)**
   - Goal cards: name, progress ring (saved / target), target date, projection. Add contribution.

8. **Mais / Configurações**
   - Contas, Cartões, Categorias, Membros (couple management + colors), preferências, export CSV, tema.

## Tone & details
- Friendly but precise. Empty states with light illustration + clear CTA.
- Optimistic, fast feel — this is used daily on the phone.
- Show realistic pt-BR sample data (Aluguel, Mercado, iFood, Uber, Academia, Salário, Netflix).
- Deliver: a cohesive component set + the 8 screens in both mobile and desktop, light and dark.
