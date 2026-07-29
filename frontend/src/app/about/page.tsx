import type { Metadata } from "next";
import ContactPattern from "@/components/backgrounds/ContactPattern";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import ContactCard from "@/components/site/ContactCard";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "About | Evalfuture.",
  description:
    "About Evalfuture. and its structured approach to rent-vs-buy property comparison.",
  alternates: { canonical: `${siteUrl}/about/` },
  openGraph: {
    title: "About Evalfuture.",
    description: "A structured, assumptions-led approach to property comparison.",
    url: `${siteUrl}/about/`
  }
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
            title="Evalfuture. supports clearer property decisions"
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
              Evalfuture. is built around a practical rent-vs-buy model for clients reviewing
              property decisions. It focuses on the assumptions that usually change the outcome:
              financing structure, interest, purchase costs, service charges, rental returns,
              savings opportunity cost, and market rise/drop scenarios.
            </p>
            <p className="mt-4 text-base leading-7 text-slateFinance">
              M. Kashif Ansari is the contact person for detailed evaluation and consulting
              requests. The initial comparison is an informational starting point and can be followed
              by a more detailed review when a property decision needs additional structure.
            </p>
            <div className="mt-8 grid gap-5 border-y border-slate-200 py-7 sm:grid-cols-2">
              <div>
                <h3 className="font-semibold text-navy">What Evalfuture. does</h3>
                <p className="mt-2 text-sm leading-6 text-slateFinance">
                  Organizes property, financing, rental, savings, and market assumptions into a
                  comparable year-by-year model.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-navy">What it does not claim</h3>
                <p className="mt-2 text-sm leading-6 text-slateFinance">
                  It does not guarantee returns or replace financial, investment, mortgage, tax,
                  or legal advice.
                </p>
              </div>
            </div>
          </div>
          <ContactCard />
        </div>
      </section>

      <CTASection
        title="Review a property decision with Evalfuture."
        body="Use the initial comparison to review the direction of the numbers, then contact Evalfuture. when deeper support is needed."
        primaryLabel="Contact"
        primaryHref="/contact"
      />
    </PageShell>
  );
}
