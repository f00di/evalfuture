import { EvaluationPreview, money, percent } from "@/lib/model";
import { Td, Th } from "./layout";

export default function DetailedTables({ preview }: { preview: EvaluationPreview }) {
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
