import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PORTAL_RESTAURANTS, isPortalRestaurantSlug } from "@/data/portal-restaurants";
import { PortalDashboardClient } from "../PortalDashboardClient";

export function generateStaticParams() {
  return PORTAL_RESTAURANTS.map(({ slug }) => ({ slug }));
}

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const r = PORTAL_RESTAURANTS.find((x) => x.slug === params.slug);
  return {
    title: r ? `${r.name} — Scorecards` : "Scorecards",
    description: "Restaurant scorecards and Guest Signal data.",
  };
}

export default function PortalDashboardBySlugPage({ params }: Props) {
  if (!isPortalRestaurantSlug(params.slug)) {
    notFound();
  }
  return <PortalDashboardClient initialSlug={params.slug} />;
}
