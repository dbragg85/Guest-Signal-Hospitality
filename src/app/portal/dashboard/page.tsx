import type { Metadata } from "next";
import { PortalDashboardClient } from "./PortalDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Restaurant scorecards and Guest Signal data.",
};

export default function PortalDashboardPage() {
  return <PortalDashboardClient />;
}
