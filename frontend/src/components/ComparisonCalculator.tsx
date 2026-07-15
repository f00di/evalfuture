"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import CompactMetricCard from "@/components/site/CompactMetricCard";
import {
  AmountPercentSource,
  AreaUnit,
  CurrencyCode,
  buildDefaultMarketVariations,
  calculatePreview,
  currencyOptions,
  defaultRequest,
  EvaluationPreview,
  EvaluationRequest,
  fromPercentInput,
  money,
  normalizeEvaluationRequest,
  numberValue,
  percent,
  resizeCustomVariations
} from "@/lib/model";
import { generateWorkbookBlob, workbookFilename } from "@/lib/workbook";

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

const inputClass =
  "numeric h-11 w-full min-w-0 rounded-md border border-slate-300 bg-inputAmber/70 px-3 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20";
const invalidInputClass =
  "border-riskRed bg-[#fff5f5] focus:border-riskRed focus:ring-riskRed/20";

export default function ComparisonCalculator() {
  const [form, setForm] = useState<EvaluationRequest>(defaultRequest);
  const [preview, setPreview] = useState<EvaluationPreview | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const normalizedForm = useMemo(() => normalizeEvaluationRequest(form), [form]);
  const validationErrors = useMemo(() => validateForm(form), [form]);
  const fieldErrors = useMemo(() => getFieldErrors(form), [form]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
        ? Math.max(0, Math.min(40, Math.trunc(loanTermYears)))
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
      return;
    }

    setPreview(calculatePreview(form));
    setHasGenerated(true);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const resetAssumptions = () => {
    setForm(defaultRequest);
    setPreview(null);
    setHasGenerated(false);
    setShowValidation(false);
    setDownloadError(null);
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
    const errors = validateForm(form);
    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    try {
      const currentPreview = preview ?? calculatePreview(form);
      const blob = generateWorkbookBlob(currentPreview);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = workbookFilename(currentPreview.inputs.propertyName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError((error as Error).message);
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
            <button
              type="button"
              onClick={resetAssumptions}
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-tealFinance hover:text-tealFinance"
            >
              Reset Assumptions
            </button>
            <button
              type="button"
              onClick={generateComparison}
              className="rounded-md bg-tealFinance px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
            >
              Generate My Free Comparison
            </button>
          </div>
        </div>

        {showValidation && validationErrors.length > 0 && (
          <ValidationSummary errors={validationErrors} />
        )}
      </div>

      {hasGenerated && preview && (
        <ResultsSection
          refTarget={resultsRef}
          preview={preview}
          hasMounted={hasMounted}
          isDownloading={isDownloading}
          downloadError={downloadError}
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
      <FieldGroup
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
      </FieldGroup>

      <FieldGroup
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
            max={40}
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
    </div>
  );
}

function ResultsSection({
  refTarget,
  preview,
  hasMounted,
  isDownloading,
  downloadError,
  downloadWorkbook
}: {
  refTarget: React.RefObject<HTMLDivElement | null>;
  preview: EvaluationPreview;
  hasMounted: boolean;
  isDownloading: boolean;
  downloadError: string | null;
  downloadWorkbook: () => void;
}) {
  const chartData = useMemo(
    () =>
      [
        {
          year: 0,
          variation: 0,
          sellingPrice: preview.inputs.propertyNetPurchasePrice
        },
        ...preview.marketRows.map((row) => ({
          year: row.year,
          variation: row.selectedMarketVariation * 100,
          sellingPrice: row.selectedSellingPrice
        }))
      ],
    [preview.inputs.propertyNetPurchasePrice, preview.marketRows]
  );

  return (
    <section ref={refTarget} id="results" className="scroll-mt-24 border-t border-slate-200 bg-creamFinance/60">
      <div className="p-4 sm:p-6">
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-tealFinance">
              Results
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">
              Your Free Comparison Results
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slateFinance sm:text-base">
              Based on the assumptions provided, here is the estimated rent-vs-buy and financing
              comparison.
            </p>
          </div>
        </div>

        {downloadError && (
          <div className="mt-4 rounded-md border border-riskRed/20 bg-[#fff7f7] px-3 py-2 text-sm text-riskRed">
            {downloadError}
          </div>
        )}

        <div className="mt-6 grid gap-5">
          <CustomerSummary preview={preview} />
          <KpiCards preview={preview} />
        </div>

        <div className="mt-6 grid min-w-0 gap-5">
          <CalculatorBlock title="Property Market Price Fluctuations">
            <MarketChart
              chartData={chartData}
              currencyCode={preview.inputs.currencyCode}
              hasMounted={hasMounted}
            />
          </CalculatorBlock>
        </div>

        <DetailedTables preview={preview} />

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-center">
          <h3 className="text-lg font-semibold text-navy">Download your full comparison</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slateFinance">
            The GitHub Pages version creates a formatted two-sheet workbook in your browser.
          </p>
          <button
            type="button"
            onClick={downloadWorkbook}
            disabled={isDownloading}
            className="mt-4 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102A43] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isDownloading ? "Preparing XLSX..." : "Download Excel Comparison"}
          </button>
        </div>
      </div>
    </section>
  );
}

function FieldGroup({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-creamFinance/70 p-4">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-base font-semibold text-navy">{title}</h3>
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
        <span className="text-xs font-medium text-tealFinance">
          Using {source === "amount" ? amountLabel : percentLabel}
        </span>
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
  onChange
}: {
  value: number;
  suffix: string;
  allowNegative?: boolean;
  invalid?: boolean;
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
  onChange
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  embedded?: boolean;
  invalid?: boolean;
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

function MarketChart({
  chartData,
  currencyCode,
  hasMounted
}: {
  chartData: Array<{ year: number; variation: number; sellingPrice: number }>;
  currencyCode: CurrencyCode;
  hasMounted: boolean;
}) {
  return (
    <div className="h-[340px] min-h-[340px] min-w-0">
      {hasMounted ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={300}>
          <LineChart data={chartData} margin={{ top: 12, right: 18, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tick={{ fill: "#334155", fontSize: 12 }}
              axisLine={{ stroke: "#94A3B8" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#334155", fontSize: 12 }}
              axisLine={{ stroke: "#94A3B8" }}
              tickLine={false}
              width={74}
              tickFormatter={(value) => compactMoney(Number(value), currencyCode)}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "sellingPrice" && typeof value === "number") {
                  return [money(value, currencyCode), "Selling price"];
                }
                return [String(value), String(name)];
              }}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Line
              type="monotone"
              dataKey="sellingPrice"
              name="Selling price"
              stroke="#0F766E"
              strokeWidth={2.6}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full rounded-lg border border-slate-200 bg-creamFinance" />
      )}
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

function ValidationSummary({ errors }: { errors: string[] }) {
  return (
    <section className="mt-5 rounded-md border border-riskRed/20 bg-[#fff7f7] p-4 text-sm text-riskRed">
      <p className="font-semibold">Please complete these fields before generating results:</p>
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

function validPair(amount: number, percentage: number, source: AmountPercentSource): boolean {
  if (source === "amount") {
    return validNonNegative(amount);
  }
  return validNonNegative(percentage);
}

function getFieldErrors(form: EvaluationRequest): FieldErrors {
  const phoneDigits = form.customerPhone.replace(/\D/g, "");
  return {
    customerName: !form.customerName.trim(),
    customerEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim()),
    customerPhone: phoneDigits.length < 7 || phoneDigits.length > 15,
    propertyName: !form.propertyName.trim(),
    currencyCode: !currencyOptions.some((option) => option.code === form.currencyCode),
    propertyNetPurchasePrice: !validPositive(form.propertyNetPurchasePrice),
    areaValue: !validPositive(form.areaValue),
    areaUnit: form.areaUnit !== "sq. ft" && form.areaUnit !== "sq. m",
    downPayment: !validPair(form.downPaymentAmount, form.downPaymentPct, form.downPaymentSource),
    purchaseCost: !validPair(
      form.purchaseCostAmount,
      form.purchaseCostPct,
      form.purchaseCostSource
    ),
    loanTermYears:
      !Number.isInteger(form.loanTermYears) || form.loanTermYears < 1 || form.loanTermYears > 40,
    mortgageRatePct: !validNonNegative(form.mortgageRatePct),
    earlyPaymentFee: !validPair(
      form.earlyPaymentFeeAmount,
      form.earlyPaymentFeePct,
      form.earlyPaymentFeeSource
    ),
    rentYield: !validPair(form.currentRentPerYear, form.rentYieldPct, form.rentYieldSource),
    serviceChargePerSqFt: !validNonNegative(form.serviceChargePerSqFt),
    savingsProfitRate: !validPair(
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
    errors.push("Loan payment period must be an integer from 1 to 40.");
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
  return errors;
}
