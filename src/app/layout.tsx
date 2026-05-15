import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { ReactNode } from "react";
import { TrackingClickEvents } from "@/components/TrackingClickEvents";
import { brand } from "@/content/site";
import { getSiteOrigin } from "@/lib/site-url";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default:
      "Guest Signal Hospitality | Hospitality Operational Intelligence for Restaurants, Bars & Hotels",
    template: "%s | Guest Signal Hospitality",
  },
  description:
    "Hospitality operational intelligence for restaurants, bars, hotels, and service businesses. Review intelligence, guest experience systems, service consistency, and revenue optimization—not generic marketing.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: brand.name,
    title:
      "Guest Signal Hospitality | Operational intelligence for restaurant owners.",
    description:
      "We turn Google Reviews into clear, actionable insights—SWOT, reputation signals, competitive positioning, and a prioritized action plan that improves guest experience and profitability.",
    url: "/",
    images: [
      {
        url: "/guest-signal-header-icon.svg",
        alt: `${brand.name} mark`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Guest Signal Hospitality | Operational intelligence for restaurant owners.",
    description:
      "We turn Google Reviews into clear, actionable insights—SWOT, reputation signals, competitive positioning, and a prioritized action plan that improves guest experience and profitability.",
    images: ["/guest-signal-header-icon.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <TrackingClickEvents />
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
