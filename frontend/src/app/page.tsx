"use client";

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
import {
  buildDefaultMarketVariations,
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

export default function Home() {
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
        const data = (await response.json()) as EvaluationPreview;
        setPreview(data);
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
    }, 350);
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
      const response = await fetch(`${API_BASE}/api/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail ?? "Workbook export failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "Evalfuture-model.xlsx";
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
    <main className="min-h-screen px-4 py-6 text-navy sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white/82 p-5 shadow-panel md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-tealFinance/20 bg-tealFinance/10 px-3 py-1 text-sm font-semibold text-tealFinance">
              Evalfuture.
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-navy md:text-4xl">
              Evalfuture. Property Evaluation Model
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slateFinance">
              Enter acquisition, mortgage, rental, and market assumptions, then preview the
              model and export the two-sheet XLSX workbook.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void requestPreview(form)}
              disabled={isLoading || validationErrors.length > 0}
              className="rounded-md bg-tealFinance px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Previewing..." : "Preview Evaluation"}
            </button>
            <button
              type="button"
              onClick={() => void downloadWorkbook()}
              disabled={isDownloading || validationErrors.length > 0}
              className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#132f4a] disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isDownloading ? "Preparing XLSX..." : "Download XLSX"}
            </button>
          </div>
        </header>

        {(validationErrors.length > 0 || apiError) && (
          <section className="rounded-lg border border-riskRed/30 bg-white p-4 text-sm text-riskRed">
            {apiError && <p>{apiError}</p>}
            {validationErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <InputPanel
            form={form}
            updateField={updateField}
            updateLoanTerm={updateLoanTerm}
            quickFill={quickFill}
            setQuickFill={setQuickFill}
            applyQuickFill={applyQuickFill}
            prefillCustomFromDefault={prefillCustomFromDefault}
          />

          <section className="flex min-w-0 flex-col gap-6">
            <KpiCards preview={preview} />
            <MarketSection
              defaultVariations={defaultVariations}
              form={form}
              preview={preview}
              updateCustomVariation={updateCustomVariation}
              chartData={chartData}
              hasMounted={hasMounted}
            />
            <ComparisonTable preview={preview} />
            <AmortizationSummary preview={preview} />
          </section>
        </div>
      </div>
    </main>
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
  setQuickFill: React.Dispatch<React.SetStateAction<QuickFill>>;
  applyQuickFill: () => void;
  prefillCustomFromDefault: () => void;
}) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-navy">Assumptions</h2>
          <p className="mt-1 text-sm text-slateFinance">Yellow workbook inputs and scenario setup.</p>
        </div>
        <select
          value={form.scenario}
          onChange={(event) => updateField("scenario", event.target.value as Scenario)}
          className="rounded-md border border-slate-300 bg-inputAmber px-3 py-2 text-sm font-semibold text-navy outline-none focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
        >
          <option value="Default">Default</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      <div className="grid gap-4">
        <TextField
          label="Property name / description"
          value={form.propertyName}
          onChange={(value) => updateField("propertyName", value)}
        />
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
        <PercentField
          label="Current rent of property per year"
          value={form.rentYieldPct}
          onChange={(value) => updateField("rentYieldPct", value ?? 0)}
        />
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

      <div className="mt-6 rounded-lg border border-slate-200 bg-panelBlue/70 p-4">
        <h3 className="text-sm font-semibold text-navy">Custom market quick fill</h3>
        <div className="mt-3 grid gap-3">
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
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <button
            type="button"
            onClick={prefillCustomFromDefault}
            className="rounded-md border border-tealFinance bg-white px-3 py-2 text-sm font-semibold text-tealFinance transition hover:bg-tealFinance hover:text-white"
          >
            Prefill Custom From Default
          </button>
          <button
            type="button"
            onClick={applyQuickFill}
            className="rounded-md border border-goldFinance bg-white px-3 py-2 text-sm font-semibold text-navy transition hover:bg-inputAmber"
          >
            Apply Quick Fill
          </button>
        </div>
      </div>
    </aside>
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slateFinance">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-slate-300 bg-inputAmber px-3 py-2 text-navy outline-none focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slateFinance">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="numeric rounded-md border border-slate-300 bg-inputAmber px-3 py-2 text-navy outline-none focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
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
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-slateFinance">{label}</span>
      <div className="flex rounded-md border border-slate-300 bg-inputAmber focus-within:border-tealFinance focus-within:ring-2 focus-within:ring-tealFinance/20">
        <input
          type="number"
          value={toPercentInput(value)}
          min={allowNegative ? undefined : 0}
          step={0.01}
          onChange={(event) => onChange(fromPercentInput(event.target.value))}
          className="numeric min-w-0 flex-1 rounded-l-md bg-transparent px-3 py-2 text-navy outline-none"
        />
        <span className="border-l border-slate-300 px-3 py-2 text-slateFinance">%</span>
      </div>
    </label>
  );
}

function KpiCards({ preview }: { preview: EvaluationPreview | null }) {
  const items = [
    ["Principal loan", preview ? money(preview.derived.principalLoan) : "-"],
    ["Monthly instalment", preview ? money(preview.derived.monthlyBankInstalment) : "-"],
    ["Total bank payment", preview ? money(preview.derived.totalBankPayment) : "-"],
    ["Total interest", preview ? money(preview.derived.totalInterest) : "-"],
    [
      "Final options comparison",
      preview ? money(preview.finalOptionsComparison) : "-"
    ]
  ];
  return (
    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <p className="text-sm font-medium text-slateFinance">{label}</p>
          <p className="numeric mt-3 text-2xl font-semibold text-navy">{value}</p>
        </div>
      ))}
    </section>
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
    <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-navy">Market variation</h2>
            <p className="text-sm text-slateFinance">
              {form.loanTermYears} rows generated for the selected loan term.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-creamFinance px-3 py-2 text-sm font-semibold text-tealFinance">
            Scenario: {form.scenario}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <TableTitle title="Default Market Variation" />
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <Th>Year</Th>
                  <Th>Variation</Th>
                  <Th>Selling Price</Th>
                </tr>
              </thead>
              <tbody>
                {defaultVariations.map((variation, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <Td>{index + 1}</Td>
                    <Td>{percent(variation)}</Td>
                    <Td>{money(form.propertyNetPurchasePrice * (1 + variation))}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <TableTitle title="Custom Market Variation" />
            <table className="w-full text-sm">
              <thead className="bg-navy text-white">
                <tr>
                  <Th>Year</Th>
                  <Th>Variation</Th>
                  <Th>Selling Price</Th>
                </tr>
              </thead>
              <tbody>
                {form.customMarketVariations.map((variation, index) => (
                  <tr key={index} className="border-t border-slate-200">
                    <Td>{index + 1}</Td>
                    <td className="px-2 py-2">
                      <div className="flex rounded-md border border-slate-300 bg-inputAmber">
                        <input
                          type="number"
                          value={toPercentInput(variation)}
                          step={0.01}
                          onChange={(event) => updateCustomVariation(index, event.target.value)}
                          className="numeric min-w-0 flex-1 rounded-l-md bg-transparent px-2 py-1 text-right outline-none focus:ring-2 focus:ring-tealFinance/20"
                        />
                        <span className="border-l border-slate-300 px-2 py-1 text-slateFinance">%</span>
                      </div>
                    </td>
                    <Td>
                      {variation === null
                        ? "-"
                        : money(form.propertyNetPurchasePrice * (1 + variation))}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <h2 className="text-lg font-semibold text-navy">Property Market Price Fluctuations</h2>
        <div className="mt-4 h-[360px]">
          {hasMounted ? (
            <ResponsiveContainer width="100%" height="100%">
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
                    return [displayValue, name === "defaultVariation" ? "Default" : "Custom"];
                  }}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="defaultVariation"
                  name="Default"
                  stroke="#0F766E"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="customVariation"
                  name="Custom"
                  stroke="#D4AF37"
                  strokeWidth={2.4}
                  dot={{ r: 3 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg border border-slate-200 bg-creamFinance" />
          )}
        </div>
        {preview && (
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <Metric label="Net rental/year" value={money(preview.derived.netRentalYear)} />
            <Metric label="Total cost" value={money(preview.derived.totalCost)} />
          </div>
        )}
      </div>
    </section>
  );
}

function ComparisonTable({ preview }: { preview: EvaluationPreview | null }) {
  if (!preview) {
    return <EmptyPanel title="Rental vs Buying Comparison" />;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">Rental vs Buying Comparison</h2>
        <span className="text-sm font-semibold text-tealFinance">
          {preview.comparisonRows.length} rows
        </span>
      </div>
      <div className="scrollbar-soft overflow-x-auto">
        <table className="min-w-[1500px] text-sm">
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
    </section>
  );
}

function AmortizationSummary({ preview }: { preview: EvaluationPreview | null }) {
  if (!preview) {
    return <EmptyPanel title="Amortization Calculator" />;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-navy">Amortization Calculator</h2>
          <p className="text-sm text-slateFinance">Reference: https://mymortgage.ae/calculator</p>
        </div>
        <span className="text-sm font-semibold text-tealFinance">
          {preview.amortizationSummaryRows.length} years
        </span>
      </div>
      <div className="scrollbar-soft overflow-x-auto">
        <table className="min-w-[980px] text-sm">
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
    </section>
  );
}

function TableTitle({ title }: { title: string }) {
  return (
    <div className="bg-tealFinance px-3 py-2 text-center text-sm font-semibold text-white">
      {title}
    </div>
  );
}

function Th({
  children,
  colSpan
}: {
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <th colSpan={colSpan} className="px-3 py-2 text-left text-xs font-semibold uppercase">
      {children}
    </th>
  );
}

function Td({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`numeric whitespace-nowrap px-3 py-2 text-right text-slateFinance ${className}`}>
      {children}
    </td>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-creamFinance px-3 py-2">
      <p className="text-xs font-semibold uppercase text-slateFinance">{label}</p>
      <p className="numeric mt-1 text-sm font-semibold text-navy">{value}</p>
    </div>
  );
}

function EmptyPanel({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-slateFinance">Preview data will appear after validation.</p>
    </section>
  );
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
