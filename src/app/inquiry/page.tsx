"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * GitHub Pages has no server redirects. Old or shorthand links to `/inquiry/`
 * would 404; send visitors to the real intake route and keep `?plan=` etc.
 */
export default function LegacyInquiryPathRedirect() {
  const router = useRouter();

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/services/inquiry/${search}`);
  }, [router]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600">
      <p>Redirecting to the service inquiry form…</p>
    </div>
  );
}
