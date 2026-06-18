export type Scenario = "Default" | "Custom";

export interface EvaluationRequest {
  propertyName: string;
  propertyNetPurchasePrice: number;
  areaSqFt: number;
  downPaymentPct: number;
  purchaseCostPct: number;
  loanTermYears: number;
  mortgageRatePct: number;
  earlyPaymentFeePct: number;
  rentYieldPct: number;
  serviceChargePerSqFt: number;
  savingsProfitRatePct: number;
  scenario: Scenario;
  customMarketVariations: Array<number | null>;
}

export interface DerivedValues {
  downPaymentAmount: number;
  purchaseCostAmount: number;
  currentRentPerYear: number;
  serviceChargesYear: number;
  totalInitialFundsRequired: number;
  principalLoan: number;
  monthlyBankInstalment: number;
  yearlyBankInstalment: number;
  totalBankPayment: number;
  totalInterest: number;
  totalInterestPct: number;
  serviceChargesMonth: number;
  netRentalYear: number;
  totalCost: number;
}

export interface MarketRow {
  year: number;
  defaultMarketVariation: number;
  defaultSellingPrice: number;
  customMarketVariation: number | null;
  customSellingPrice: number | null;
  selectedMarketVariation: number;
  selectedSellingPrice: number;
}

export interface ComparisonRow {
  year: number;
  rent: number;
  fundsAvailable: number;
  earningOnAvailableFunds: number;
  rentalNetTotal: number;
  yearlyBankInstalments: number;
  bankInterest: number;
  bankPrincipal: number;
  totalPrincipal: number;
  totalCost: number;
  earlySettlementCost: number;
  marketVariation: number;
  propertyMarketPrice: number;
  netTotalResale: number;
  optionsComparison: number;
}

export interface AmortizationSummaryRow {
  year: number;
  interest: number;
  principal: number;
  endingBalance: number;
  totalInstalment: number;
  interestPrincipalRatio: number;
  decrease: number;
  interestTotalInterestRatio: number;
}

export interface EvaluationPreview {
  inputs: EvaluationRequest;
  derived: DerivedValues;
  marketRows: MarketRow[];
  comparisonRows: ComparisonRow[];
  amortizationSummaryRows: AmortizationSummaryRow[];
  finalOptionsComparison: number;
  totals: {
    yearlyBankInstalments: number;
    bankInterest: number;
    bankPrincipal: number;
  };
}

export const defaultRequest: EvaluationRequest = {
  propertyName: "2 BR Apartment in Reem Island",
  propertyNetPurchasePrice: 1500000,
  areaSqFt: 1200,
  downPaymentPct: 0.2,
  purchaseCostPct: 0.05,
  loanTermYears: 10,
  mortgageRatePct: 0.037,
  earlyPaymentFeePct: 0.01,
  rentYieldPct: 0.075,
  serviceChargePerSqFt: 13,
  savingsProfitRatePct: 0.05,
  scenario: "Default",
  customMarketVariations: Array.from({ length: 10 }, () => null)
};

export function buildDefaultMarketVariations(loanTermYears: number): number[] {
  return Array.from({ length: loanTermYears }, (_, index) => {
    if (index < 2) {
      return 0;
    }
    return -0.02 * (index - 1);
  });
}

export function resizeCustomVariations(
  values: Array<number | null>,
  loanTermYears: number
): Array<number | null> {
  const next = values.slice(0, loanTermYears);
  while (next.length < loanTermYears) {
    next.push(null);
  }
  return next;
}

export function toPercentInput(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "";
  }
  return String(Number((value * 100).toFixed(4)));
}

export function fromPercentInput(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed / 100 : null;
}

export function money(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 2
  }).format(value);
}

export function numberValue(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    maximumFractionDigits: 2
  }).format(value);
}

export function percent(value: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
