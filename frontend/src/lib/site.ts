export const siteUrl = "https://f00di.github.io/evalfuture";

export const disclaimer =
  "This comparison is for informational purposes only and does not constitute financial, investment, mortgage, tax, or legal advice.";

export const contactDetails = {
  name: "M. Kashif Ansari",
  phone: "xxxx",
  email: "xxxxxx"
};

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const freeComparisonItems = [
  {
    title: "Purchase price and financing assumptions",
    body: "Property price, area, down payment, purchase cost, loan term, and mortgage rate."
  },
  {
    title: "Down payment and purchase cost estimate",
    body: "A clearer view of initial funds required before comparing financing outcomes."
  },
  {
    title: "Mortgage payment and interest estimate",
    body: "Monthly instalment, yearly payment, principal, and total interest preview."
  },
  {
    title: "Rental income and service charge view",
    body: "Current rent assumptions, service charges, and net rental impact."
  },
  {
    title: "Market rise/drop scenario",
    body: "Default and custom annual market movement based on the selected loan term."
  },
  {
    title: "Rent-vs-buy outcome summary",
    body: "A compact result view before opening the detailed year-by-year tables."
  },
  {
    title: "Excel comparison export",
    body: "Download an Excel-compatible workbook generated in the browser for static hosting."
  }
];

export const serviceOffers = [
  {
    title: "Free Initial Comparison",
    body: "A quick rent-vs-buy comparison using basic property, rental, financing, service charge, and market assumptions.",
    cta: "Open Comparison Tool",
    href: "/free-comparison",
    deliverables: ["On-screen comparison", "Market scenario chart", "Excel-compatible workbook"],
    bestFor: "A first structured view before requesting a deeper review."
  },
  {
    title: "Detailed Property Evaluation",
    body: "A more detailed report based on the initial quote, with deeper year-by-year outcomes and scenario review.",
    cta: "Request Detailed Evaluation",
    href: "/contact",
    deliverables: ["Assumption review", "Year-by-year outcome context", "Scenario discussion"],
    bestFor: "A specific property decision that needs more context than the free comparison."
  },
  {
    title: "Consulting Session",
    body: "Review assumptions and results with M. Kashif Ansari, including financing structure, mortgage assumptions, rental income, and market scenarios.",
    cta: "Request a Consultation",
    href: "/contact",
    deliverables: ["Focused discussion", "Assumption walkthrough", "Clear follow-up questions"],
    bestFor: "Clients who want to understand how individual assumptions influence the model."
  },
  {
    title: "Download Your Excel Comparison",
    body: "Take the free comparison into an Excel-compatible two-sheet workbook for review, notes, and offline reference.",
    cta: "Create Your Workbook",
    href: "/free-comparison",
    deliverables: ["Evalfuture sheet", "Amort sheet", "Chart-ready market data"],
    bestFor: "Keeping a portable record of the assumptions and calculated comparison."
  }
];

export const processSteps = [
  {
    title: "Input",
    body: "Enter client, property, purchase, rental, and financing details."
  },
  {
    title: "Assumptions",
    body: "Choose the display currency and Default or Custom market values for the selected term."
  },
  {
    title: "Calculation",
    body: "The model calculates mortgage payments, interest, rent, service charges, savings, and settlement balances."
  },
  {
    title: "Comparison",
    body: "Review year-by-year rent, financed purchase, market price, settlement, and resale outcomes."
  },
  {
    title: "Export",
    body: "Download the two-sheet Excel-compatible workbook directly from the browser."
  },
  {
    title: "Optional consultation",
    body: "Request a detailed evaluation or consulting session when the assumptions need more context."
  }
];

export const reassuranceItems = [
  {
    title: "Your assumptions stay in the session",
    body: "The public calculator runs in your browser and does not store financial assumptions in local storage."
  },
  {
    title: "Currency is a display assumption",
    body: "Changing currency labels the model values; it does not perform live exchange-rate conversion."
  },
  {
    title: "Outcomes, not promises",
    body: "Results depend on the values entered and are framed as comparison outcomes, not guaranteed returns."
  }
];
