import { describe, expect, it } from "vitest";
import vectors from "../../../shared/calculation-vectors.json";
import {
  buildMarketChartData,
  calculatePreview,
  defaultRequest,
  normalizeEvaluationRequest,
  resizeCustomVariations,
  validateEvaluationInputs,
  type EvaluationRequest
} from "./model";

type Vector = {
  name: string;
  inputs: Partial<EvaluationRequest>;
  expected: Record<string, number>;
};

describe("shared frontend/backend calculation vectors", () => {
  it.each(vectors as Vector[])("$name", ({ inputs, expected }) => {
    const preview = calculatePreview({
      ...defaultRequest,
      ...inputs,
      customMarketVariations:
        inputs.customMarketVariations ??
        resizeCustomVariations(defaultRequest.customMarketVariations, inputs.loanTermYears ?? 10)
    });
    const first = preview.comparisonRows[0];
    const final = preview.comparisonRows.at(-1)!;

    expect(preview.marketRows).toHaveLength(expected.rowCount);
    expect(preview.comparisonRows).toHaveLength(expected.rowCount);
    expect(preview.derived.downPaymentAmount).toBeCloseTo(expected.downPaymentAmount, 6);
    expect(preview.derived.purchaseCostAmount).toBeCloseTo(expected.purchaseCostAmount, 6);
    expect(preview.derived.currentRentPerYear).toBeCloseTo(expected.currentRentPerYear, 6);
    expect(preview.derived.serviceChargesYear).toBeCloseTo(expected.serviceChargesYear, 6);
    expect(preview.derived.principalLoan).toBeCloseTo(expected.principalLoan, 6);
    expect(preview.derived.monthlyBankInstalment).toBeCloseTo(
      expected.monthlyBankInstalment,
      6
    );
    expect(preview.derived.totalInterest).toBeCloseTo(expected.totalInterest, 6);
    expect(preview.marketRows[0].selectedMarketVariation).toBeCloseTo(
      expected.firstSelectedVariation,
      10
    );
    expect(preview.marketRows.at(-1)!.selectedMarketVariation).toBeCloseTo(
      expected.finalSelectedVariation,
      10
    );
    expect(first.earlySettlementCost).toBeCloseTo(
      expected.firstEarlySettlementCost,
      6
    );
    expect(final.netTotalResale).toBeCloseTo(expected.finalResale, 6);
    expect(preview.finalOptionsComparison).toBeCloseTo(
      expected.finalOptionsComparison,
      6
    );
  });
});

describe("calculation behavior", () => {
  it("keeps 10 and 25 year row counts exact", () => {
    for (const loanTermYears of [10, 25]) {
      const preview = calculatePreview({
        ...defaultRequest,
        loanTermYears,
        customMarketVariations: resizeCustomVariations(
          defaultRequest.customMarketVariations,
          loanTermYears
        )
      });
      expect(preview.marketRows).toHaveLength(loanTermYears);
      expect(preview.amortizationSummaryRows).toHaveLength(loanTermYears);
    }
  });

  it("uses Default values for blank Custom rows and preserves zero/negative overrides", () => {
    const preview = calculatePreview({
      ...defaultRequest,
      loanTermYears: 3,
      scenario: "Custom",
      customMarketVariations: [null, -0.05, 0]
    });
    expect(preview.marketRows.map((row) => row.selectedMarketVariation)).toEqual([
      0,
      -0.05,
      0
    ]);
  });

  it("supports percentage and fixed amount input modes", () => {
    const percentage = calculatePreview({
      ...defaultRequest,
      downPaymentPct: 0.25,
      purchaseCostPct: 0.04,
      rentYieldPct: 0.08
    });
    expect(percentage.derived.downPaymentAmount).toBe(375000);
    expect(percentage.derived.purchaseCostAmount).toBe(60000);
    expect(percentage.derived.currentRentPerYear).toBe(120000);

    const fixed = calculatePreview({
      ...defaultRequest,
      downPaymentSource: "amount",
      downPaymentAmount: 250000,
      purchaseCostSource: "amount",
      purchaseCostAmount: 50000,
      rentYieldSource: "amount",
      currentRentPerYear: 100000
    });
    expect(fixed.derived.downPaymentAmount).toBe(250000);
    expect(fixed.derived.purchaseCostAmount).toBe(50000);
    expect(fixed.derived.currentRentPerYear).toBe(100000);
  });

  it("adds Year 0 only to chart data", () => {
    const preview = calculatePreview(defaultRequest);
    const chart = buildMarketChartData(preview);
    expect(chart).toHaveLength(preview.inputs.loanTermYears + 1);
    expect(chart[0]).toEqual({
      year: 0,
      variation: 0,
      sellingPrice: preview.inputs.propertyNetPurchasePrice
    });
    expect(preview.marketRows[0].year).toBe(1);
    expect(preview.amortizationRows[0].period).toBe(1);
  });

  it("changes currency labels without converting model values", () => {
    const aed = calculatePreview(defaultRequest);
    const usd = calculatePreview({ ...defaultRequest, currencyCode: "USD" });
    expect(usd.derived).toEqual(aed.derived);
    expect(usd.comparisonRows).toEqual(aed.comparisonRows);
  });
});

describe("invalid numerical input handling", () => {
  it.each([
    ["NaN", { propertyNetPurchasePrice: Number.NaN }],
    [
      "Infinity",
      {
        rentYieldSource: "amount",
        currentRentPerYear: Number.POSITIVE_INFINITY
      }
    ],
    ["negative money", { purchaseCostSource: "amount", purchaseCostAmount: -1 }],
    ["extremely large money", { propertyNetPurchasePrice: 1_000_000_000_001 }],
    ["zero term", { loanTermYears: 0, customMarketVariations: [] }],
    ["invalid percentage", { mortgageRatePct: 1.01 }]
  ])("rejects %s", (_name, overrides) => {
    const request = normalizeEvaluationRequest({
      ...defaultRequest,
      ...(overrides as Partial<EvaluationRequest>)
    });
    expect(validateEvaluationInputs(request).length).toBeGreaterThan(0);
    expect(() => calculatePreview(request)).toThrow();
  });
});
