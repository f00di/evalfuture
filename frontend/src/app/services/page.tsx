import type { Metadata } from "next";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import ServicesPattern from "@/components/backgrounds/ServicesPattern";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import ServiceCard from "@/components/site/ServiceCard";
import SectionReveal from "@/components/ui/SectionReveal";
import { serviceOffers, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services | Evalfuture.",
  description:
    "Free comparison, detailed property evaluation, consulting, and Excel export services from Evalfuture.",
  alternates: { canonical: `${siteUrl}/services/` },
  openGraph: {
    title: "Property Comparison Services | Evalfuture.",
    description:
      "Explore free comparison, detailed evaluation, consulting, and Excel export options.",
    url: `${siteUrl}/services/`
  }
};

export default function ServicesPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-creamFinance py-14">
        <ServicesPattern />
        <SectionGlow />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            level="h1"
            eyebrow="Services"
            title="Property comparison services for clearer decisions"
            body="Start with an initial comparison, then request deeper evaluation or consultation when your property decision needs more context."
          />
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-16 sm:py-20">
        <ServicesPattern />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionReveal>
            <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
              {serviceOffers.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
            </div>
          </SectionReveal>
          <div className="mt-14 grid gap-6 border-y border-slate-200 py-8 lg:grid-cols-3">
            <div>
              <h2 className="text-xl font-semibold text-navy">No invented pricing</h2>
              <p className="mt-2 text-sm leading-6 text-slateFinance">
                The site explains scope and deliverables without publishing assumptions about fees.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-navy">Assumption-led output</h2>
              <p className="mt-2 text-sm leading-6 text-slateFinance">
                Every comparison depends on the property and financial values supplied by the user.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-navy">Informational use</h2>
              <p className="mt-2 text-sm leading-6 text-slateFinance">
                The comparison supports review and discussion; it is not formal financial advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Discuss the right level of support"
        body="Use the service options above to decide whether a detailed evaluation or consulting session is needed."
        primaryLabel="Contact"
        primaryHref="/contact"
      />
    </PageShell>
  );
}
