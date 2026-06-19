"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  buildDefaultMarketVariations,
  calculatePreview,
  defaultRequest,
  EvaluationPreview,
  EvaluationRequest,
  fromPercentInput,
  money,
  numberValue,
  percent,
  resizeCustomVariations,
  Scenario,
  toPercentInput
} from "@/lib/model";
import { generateWorkbookBlob, workbookFilename } from "@/lib/workbook";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

type QuickFill = {
  firstYearVariation: number;
  secondYearVariation: number;
  annualMovementAfterYearTwo: number;
};

const initialQuickFill: QuickFill = {
  firstYearVariation: 0,
  secondYearVariation: 0,
  annualMovementAfterYearTwo: -0.02
};

export default function ComparisonCalculator() {
  const [form, setForm] = useState<EvaluationRequest>(defaultRequest);
  const [preview, setPreview] = useState<EvaluationPreview | null>(null);
  const [quickFill, setQuickFill] = useState<QuickFill>(initialQuickFill);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  const validationErrors = useMemo(() => validateForm(form), [form]);
  const defaultVariations = useMemo(
    () => buildDefaultMarketVariations(form.loanTermYears),
    [form.loanTermYears]
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const requestPreview = useCallback(
    async (request: EvaluationRequest, signal?: AbortSignal) => {
      if (validateForm(request).length > 0) {
        return;
      }
      setIsLoading(true);
      setApiError(null);
      try {
        let data: EvaluationPreview | null = null;
        if (API_BASE) {
          try {
            const response = await fetch(`${API_BASE}/api/preview`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request),
              signal
            });
            if (!response.ok) {
              const detail = await response.json().catch(() => null);
              throw new Error(detail?.detail ?? "Preview request failed");
            }
            data = (await response.json()) as EvaluationPreview;
          } catch (error) {
            if ((error as Error).name === "AbortError") {
              throw error;
            }
          }
        }
        if (!signal?.aborted) {
          setPreview(data ?? calculatePreview(request));
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setApiError((error as Error).message);
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      void requestPreview(form, controller.signal);
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [form, requestPreview]);

  const updateField = <K extends keyof EvaluationRequest>(
    key: K,
    value: EvaluationRequest[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateLoanTerm = (loanTermYears: number) => {
    setForm((current) => ({
      ...current,
      loanTermYears,
      customMarketVariations: resizeCustomVariations(
        current.customMarketVariations,
        Math.max(0, Math.min(40, Number.isFinite(loanTermYears) ? loanTermYears : 0))
      )
    }));
  };

  const updateCustomVariation = (index: number, value: string) => {
    const parsed = fromPercentInput(value);
    setForm((current) => {
      const next = resizeCustomVariations(current.customMarketVariations, current.loanTermYears);
      next[index] = parsed;
      return { ...current, customMarketVariations: next };
    });
  };

  const prefillCustomFromDefault = () => {
    setForm((current) => ({
      ...current,
      customMarketVariations: buildDefaultMarketVariations(current.loanTermYears)
    }));
  };

  const applyQuickFill = () => {
    setForm((current) => {
      const values: Array<number | null> = [];
      for (let index = 0; index < current.loanTermYears; index += 1) {
        if (index === 0) {
          values.push(quickFill.firstYearVariation);
        } else if (index === 1) {
          values.push(quickFill.secondYearVariation);
        } else {
          values.push((values[index - 1] ?? 0) + quickFill.annualMovementAfterYearTwo);
        }
      }
      return { ...current, customMarketVariations: values };
    });
  };

  const downloadWorkbook = async () => {
    if (validationErrors.length > 0) {
      return;
    }
    setIsDownloading(true);
    setApiError(null);
    try {
      let blob: Blob | null = null;
      if (API_BASE) {
        try {
          const response = await fetch(`${API_BASE}/api/export`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form)
          });
          if (!response.ok) {
            const detail = await response.json().catch(() => null);
            throw new Error(detail?.detail ?? "Workbook export failed");
          }
          blob = await response.blob();
        } catch {
          blob = null;
        }
      }
      blob ??= generateWorkbookBlob(calculatePreview(form));
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = workbookFilename(form.propertyName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setApiError((error as Error).message);
    } finally {
      setIsDownloading(false);
    }
  };

  const chartData = useMemo(() => {
    const rows = preview?.marketRows ?? [];
    return rows.map((row) => ({
      year: row.year,
      defaultVariation: row.defaultMarketVariation * 100,
      customVariation:
        row.customMarketVariation === null ? null : row.customMarketVariation * 100,
      selectedVariation: row.selectedMarketVariation * 100
    }));
  }, [preview]);

  return (
    <section id="calculator" className="rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-tealFinance">
              Free Initial Comparison
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">
              Build your property comparison
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slateFinance sm:text-base">
              Enter your assumptions to preview a rent-vs-buy outcome and download an
              Excel-compatible two-sheet workbook.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void requestPreview(form)}
              disabled={isLoading || validationErrors.length > 0}
              className="rounded-md bg-tealFinance px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Previewing..." : "Preview Evaluation"}
            </button>
            <button
              type="button"
              onClick={() => void downloadWorkbook()}
              disabled={isDownloading || validationErrors.length > 0}
              className="rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102A43] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isDownloading ? "Preparing XLSX..." : "Download Your Excel Comparison"}
            </button>
          </div>
        </div>
        <p className="mt-4 rounded-md border border-goldFinance/30 bg-inputAmber/50 px-3 py-2 text-xs leading-5 text-slateFinance">
          The GitHub Pages version creates the workbook in your browser. A backend export is used
          only when NEXT_PUBLIC_API_BASE_URL is configured.
        </p>
      </div>

      {(validationErrors.length > 0 || apiError) && (
        <section className="border-b border-riskRed/20 bg-[#fff7f7] p-4 text-sm text-riskRed">
          {apiError && <p>{apiError}</p>}
          {validationErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </section>
      )}

      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,410px)_minmax(0,1fr)]">
        <section className="min-w-0">
          <SectionTitle title="Assumptions" />
          <InputPanel
            form={form}
            updateField={updateField}
            updateLoanTerm={updateLoanTerm}
            quickFill={quickFill}
            setQuickFill={setQuickFill}
            applyQuickFill={applyQuickFill}
            prefillCustomFromDefault={prefillCustomFromDefault}
          />
        </section>

        <section className="flex min-w-0 flex-col gap-6">
          <CalculatorBlock title="Summary">
            <KpiCards preview={preview} />
          </CalculatorBlock>
          <CalculatorBlock
            title="Market Scenario"
            detail={`${form.loanTermYears} market variation rows generated from the selected loan term.`}
          >
            <MarketSection
              defaultVariations={defaultVariations}
              form={form}
              preview={preview}
              updateCustomVariation={updateCustomVariation}
              chartData={chartData}
              hasMounted={hasMounted}
            />
          </CalculatorBlock>
          <CalculatorBlock title="Results" detail="Detailed tables are available below when needed.">
            <ResultsPanel preview={preview} />
          </CalculatorBlock>
        </section>
      </div>

      <DetailedTables preview={preview} />
    </section>
  );
}

function InputPanel({
  form,
  updateField,
  updateLoanTerm,
  quickFill,
  setQuickFill,
  applyQuickFill,
  prefillCustomFromDefault
}: {
  form: EvaluationRequest;
  updateField: <K extends keyof EvaluationRequest>(key: K, value: EvaluationRequest[K]) => void;
  updateLoanTerm: (loanTermYears: number) => void;
  quickFill: QuickFill;
  setQuickFill: Dispatch<SetStateAction<QuickFill>>;
  applyQuickFill: () => void;
  prefillCustomFromDefault: () => void;
}) {
  return (
    <div className="mt-4 flex min-w-0 flex-col gap-4">
      <FieldGroup
        title="Property Details"
        description="Basic details used across the comparison and workbook export."
      >
        <TextField
          label="Property name / description"
          value={form.propertyName}
          onChange={(value) => updateField("propertyName", value)}
        />
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <NumberField
            label="Property net purchase price"
            value={form.propertyNetPurchasePrice}
            onChange={(value) => updateField("propertyNetPurchasePrice", value)}
          />
          <NumberField
            label="Area in sq. ft"
            value={form.areaSqFt}
            onChange={(value) => updateField("areaSqFt", value)}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Purchase & Financing"
        description="Down payment, acquisition costs, loan term, mortgage rate, and exit cost."
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <PercentField
            label="Down payment"
            value={form.downPaymentPct}
            onChange={(value) => updateField("downPaymentPct", value ?? 0)}
          />
          <PercentField
            label="Purchase cost"
            value={form.purchaseCostPct}
            onChange={(value) => updateField("purchaseCostPct", value ?? 0)}
          />
          <NumberField
            label="Loan payment period in years"
            value={form.loanTermYears}
            min={1}
            max={40}
            step={1}
            onChange={updateLoanTerm}
          />
          <PercentField
            label="Mortgage rate"
            value={form.mortgageRatePct}
            onChange={(value) => updateField("mortgageRatePct", value ?? 0)}
          />
          <PercentField
            label="Early payment fee"
            value={form.earlyPaymentFeePct}
            onChange={(value) => updateField("earlyPaymentFeePct", value ?? 0)}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Rental & Service Charges"
        description="Rental yield, recurring service charges, and opportunity cost of savings."
      >
        <PercentField
          label="Current rent of property per year"
          value={form.rentYieldPct}
          onChange={(value) => updateField("rentYieldPct", value ?? 0)}
        />
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <NumberField
            label="Service charges AED per sq. ft per year"
            value={form.serviceChargePerSqFt}
            onChange={(value) => updateField("serviceChargePerSqFt", value)}
          />
          <PercentField
            label="Profit rate savings can earn per year"
            value={form.savingsProfitRatePct}
            onChange={(value) => updateField("savingsProfitRatePct", value ?? 0)}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        title="Market Assumptions"
        description="Choose the default movement curve or enter your own annual rise/drop values."
      >
        <label className="grid min-w-0 gap-1 text-sm">
          <span className="font-medium text-slateFinance">Scenario selector</span>
          <select
            value={form.scenario}
            onChange={(event) => updateField("scenario", event.target.value as Scenario)}
            className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-inputAmber px-3 text-sm font-semibold text-navy outline-none focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
          >
            <option value="Default">Default</option>
            <option value="Custom">Custom</option>
          </select>
        </label>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <PercentField
            label="First year variation"
            value={quickFill.firstYearVariation}
            allowNegative
            onChange={(value) =>
              setQuickFill((current) => ({ ...current, firstYearVariation: value ?? 0 }))
            }
          />
          <PercentField
            label="Second year variation"
            value={quickFill.secondYearVariation}
            allowNegative
            onChange={(value) =>
              setQuickFill((current) => ({ ...current, secondYearVariation: value ?? 0 }))
            }
          />
          <PercentField
            label="Annual movement after year 2"
            value={quickFill.annualMovementAfterYearTwo}
            allowNegative
            onChange={(value) =>
              setQuickFill((current) => ({
                ...current,
                annualMovementAfterYearTwo: value ?? 0
              }))
            }
          />
        </div>
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <button
            type="button"
            onClick={prefillCustomFromDefault}
            className="min-w-0 rounded-md border border-tealFinance bg-white px-3 py-2 text-sm font-semibold text-tealFinance transition hover:bg-tealFinance hover:text-white"
          >
            Prefill Custom From Default
          </button>
          <button
            type="button"
            onClick={applyQuickFill}
            className="min-w-0 rounded-md border border-goldFinance bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:bg-inputAmber"
          >
            Apply Quick Fill
          </button>
        </div>
      </FieldGroup>
    </div>
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
        <h4 className="text-base font-semibold text-navy">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-slateFinance">{description}</p>
      </div>
      <div className="mt-4 grid min-w-0 gap-3">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-inputAmber px-3 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="numeric h-10 w-full min-w-0 rounded-md border border-slate-300 bg-inputAmber px-3 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
      />
    </label>
  );
}

function PercentField({
  label,
  value,
  onChange,
  allowNegative = false
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  allowNegative?: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <InputWithSuffix
        value={toPercentInput(value)}
        suffix="%"
        min={allowNegative ? undefined : 0}
        onChange={(nextValue) => onChange(fromPercentInput(nextValue))}
      />
    </label>
  );
}

function InputWithSuffix({
  value,
  suffix,
  min,
  onChange
}: {
  value: string;
  suffix: string;
  min?: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex h-10 min-w-0 overflow-hidden rounded-md border border-slate-300 bg-inputAmber transition focus-within:border-tealFinance focus-within:ring-2 focus-within:ring-tealFinance/20">
      <input
        type="number"
        value={value}
        min={min}
        step={0.01}
        onChange={(event) => onChange(event.target.value)}
        className="numeric h-full min-w-0 flex-1 bg-transparent px-3 text-navy outline-none"
      />
      <span className="flex h-full w-10 shrink-0 items-center justify-center border-l border-slate-300 text-sm font-medium text-slateFinance">
        {suffix}
      </span>
    </div>
  );
}

function KpiCards({ preview }: { preview: EvaluationPreview | null }) {
  const items: Array<{
    label: string;
    value: string;
    detail?: string;
    tone?: "default" | "positive" | "risk";
  }> = preview
    ? [
        {
          label: "Principal loan",
          value: compactMoney(preview.derived.principalLoan),
          detail: money(preview.derived.principalLoan)
        },
        {
          label: "Monthly instalment",
          value: compactMoney(preview.derived.monthlyBankInstalment),
          detail: money(preview.derived.monthlyBankInstalment)
        },
        {
          label: "Total bank payment",
          value: compactMoney(preview.derived.totalBankPayment),
          detail: money(preview.derived.totalBankPayment)
        },
        {
          label: "Total interest",
          value: compactMoney(preview.derived.totalInterest),
          detail: money(preview.derived.totalInterest)
        },
        {
          label: "Final options comparison",
          value: compactMoney(preview.finalOptionsComparison),
          detail: money(preview.finalOptionsComparison),
          tone: preview.finalOptionsComparison < 0 ? "risk" : "positive"
        }
      ]
    : [
        { label: "Principal loan", value: "-" },
        { label: "Monthly instalment", value: "-" },
        { label: "Total bank payment", value: "-" },
        { label: "Total interest", value: "-" },
        { label: "Final options comparison", value: "-" }
      ];

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 2xl:grid-cols-5">
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

function MarketSection({
  defaultVariations,
  form,
  preview,
  updateCustomVariation,
  chartData,
  hasMounted
}: {
  defaultVariations: number[];
  form: EvaluationRequest;
  preview: EvaluationPreview | null;
  updateCustomVariation: (index: number, value: string) => void;
  chartData: Array<{
    year: number;
    defaultVariation: number;
    customVariation: number | null;
    selectedVariation: number;
  }>;
  hasMounted: boolean;
}) {
  return (
    <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-slateFinance">
            Default and custom rows stay aligned with the selected loan term.
          </p>
          <div className="w-fit rounded-md border border-slate-200 bg-creamFinance px-3 py-2 text-sm font-semibold text-tealFinance">
            Scenario: {form.scenario}
          </div>
        </div>
        <div className="grid min-w-0 gap-4 xl:grid-cols-2 2xl:grid-cols-1">
          <MarketTable title="Default Market Variation">
            {defaultVariations.map((variation, index) => (
              <tr key={index} className="border-t border-slate-200">
                <Td>{index + 1}</Td>
                <Td>{percent(variation)}</Td>
                <Td>{money(form.propertyNetPurchasePrice * (1 + variation))}</Td>
              </tr>
            ))}
          </MarketTable>

          <MarketTable title="Custom Market Variation">
            {form.customMarketVariations.map((variation, index) => (
              <tr key={index} className="border-t border-slate-200">
                <Td>{index + 1}</Td>
                <td className="px-2 py-2">
                  <div className="flex h-9 min-w-[96px] overflow-hidden rounded-md border border-slate-300 bg-inputAmber">
                    <input
                      type="number"
                      value={toPercentInput(variation)}
                      step={0.01}
                      onChange={(event) => updateCustomVariation(index, event.target.value)}
                      className="numeric h-full min-w-0 flex-1 bg-transparent px-2 text-right outline-none focus:ring-2 focus:ring-tealFinance/20"
                    />
                    <span className="flex h-full w-8 shrink-0 items-center justify-center border-l border-slate-300 text-xs text-slateFinance">
                      %
                    </span>
                  </div>
                </td>
                <Td>
                  {variation === null
                    ? "-"
                    : money(form.propertyNetPurchasePrice * (1 + variation))}
                </Td>
              </tr>
            ))}
          </MarketTable>
        </div>
      </div>

      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold text-navy">Property Market Price Fluctuations</h3>
        <div className="mt-4 h-[320px] min-h-[320px] min-w-0">
          {hasMounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={260} minHeight={280}>
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
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const displayValue = typeof value === "number" ? `${value.toFixed(2)}%` : "-";
                    const label =
                      name === "selectedVariation"
                        ? "Selected"
                        : name === "customVariation"
                          ? "Custom"
                          : "Default";
                    return [displayValue, label];
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="defaultVariation"
                  name="Default"
                  stroke="#0F766E"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="customVariation"
                  name="Custom"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={{ r: 2.5 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="selectedVariation"
                  name="Selected"
                  stroke="#102A43"
                  strokeWidth={2.6}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg border border-slate-200 bg-creamFinance" />
          )}
        </div>
        {preview && (
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <Metric label="Net rental/year" value={money(preview.derived.netRentalYear)} />
            <Metric label="Total cost" value={money(preview.derived.totalCost)} />
          </div>
        )}
      </div>
    </div>
  );
}

function MarketTable({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200">
      <TableTitle title={title} />
      <div className="scrollbar-soft overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <thead className="bg-navy text-white">
            <tr>
              <Th>Year</Th>
              <Th>Variation</Th>
              <Th>Selling Price</Th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function ResultsPanel({ preview }: { preview: EvaluationPreview | null }) {
  if (!preview) {
    return <p className="text-sm leading-6 text-slateFinance">Preview data will appear after validation.</p>;
  }

  const finalRow = preview.comparisonRows[preview.comparisonRows.length - 1];

  return (
    <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Down payment" value={money(preview.derived.downPaymentAmount)} />
      <Metric label="Purchase cost" value={money(preview.derived.purchaseCostAmount)} />
      <Metric label="Net rental/year" value={money(preview.derived.netRentalYear)} />
      <Metric
        label={`Year ${finalRow.year} comparison`}
        value={money(finalRow.optionsComparison)}
        tone={finalRow.optionsComparison < 0 ? "risk" : "positive"}
      />
    </div>
  );
}

function DetailedTables({ preview }: { preview: EvaluationPreview | null }) {
  return (
    <section className="border-t border-slate-200 bg-creamFinance/60 p-4 sm:p-6">
      <div className="mb-4">
        <SectionTitle title="Detailed Tables" />
        <p className="mt-2 text-sm leading-6 text-slateFinance">
          Open these sections when you need the full year-by-year rent-vs-buy or amortization view.
        </p>
      </div>
      <div className="grid gap-4">
        <details className="rounded-lg border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-navy">
            Detailed Rent vs Buying Table
          </summary>
          <div className="border-t border-slate-200 p-4">
            {preview ? <ComparisonTable preview={preview} /> : <EmptyPanel />}
          </div>
        </details>
        <details className="rounded-lg border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-base font-semibold text-navy">
            Amortization Schedule
          </summary>
          <div className="border-t border-slate-200 p-4">
            {preview ? <AmortizationSummary preview={preview} /> : <EmptyPanel />}
          </div>
        </details>
      </div>
    </section>
  );
}

function ComparisonTable({ preview }: { preview: EvaluationPreview }) {
  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-navy">Rental vs Buying Comparison</h3>
          <p className="text-sm text-slateFinance">Year-by-year rent, financing, resale, and cost view.</p>
        </div>
        <span className="text-sm font-semibold text-tealFinance">
          {preview.comparisonRows.length} rows
        </span>
      </div>
      <div className="scrollbar-soft overflow-x-auto">
        <table className="min-w-[1280px] text-sm">
          <thead>
            <tr className="bg-panelBlue text-center text-navy">
              <Th>Year</Th>
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
              ].map((header) => (
                <Th key={header}>{header}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.comparisonRows.map((row) => (
              <tr key={row.year} className="border-t border-slate-200">
                <Td>{row.year}</Td>
                <Td>{money(row.rent)}</Td>
                <Td>{money(row.fundsAvailable)}</Td>
                <Td>{money(row.earningOnAvailableFunds)}</Td>
                <Td>{money(row.rentalNetTotal)}</Td>
                <Td>{money(row.yearlyBankInstalments)}</Td>
                <Td>{money(row.bankInterest)}</Td>
                <Td>{money(row.bankPrincipal)}</Td>
                <Td>{money(row.totalPrincipal)}</Td>
                <Td>{money(row.totalCost)}</Td>
                <Td>{money(row.earlySettlementCost)}</Td>
                <Td>{percent(row.marketVariation)}</Td>
                <Td>{money(row.propertyMarketPrice)}</Td>
                <Td>{money(row.netTotalResale)}</Td>
                <Td className={row.optionsComparison < 0 ? "text-riskRed" : "text-positiveGreen"}>
                  {money(row.optionsComparison)}
                </Td>
              </tr>
            ))}
            <tr className="border-t border-goldFinance bg-inputAmber font-semibold">
              <Td>Total</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>{money(preview.totals.yearlyBankInstalments)}</Td>
              <Td>{money(preview.totals.bankInterest)}</Td>
              <Td>{money(preview.totals.bankPrincipal)}</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>-</Td>
              <Td>{money(preview.finalOptionsComparison)}</Td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AmortizationSummary({ preview }: { preview: EvaluationPreview }) {
  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-navy">Amortization Calculator</h3>
          <p className="text-sm text-slateFinance">Reference: https://mymortgage.ae/calculator</p>
        </div>
        <span className="text-sm font-semibold text-tealFinance">
          {preview.amortizationSummaryRows.length} years
        </span>
      </div>
      <div className="scrollbar-soft overflow-x-auto">
        <table className="min-w-[920px] text-sm">
          <thead className="bg-navy text-white">
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
                <Td>{row.year}</Td>
                <Td>{money(row.interest)}</Td>
                <Td>{money(row.principal)}</Td>
                <Td>{money(row.endingBalance)}</Td>
                <Td>{money(row.totalInstalment)}</Td>
                <Td>{percent(row.interestPrincipalRatio)}</Td>
                <Td>{money(row.decrease)}</Td>
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
    <section className="min-w-0 rounded-lg border border-slate-200 bg-creamFinance/60 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        {detail && <p className="mt-1 text-sm leading-6 text-slateFinance">{detail}</p>}
      </div>
      {children}
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold text-navy">{title}</h2>;
}

function TableTitle({ title }: { title: string }) {
  return (
    <div className="bg-tealFinance px-3 py-2 text-center text-sm font-semibold text-white">
      {title}
    </div>
  );
}

function Th({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  return (
    <th colSpan={colSpan} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase">
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

function Metric({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "risk";
}) {
  const valueClass =
    tone === "positive" ? "text-positiveGreen" : tone === "risk" ? "text-riskRed" : "text-navy";

  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-white px-3 py-2">
      <p className="truncate text-xs font-semibold uppercase text-slateFinance">{label}</p>
      <p className={`numeric mt-1 truncate text-sm font-semibold ${valueClass}`} title={value}>
        {value}
      </p>
    </div>
  );
}

function EmptyPanel() {
  return <p className="text-sm text-slateFinance">Preview data will appear after validation.</p>;
}

function compactMoney(value: number): string {
  const absoluteValue = Math.abs(value);
  const prefix = value < 0 ? "AED -" : "AED ";

  if (absoluteValue >= 1_000_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000_000).toFixed(2)}B`;
  }
  if (absoluteValue >= 1_000_000) {
    return `${prefix}${(absoluteValue / 1_000_000).toFixed(2)}M`;
  }
  if (absoluteValue >= 100_000) {
    return `${prefix}${(absoluteValue / 1_000).toFixed(1)}K`;
  }
  return `${prefix}${numberValue(absoluteValue)}`;
}

function validateForm(form: EvaluationRequest): string[] {
  const errors: string[] = [];
  if (!form.propertyName.trim()) {
    errors.push("Property name is required.");
  }
  if (!Number.isFinite(form.propertyNetPurchasePrice) || form.propertyNetPurchasePrice <= 0) {
    errors.push("Property net purchase price must be positive.");
  }
  if (!Number.isFinite(form.areaSqFt) || form.areaSqFt <= 0) {
    errors.push("Area must be positive.");
  }
  if (!Number.isInteger(form.loanTermYears) || form.loanTermYears < 1 || form.loanTermYears > 40) {
    errors.push("Loan term must be an integer from 1 to 40.");
  }
  const nonMarketPercentages = [
    ["Down payment", form.downPaymentPct],
    ["Purchase cost", form.purchaseCostPct],
    ["Mortgage rate", form.mortgageRatePct],
    ["Early payment fee", form.earlyPaymentFeePct],
    ["Current rent", form.rentYieldPct],
    ["Savings profit rate", form.savingsProfitRatePct]
  ] as const;
  for (const [label, value] of nonMarketPercentages) {
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${label} percentage cannot be negative.`);
    }
  }
  if (form.customMarketVariations.length !== form.loanTermYears) {
    errors.push("Custom market variation rows must match loan term.");
  }
  if (!Number.isFinite(form.serviceChargePerSqFt) || form.serviceChargePerSqFt < 0) {
    errors.push("Service charges must be zero or positive.");
  }
  return errors;
}
