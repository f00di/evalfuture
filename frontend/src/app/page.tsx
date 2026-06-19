import ModelDashboard from "@/components/ModelDashboard";

const navItems = [
  ["How It Works", "#how-it-works"],
  ["Services", "#services"],
  ["Free Comparison", "#free-comparison"],
  ["Model Preview", "#model-preview"],
  ["Contact", "#contact"]
];

const decisionFactors = [
  "Mortgage payments",
  "Down payments",
  "Purchase costs",
  "Interest over time",
  "Rental income",
  "Service charges",
  "Early settlement fees",
  "Market price rise/drop",
  "Opportunity cost of savings",
  "Exit/resale value"
];

const services = [
  {
    title: "Free Initial Comparison",
    description:
      "A quick rent-vs-buy comparison using your property price, expected rent, loan term, mortgage rate, service charges, and market assumptions.",
    cta: "Get a Free Comparison",
    href: "#free-comparison"
  },
  {
    title: "Detailed Property Evaluation",
    description:
      "A more detailed quote/report based on the initial comparison, including year-by-year rental, financing, resale, and market movement assumptions.",
    cta: "Request Detailed Evaluation",
    href: "#contact"
  },
  {
    title: "Consulting Session",
    description:
      "A one-to-one session to review the numbers, scenarios, financing structure, and property assumptions in more detail.",
    cta: "Book a Consulting Session",
    href: "#contact"
  }
];

export default function Home() {
  return (
    <main className="min-h-screen text-navy">
      <SiteHeader />
      <HeroSection />
      <ValueSection />
      <HowItWorksSection />
      <ServicesSection />
      <FreeComparisonSection />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <a href="#top" className="text-xl font-semibold tracking-normal text-navy">
          Evalfuture.
        </a>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slateFinance lg:justify-end">
          {navItems.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-md px-2.5 py-2 font-medium transition hover:bg-panelBlue hover:text-navy"
            >
              {label}
            </a>
          ))}
          <a
            href="#free-comparison"
            className="rounded-md bg-tealFinance px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
          >
            Get a Free Comparison
          </a>
        </nav>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section id="top" className="border-b border-slate-200 bg-creamFinance">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,520px)] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tealFinance">
            Property comparison and financing evaluation
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Compare Renting, Buying, and Financing Property with Confidence
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slateFinance sm:text-lg">
            Evalfuture. helps property buyers, landlords, and investors understand the
            long-term numbers behind renting, buying, mortgage financing, rental income, service
            charges, interest, and market movement.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="#free-comparison"
              className="rounded-md bg-tealFinance px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
            >
              Get a Free Comparison
            </a>
            <a
              href="#model-preview"
              className="rounded-md border border-navy px-5 py-3 text-center text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
            >
              View Model Preview
            </a>
          </div>
          <p className="mt-5 max-w-2xl text-xs leading-5 text-slateFinance">
            This comparison is for informational purposes only and does not constitute financial,
            investment, mortgage, tax, or legal advice.
          </p>
        </div>
        <HeroDashboardVisual />
      </div>
    </section>
  );
}

function HeroDashboardVisual() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tealFinance">
            Evalfuture. snapshot
          </p>
          <h2 className="mt-1 text-xl font-semibold text-navy">Property decision view</h2>
        </div>
        <div className="rounded-md bg-inputAmber px-3 py-2 text-sm font-semibold text-navy">
          AED
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ["Rental outcome", "Net annual cost"],
          ["Buying cash", "Initial capital view"],
          ["Mortgage option", "Interest and principal"],
          ["Resale scenario", "Market movement"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-creamFinance p-4">
            <p className="text-sm font-medium text-slateFinance">{label}</p>
            <p className="mt-2 text-lg font-semibold text-navy">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-lg border border-slate-200 bg-panelBlue/70 p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-navy">10-year comparison curve</p>
          <p className="text-xs font-semibold text-positiveGreen">Preview</p>
        </div>
        <div className="flex h-32 items-end gap-2">
          {[58, 64, 60, 72, 68, 82, 76, 88, 84, 94].map((height, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-tealFinance"
                style={{ height: `${height}%` }}
              />
              <span className="text-[10px] font-semibold text-slateFinance">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Loan term" value="10 yrs" />
        <MiniMetric label="Rent yield" value="7.5%" />
        <MiniMetric label="Market" value="Default" />
      </div>
    </div>
  );
}

function ValueSection() {
  return (
    <section className="bg-white py-14" aria-labelledby="value-heading">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tealFinance">
              The decision is rarely simple
            </p>
            <h2 id="value-heading" className="mt-3 text-3xl font-semibold text-navy">
              Property choices need more than a headline price
            </h2>
            <p className="mt-4 text-base leading-7 text-slateFinance">
              Renting, renting out, buying outright, or buying with financing can each look
              attractive until all cash flows are compared year by year. Evalfuture. simplifies
              the complicated financial comparison into a practical view of costs, income,
              financing, and potential resale outcomes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {decisionFactors.map((factor) => (
              <div key={factor} className="rounded-lg border border-slate-200 bg-creamFinance p-4">
                <p className="text-sm font-semibold text-navy">{factor}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    [
      "01",
      "Share property assumptions",
      "Enter price, rent, mortgage, service charge, and market movement assumptions."
    ],
    [
      "02",
      "Get a free initial comparison",
      "Preview the direction of the rent-vs-buy and financing outcome before requesting deeper review."
    ],
    [
      "03",
      "Review rent-vs-buy outcomes",
      "Compare rental cash flows, bank instalments, interest, principal, market value, and resale assumptions."
    ],
    [
      "04",
      "Move to detailed support",
      "Upgrade to a Detailed Property Evaluation or Consulting Session when a decision needs more structure."
    ]
  ];

  return (
    <section id="how-it-works" className="border-y border-slate-200 bg-panelBlue/60 py-14">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="How Evalfuture. helps"
          title="A clearer route from assumptions to decision support"
          body="The flow starts with a free initial comparison and can extend into a more detailed evaluation or consulting session."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(([number, title, body]) => (
            <article key={number} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-5 inline-flex rounded-md bg-inputAmber px-3 py-2 text-sm font-semibold text-navy">
                {number}
              </div>
              <h3 className="text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slateFinance">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="bg-white py-14">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Services"
          title="Choose the level of evaluation your property decision needs"
          body="Start with the free tool, then request deeper review when the numbers require more context."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.title} className="flex rounded-lg border border-slate-200 bg-creamFinance p-5 shadow-panel">
              <div className="flex flex-col">
                <h3 className="text-xl font-semibold text-navy">{service.title}</h3>
                <p className="mt-4 flex-1 text-sm leading-6 text-slateFinance">{service.description}</p>
                <a
                  href={service.href}
                  className="mt-6 inline-flex w-fit rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102A43]"
                >
                  {service.cta}
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreeComparisonSection() {
  return (
    <section id="free-comparison" className="border-y border-slate-200 bg-creamFinance py-14">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <SectionHeader
            eyebrow="Get a Free Comparison"
            title="Preview the model before requesting a detailed review"
            body="The free comparison estimates rental outcomes, loan payments, financing costs, service charges, market movement, and resale assumptions from your inputs."
          />
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm font-semibold text-navy">Included in the model preview</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {[
                "Rent-vs-buy outcome",
                "Default and custom market variation",
                "Mortgage interest and principal",
                "Download Your Excel Comparison"
              ].map((item) => (
                <div key={item} className="rounded-md bg-panelBlue/70 px-3 py-2 text-sm text-slateFinance">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <ModelDashboard />
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="bg-white py-14">
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-lg border border-slate-200 bg-navy p-6 text-white shadow-panel lg:grid-cols-[1fr_420px] lg:p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9FE3D9]">
              Consulting and detailed review
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Need help reviewing a property decision?</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
              Speak with M. Kashif Ansari to review your property assumptions, financing
              structure, rental income, and long-term comparison.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#free-comparison"
                className="rounded-md bg-tealFinance px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0b625b]"
              >
                Get a Free Comparison
              </a>
              <a
                href="mailto:xxxxxx"
                className="rounded-md border border-white/40 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white hover:text-navy"
              >
                Request Consulting Session
              </a>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 bg-white/10 p-5">
            <h3 className="text-lg font-semibold">Contact</h3>
            <dl className="mt-5 grid gap-4 text-sm">
              <div>
                <dt className="text-slate-300">Consultant</dt>
                <dd className="mt-1 font-semibold text-white">M. Kashif Ansari</dd>
              </div>
              <div>
                <dt className="text-slate-300">UAE</dt>
                <dd className="mt-1 font-semibold text-white">xxxx</dd>
              </div>
              <div>
                <dt className="text-slate-300">Email</dt>
                <dd className="mt-1 font-semibold text-white">xxxxxx</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-creamFinance py-8">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 text-sm text-slateFinance sm:px-6 lg:grid-cols-[1fr_1fr_1.2fr] lg:px-8">
        <div>
          <p className="text-lg font-semibold text-navy">Evalfuture.</p>
          <p className="mt-2">Rent-vs-buy property comparison and financing evaluation</p>
        </div>
        <div>
          <p className="font-semibold text-navy">Contact details</p>
          <p className="mt-2">M. Kashif Ansari</p>
          <p>UAE: xxxx</p>
          <p>Email: xxxxxx</p>
        </div>
        <p className="leading-6">
          This website provides informational comparisons only and does not constitute financial,
          investment, mortgage, tax, or legal advice.
        </p>
      </div>
    </footer>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tealFinance">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-navy">{title}</h2>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slateFinance">{body}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase text-slateFinance">{label}</p>
      <p className="mt-1 text-base font-semibold text-navy">{value}</p>
    </div>
  );
}
