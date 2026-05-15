import { brand } from "@/content/site";
import { getSiteOrigin } from "@/lib/site-url";

const LOGO = "/guest-signal-header-icon.svg";

export function organizationSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: origin,
    logo: `${origin}${LOGO}`,
    email: brand.email,
    description: brand.mission,
    areaServed: ["Cincinnati, Ohio", "United States"],
    sameAs: [brand.instagram],
    knowsAbout: [
      "Hospitality operational intelligence",
      "Restaurant guest experience monitoring",
      "Review intelligence",
      "Reputation management",
    ],
  };
}

export function websiteSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: origin,
    description: brand.tagline,
    publisher: { "@type": "Organization", name: brand.name },
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}/insights/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function localBusinessSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: brand.name,
    image: `${origin}${LOGO}`,
    url: origin,
    email: brand.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Cincinnati",
      addressRegion: "OH",
      addressCountry: "US",
    },
    areaServed: ["Cincinnati, Ohio", "United States"],
    priceRange: "$$",
    description:
      "Hospitality operational intelligence for restaurants, bars, hotels, and service-based businesses.",
  };
}

export function professionalServiceSchema() {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Guest Signal Score & Reputation Intelligence",
    provider: { "@type": "Organization", name: brand.name },
    serviceType: "Hospitality operational intelligence and guest experience monitoring",
    areaServed: ["Cincinnati, Ohio", "United States"],
    url: `${origin}/services/`,
    description:
      "Review intelligence, sentiment analysis, competitive positioning, and prioritized operational action plans.",
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${origin}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  publishedDate: string;
  updatedDate: string;
  image?: string;
}) {
  const origin = getSiteOrigin();
  const url = `${origin}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    datePublished: input.publishedDate,
    dateModified: input.updatedDate,
    author: { "@type": "Organization", name: brand.name },
    publisher: {
      "@type": "Organization",
      name: brand.name,
      logo: { "@type": "ImageObject", url: `${origin}${LOGO}` },
    },
    mainEntityOfPage: url,
    url,
    ...(input.image ? { image: input.image.startsWith("http") ? input.image : `${origin}${input.image}` } : {}),
  };
}

export function faqPageSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  path: string;
}) {
  const origin = getSiteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: `${origin}${input.path}`,
    isPartOf: { "@type": "WebSite", name: brand.name, url: origin },
  };
}
