import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/portal/dashboard/",
          "/test/",
          "/inquiry/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
