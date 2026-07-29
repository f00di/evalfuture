import type { Metadata } from "next";
import BlueprintPattern from "@/components/backgrounds/BlueprintPattern";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import { processSteps, siteUrl } from "@/lib/site";
import SectionReveal from "@/components/ui/SectionReveal";

export const metadata: Metadata = {
  title: "How It Works | Evalfuture.",
  description:
    "Learn how Evalfuture. turns property inputs into assumptions, calculations, comparisons, and an Excel export.",
  alternates: { canonical: `${siteUrl}/how-it-works/` },
  openGraph: {
    title: "How the Property Comparison Works | Evalfuture.",
    description:
      "See how inputs and assumptions become calculations, comparisons, and an Excel export.",
    url: `${siteUrl}/how-it-works/`
  }
};

export default function HowItWorksPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-creamFinance py-14">
        <BlueprintPattern />
        <SectionGlow />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            level="h1"
            eyebrow="How It Works"
            title="From property assumptions to a structured comparison"
            body="Evalfuture. keeps the first step simple, then opens the full comparison model when you need detailed rows and exports."
          />
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 sm:py-20">
        <BlueprintPattern />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <ol className="border-y border-slate-200">
              {processSteps.map((step, index) => (
                <li key={step.title} className="grid gap-4 border-b border-slate-200 py-6 last:border-b-0 sm:grid-cols-[80px_1fr]">
                  <div className="numeric text-3xl font-semibold text-goldFinance">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-navy">{step.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slateFinance">{step.body}</p>
                    {index === 1 && (
                      <p className="mt-2 text-xs font-medium text-tealFinance">
                        Blank Custom market values use the corresponding Default value.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </SectionReveal>
          <p className="mt-8 rounded-control border border-goldFinance/40 bg-inputAmber/40 px-4 py-3 text-sm leading-6 text-navy">
            The quality of the output depends on the completeness and reasonableness of the
            assumptions entered. Changing the display currency does not convert values using live
            exchange rates.
          </p>
        </div>
      </section>

      <CTASection
        title="Choose the next step"
        body="Review the process, then explore the service options or contact Evalfuture. for a detailed property review."
        primaryLabel="Explore Services"
        primaryHref="/services"
        secondaryLabel="Contact"
        secondaryHref="/contact"
      />
    </PageShell>
  );
}
