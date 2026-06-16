import { describe, it, expect } from "vitest";
import { formatCents, toCents, splitInstallments } from "./money";

describe("toCents", () => {
  it("parses pt-BR formatted strings", () => {
    expect(toCents("1.234,56")).toBe(123456);
    expect(toCents("0,99")).toBe(99);
    expect(toCents("100")).toBe(10000);
    expect(toCents("R$ 50,00")).toBe(5000);
  });
  it("parses numbers", () => {
    expect(toCents(12.34)).toBe(1234);
  });
  it("handles garbage as zero", () => {
    expect(toCents("abc")).toBe(0);
  });
});

describe("formatCents", () => {
  it("formats to BRL", () => {
    expect(formatCents(123456)).toContain("1.234,56");
    expect(formatCents(0)).toContain("0,00");
  });
});

describe("splitInstallments", () => {
  it("splits evenly", () => {
    expect(splitInstallments(10000, 2)).toEqual([5000, 5000]);
  });
  it("last absorbs the remainder", () => {
    const parts = splitInstallments(10000, 3);
    expect(parts).toEqual([3333, 3333, 3334]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
  });
  it("single installment", () => {
    expect(splitInstallments(999, 1)).toEqual([999]);
  });
});
