import type { Metadata } from "next";
import FreeComparisonFlow from "@/components/site/FreeComparisonFlow";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "Free Property Comparison | Evalfuture.",
  description: "Start a free rent-vs-buy property comparison and download an Excel workbook."
};

const checklist = [
  "Rental vs buying comparison",
  "Mortgage and interest estimate",
  "Market rise/drop scenario",
  "Service charge impact",
  "Excel workbook download"
];

export default function FreeComparisonPage() {
  return (
    <PageShell>
      <section className="border-b border-slate-200 bg-creamFinance py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-end lg:px-8">
          <SectionHeader
            level="h1"
            eyebrow="Get a Free Comparison"
            title="Start with a Free Property Comparison"
            body="Enter your assumptions to preview a rent-vs-buy outcome and download an Excel comparison workbook."
          />
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <p className="text-sm font-semibold text-navy">Included in your free comparison</p>
            <ul className="mt-4 grid gap-2 text-sm text-slateFinance">
              {checklist.map((item) => (
                <li key={item} className="rounded-md bg-panelBlue/70 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#start"
              className="mt-5 inline-flex rounded-md bg-tealFinance px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
            >
              Start My Free Comparison
            </a>
          </div>
        </div>
      </section>

      <section id="start" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FreeComparisonFlow />
        </div>
      </section>
    </PageShell>
  );
}
