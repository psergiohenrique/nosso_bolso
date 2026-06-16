import { describe, it, expect } from "vitest";
import { computeInvoicePeriod, addMonthsISO, invoiceMonthFor } from "./dates";

describe("computeInvoicePeriod", () => {
  // fecha dia 20, vence dia 27
  it("compra antes do fechamento cai na fatura do mês", () => {
    const p = computeInvoicePeriod(20, 27, new Date("2026-06-05"));
    expect(p.period_end).toBe("2026-06-20");
    expect(p.period_start).toBe("2026-05-21");
    expect(p.due_date).toBe("2026-06-27");
  });

  it("compra depois do fechamento cai na fatura do mês seguinte", () => {
    const p = computeInvoicePeriod(20, 27, new Date("2026-06-25"));
    expect(p.period_end).toBe("2026-07-20");
    expect(p.period_start).toBe("2026-06-21");
    expect(p.due_date).toBe("2026-07-27");
  });

  it("vencimento menor que fechamento vence no mês seguinte", () => {
    // fecha dia 28, vence dia 5
    const p = computeInvoicePeriod(28, 5, new Date("2026-06-10"));
    expect(p.period_end).toBe("2026-06-28");
    expect(p.due_date).toBe("2026-07-05");
  });
});

describe("addMonthsISO", () => {
  it("adds months keeping day", () => {
    expect(addMonthsISO("2026-06-15", 2)).toBe("2026-08-15");
    expect(addMonthsISO("2026-06-15", 0)).toBe("2026-06-15");
  });
  it("clamps day to month length", () => {
    expect(addMonthsISO("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("invoiceMonthFor", () => {
  it("returns next month when after closing", () => {
    expect(invoiceMonthFor(new Date("2026-06-25"), 20).getMonth()).toBe(6); // julho
  });
});
