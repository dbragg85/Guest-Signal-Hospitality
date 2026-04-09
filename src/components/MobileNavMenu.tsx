"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

export function MobileNavMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-primary-nav"
        aria-label="Open navigation menu"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 bg-white text-slate-700 shadow-sm transition-colors hover:bg-stone-50"
      >
        <span className="sr-only">Menu</span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {open ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      {open ? (
        <div
          id="mobile-primary-nav"
          className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-stone-200 bg-white p-3 shadow-xl"
          role="menu"
          aria-label="Mobile primary navigation"
        >
          <nav className="flex flex-col" aria-label="Primary">
            {items.map((item) => {
              const href = item.href.startsWith("#") ? `/${item.href}` : item.href;
              const isActive =
                href === "/"
                  ? pathname === "/"
                  : pathname === href || pathname?.startsWith(`${href}/`);

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={href}
                  role="menuitem"
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-stone-100 text-slate-900"
                      : "text-slate-700 hover:bg-stone-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
