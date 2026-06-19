import type { Metadata } from "next";
import ContactPattern from "@/components/backgrounds/ContactPattern";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import ContactCard from "@/components/site/ContactCard";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "About | Evalfuture.",
  description:
    "About Evalfuture. and M. Kashif Ansari, focused on property comparison, rent-vs-buy analysis, and UAE property decisions."
};

export default function AboutPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-creamFinance py-14">
        <ContactPattern />
        <SectionGlow />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            level="h1"
            eyebrow="About"
            title="Evalfuture. supports clearer UAE property decisions"
            body="The purpose is to help clients compare renting, buying outright, mortgage financing, rental income, service charges, market movement, and long-term resale outcomes in one structured view."
          />
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-14">
        <ContactPattern />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-navy">Property comparison first</h2>
            <p className="mt-4 text-base leading-7 text-slateFinance">
              Evalfuture. is built around a practical rent-vs-buy model for clients reviewing UAE
              property decisions. It focuses on the assumptions that usually change the outcome:
              financing structure, interest, purchase costs, service charges, rental returns,
              savings opportunity cost, and market rise/drop scenarios.
            </p>
            <p className="mt-4 text-base leading-7 text-slateFinance">
              M. Kashif Ansari is the contact person for detailed evaluation and consulting
              requests. The free comparison is an informational starting point and can be followed
              by a more detailed review when a property decision needs additional structure.
            </p>
          </div>
          <ContactCard />
        </div>
      </section>

      <CTASection
        title="Start with a free property comparison"
        body="Use the initial comparison to review the direction of the numbers before requesting deeper support."
        primaryLabel="Get a Free Comparison"
        primaryHref="/free-comparison"
        secondaryLabel="Contact"
        secondaryHref="/contact"
      />
    </PageShell>
  );
}
