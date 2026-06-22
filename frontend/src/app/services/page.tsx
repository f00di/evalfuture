import type { Metadata } from "next";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import ServicesPattern from "@/components/backgrounds/ServicesPattern";
import CTASection from "@/components/site/CTASection";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import ServiceCard from "@/components/site/ServiceCard";
import { serviceOffers } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services | Evalfuture.",
  description:
    "Free initial comparison, detailed property evaluation, and consulting sessions for rent-vs-buy property decisions."
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

      <section className="relative overflow-hidden bg-white py-14">
        <ServicesPattern />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {serviceOffers.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
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
