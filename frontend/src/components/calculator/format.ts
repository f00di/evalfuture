import type { CurrencyCode } from "@/lib/model";

export function parseNumericInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return Number.NaN;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function formatInputNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

export function calculatePercent(amount: number, base: number): number {
  return Number.isFinite(amount) && Number.isFinite(base) && base > 0
    ? amount / base
    : Number.NaN;
}

export function compactMoney(value: number, currencyCode: CurrencyCode): string {
  const formatted = new Intl.NumberFormat("en", {
    notation: Math.abs(value) >= 100_000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(value) >= 100_000 ? 1 : 0
  }).format(value);
  return `${currencyCode} ${formatted}`;
}
