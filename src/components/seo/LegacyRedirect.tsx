"use client";

import { useEffect } from "react";
import Link from "next/link";

type Props = {
  targetPath: string;
  label?: string;
};

/**
 * GitHub Pages static export has no server 301s. Client redirect + canonical on the
 * destination page preserves UX; legacy pages include link rel=canonical to target.
 */
export function LegacyRedirect({ targetPath, label = "Redirecting to the updated article…" }: Props) {
  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    window.location.replace(`${targetPath}${search}`);
  }, [targetPath]);

  return (
    <RedirectFallback targetPath={targetPath} label={label} />
  );
}

function RedirectFallback({ targetPath, label }: Props) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center text-slate-600">
      <p>{label}</p>
      <p className="mt-4">
        <Link href={targetPath} className="font-semibold text-amber-900 underline underline-offset-2">
          Continue to the updated page
        </Link>
      </p>
    </div>
  );
}
