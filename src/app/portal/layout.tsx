import { PortalSessionProvider } from "@/contexts/PortalSessionContext";
import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalSessionProvider>{children}</PortalSessionProvider>;
}
