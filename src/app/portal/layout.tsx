import { PortalSessionProvider } from "@/contexts/PortalSessionContext";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalSessionProvider>{children}</PortalSessionProvider>;
}
