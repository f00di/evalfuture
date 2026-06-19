import type { Metadata } from "next";
import BlueprintPattern from "@/components/backgrounds/BlueprintPattern";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import { processSteps } from "@/lib/site";

export const metadata: Metadata = {
  title: "How It Works | Evalfuture.",
  description:
    "Learn how Evalfuture. compares property assumptions, rent, buying, financing, resale outcomes, and Excel exports."
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

      <section className="relative overflow-hidden bg-white py-14">
        <BlueprintPattern />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            {processSteps.map((step, index) => (
              <article
                key={step.title}
                className="grid gap-4 rounded-lg border border-slate-200 bg-creamFinance/70 p-5 shadow-panel sm:grid-cols-[64px_1fr]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-inputAmber text-sm font-semibold text-navy">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-navy">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slateFinance">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Open the free comparison when you are ready"
        body="Preview the main assumptions first, then start the model to compare rent, buy, finance, and resale outcomes."
        primaryLabel="Start My Free Comparison"
        primaryHref="/free-comparison"
      />
    </PageShell>
  );
}
