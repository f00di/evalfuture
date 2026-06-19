import type { ReactNode } from "react";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-creamFinance text-navy">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
