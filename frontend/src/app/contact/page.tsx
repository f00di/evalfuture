import type { Metadata } from "next";
import ContactPattern from "@/components/backgrounds/ContactPattern";
import SectionGlow from "@/components/backgrounds/SectionGlow";
import ContactCard from "@/components/site/ContactCard";
import ContactForm from "@/components/site/ContactForm";
import PageShell from "@/components/site/PageShell";
import SectionHeader from "@/components/site/SectionHeader";

export const metadata: Metadata = {
  title: "Contact | Evalfuture.",
  description: "Contact M. Kashif Ansari for Evalfuture. property comparison and consultation."
};

export default function ContactPage() {
  return (
    <PageShell>
      <section className="relative overflow-hidden border-b border-slate-200 bg-creamFinance py-14">
        <ContactPattern />
        <SectionGlow />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            level="h1"
            eyebrow="Contact"
            title="Contact Evalfuture."
            body="Use the contact details below for detailed property evaluation or consulting session requests."
          />
        </div>
      </section>

      <section className="relative overflow-hidden bg-white py-14">
        <ContactPattern />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
          <ContactCard />
          <ContactForm />
        </div>
      </section>
    </PageShell>
  );
}
