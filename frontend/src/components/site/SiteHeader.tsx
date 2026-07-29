"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/site";

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_4px_18px_rgba(11,31,51,0.04)] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-xl font-semibold tracking-[-0.02em] text-navy">
          Evalfuture.
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex size-11 items-center justify-center rounded-control border border-slate-300 bg-white text-navy lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
        >
          <span className="grid gap-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 text-sm text-slateFinance lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href}>
              {item.label}
            </NavLink>
          ))}
          <Link
            href="/free-comparison"
            className="ml-2 inline-flex min-h-11 items-center rounded-control bg-tealFinance px-4 font-semibold text-white transition hover:bg-[#0b625b]"
          >
            Get a Free Comparison
          </Link>
        </nav>
      </div>

      {isOpen && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slateFinance shadow-panel sm:px-6 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-control px-3 font-medium transition hover:bg-panelBlue hover:text-navy ${pathname === item.href ? "bg-panelBlue text-navy" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/free-comparison"
            className="mt-2 flex min-h-11 items-center justify-center rounded-control bg-tealFinance px-4 font-semibold text-white"
          >
            Get a Free Comparison
          </Link>
        </nav>
      )}
    </header>
  );
}

function NavLink({
  href,
  active,
  children
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center rounded-control border-b-2 px-3 font-medium transition hover:text-navy ${
        active ? "border-goldFinance text-navy" : "border-transparent"
      }`}
    >
      {children}
    </Link>
  );
}
