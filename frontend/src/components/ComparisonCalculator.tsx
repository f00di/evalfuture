"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import CompactMetricCard from "@/components/site/CompactMetricCard";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import {
  AmountPercentSource,
  AreaUnit,
  CurrencyCode,
  buildDefaultMarketVariations,
  buildMarketChartData,
  calculatePreview,
  currencyOptions,
  defaultRequest,
  EvaluationPreview,
  EvaluationRequest,
  MAX_LOAN_TERM_YEARS,
  MAX_MARKET_VARIATION,
  MIN_MARKET_VARIATION,
  fromPercentInput,
  money,
  normalizeEvaluationRequest,
  numberValue,
  percent,
  resizeCustomVariations,
  validateEvaluationInputs
} from "@/lib/model";
import { generateWorkbookBlob, workbookFilename } from "@/lib/workbook";

const MarketPriceChart = dynamic(() => import("@/components/MarketPriceChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] animate-pulse rounded-panel border border-slate-200 bg-panelBlue/50" />
  )
});

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type AmountPercentValue = {
  amount: number;
  percent: number;
  source: AmountPercentSource;
};

type FieldErrors = {
  customerName: boolean;
  customerEmail: boolean;
  customerPhone: boolean;
  propertyName: boolean;
  currencyCode: boolean;
  propertyNetPurchasePrice: boolean;
  areaValue: boolean;
  areaUnit: boolean;
  downPayment: boolean;
  purchaseCost: boolean;
  loanTermYears: boolean;
  mortgageRatePct: boolean;
  earlyPaymentFee: boolean;
  rentYield: boolean;
  serviceChargePerSqFt: boolean;
  savingsProfitRate: boolean;
};

type DownloadStatus = "idle" | "preparing" | "success" | "fallback" | "error";

const inputClass =
  "numeric h-11 w-full min-w-0 rounded-md border border-slate-300 bg-inputAmber/70 px-3 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20";
const invalidInputClass =
  "border-riskRed bg-[#fff5f5] focus:border-riskRed focus:ring-riskRed/20";

export default function ComparisonCalculator() {
  const [form, setForm] = useState<EvaluationRequest>(defaultRequest);
  const [preview, setPreview] = useState<EvaluationPreview | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const resultsRef = useRef<HTMLElement>(null);
  const validationRef = useRef<HTMLDivElement>(null);

  const normalizedForm = useMemo(() => normalizeEvaluationRequest(form), [form]);
  const validationErrors = useMemo(() => validateForm(form), [form]);
  const fieldErrors = useMemo(() => getFieldErrors(form), [form]);

  useEffect(() => {
    if (!hasGenerated) {
      return;
    }
    if (validationErrors.length > 0) {
      setPreview(null);
      return;
    }
    setPreview(calculatePreview(form));
  }, [form, hasGenerated, validationErrors.length]);

  const updateForm = (updater: (current: EvaluationRequest) => EvaluationRequest) => {
    setForm((current) => normalizeEvaluationRequest(updater(current)));
  };

  const updateField = <K extends keyof EvaluationRequest>(
    key: K,
    value: EvaluationRequest[K]
  ) => {
    updateForm((current) => ({ ...current, [key]: value }));
  };

  const updateLoanTerm = (loanTermYears: number) => {
    updateForm((current) => {
      const rowCount = Number.isFinite(loanTermYears)
        ? Math.max(0, Math.min(MAX_LOAN_TERM_YEARS, Math.trunc(loanTermYears)))
        : 0;
      return {
        ...current,
        loanTermYears,
        customMarketVariations: resizeCustomVariations(current.customMarketVariations, rowCount)
      };
    });
  };

  const updateAmountPercent = (
    keys: {
      amount: keyof EvaluationRequest;
      percent: keyof EvaluationRequest;
      source: keyof EvaluationRequest;
    },
    value: AmountPercentValue
  ) => {
    updateForm((current) => ({
      ...current,
      [keys.amount]: value.amount,
      [keys.percent]: value.percent,
      [keys.source]: value.source
    }));
  };

  const generateComparison = () => {
    setShowValidation(true);
    setDownloadError(null);
    const errors = validateForm(form);
    if (errors.length > 0) {
      setHasGenerated(false);
      setPreview(null);
      window.setTimeout(() => validationRef.current?.focus(), 0);
      return;
    }

    setPreview(calculatePreview(form));
    setHasGenerated(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    }, 50);
  };

  const resetAssumptions = () => {
    const hasChanges = JSON.stringify(form) !== JSON.stringify(defaultRequest);
    if (
      hasChanges &&
      !window.confirm("Reset all entered assumptions and clear the generated results?")
    ) {
      return;
    }
    setForm(defaultRequest);
    setPreview(null);
    setHasGenerated(false);
    setShowValidation(false);
    setDownloadError(null);
    setDownloadStatus("idle");
  };

  const updateCustomVariation = (index: number, value: string) => {
    const parsed = fromPercentInput(value);
    updateForm((current) => {
      const next = resizeCustomVariations(current.customMarketVariations, current.loanTermYears);
      next[index] = parsed;
      return { ...current, customMarketVariations: next };
    });
  };

  const resetCustomVariation = (index: number) => {
    updateForm((current) => {
      const next = resizeCustomVariations(current.customMarketVariations, current.loanTermYears);
      next[index] = null;
      return { ...current, customMarketVariations: next };
    });
  };

  const resetMarketVariations = () => {
    updateForm((current) => ({
      ...current,
      customMarketVariations: Array.from({ length: current.loanTermYears }, () => null)
    }));
  };

  const downloadWorkbook = async () => {
    if (isDownloading) return;
    const errors = validateForm(form);
    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadStatus("preparing");
    try {
      const currentPreview = preview ?? calculatePreview(form);
      let blob: Blob | null = null;
      let usedFallback = false;
      if (apiBaseUrl) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/export`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentPreview.inputs)
          });
          if (!response.ok) throw new Error("Backend export unavailable.");
          blob = await response.blob();
        } catch {
          usedFallback = true;
        }
      }
      blob ??= generateWorkbookBlob(currentPreview);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = workbookFilename(currentPreview.inputs.propertyName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setDownloadStatus(usedFallback ? "fallback" : "success");
    } catch (error) {
      setDownloadError((error as Error).message);
      setDownloadStatus("error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section id="calculator" className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-tealFinance">
          Free Initial Comparison
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">
          Tell us about you, then the property
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slateFinance sm:text-base">
          Enter the assumptions you want the model to use. Results, charts, tables, and the Excel
          download appear after the questionnaire is complete.
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <AssumptionsForm
          form={form}
          normalizedForm={normalizedForm}
          fieldErrors={showValidation ? fieldErrors : null}
          updateField={updateField}
          updateLoanTerm={updateLoanTerm}
          updateAmountPercent={updateAmountPercent}
          updateCustomVariation={updateCustomVariation}
          resetCustomVariation={resetCustomVariation}
          resetMarketVariations={resetMarketVariations}
        />

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm leading-6 text-slateFinance">
            <p className="font-semibold text-navy">Ready to generate your comparison?</p>
            <p>Market variation rows match the selected loan term and are included in the results.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={resetAssumptions}
              variant="outline"
            >
              Reset Assumptions
            </Button>
            <Button
              onClick={generateComparison}
            >
              Generate My Free Comparison
            </Button>
          </div>
        </div>

        {showValidation && validationErrors.length > 0 && (
          <ValidationSummary refTarget={validationRef} errors={validationErrors} />
        )}
      </div>

      {hasGenerated && preview && (
        <ResultsSection
          refTarget={resultsRef}
          preview={preview}
          isDownloading={isDownloading}
          downloadError={downloadError}
          downloadStatus={downloadStatus}
          downloadWorkbook={downloadWorkbook}
        />
      )}
    </section>
  );
}

function AssumptionsForm({
  form,
  normalizedForm,
  fieldErrors,
  updateField,
  updateLoanTerm,
  updateAmountPercent,
  updateCustomVariation,
  resetCustomVariation,
  resetMarketVariations
}: {
  form: EvaluationRequest;
  normalizedForm: EvaluationRequest;
  fieldErrors: FieldErrors | null;
  updateField: <K extends keyof EvaluationRequest>(key: K, value: EvaluationRequest[K]) => void;
  updateLoanTerm: (loanTermYears: number) => void;
  updateAmountPercent: (
    keys: {
      amount: keyof EvaluationRequest;
      percent: keyof EvaluationRequest;
      source: keyof EvaluationRequest;
    },
    value: AmountPercentValue
  ) => void;
  updateCustomVariation: (index: number, value: string) => void;
  resetCustomVariation: (index: number) => void;
  resetMarketVariations: () => void;
}) {
  const initialFunds =
    normalizedForm.downPaymentAmount + normalizedForm.purchaseCostAmount;
  const principalLoan =
    normalizedForm.propertyNetPurchasePrice - normalizedForm.downPaymentAmount;

  return (
    <div className="grid min-w-0 gap-4">
      <nav aria-label="Questionnaire progress" className="overflow-x-auto pb-1">
        <ol className="flex min-w-[720px] items-start">
          {[
            ["Client", "client-details"],
            ["Property", "property-details"],
            ["Purchase & financing", "purchase-financing"],
            ["Rental & charges", "rental-charges"],
            ["Market", "market-assumptions"],
            ["Review", "review-calculate"]
          ].map(([label, id], index) => (
            <li key={id} className="relative flex-1 border-t border-slate-300 pt-4 first:border-tealFinance">
              <a href={`#${id}`} className="group block pr-3 text-xs font-semibold text-slateFinance hover:text-navy">
                <span className="absolute -top-3 left-0 flex size-6 items-center justify-center rounded-full bg-navy text-[11px] text-white group-focus-visible:ring-2 group-focus-visible:ring-tealFinance">
                  {index + 1}
                </span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <FieldGroup
        id="client-details"
        step={1}
        title="Customer Details"
        description="Your details are included in the on-screen summary and Excel comparison."
      >
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <TextField
            label="Customer name"
            value={form.customerName}
            invalid={fieldErrors?.customerName}
            onChange={(value) => updateField("customerName", value)}
          />
          <TextField
            label="Customer email"
            value={form.customerEmail}
            invalid={fieldErrors?.customerEmail}
            inputMode="email"
            onChange={(value) => updateField("customerEmail", value)}
          />
          <TextField
            label="Customer phone"
            value={form.customerPhone}
            invalid={fieldErrors?.customerPhone}
            inputMode="tel"
            onChange={(value) => updateField("customerPhone", value)}
          />
          <TextAreaField
            label="Customer notes / message (optional)"
            value={form.customerNotes}
            onChange={(value) => updateField("customerNotes", value)}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        id="property-details"
        step={2}
        title="Property Details"
        description="Core property details used by the comparison and workbook."
      >
        <TextField
          label="Property name / description"
          value={form.propertyName}
          invalid={fieldErrors?.propertyName}
          onChange={(value) => updateField("propertyName", value)}
        />
        <CurrencySelect
          value={form.currencyCode}
          invalid={fieldErrors?.currencyCode}
          onChange={(value) => updateField("currencyCode", value)}
        />
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <MoneyInput
            label="Property net purchase price"
            value={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.propertyNetPurchasePrice}
            onChange={(value) => updateField("propertyNetPurchasePrice", value)}
          />
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <MoneyInput
              label="Area value"
              value={form.areaValue}
              invalid={fieldErrors?.areaValue}
              onChange={(value) => updateField("areaValue", value)}
            />
            <AreaUnitSelect
              value={form.areaUnit}
              invalid={fieldErrors?.areaUnit}
              onChange={(value) => updateField("areaUnit", value)}
            />
          </div>
        </div>
        <p className="text-xs leading-5 text-slateFinance">
          Service charges are calculated using the area converted to sq. ft.
        </p>
        <Alert tone="info">
          Currency labels the assumptions and results only. Evalfuture. does not perform live
          exchange-rate conversion.
        </Alert>
      </FieldGroup>

      <FieldGroup
        id="purchase-financing"
        step={3}
        title="Purchase & Financing"
        description="Acquisition assumptions, loan term, mortgage rate, and estimated settlement cost."
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <AmountOrPercentInput
            label="Down payment"
            amount={form.downPaymentAmount}
            percent={form.downPaymentPct}
            source={form.downPaymentSource}
            base={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.downPayment}
            onChange={(value) =>
              updateAmountPercent(
                {
                  amount: "downPaymentAmount",
                  percent: "downPaymentPct",
                  source: "downPaymentSource"
                },
                value
              )
            }
          />
          <AmountOrPercentInput
            label="Purchase cost"
            amount={form.purchaseCostAmount}
            percent={form.purchaseCostPct}
            source={form.purchaseCostSource}
            base={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.purchaseCost}
            onChange={(value) =>
              updateAmountPercent(
                {
                  amount: "purchaseCostAmount",
                  percent: "purchaseCostPct",
                  source: "purchaseCostSource"
                },
                value
              )
            }
          />
          <NumberInput
            label="Loan payment period in years"
            value={form.loanTermYears}
            min={1}
            max={MAX_LOAN_TERM_YEARS}
            step={1}
            invalid={fieldErrors?.loanTermYears}
            onChange={updateLoanTerm}
          />
          <PercentInput
            label="Mortgage rate"
            value={form.mortgageRatePct}
            invalid={fieldErrors?.mortgageRatePct}
            onChange={(value) => updateField("mortgageRatePct", value)}
          />
          <div className="xl:col-span-2">
            <AmountOrPercentInput
              label="Early payment fee"
              amountLabel="Fixed currency fee/cap"
              amount={form.earlyPaymentFeeAmount}
              percent={form.earlyPaymentFeePct}
              source={form.earlyPaymentFeeSource}
              base={principalLoan}
              invalid={fieldErrors?.earlyPaymentFee}
              preserveAmountOnPercentChange
              helperText="Percentage mode applies the entered rate to the outstanding settlement balance. Amount mode uses the entered fixed fee, capped at that balance."
              onChange={(value) =>
                updateAmountPercent(
                  {
                    amount: "earlyPaymentFeeAmount",
                    percent: "earlyPaymentFeePct",
                    source: "earlyPaymentFeeSource"
                  },
                  value
                )
              }
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        id="rental-charges"
        step={4}
        title="Rental & Service Charges"
        description="Rental return, service charges, and the savings profit assumption."
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <AmountOrPercentInput
            label="Current rent of property per year"
            amount={form.currentRentPerYear}
            percent={form.rentYieldPct}
            source={form.rentYieldSource}
            base={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.rentYield}
            onChange={(value) =>
              updateAmountPercent(
                {
                  amount: "currentRentPerYear",
                  percent: "rentYieldPct",
                  source: "rentYieldSource"
                },
                value
              )
            }
          />
          <MoneyInput
            label="Service charges per sq. ft/year"
            value={form.serviceChargePerSqFt}
            invalid={fieldErrors?.serviceChargePerSqFt}
            onChange={(value) => updateField("serviceChargePerSqFt", value)}
          />
          <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm">
            <p className="font-medium text-slateFinance">Service charges per year</p>
            <p className="numeric mt-1 font-semibold text-navy">
              {money(
                normalizedForm.serviceChargePerSqFt * normalizedForm.areaSqFt,
                normalizedForm.currencyCode
              )}
            </p>
          </div>
          <div className="xl:col-span-2">
            <AmountOrPercentInput
              label="Profit rate your savings can earn per year"
              amountLabel="First-year earnings"
              amount={form.savingsProfitAmount}
              percent={form.savingsProfitRatePct}
              source={form.savingsProfitRateSource}
              base={initialFunds}
              invalid={fieldErrors?.savingsProfitRate}
              helperText="Currency value is converted into an equivalent first-year rate based on down payment plus purchase cost."
              onChange={(value) =>
                updateAmountPercent(
                  {
                    amount: "savingsProfitAmount",
                    percent: "savingsProfitRatePct",
                    source: "savingsProfitRateSource"
                  },
                  value
                )
              }
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        id="market-assumptions"
        step={5}
        title="Market Assumptions"
        description="Review and edit yearly market assumptions before generating the comparison."
      >
        <MarketAssumptionsInput
          form={normalizedForm}
          updateField={updateField}
          updateCustomVariation={updateCustomVariation}
          resetCustomVariation={resetCustomVariation}
          resetMarketVariations={resetMarketVariations}
        />
      </FieldGroup>

      <FieldGroup
        id="review-calculate"
        step={6}
        title="Review & Calculate"
        description="Check the central assumptions below. You can return to any section before generating results."
      >
        <dl className="grid gap-3 rounded-control border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <ReviewItem label="Property price" value={money(normalizedForm.propertyNetPurchasePrice, normalizedForm.currencyCode)} />
          <ReviewItem label="Initial funds" value={money(initialFunds, normalizedForm.currencyCode)} />
          <ReviewItem label="Principal loan" value={money(principalLoan, normalizedForm.currencyCode)} />
          <ReviewItem label="Loan term" value={`${normalizedForm.loanTermYears} years`} />
          <ReviewItem label="Annual rent" value={money(normalizedForm.currentRentPerYear, normalizedForm.currencyCode)} />
          <ReviewItem label="Market scenario" value={normalizedForm.scenario} />
        </dl>
        <p className="text-xs leading-5 text-slateFinance">
          Results are estimates under the entered assumptions. Year 0 is used only as a chart
          baseline and is not added to payment or amortization rows.
        </p>
      </FieldGroup>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slateFinance">{label}</dt>
      <dd className="numeric mt-1 font-semibold text-navy">{value}</dd>
    </div>
  );
}

function ResultsSection({
  refTarget,
  preview,
  isDownloading,
  downloadError,
  downloadStatus,
  downloadWorkbook
}: {
  refTarget: React.RefObject<HTMLElement | null>;
  preview: EvaluationPreview;
  isDownloading: boolean;
  downloadError: string | null;
  downloadStatus: DownloadStatus;
  downloadWorkbook: () => void;
}) {
  const motionRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(() => buildMarketChartData(preview), [preview]);

  useEffect(() => {
    const node = motionRef.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    void import("animejs").then(({ animate, stagger }) => {
      if (cancelled) return;
      animate(node.querySelectorAll("[data-result-reveal]"), {
        opacity: { from: 0 },
        y: { from: 12 },
        delay: stagger(65),
        duration: 480,
        ease: "out(3)"
      });
    });
    return () => {
      cancelled = true;
    };
  }, [preview]);

  const finalRow = preview.comparisonRows.at(-1)!;
  const outcomeDirection =
    preview.finalOptionsComparison === 0
      ? "The compared outcomes are equal"
      : preview.finalOptionsComparison > 0
        ? "The financed purchase outcome is higher"
        : "The rental outcome is higher";

  return (
    <section
      ref={refTarget}
      id="results"
      tabIndex={-1}
      aria-labelledby="comparison-result-heading"
      className="scroll-mt-24 border-t border-slate-200 bg-creamFinance/60 outline-none"
    >
      <div ref={motionRef} className="p-4 sm:p-6">
        <div data-result-reveal className="grid gap-5 rounded-panel bg-navy p-5 text-white sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-[#9FE3D9]">Comparison result · {preview.inputs.scenario} scenario</p>
            <h2 id="comparison-result-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">
              {outcomeDirection} at Year {finalRow.year}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
              This describes the model outcome under the values entered. It does not identify a
              universally better property decision.
            </p>
          </div>
          <div className="border-l border-white/20 pl-5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-300">Options comparison</p>
            <p className="numeric mt-1 text-2xl font-semibold">{money(preview.finalOptionsComparison, preview.inputs.currencyCode)}</p>
          </div>
        </div>

        {downloadError && (
          <Alert tone="error" live className="mt-4">{downloadError}</Alert>
        )}

        <div data-result-reveal className="mt-6 grid gap-5">
          <CustomerSummary preview={preview} />
          <KpiCards preview={preview} />
        </div>

        <div data-result-reveal className="mt-6 grid min-w-0 gap-5">
          <ResultBreakdown preview={preview} />
          <CalculatorBlock
            title="Property Market Price Fluctuations"
            detail="The chart starts with the display-only Year 0 baseline. Open the data alternative below for exact values."
          >
            <MarketPriceChart chartData={chartData} currencyCode={preview.inputs.currencyCode} />
            <details className="mt-3 rounded-control border border-slate-200">
              <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold text-navy">
                View chart data as a table
              </summary>
              <div className="table-scroll-region overflow-x-auto border-t border-slate-200">
                <table className="w-full min-w-[480px] text-sm">
                  <caption className="sr-only">Selected market price data including the display-only Year 0 baseline.</caption>
                  <thead className="bg-panelBlue text-navy">
                    <tr><Th>Year</Th><Th>Market variation</Th><Th>Selling price</Th></tr>
                  </thead>
                  <tbody>
                    {chartData.map((row) => (
                      <tr key={row.year} className="border-t border-slate-200">
                        <Td>{row.year}</Td>
                        <Td>{percent(row.variation)}</Td>
                        <Td>{money(row.sellingPrice, preview.inputs.currencyCode)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </CalculatorBlock>
        </div>

        <div data-result-reveal><DetailedTables preview={preview} /></div>

        <div data-result-reveal className="mt-6 rounded-panel border border-slate-200 bg-white p-5 text-center">
          <h3 className="text-lg font-semibold text-navy">Download your full comparison</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slateFinance">
            The GitHub Pages version creates a formatted two-sheet workbook in your browser.
          </p>
          <Button
            onClick={downloadWorkbook}
            disabled={isDownloading}
            variant="secondary"
            className="mt-4"
          >
            {isDownloading && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {isDownloading ? "Preparing XLSX..." : "Download Excel Comparison"}
          </Button>
          <div className="mx-auto mt-3 max-w-2xl" aria-live="polite">
            {downloadStatus === "success" && <p className="text-sm text-positiveGreen">Your workbook download started successfully.</p>}
            {downloadStatus === "fallback" && <p className="text-sm text-positiveGreen">The backend export was unavailable, so the browser workbook was downloaded instead.</p>}
            {downloadStatus === "error" && <p className="text-sm text-riskRed">The workbook could not be prepared. Review the error above and try again.</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth";
              document.getElementById("client-details")?.scrollIntoView({ behavior });
            }}
            className="mt-4 min-h-11 text-sm font-semibold text-tealFinance underline decoration-tealFinance/30 underline-offset-4"
          >
            Edit assumptions
          </button>
        </div>
      </div>
    </section>
  );
}

function ResultBreakdown({ preview }: { preview: EvaluationPreview }) {
  const final = preview.comparisonRows.at(-1)!;
  const blocks = [
    {
      title: "Financing",
      items: [
        ["Principal loan", money(preview.derived.principalLoan, preview.inputs.currencyCode)],
        ["Total interest", money(preview.derived.totalInterest, preview.inputs.currencyCode)],
        ["Monthly instalment", money(preview.derived.monthlyBankInstalment, preview.inputs.currencyCode)]
      ]
    },
    {
      title: "Rental & charges",
      items: [
        ["Annual rent", money(preview.derived.currentRentPerYear, preview.inputs.currencyCode)],
        ["Annual service charges", money(preview.derived.serviceChargesYear, preview.inputs.currencyCode)],
        ["Net rental/year", money(preview.derived.netRentalYear, preview.inputs.currencyCode)]
      ]
    },
    {
      title: "Resale & settlement",
      items: [
        [`Year ${final.year} market price`, money(final.propertyMarketPrice, preview.inputs.currencyCode)],
        ["Early settlement cost", money(final.earlySettlementCost, preview.inputs.currencyCode)],
        ["Net total / resale", money(final.netTotalResale, preview.inputs.currencyCode)]
      ]
    }
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {blocks.map((block) => (
        <section key={block.title} className="rounded-panel border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-navy">{block.title}</h3>
          <dl className="mt-3 divide-y divide-slate-200 text-sm">
            {block.items.map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2">
                <dt className="text-slateFinance">{label}</dt>
                <dd className="numeric text-right font-semibold text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}

function FieldGroup({
  id,
  step,
  title,
  description,
  children
}: {
  id?: string;
  step?: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-24 rounded-panel border border-slate-200 bg-creamFinance/70 p-4 sm:p-5">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          {step && <span className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">{step}</span>}
          <h3 className="text-base font-semibold text-navy">{title}</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-slateFinance">{description}</p>
      </div>
      <div className="mt-4 grid min-w-0 gap-3">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  invalid,
  inputMode,
  onChange
}: {
  label: string;
  value: string;
  invalid?: boolean;
  inputMode?: "email" | "tel" | "text";
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${invalid ? invalidInputClass : ""}`}
        aria-invalid={invalid ? "true" : undefined}
        required={!label.includes("(optional)")}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm lg:col-span-2">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} h-auto min-h-24 py-3`}
      />
    </label>
  );
}

function MoneyInput({
  label,
  value,
  invalid,
  onChange
}: {
  label: string;
  value: number;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <NumericTextInput value={value} invalid={invalid} onChange={onChange} />
    </label>
  );
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  invalid,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <NumericTextInput
        value={value}
        min={min}
        max={max}
        step={step}
        invalid={invalid}
        onChange={onChange}
      />
    </label>
  );
}

function PercentInput({
  label,
  value,
  allowNegative = false,
  invalid,
  onChange
}: {
  label: string;
  value: number;
  allowNegative?: boolean;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <InputWithSuffix
        value={Number.isFinite(value) ? value * 100 : Number.NaN}
        suffix="%"
        allowNegative={allowNegative}
        invalid={invalid}
        onChange={(nextValue) => onChange(Number.isFinite(nextValue) ? nextValue / 100 : Number.NaN)}
      />
    </label>
  );
}

function AmountOrPercentInput({
  label,
  amount,
  percent: percentValue,
  source,
  base,
  amountLabel = "Currency value",
  percentLabel = "%",
  helperText,
  invalid,
  preserveAmountOnPercentChange = false,
  onChange
}: {
  label: string;
  amount: number;
  percent: number;
  source: AmountPercentSource;
  base: number;
  amountLabel?: string;
  percentLabel?: string;
  helperText?: string;
  invalid?: boolean;
  preserveAmountOnPercentChange?: boolean;
  onChange: (value: AmountPercentValue) => void;
}) {
  const activeAmount = source === "amount";
  const activePercent = source === "percent";

  const updateAmount = (nextAmount: number) => {
    onChange({
      amount: nextAmount,
      percent: calculatePercent(nextAmount, base),
      source: "amount"
    });
  };

  const updatePercent = (nextPercentDisplayValue: number) => {
    const nextPercent = Number.isFinite(nextPercentDisplayValue)
      ? nextPercentDisplayValue / 100
      : Number.NaN;
    onChange({
      amount:
        preserveAmountOnPercentChange || !Number.isFinite(base) || base <= 0
          ? amount
          : base * nextPercent,
      percent: nextPercent,
      source: "percent"
    });
  };

  return (
    <div className="grid min-w-0 gap-1.5 text-sm">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="font-medium leading-5 text-slateFinance">{label}</span>
        <div className="inline-flex w-fit rounded-control border border-slate-300 bg-white p-0.5" role="group" aria-label={`${label} input mode`}>
          <button
            type="button"
            aria-pressed={activeAmount}
            onClick={() => updateAmount(amount)}
            className={`min-h-9 rounded-[6px] px-3 text-xs font-semibold transition ${activeAmount ? "bg-navy text-white shadow-sm" : "text-slateFinance hover:text-navy"}`}
          >
            {amountLabel}
          </button>
          <button
            type="button"
            aria-pressed={activePercent}
            onClick={() => updatePercent(Number.isFinite(percentValue) ? percentValue * 100 : 0)}
            className={`min-h-9 rounded-[6px] px-3 text-xs font-semibold transition ${activePercent ? "bg-navy text-white shadow-sm" : "text-slateFinance hover:text-navy"}`}
          >
            {percentLabel}
          </button>
        </div>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <CompactNumberInput
          label={amountLabel}
          value={amount}
          invalid={invalid && activeAmount}
          active={activeAmount}
          onChange={updateAmount}
        />
        <CompactNumberInput
          label={percentLabel}
          value={Number.isFinite(percentValue) ? percentValue * 100 : Number.NaN}
          suffix="%"
          invalid={invalid && activePercent}
          active={activePercent}
          onChange={updatePercent}
        />
      </div>
      {helperText && <p className="text-xs leading-5 text-slateFinance">{helperText}</p>}
    </div>
  );
}

function CompactNumberInput({
  label,
  value,
  suffix,
  invalid,
  active,
  onChange
}: {
  label: string;
  value: number;
  suffix?: string;
  invalid?: boolean;
  active?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label
      className={`grid min-w-0 gap-1 rounded-md border bg-white p-2 ${
        active ? "border-tealFinance/60" : "border-slate-200"
      }`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slateFinance">
        {label}
      </span>
      {suffix ? (
        <InputWithSuffix value={value} suffix={suffix} invalid={invalid} onChange={onChange} />
      ) : (
        <NumericTextInput value={value} invalid={invalid} onChange={onChange} />
      )}
    </label>
  );
}

function AreaUnitSelect({
  value,
  invalid,
  onChange
}: {
  value: AreaUnit;
  invalid?: boolean;
  onChange: (value: AreaUnit) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">Area unit</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AreaUnit)}
        className={`${inputClass} ${invalid ? invalidInputClass : ""}`}
      >
        <option value="sq. ft">sq. ft</option>
        <option value="sq. m">sq. m</option>
      </select>
    </label>
  );
}

function CurrencySelect({
  value,
  invalid,
  onChange
}: {
  value: CurrencyCode;
  invalid?: boolean;
  onChange: (value: CurrencyCode) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">Currency</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CurrencyCode)}
        className={`${inputClass} ${invalid ? invalidInputClass : ""}`}
      >
        {currencyOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InputWithSuffix({
  value,
  suffix,
  allowNegative = false,
  invalid,
  ariaLabel,
  onChange
}: {
  value: number;
  suffix: string;
  allowNegative?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className={`flex h-11 min-w-0 overflow-hidden rounded-md border border-slate-300 bg-inputAmber/70 transition focus-within:border-tealFinance focus-within:ring-2 focus-within:ring-tealFinance/20 ${
        invalid ? invalidInputClass : ""
      }`}
    >
      <NumericTextInput
        value={value}
        allowNegative={allowNegative}
        embedded
        ariaLabel={ariaLabel}
        onChange={onChange}
      />
      <span className="flex h-full w-9 shrink-0 items-center justify-center border-l border-slate-300 text-xs font-semibold text-slateFinance">
        {suffix}
      </span>
    </div>
  );
}

function NumericTextInput({
  value,
  min,
  max,
  step,
  allowNegative = false,
  embedded = false,
  invalid,
  ariaLabel,
  onChange
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  embedded?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(formatInputNumber(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatInputNumber(value));
    }
  }, [isFocused, value]);

  const handleChange = (nextDraft: string) => {
    setDraft(nextDraft);
    const parsed = parseNumericInput(nextDraft);
    onChange(parsed);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseNumericInput(draft);
    if (Number.isFinite(parsed)) {
      setDraft(formatInputNumber(parsed));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={draft}
      min={min}
      max={max}
      step={step}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onChange={(event) => handleChange(event.target.value)}
      className={
        embedded
          ? "numeric h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-navy outline-none"
          : `${inputClass} ${invalid ? invalidInputClass : ""}`
      }
      aria-invalid={invalid ? "true" : undefined}
      aria-label={ariaLabel}
      data-allow-negative={allowNegative ? "true" : "false"}
    />
  );
}

function CustomerSummary({ preview }: { preview: EvaluationPreview }) {
  const { customerName, customerEmail, customerPhone, customerNotes } = preview.inputs;
  return (
    <CalculatorBlock title="Customer Summary">
      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-medium text-slateFinance">Name</dt>
          <dd className="mt-1 font-semibold text-navy">{customerName}</dd>
        </div>
        <div>
          <dt className="font-medium text-slateFinance">Email</dt>
          <dd className="mt-1 break-all font-semibold text-navy">{customerEmail}</dd>
        </div>
        <div>
          <dt className="font-medium text-slateFinance">Phone</dt>
          <dd className="mt-1 font-semibold text-navy">{customerPhone}</dd>
        </div>
        {customerNotes && (
          <div className="sm:col-span-3">
            <dt className="font-medium text-slateFinance">Notes / message</dt>
            <dd className="mt-1 whitespace-pre-wrap text-navy">{customerNotes}</dd>
          </div>
        )}
      </dl>
    </CalculatorBlock>
  );
}

function KpiCards({ preview }: { preview: EvaluationPreview }) {
  const finalRow = preview.comparisonRows[preview.comparisonRows.length - 1];
  const currencyCode = preview.inputs.currencyCode;
  const items: Array<{
    label: string;
    value: string;
    detail?: string;
    tone?: "default" | "positive" | "risk";
  }> = [
    {
      label: "Principal loan",
      value: compactMoney(preview.derived.principalLoan, currencyCode),
      detail: money(preview.derived.principalLoan, currencyCode)
    },
    {
      label: "Monthly instalment",
      value: compactMoney(preview.derived.monthlyBankInstalment, currencyCode),
      detail: money(preview.derived.monthlyBankInstalment, currencyCode)
    },
    {
      label: "Total bank payment",
      value: compactMoney(preview.derived.totalBankPayment, currencyCode),
      detail: money(preview.derived.totalBankPayment, currencyCode)
    },
    {
      label: "Total interest",
      value: compactMoney(preview.derived.totalInterest, currencyCode),
      detail: money(preview.derived.totalInterest, currencyCode)
    },
    {
      label: "Down payment",
      value: compactMoney(preview.derived.downPaymentAmount, currencyCode),
      detail: money(preview.derived.downPaymentAmount, currencyCode)
    },
    {
      label: "Purchase cost",
      value: compactMoney(preview.derived.purchaseCostAmount, currencyCode),
      detail: money(preview.derived.purchaseCostAmount, currencyCode)
    },
    {
      label: "Service Charges/year",
      value: compactMoney(preview.derived.serviceChargesYear, currencyCode),
      detail: money(preview.derived.serviceChargesYear, currencyCode)
    },
    {
      label: "Net rental/year",
      value: compactMoney(preview.derived.netRentalYear, currencyCode),
      detail: money(preview.derived.netRentalYear, currencyCode)
    },
    {
      label: "Total cost",
      value: compactMoney(preview.derived.totalCost, currencyCode),
      detail: money(preview.derived.totalCost, currencyCode)
    },
    {
      label: `Year ${finalRow.year} options comparison`,
      value: compactMoney(preview.finalOptionsComparison, currencyCode),
      detail: money(preview.finalOptionsComparison, currencyCode),
      tone: preview.finalOptionsComparison < 0 ? "risk" : "positive"
    }
  ];

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <CompactMetricCard
          key={item.label}
          label={item.label}
          value={item.value}
          detail={item.detail}
          tone={item.tone}
        />
      ))}
    </div>
  );
}

function MarketAssumptionsInput({
  form,
  updateField,
  updateCustomVariation,
  resetCustomVariation,
  resetMarketVariations
}: {
  form: EvaluationRequest;
  updateField: <K extends keyof EvaluationRequest>(key: K, value: EvaluationRequest[K]) => void;
  updateCustomVariation: (index: number, value: string) => void;
  resetCustomVariation: (index: number) => void;
  resetMarketVariations: () => void;
}) {
  const defaultVariations = buildDefaultMarketVariations(form.loanTermYears);

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slateFinance">
          Select Default, or choose Custom and enter overrides for individual years.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-medium text-slateFinance">
            Scenario
            <select
              value={form.scenario}
              onChange={(event) => updateField("scenario", event.target.value as EvaluationRequest["scenario"])}
              className={`${inputClass} h-10 min-w-32 bg-inputAmber/70`}
            >
              <option value="Default">Default</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          <button
            type="button"
            onClick={resetMarketVariations}
            className="h-10 w-fit rounded-md border border-tealFinance bg-white px-3 text-sm font-semibold text-tealFinance transition hover:bg-tealFinance hover:text-white"
          >
            Clear Custom Values
          </button>
        </div>
      </div>
      <div className="scrollbar-soft overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-xs sm:text-sm">
          <caption className="sr-only">
            Default and custom annual market assumptions. Blank Custom values use the
            corresponding Default value.
          </caption>
          <thead className="sticky top-0 z-10 bg-navy text-white">
            <tr>
              <Th>Year</Th>
              <Th>Default Variation</Th>
              <Th>Default Selling Price</Th>
              <Th>Custom Variation</Th>
              <Th>Selected Selling Price</Th>
            </tr>
          </thead>
          <tbody>
            {defaultVariations.map((defaultVariation, index) => {
              const customVariation = form.customMarketVariations[index];
              const isCustom = customVariation !== null;
              const selectedVariation =
                form.scenario === "Custom" && customVariation !== null
                  ? customVariation
                  : defaultVariation;
              return (
                <tr key={index + 1} className="border-t border-slate-200">
                  <Td>{index + 1}</Td>
                  <Td>{percent(defaultVariation)}</Td>
                  <Td>{money(form.propertyNetPurchasePrice * (1 + defaultVariation), form.currencyCode)}</Td>
                  <td className="px-2 py-2 align-top">
                    <div className="grid min-w-[150px] gap-1">
                      <InputWithSuffix
                        value={customVariation === null ? Number.NaN : customVariation * 100}
                        suffix="%"
                        allowNegative
                        ariaLabel={`Year ${index + 1} custom market variation`}
                        onChange={(value) =>
                          updateCustomVariation(
                            index,
                            Number.isFinite(value) ? String(value) : ""
                          )
                        }
                      />
                      <div className="flex items-center justify-end gap-2">
                        {isCustom && (
                          <span className="rounded-full bg-panelBlue px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tealFinance">
                            Custom
                          </span>
                        )}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => resetCustomVariation(index)}
                            className="text-xs font-semibold text-slateFinance transition hover:text-tealFinance"
                          >
                            Reset row
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <Td>{money(form.propertyNetPurchasePrice * (1 + selectedVariation), form.currencyCode)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailedTables({ preview }: { preview: EvaluationPreview }) {
  return (
    <section className="mt-6 grid gap-4">
      <details className="rounded-lg border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-navy">
          Detailed Rent vs Buying Comparison
        </summary>
        <div className="border-t border-slate-200 p-4">
          <ComparisonTable preview={preview} />
        </div>
      </details>
      <details className="rounded-lg border border-slate-200 bg-white">
        <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-navy">
          Amortization Schedule
        </summary>
        <div className="border-t border-slate-200 p-4">
          <AmortizationSummary preview={preview} />
        </div>
      </details>
    </section>
  );
}

function ComparisonTable({ preview }: { preview: EvaluationPreview }) {
  const currencyCode = preview.inputs.currencyCode;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-navy">Rental vs Buying Comparison</h3>
          <p className="text-sm text-slateFinance">
            Year-by-year rent, financing, resale, and cost view.
          </p>
        </div>
        <span className="text-sm font-semibold text-tealFinance">
          {preview.comparisonRows.length} rows
        </span>
      </div>
      <div className="scrollbar-soft max-w-full overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-max min-w-[1800px] text-xs">
          <caption className="sr-only">
            Year-by-year rental and financed buying comparison for the selected assumptions.
          </caption>
          <thead className="sticky top-0 z-20">
            <tr className="bg-panelBlue text-center text-navy">
              <Th className="sticky left-0 z-30 bg-panelBlue">Year</Th>
              <Th colSpan={4}>Rental Option</Th>
              <Th colSpan={9}>Buying Option</Th>
              <Th>Options Comparison</Th>
            </tr>
            <tr className="bg-navy text-white">
              {[
                "Year",
                "Rent",
                "Funds Available",
                "Earning on Funds",
                "Net Total",
                "Yearly Inst.",
                "Interest",
                "Principal",
                "Total Principal",
                "Total Cost",
                "Settlement Cost",
                "Market Variation",
                "Market Price",
                "Net Total / Resale",
                "Comparison"
              ].map((header, index) => (
                <Th key={header} className={index === 0 ? "sticky left-0 z-30 bg-navy" : ""}>{header}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.comparisonRows.map((row) => (
              <tr key={row.year} className="border-t border-slate-200">
                <Td className="sticky left-0 z-10 bg-white font-semibold text-navy">{row.year}</Td>
                <Td>{money(row.rent, currencyCode)}</Td>
                <Td>{money(row.fundsAvailable, currencyCode)}</Td>
                <Td>{money(row.earningOnAvailableFunds, currencyCode)}</Td>
                <Td>{money(row.rentalNetTotal, currencyCode)}</Td>
                <Td>{money(row.yearlyBankInstalments, currencyCode)}</Td>
                <Td>{money(row.bankInterest, currencyCode)}</Td>
                <Td>{money(row.bankPrincipal, currencyCode)}</Td>
                <Td>{money(row.totalPrincipal, currencyCode)}</Td>
                <Td>{money(row.totalCost, currencyCode)}</Td>
                <Td>{money(row.earlySettlementCost, currencyCode)}</Td>
                <Td>{percent(row.marketVariation)}</Td>
                <Td>{money(row.propertyMarketPrice, currencyCode)}</Td>
                <Td>{money(row.netTotalResale, currencyCode)}</Td>
                <Td className={row.optionsComparison < 0 ? "text-riskRed" : "text-positiveGreen"}>
                  {money(row.optionsComparison, currencyCode)}
                </Td>
              </tr>
            ))}
            <tr className="border-t border-goldFinance bg-inputAmber font-semibold">
              <Td className="sticky left-0 z-10 bg-inputAmber text-left text-navy">Total</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>{money(preview.totals.yearlyBankInstalments, currencyCode)}</Td>
              <Td>{money(preview.totals.bankInterest, currencyCode)}</Td>
              <Td>{money(preview.totals.bankPrincipal, currencyCode)}</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-3 rounded-md border border-tealFinance/20 bg-panelBlue px-3 py-2 text-sm text-navy">
        <span className="font-semibold">Final result (Year {preview.comparisonRows.at(-1)?.year}):</span>{" "}
        <span className={preview.finalOptionsComparison < 0 ? "text-riskRed" : "text-positiveGreen"}>
          {money(preview.finalOptionsComparison, currencyCode)}
        </span>
      </div>
    </div>
  );
}

function AmortizationSummary({ preview }: { preview: EvaluationPreview }) {
  const currencyCode = preview.inputs.currencyCode;

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-navy">Amortization Calculator</h3>
          <p className="text-sm text-slateFinance">
            Annual mortgage payment, interest, principal, and balance view.
          </p>
        </div>
        <span className="text-sm font-semibold text-tealFinance">
          {preview.amortizationSummaryRows.length} years
        </span>
      </div>
      <div className="scrollbar-soft max-w-full overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-max min-w-[1080px] text-xs">
          <caption className="sr-only">
            Annual mortgage interest, principal, ending balance, and instalment summary.
          </caption>
          <thead className="sticky top-0 z-20 bg-navy text-white">
            <tr>
              {[
                "Year",
                "Interest",
                "Principal",
                "Ending Balance",
                "Total Instalment",
                "Interest / Principal",
                "Decrease",
                "Interest / Total Interest"
              ].map((header) => (
                <Th key={header}>{header}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.amortizationSummaryRows.map((row) => (
              <tr key={row.year} className="border-t border-slate-200">
                <Td className="sticky left-0 z-10 bg-white font-semibold text-navy">{row.year}</Td>
                <Td>{money(row.interest, currencyCode)}</Td>
                <Td>{money(row.principal, currencyCode)}</Td>
                <Td>{money(row.endingBalance, currencyCode)}</Td>
                <Td>{money(row.totalInstalment, currencyCode)}</Td>
                <Td>{percent(row.interestPrincipalRatio)}</Td>
                <Td>{money(row.decrease, currencyCode)}</Td>
                <Td>{percent(row.interestTotalInterestRatio)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalculatorBlock({
  title,
  detail,
  children
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        {detail && <p className="mt-1 text-sm leading-6 text-slateFinance">{detail}</p>}
      </div>
      {children}
    </section>
  );
}

function ValidationSummary({
  refTarget,
  errors
}: {
  refTarget: React.RefObject<HTMLDivElement | null>;
  errors: string[];
}) {
  return (
    <section
      ref={refTarget}
      tabIndex={-1}
      role="alert"
      aria-labelledby="validation-summary-heading"
      className="mt-5 rounded-md border border-riskRed/20 bg-[#fff7f7] p-4 text-sm text-riskRed outline-none"
    >
      <p id="validation-summary-heading" className="font-semibold">
        Please complete these fields before generating results:
      </p>
      <ul className="mt-2 grid gap-1">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </section>
  );
}

function Th({ children, colSpan, className = "" }: { children: ReactNode; colSpan?: number; className?: string }) {
  return (
    <th
      colSpan={colSpan}
      className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`numeric whitespace-nowrap px-3 py-2 text-right text-slateFinance ${className}`}>
      {children}
    </td>
  );
}

function parseNumericInput(value: string): number {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return Number.NaN;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatInputNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

function calculatePercent(amount: number, base: number): number {
  return Number.isFinite(amount) && Number.isFinite(base) && base > 0
    ? amount / base
    : Number.NaN;
}

function compactMoney(value: number, currencyCode: CurrencyCode): string {
  const formatted = new Intl.NumberFormat("en", {
    notation: Math.abs(value) >= 100_000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(value) >= 100_000 ? 1 : 0
  }).format(value);
  return `${currencyCode} ${formatted}`;
}

function validNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function validPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function getFieldErrors(form: EvaluationRequest): FieldErrors {
  const phoneDigits = form.customerPhone.replace(/\D/g, "");
  const validPercent = (value: number) =>
    Number.isFinite(value) && value >= 0 && value <= 1;
  const validMoney = (value: number) =>
    Number.isFinite(value) && value >= 0 && value <= 1_000_000_000_000;
  const validPairInRange = (
    amount: number,
    percentage: number,
    source: AmountPercentSource
  ) => (source === "amount" ? validMoney(amount) : validPercent(percentage));
  return {
    customerName: !form.customerName.trim(),
    customerEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim()),
    customerPhone: phoneDigits.length < 7 || phoneDigits.length > 15,
    propertyName: !form.propertyName.trim(),
    currencyCode: !currencyOptions.some((option) => option.code === form.currencyCode),
    propertyNetPurchasePrice:
      !validPositive(form.propertyNetPurchasePrice) ||
      form.propertyNetPurchasePrice > 1_000_000_000_000,
    areaValue: !validPositive(form.areaValue) || form.areaValue > 1_000_000_000,
    areaUnit: form.areaUnit !== "sq. ft" && form.areaUnit !== "sq. m",
    downPayment:
      !validPairInRange(
        form.downPaymentAmount,
        form.downPaymentPct,
        form.downPaymentSource
      ) ||
      normalizeEvaluationRequest(form).downPaymentAmount > form.propertyNetPurchasePrice,
    purchaseCost: !validPairInRange(
      form.purchaseCostAmount,
      form.purchaseCostPct,
      form.purchaseCostSource
    ),
    loanTermYears:
      !Number.isInteger(form.loanTermYears) ||
      form.loanTermYears < 1 ||
      form.loanTermYears > MAX_LOAN_TERM_YEARS,
    mortgageRatePct: !validPercent(form.mortgageRatePct),
    earlyPaymentFee: !validPairInRange(
      form.earlyPaymentFeeAmount,
      form.earlyPaymentFeePct,
      form.earlyPaymentFeeSource
    ),
    rentYield: !validPairInRange(
      form.currentRentPerYear,
      form.rentYieldPct,
      form.rentYieldSource
    ),
    serviceChargePerSqFt:
      !validNonNegative(form.serviceChargePerSqFt) ||
      form.serviceChargePerSqFt > 1_000_000,
    savingsProfitRate: !validPairInRange(
      form.savingsProfitAmount,
      form.savingsProfitRatePct,
      form.savingsProfitRateSource
    )
  };
}

function validateForm(form: EvaluationRequest): string[] {
  const errors: string[] = [];
  const fields = getFieldErrors(form);

  if (fields.customerName) {
    errors.push("Customer name is required.");
  }
  if (fields.customerEmail) {
    errors.push("Customer email must be a valid email address.");
  }
  if (fields.customerPhone) {
    errors.push("Customer phone must contain 7 to 15 digits.");
  }
  if (fields.propertyName) {
    errors.push("Property name / description is required.");
  }
  if (fields.currencyCode) {
    errors.push("Currency is required.");
  }
  if (fields.propertyNetPurchasePrice) {
    errors.push("Property net purchase price must be positive.");
  }
  if (fields.areaValue) {
    errors.push("Area value must be positive.");
  }
  if (fields.areaUnit) {
    errors.push("Area unit is required.");
  }
  if (fields.downPayment) {
    errors.push("Down payment requires a valid currency value or percentage.");
  }
  if (fields.purchaseCost) {
    errors.push("Purchase cost requires a valid currency value or percentage.");
  }
  if (fields.loanTermYears) {
    errors.push(
      `Loan payment period must be an integer from 1 to ${MAX_LOAN_TERM_YEARS}.`
    );
  }
  if (fields.mortgageRatePct) {
    errors.push("Mortgage rate must be zero or positive.");
  }
  if (fields.earlyPaymentFee) {
    errors.push("Early payment fee requires a valid fixed currency fee/cap or percentage.");
  }
  if (fields.rentYield) {
    errors.push("Current rent requires a valid annual currency value or yield percentage.");
  }
  if (fields.serviceChargePerSqFt) {
    errors.push("Service charges must be zero or positive.");
  }
  if (fields.savingsProfitRate) {
    errors.push("Profit rate your savings can earn per year requires a valid currency value or percentage.");
  }
  if (form.customMarketVariations.length !== form.loanTermYears) {
    errors.push("Market variation rows must match the selected loan term.");
  }
  const normalizedErrors = validateEvaluationInputs(normalizeEvaluationRequest(form));
  normalizedErrors.forEach((error) => {
    if (!errors.includes(error)) {
      errors.push(error);
    }
  });
  return errors;
}
