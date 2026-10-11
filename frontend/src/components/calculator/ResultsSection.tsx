import { useEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import dynamic from "next/dynamic";
import CompactMetricCard from "@/components/site/CompactMetricCard";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { EvaluationPreview, buildMarketChartData, money, percent } from "@/lib/model";
import { compactMoney } from "./format";
import { CalculatorBlock, Td, Th } from "./layout";
import DetailedTables from "./ResultTables";
import type { DownloadStatus } from "./types";

const MarketPriceChart = dynamic(() => import("@/components/MarketPriceChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] animate-pulse rounded-panel border border-slate-200 bg-panelBlue/50" />
  )
});

export default function ResultsSection({
  refTarget,
  preview,
  isDownloading,
  downloadError,
  downloadStatus,
  downloadWorkbook
}: {
  refTarget: RefObject<HTMLElement | null>;
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
