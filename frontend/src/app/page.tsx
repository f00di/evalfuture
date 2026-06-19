import type { Metadata } from "next";
import Link from "next/link";
import ContactCard from "@/components/site/ContactCard";
import CTASection from "@/components/site/CTASection";
import FreeComparisonPreview from "@/components/site/FreeComparisonPreview";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";
import ServiceCard from "@/components/site/ServiceCard";
import { contactDetails, freeComparisonItems, processSteps, serviceOffers } from "@/lib/site";

export const metadata: Metadata = {
  title: "Evalfuture. | Rent vs Buy Property Comparison UAE",
  description:
    "Compare renting, buying, financing, rental income, mortgage interest, service charges, and market movement with Evalfuture."
};

export default function Home() {
  return (
    <PageShell>
      <Hero />
      <section className="bg-creamFinance py-14" aria-labelledby="free-includes">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:px-8">
          <div>
            <SectionHeader
              eyebrow="What your free comparison includes"
              title="A compact first view of the numbers"
              body="Start with the major assumptions and outcome signals clients need before opening the full model."
            />
          </div>
          <div id="free-includes">
            <FreeComparisonPreview ctaLabel="Get Yours Free" />
          </div>
        </div>
      </section>

      <section className="bg-white py-14" aria-labelledby="services-preview">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Services"
            title="Choose the level of evaluation your property decision needs"
            body="Use the free comparison first, then request deeper support when the assumptions need more review."
          />
          <div id="services-preview" className="mt-8 grid gap-5 lg:grid-cols-3">
            {serviceOffers.slice(0, 3).map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-panelBlue/60 py-14" aria-labelledby="process-preview">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="How it works"
            title="A practical route from assumptions to comparison"
            body="The flow keeps the first decision clean, then makes the full model available when the client is ready."
          />
          <div id="process-preview" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.slice(0, 4).map((step, index) => (
              <article key={step.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <div className="mb-5 inline-flex rounded-md bg-inputAmber px-3 py-2 text-sm font-semibold text-navy">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slateFinance">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_420px] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tealFinance">
              Contact
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-navy">
              Review a property decision with {contactDetails.name}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slateFinance">
              Evalfuture. supports property buyers, landlords, and investors comparing renting,
              buying outright, mortgage financing, service charges, rental income, market
              movement, and long-term outcomes.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/free-comparison"
                className="rounded-md bg-tealFinance px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0b625b]"
              >
                Get a Free Comparison
              </Link>
              <Link
                href="/contact"
                className="rounded-md border border-navy px-5 py-3 text-center text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>
          <ContactCard />
        </div>
      </section>

      <CTASection
        eyebrow="Free Initial Comparison"
        title="Start with the numbers before deciding your next property move"
        body="Compare rent, buy, financing, service charge, market movement, and resale assumptions in one structured flow."
        primaryLabel="Get a Free Comparison"
        primaryHref="/free-comparison"
        secondaryLabel="Explore Services"
        secondaryHref="/services"
      />
    </PageShell>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <HeroBackground />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9FE3D9]">
            Property comparison and financing evaluation
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Compare Renting, Buying, and Financing Property with Confidence
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            Evalfuture. helps property buyers, landlords, and investors understand the long-term
            numbers behind rent, mortgages, service charges, interest, and market movement.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/free-comparison"
              className="rounded-md bg-tealFinance px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
            >
              Get a Free Comparison
            </Link>
            <Link
              href="/services"
              className="rounded-md border border-white/40 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white hover:text-navy"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroBackground() {
  return (
    <div className="absolute inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,31,51,0.96)_0%,rgba(11,31,51,0.86)_45%,rgba(11,31,51,0.42)_100%)]" />
      <div className="absolute bottom-0 right-0 top-0 hidden w-[58%] lg:block">
        <div className="absolute inset-y-10 right-8 w-[78%] rounded-lg border border-white/15 bg-white/10 shadow-panel backdrop-blur-sm">
          <div className="grid h-full grid-rows-[auto_1fr_auto] gap-5 p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {["Rent", "Buy", "Finance"].map((label) => (
                <div key={label} className="rounded-md border border-white/15 bg-white/10 p-3">
                  <p className="text-xs text-slate-300">{label}</p>
                  <div className="mt-3 h-2 rounded-full bg-white/20">
                    <div className="h-2 rounded-full bg-[#9FE3D9]" style={{ width: "68%" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-10 items-end gap-2">
              {freeComparisonItems.slice(0, 10).map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-t-md bg-[#9FE3D9]/80"
                  style={{ height: `${42 + index * 5}%` }}
                />
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/15 bg-white/10 p-4">
                <div className="h-2 w-24 rounded-full bg-white/30" />
                <div className="mt-4 h-8 rounded-md bg-white/20" />
              </div>
              <div className="rounded-md border border-white/15 bg-white/10 p-4">
                <div className="h-2 w-28 rounded-full bg-white/30" />
                <div className="mt-4 h-8 rounded-md bg-inputAmber/80" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 h-44 w-full bg-[linear-gradient(0deg,rgba(15,118,110,0.34),rgba(15,118,110,0))]" />
      </div>
    </div>
  );
}
