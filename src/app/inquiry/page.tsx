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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("plan") === "free_snapshot") {
      router.replace("/snapshot/");
      return;
    }
    router.replace(`/services/inquiry/${window.location.search}`);
  }, [router]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600">
      <p>Redirecting to the service inquiry form…</p>
    </div>
  );
}
