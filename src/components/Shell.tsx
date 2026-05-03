import Link from "next/link";
import { ServicesIntakeLink } from "@/components/ServicesIntakeLink";
import { brand, nav } from "@/content/site";
import { ReactNode } from "react";
import { BrandLockup, BrandLockupFooter } from "@/components/BrandLockup";
import { MobileNavMenu } from "@/components/MobileNavMenu";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-gradient-to-b from-white via-sky-50/35 to-stone-100 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-2.5">
          {/* Logo + nav grouped so links sit next to the mark—avoids a wide empty band on large screens */}
          <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-8 lg:gap-10">
            <BrandLockup />
            <nav
              className="hidden items-center gap-4 md:flex lg:gap-5"
              aria-label="Primary"
            >
              {nav.map((n) => (
                <Link
                  key={n.label + n.href}
                  href={n.href.startsWith("#") ? `/${n.href}` : n.href}
                  className="whitespace-nowrap text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            <MobileNavMenu items={nav} />
            <ServicesIntakeLink
              href="/services/inquiry/?plan=free_snapshot"
              className="btn-primary whitespace-nowrap py-2.5 text-xs sm:py-3 sm:text-sm"
            >
              <span className="hidden sm:inline">Get Your Free Snapshot</span>
              <span className="sm:hidden">Free Snapshot</span>
            </ServicesIntakeLink>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-5">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <BrandLockupFooter />
              <p className="mt-4 text-sm text-slate-400">
                © {new Date().getFullYear()} {brand.name}. All rights reserved.
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                <span className="font-medium text-slate-200">{brand.city}</span>
                <span className="text-slate-600" aria-hidden>
                  •
                </span>
                <span>{brand.email}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <Link
                href="/portal"
                className="font-medium text-slate-400 transition-colors hover:text-amber-400"
              >
                Client Portal
              </Link>
              <span className="text-slate-700" aria-hidden>
                |
              </span>
              <a
                href={brand.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-amber-400"
                aria-label="Follow us on Instagram"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
