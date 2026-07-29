import type { Metadata } from "next";
import Link from "next/link";
import BlueprintPattern from "@/components/backgrounds/BlueprintPattern";
import ContactPattern from "@/components/backgrounds/ContactPattern";
import HeroFinancePattern from "@/components/backgrounds/HeroFinancePattern";
import ServicesPattern from "@/components/backgrounds/ServicesPattern";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import ServiceCard from "@/components/site/ServiceCard";
import SectionReveal from "@/components/ui/SectionReveal";
import { calculatePreview, defaultRequest, money, percent } from "@/lib/model";
import { processSteps, reassuranceItems, serviceOffers, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Evalfuture. | Rent vs Buy Property Comparison",
  description:
    "Compare renting, buying, mortgage financing, rental income, service charges, market movement, and resale outcomes with Evalfuture.",
  alternates: { canonical: `${siteUrl}/` },
  openGraph: {
    title: "Evalfuture. | Property Comparison and Financing Evaluation",
    description:
      "A structured rent-vs-buy property comparison with financing, rental, service-charge, market, and resale assumptions.",
    url: `${siteUrl}/`
  }
};

const example = calculatePreview({
  ...defaultRequest,
  customerName: "Illustrative client",
  customerEmail: "example@example.com",
  customerPhone: "0000000"
});
const exampleFinal = example.comparisonRows.at(-1)!;

export default function Home() {
  return (
    <PageShell>
      <Hero />

      <section className="relative overflow-hidden bg-white py-16 sm:py-20" aria-labelledby="example-heading">
        <BlueprintPattern />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <SectionHeader
                  title="See how the main assumptions connect"
                  body="The free comparison turns property, financing, rental, service-charge, savings, and market inputs into a year-by-year view."
                />
                <p className="mt-5 border-l-2 border-goldFinance pl-4 text-sm leading-6 text-slateFinance">
                  Illustrative default scenario only. Your results change with the values and
                  market assumptions you enter.
                </p>
              </div>
              <div className="overflow-hidden rounded-panel border border-slate-200 bg-white shadow-panel">
                <div className="flex flex-col gap-2 border-b border-slate-200 bg-navy px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
                  <h2 id="example-heading" className="text-lg font-semibold">
                    Comparison output preview
                  </h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9FE3D9]">
                    AED · 10-year example
                  </span>
                </div>
                <dl className="grid sm:grid-cols-3">
                  <PreviewMetric label="Monthly instalment" value={money(example.derived.monthlyBankInstalment)} />
                  <PreviewMetric label="Total interest" value={money(example.derived.totalInterest)} />
                  <PreviewMetric
                    label="Year 10 resale position"
                    value={money(exampleFinal.netTotalResale)}
                  />
                </dl>
                <div className="grid gap-4 border-t border-slate-200 bg-creamFinance p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <p className="font-semibold text-navy">Selected market movement</p>
                    <p className="mt-1 text-sm text-slateFinance">
                      Year 10: {percent(exampleFinal.marketVariation)} · Default scenario
                    </p>
                  </div>
                  <Link
                    href="/free-comparison"
                    className="inline-flex min-h-11 items-center justify-center rounded-control bg-tealFinance px-5 text-sm font-semibold text-white transition hover:bg-[#0b625b]"
                  >
                    Build your comparison
                  </Link>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-slate-200 bg-creamFinance py-16 sm:py-20">
        <ServicesPattern />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <SectionHeader
              title="Start with the level of support your decision needs"
              body="Use the browser comparison independently, then request a deeper evaluation or a focused conversation if the assumptions need more context."
            />
            <div className="mt-10 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
              {serviceOffers.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-panelBlue/55 py-16 sm:py-20" aria-labelledby="methodology-heading">
        <BlueprintPattern />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <SectionHeader
              title="A clear path from input to optional consultation"
              body="Every output remains tied to the assumptions entered. The process makes those assumptions visible before presenting a comparison."
            />
            <ol id="methodology-heading" className="mt-10 grid gap-0 md:grid-cols-3 xl:grid-cols-6">
              {processSteps.map((step, index) => (
                <li key={step.title} className="relative border-l border-slate-300 px-5 py-4 first:border-tealFinance xl:border-l-0 xl:border-t xl:pt-7">
                  <span className="absolute -left-[17px] top-3 flex size-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white xl:-top-4 xl:left-5">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 font-semibold text-navy xl:mt-0">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slateFinance">{step.body}</p>
                </li>
              ))}
            </ol>
          </SectionReveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 sm:py-20">
        <ContactPattern />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <SectionHeader
                title="A transparent, informational comparison"
                body="Evalfuture. keeps the model’s role clear: it organizes user-entered assumptions and calculated outcomes without presenting them as formal advice."
              />
              <div className="divide-y divide-slate-200 border-y border-slate-200">
                {reassuranceItems.map((item) => (
                  <article key={item.title} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr]">
                    <h3 className="font-semibold text-navy">{item.title}</h3>
                    <p className="text-sm leading-6 text-slateFinance">{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      <CTASection
        title="Turn a property question into a structured set of assumptions"
        body="Create a browser-based comparison, review the year-by-year outcome, and download the two-sheet workbook when you are ready."
        primaryLabel="Start the Free Comparison"
        primaryHref="/free-comparison"
        secondaryLabel="See How It Works"
        secondaryHref="/how-it-works"
      />
    </PageShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,31,51,1)_0%,rgba(11,31,51,0.96)_56%,rgba(16,42,67,0.9)_100%)]" />
        <HeroFinancePattern />
      </div>
      <div className="relative z-10 mx-auto grid min-h-[590px] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.58fr] lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
            Compare Renting, Buying, and Financing Property{" "}
            <span className="text-goldFinance">with Confidence</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Evalfuture. helps property buyers, landlords, and investors understand how rent,
            mortgages, service charges, interest, savings, and market movement shape a long-term
            comparison.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-comparison"
              className="inline-flex min-h-12 items-center justify-center rounded-control bg-tealFinance px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
            >
              Get a Free Comparison
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-12 items-center justify-center rounded-control border border-white/45 px-6 text-sm font-semibold text-white transition hover:bg-white hover:text-navy"
            >
              Explore Services
            </Link>
          </div>
        </div>
        <div className="hidden border-l border-white/15 pl-8 lg:block">
          <p className="text-sm font-semibold text-[#9FE3D9]">One structured view</p>
          <dl className="mt-6 divide-y divide-white/15">
            {[
              ["Financing", "Payment, principal, interest"],
              ["Property", "Purchase, service charges, resale"],
              ["Rental", "Rent, net return, savings"],
              ["Market", "Default and custom yearly movement"]
            ].map(([term, detail]) => (
              <div key={term} className="py-4">
                <dt className="font-semibold">{term}</dt>
                <dd className="mt-1 text-sm text-slate-300">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <dt className="text-sm text-slateFinance">{label}</dt>
      <dd className="numeric mt-2 text-xl font-semibold text-navy">{value}</dd>
    </div>
  );
}
