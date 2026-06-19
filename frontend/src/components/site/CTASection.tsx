import Link from "next/link";
import ContactPattern from "@/components/backgrounds/ContactPattern";

export default function CTASection({
  eyebrow,
  title,
  body,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref
}: {
  eyebrow?: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy py-14 text-white">
      <ContactPattern />
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-tealFinance/[0.08] blur-3xl" aria-hidden="true" />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <div>
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9FE3D9]">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight">{title}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">{body}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <Link
            href={primaryHref}
            className="rounded-md bg-tealFinance px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#0b625b]"
          >
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="rounded-md border border-white/40 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white hover:text-navy"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
