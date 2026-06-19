import Link from "next/link";
import FooterSkyline from "@/components/backgrounds/FooterSkyline";
import { contactDetails, disclaimer, navItems } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-white">
      <FooterSkyline />
      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 py-8 text-sm text-slateFinance sm:px-6 lg:grid-cols-[1fr_1fr_1.4fr] lg:px-8">
        <div>
          <p className="text-lg font-semibold text-navy">Evalfuture.</p>
          <p className="mt-2 leading-6">
            Rent-vs-buy property comparison and financing evaluation.
          </p>
        </div>
        <div>
          <p className="font-semibold text-navy">Contact details</p>
          <p className="mt-2">{contactDetails.name}</p>
          <p>UAE: {contactDetails.uae}</p>
          <p>Email: {contactDetails.email}</p>
        </div>
        <div>
          <nav className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="font-medium hover:text-navy">
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="leading-6">{disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
