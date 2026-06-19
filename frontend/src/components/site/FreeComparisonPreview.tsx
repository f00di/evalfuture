import Link from "next/link";
import { freeComparisonItems } from "@/lib/site";

export default function FreeComparisonPreview({
  ctaLabel = "Get Yours Free",
  ctaHref = "/free-comparison",
  showCta = true
}: {
  ctaLabel?: string;
  ctaHref?: string;
  showCta?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="divide-y divide-slate-200">
        {freeComparisonItems.map((item, index) => (
          <div key={item.title} className="grid gap-3 p-4 sm:grid-cols-[44px_1fr] sm:p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-inputAmber text-sm font-semibold text-navy">
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-navy">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slateFinance">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
      {showCta && (
        <div className="border-t border-slate-200 p-4 sm:p-5">
          <Link
            href={ctaHref}
            className="inline-flex rounded-md bg-tealFinance px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
