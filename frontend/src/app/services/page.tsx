import type { Metadata } from "next";
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
      <section className="border-b border-slate-200 bg-creamFinance py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            level="h1"
            eyebrow="Services"
            title="Property comparison services for clearer decisions"
            body="Start with a free initial comparison, then request deeper evaluation or consultation when your property decision needs more context."
          />
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {serviceOffers.map((service) => (
            <ServiceCard key={service.title} {...service} />
          ))}
        </div>
      </section>

      <CTASection
        title="Begin with the free comparison"
        body="Use the compact comparison first, then decide whether a detailed evaluation or consulting session is needed."
        primaryLabel="Get a Free Comparison"
        primaryHref="/free-comparison"
        secondaryLabel="Contact"
        secondaryHref="/contact"
      />
    </PageShell>
  );
}
