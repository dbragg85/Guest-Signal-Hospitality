import type { Metadata } from "next";
import { HomeConversionPage } from "@/components/HomeConversionPage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  localBusinessSchema,
  organizationSchema,
  professionalServiceSchema,
  websiteSchema,
} from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Restaurant Review Scorecards & Action Plans",
  description:
    "Turn Google and Yelp reviews into one clear score and three practical priorities your restaurant team can use this week.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Know What Guests Notice | Guest Signal Hospitality",
    description:
      "A clear restaurant review scorecard, recurring guest themes, and practical next steps.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          localBusinessSchema(),
          professionalServiceSchema(),
        ]}
      />
      <HomeConversionPage />
    </>
  );
}
