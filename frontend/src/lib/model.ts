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

export interface AmortizationRow {
  period: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

export interface EvaluationPreview {
  inputs: EvaluationRequest;
  derived: DerivedValues;
  marketRows: MarketRow[];
  comparisonRows: ComparisonRow[];
  amortizationRows: AmortizationRow[];
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

function pmt(rate: number, nper: number, pv: number, fv = 0, paymentType = 0): number {
  if (nper <= 0) {
    throw new Error("nper must be positive");
  }
  if (rate === 0) {
    return -(pv + fv) / nper;
  }
  const factor = (1 + rate) ** nper;
  return -((pv * factor + fv) * rate) / ((1 + rate * paymentType) * (factor - 1));
}

function normalizeCustomVariations(
  values: Array<number | null>,
  loanTermYears: number
): Array<number | null> {
  if (values.length !== loanTermYears) {
    throw new Error("custom market variation rows must match loan term");
  }
  return values;
}

function buildAmortizationSchedule(
  annualRate: number,
  loanTermYears: number,
  loanAmount: number,
  paymentsPerYear = 1,
  periods?: number
): AmortizationRow[] {
  const totalPeriods = loanTermYears * paymentsPerYear;
  const outputPeriods = periods ?? totalPeriods;
  const periodRate = annualRate / paymentsPerYear;
  const payment = pmt(periodRate, totalPeriods, loanAmount);
  let balance = loanAmount;
  const rows: AmortizationRow[] = [];

  for (let period = 1; period <= outputPeriods; period += 1) {
    if (period <= totalPeriods) {
      const interest = -balance * periodRate;
      const principal = payment - interest;
      balance = Math.max(0, balance + principal);
      rows.push({ period, payment, interest, principal, balance });
    } else {
      rows.push({ period, payment: 0, interest: 0, principal: 0, balance: 0 });
    }
  }

  return rows;
}

function selectedVariation(
  scenario: Scenario,
  defaultVariation: number,
  customVariation: number | null
): number {
  if (scenario === "Custom" && customVariation !== null) {
    return customVariation;
  }
  return defaultVariation;
}

export function calculatePreview(inputs: EvaluationRequest): EvaluationPreview {
  const customVariations = normalizeCustomVariations(
    inputs.customMarketVariations,
    inputs.loanTermYears
  );
  const downPaymentAmount = inputs.propertyNetPurchasePrice * inputs.downPaymentPct;
  const purchaseCostAmount = inputs.propertyNetPurchasePrice * inputs.purchaseCostPct;
  const currentRentPerYear = inputs.propertyNetPurchasePrice * inputs.rentYieldPct;
  const serviceChargesYear = inputs.serviceChargePerSqFt * inputs.areaSqFt;
  const totalInitialFundsRequired = downPaymentAmount + purchaseCostAmount;
  const principalLoan = inputs.propertyNetPurchasePrice - downPaymentAmount;
  const amortizationRows = buildAmortizationSchedule(
    inputs.mortgageRatePct,
    inputs.loanTermYears,
    principalLoan
  );
  const yearlyBankInstalment = -amortizationRows[0].payment;
  const monthlyBankInstalment = yearlyBankInstalment / 12;
  const totalBankPayment = yearlyBankInstalment * inputs.loanTermYears;
  const totalInterest = totalBankPayment - principalLoan;

  const derived: DerivedValues = {
    downPaymentAmount,
    purchaseCostAmount,
    currentRentPerYear,
    serviceChargesYear,
    totalInitialFundsRequired,
    principalLoan,
    monthlyBankInstalment,
    yearlyBankInstalment,
    totalBankPayment,
    totalInterest,
    totalInterestPct: principalLoan ? totalInterest / principalLoan : 0,
    serviceChargesMonth: serviceChargesYear / 12,
    netRentalYear: currentRentPerYear - serviceChargesYear,
    totalCost: inputs.propertyNetPurchasePrice + purchaseCostAmount + totalInterest
  };

  const defaultVariations = buildDefaultMarketVariations(inputs.loanTermYears);
  const marketRows: MarketRow[] = defaultVariations.map((defaultMarketVariation, index) => {
    const customMarketVariation = customVariations[index];
    const selectedMarketVariation = selectedVariation(
      inputs.scenario,
      defaultMarketVariation,
      customMarketVariation
    );
    return {
      year: index + 1,
      defaultMarketVariation,
      defaultSellingPrice: inputs.propertyNetPurchasePrice * (1 + defaultMarketVariation),
      customMarketVariation,
      customSellingPrice:
        customMarketVariation === null
          ? null
          : inputs.propertyNetPurchasePrice * (1 + customMarketVariation),
      selectedMarketVariation,
      selectedSellingPrice: inputs.propertyNetPurchasePrice * (1 + selectedMarketVariation)
    };
  });

  const comparisonRows: ComparisonRow[] = [];
  let previousRentalNetTotal = 0;
  let previousTotalPrincipal = 0;

  marketRows.forEach((market, index) => {
    const interest = -amortizationRows[index].interest;
    const principal = -amortizationRows[index].principal;
    const yearlyBankInstalments = interest + principal;
    const rent = derived.currentRentPerYear * (1 + market.selectedMarketVariation);
    let fundsAvailable: number;
    let rentalNetTotal: number;
    let totalPrincipal: number;

    if (index === 0) {
      fundsAvailable = totalInitialFundsRequired;
      rentalNetTotal = fundsAvailable * inputs.savingsProfitRatePct;
      totalPrincipal = principal;
    } else {
      const previous = comparisonRows[index - 1];
      fundsAvailable = previous.rentalNetTotal + previous.totalCost - rent;
      rentalNetTotal = previousRentalNetTotal + fundsAvailable * inputs.savingsProfitRatePct;
      totalPrincipal = previousTotalPrincipal + principal;
    }

    const earningOnAvailableFunds = fundsAvailable * inputs.savingsProfitRatePct;
    const totalCost = yearlyBankInstalments + derived.serviceChargesYear;
    const settlementBase = Math.max(0, derived.principalLoan - totalPrincipal);
    const earlySettlementCost = Math.min(10000, settlementBase * inputs.earlyPaymentFeePct);
    const propertyMarketPrice =
      inputs.propertyNetPurchasePrice * (1 + market.selectedMarketVariation);
    const netTotalResale =
      (derived.downPaymentAmount + totalPrincipal) *
        (1 + market.selectedMarketVariation) -
      earlySettlementCost;
    const optionsComparison = netTotalResale - rentalNetTotal - derived.purchaseCostAmount;
    const row: ComparisonRow = {
      year: market.year,
      rent,
      fundsAvailable,
      earningOnAvailableFunds,
      rentalNetTotal,
      yearlyBankInstalments,
      bankInterest: interest,
      bankPrincipal: principal,
      totalPrincipal,
      totalCost,
      earlySettlementCost,
      marketVariation: market.selectedMarketVariation,
      propertyMarketPrice,
      netTotalResale,
      optionsComparison
    };

    comparisonRows.push(row);
    previousRentalNetTotal = rentalNetTotal;
    previousTotalPrincipal = totalPrincipal;
  });

  const amortizationSummaryRows: AmortizationSummaryRow[] = comparisonRows.map((row) => {
    const endingBalance = Math.max(0, derived.principalLoan - row.totalPrincipal);
    return {
      year: row.year,
      interest: row.bankInterest,
      principal: row.bankPrincipal,
      endingBalance,
      totalInstalment: row.yearlyBankInstalments,
      interestPrincipalRatio: row.bankPrincipal ? row.bankInterest / row.bankPrincipal : 0,
      decrease: row.bankPrincipal,
      interestTotalInterestRatio: derived.totalInterest
        ? row.bankInterest / derived.totalInterest
        : 0
    };
  });

  const totals = {
    yearlyBankInstalments: comparisonRows.reduce(
      (sum, row) => sum + row.yearlyBankInstalments,
      0
    ),
    bankInterest: comparisonRows.reduce((sum, row) => sum + row.bankInterest, 0),
    bankPrincipal: comparisonRows.reduce((sum, row) => sum + row.bankPrincipal, 0)
  };

  return {
    inputs,
    derived,
    marketRows,
    comparisonRows,
    amortizationRows,
    amortizationSummaryRows,
    totals,
    finalOptionsComparison:
      comparisonRows.length > 0
        ? comparisonRows[comparisonRows.length - 1].optionsComparison
        : 0
  };
}
