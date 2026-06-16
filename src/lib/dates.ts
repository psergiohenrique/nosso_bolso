import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(d: Date | string, pattern = "dd 'de' MMM"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, pattern, { locale: ptBR });
}

export function monthLabel(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

/** Limites do mês para filtros/queries (YYYY-MM-DD). */
export function monthRange(d: Date) {
  return {
    start: format(startOfMonth(d), "yyyy-MM-dd"),
    end: format(endOfMonth(d), "yyyy-MM-dd"),
  };
}

/**
 * Em qual fatura cai uma compra de cartão.
 * Compra após o dia de fechamento entra na fatura do mês seguinte.
 */
export function invoiceMonthFor(purchaseDate: Date, closingDay: number): Date {
  const d = new Date(purchaseDate);
  if (d.getDate() > closingDay) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Dia do mês com clamp ao último dia (ex.: dia 31 em fevereiro). */
function clampDay(year: number, month0: number, day: number): Date {
  const last = new Date(year, month0 + 1, 0).getDate();
  return new Date(year, month0, Math.min(day, last));
}

export type InvoicePeriod = {
  period_start: string;
  period_end: string;
  due_date: string;
};

/**
 * Período/fechamento/vencimento da fatura que recebe uma compra.
 * period_end = fechamento do mês de referência; period_start = dia após o
 * fechamento anterior; due_date no mês seguinte se vencimento < fechamento.
 */
export function computeInvoicePeriod(
  closingDay: number,
  dueDay: number,
  purchaseDate: Date,
): InvoicePeriod {
  // Lê em UTC: callers passam new Date("YYYY-MM-DD") (meia-noite UTC).
  let refY = purchaseDate.getUTCFullYear();
  let refM = purchaseDate.getUTCMonth();
  if (purchaseDate.getUTCDate() > closingDay) {
    refM += 1;
    if (refM > 11) {
      refM = 0;
      refY += 1;
    }
  }

  const periodEnd = clampDay(refY, refM, closingDay);

  let pm = refM - 1;
  let py = refY;
  if (pm < 0) {
    pm = 11;
    py -= 1;
  }
  const prevClosing = clampDay(py, pm, closingDay);
  const periodStart = new Date(prevClosing);
  periodStart.setDate(periodStart.getDate() + 1);

  let dY = refY;
  let dM = refM;
  if (dueDay < closingDay) {
    dM += 1;
    if (dM > 11) {
      dM = 0;
      dY += 1;
    }
  }
  const dueDate = clampDay(dY, dM, dueDay);

  const iso = (d: Date) => format(d, "yyyy-MM-dd");
  return {
    period_start: iso(periodStart),
    period_end: iso(periodEnd),
    due_date: iso(dueDate),
  };
}

/** Soma meses a uma data ISO, devolvendo ISO (para parcelas). Sem TZ. */
export function addMonthsISO(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm0 = total % 12; // 0-indexed
  const lastDay = new Date(ny, nm0 + 1, 0).getDate();
  const nd = Math.min(d, lastDay);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ny}-${pad(nm0 + 1)}-${pad(nd)}`;
}
