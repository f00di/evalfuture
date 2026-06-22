"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/lib/site";

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-xl font-semibold tracking-normal text-navy">
          Evalfuture.
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-navy lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span className="grid gap-1.5">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>

        <nav className="hidden items-center gap-1 text-sm text-slateFinance lg:flex">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} active={pathname === item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {isOpen && (
        <nav className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 text-sm text-slateFinance sm:px-6 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 font-medium transition hover:bg-panelBlue hover:text-navy"
            >
              {item.label}
            </Link>
          ))}
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
      className={`rounded-md px-3 py-2 font-medium transition hover:bg-panelBlue hover:text-navy ${
        active ? "bg-panelBlue text-navy" : ""
      }`}
    >
      {children}
    </Link>
  );
}
