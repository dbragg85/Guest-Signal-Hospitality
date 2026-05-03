import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Legacy `/inquiry/` path; canonical intake is `/services/inquiry/`. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: "Redirecting to intake | Guest Signal Hospitality",
};

export default function InquiryAliasLayout({ children }: { children: ReactNode }) {
  return children;
}
