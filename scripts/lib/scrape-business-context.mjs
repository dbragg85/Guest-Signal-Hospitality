/**
 * Scrape and extract business context from prospect websites.
 * Gathers history, mission, values, specialties, and unique details
 * to enable personalized Senior VP of Marketing outreach.
 */

const CONTEXT_PATHS = [
  "/",
  "/about",
  "/about-us",
  "/aboutus",
  "/our-story",
  "/story",
  "/history",
  "/our-history",
  "/team",
  "/our-team",
  "/philosophy",
  "/mission",
  "/values",
  "/chef",
  "/chefs",
  "/menu",
  "/menus",
  "/press",
  "/awards",
  "/accolades",
];

const META_SELECTORS = [
  { selector: 'meta[name="description"]', attr: "content" },
  { selector: 'meta[property="og:description"]', attr: "content" },
  { selector: 'meta[property="og:title"]', attr: "content" },
  { selector: 'meta[name="keywords"]', attr: "content" },
  { selector: 'meta[property="og:site_name"]', attr: "content" },
];

const CONTENT_PATTERNS = [
  /(?:since|established|founded|opened|serving since)\s*(\d{4})/gi,
  /(\d+)\s*(?:years?|decades?)\s*(?:of\s*)?(?:experience|service|excellence|tradition)/gi,
  /(?:family[- ]owned|family[- ]run|independently owned|locally owned)/gi,
  /(?:award[- ]winning|james beard|michelin|zagat|best of|top \d+)/gi,
  /(?:farm[- ]to[- ]table|locally sourced|sustainable|organic|scratch[- ]made|house[- ]made)/gi,
  /(?:signature|specialty|famous for|known for|celebrated)/gi,
  /(?:chef|owner|founder|proprietor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
  /(?:generation|generations?)/gi,
];

async function fetchPageHtml(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "GuestSignalHospitality/1.0 (+https://guestsignalhospitality.com/; business-context discovery)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType) && contentType) {
      return null;
    }
    const html = await response.text();
    return html.slice(0, 500_000);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractMetaTags(html) {
  const meta = {};
  for (const { selector, attr } of META_SELECTORS) {
    const tagMatch = selector.match(/\[([^\]]+)\]/g);
    if (!tagMatch) continue;
    const attrConditions = tagMatch.map((m) => {
      const [key, val] = m.slice(1, -1).split("=");
      return { key, val: val?.replace(/"/g, "") };
    });
    const pattern = new RegExp(
      `<meta[^>]*${attrConditions
        .map(({ key, val }) => `${key}="${val}"`)
        .join("[^>]*")}[^>]*${attr}="([^"]*)"`,
      "i"
    );
    const altPattern = new RegExp(
      `<meta[^>]*${attr}="([^"]*)"[^>]*${attrConditions
        .map(({ key, val }) => `${key}="${val}"`)
        .join("[^>]*")}`,
      "i"
    );
    const match = html.match(pattern) || html.match(altPattern);
    if (match?.[1]) {
      const key = attrConditions.find((c) => c.key !== attr)?.val || "meta";
      meta[key] = cleanText(match[1]);
    }
  }
  return meta;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? cleanText(match[1]) : null;
}

function stripHtmlTags(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2000);
}

function extractMainContent(html) {
  const mainPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi,
    /<div[^>]*class="[^"]*(?:content|about|story|history)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<section[^>]*class="[^"]*(?:about|story|history|team)[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
  ];

  const contentPieces = [];
  for (const pattern of mainPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const text = stripHtmlTags(match[1]);
      if (text.length > 50) {
        contentPieces.push(text);
      }
    }
  }

  if (contentPieces.length === 0) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      contentPieces.push(stripHtmlTags(bodyMatch[1]).slice(0, 5000));
    }
  }

  return contentPieces.join("\n\n").slice(0, 15000);
}

function extractPatternMatches(text) {
  const findings = {
    foundedYear: null,
    yearsInBusiness: null,
    ownership: [],
    awards: [],
    foodPhilosophy: [],
    signatures: [],
    people: [],
    generations: false,
  };

  const yearMatch = text.match(/(?:since|established|founded|opened|serving since)\s*(\d{4})/i);
  if (yearMatch) {
    findings.foundedYear = parseInt(yearMatch[1], 10);
  }

  const yearsMatch = text.match(/(\d+)\s*(?:years?|decades?)\s*(?:of\s*)?(?:experience|service|excellence|tradition)/i);
  if (yearsMatch) {
    const num = parseInt(yearsMatch[1], 10);
    findings.yearsInBusiness = yearsMatch[0].toLowerCase().includes("decade") ? num * 10 : num;
  }

  if (/family[- ]owned|family[- ]run/i.test(text)) findings.ownership.push("family-owned");
  if (/independently owned/i.test(text)) findings.ownership.push("independently-owned");
  if (/locally owned/i.test(text)) findings.ownership.push("locally-owned");
  if (/woman[- ]owned/i.test(text)) findings.ownership.push("woman-owned");
  if (/veteran[- ]owned/i.test(text)) findings.ownership.push("veteran-owned");

  if (/award[- ]winning/i.test(text)) findings.awards.push("award-winning");
  if (/james beard/i.test(text)) findings.awards.push("James Beard");
  if (/michelin/i.test(text)) findings.awards.push("Michelin");
  if (/zagat/i.test(text)) findings.awards.push("Zagat");
  const bestOfMatch = text.match(/best of\s+([^.,]+)/gi);
  if (bestOfMatch) findings.awards.push(...bestOfMatch.map((m) => cleanText(m).slice(0, 60)));

  if (/farm[- ]to[- ]table/i.test(text)) findings.foodPhilosophy.push("farm-to-table");
  if (/locally sourced/i.test(text)) findings.foodPhilosophy.push("locally-sourced");
  if (/sustainable/i.test(text)) findings.foodPhilosophy.push("sustainable");
  if (/organic/i.test(text)) findings.foodPhilosophy.push("organic");
  if (/scratch[- ]made|house[- ]made/i.test(text)) findings.foodPhilosophy.push("scratch-made");
  if (/seasonal/i.test(text)) findings.foodPhilosophy.push("seasonal");

  const signatureMatch = text.match(/(?:signature|specialty|famous for|known for|celebrated)\s+([^.,]+)/gi);
  if (signatureMatch) {
    findings.signatures.push(...signatureMatch.map((m) => cleanText(m).slice(0, 80)));
  }

  const peoplePattern = /(?:chef|owner|founder|proprietor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g;
  let peopleMatch;
  while ((peopleMatch = peoplePattern.exec(text)) !== null) {
    if (peopleMatch[1] && peopleMatch[1].length > 2) {
      findings.people.push(cleanText(peopleMatch[1]));
    }
  }

  if (/generation|generations?/i.test(text)) {
    findings.generations = true;
  }

  return findings;
}

function buildContextPaths(websiteUrl) {
  let base;
  try {
    base = new URL(websiteUrl);
  } catch {
    return [];
  }
  if (!/^https?:$/i.test(base.protocol)) return [];
  if (/facebook\.com|instagram\.com|yelp\.com|tripadvisor\.com/i.test(base.hostname)) {
    return [];
  }
  return CONTEXT_PATHS.map((path) => new URL(path, base).toString());
}

export async function scrapeBusinessContext({ websiteUrl, businessName, maxPages = 6 } = {}) {
  const result = {
    businessName: businessName || null,
    websiteUrl: websiteUrl || null,
    title: null,
    metaDescription: null,
    ogDescription: null,
    rawContent: "",
    foundedYear: null,
    yearsInBusiness: null,
    ownership: [],
    awards: [],
    foodPhilosophy: [],
    signatures: [],
    people: [],
    generations: false,
    contentSummary: null,
    scrapedAt: new Date().toISOString(),
    pagesScraped: 0,
    error: null,
  };

  if (!websiteUrl) {
    result.error = "No website URL provided";
    return result;
  }

  const paths = buildContextPaths(websiteUrl);
  if (!paths.length) {
    result.error = "Invalid or unsupported website URL";
    return result;
  }

  const allContent = [];
  const seenContent = new Set();
  let pagesScraped = 0;

  for (const url of paths.slice(0, maxPages)) {
    const html = await fetchPageHtml(url);
    if (!html) continue;
    pagesScraped++;

    if (pagesScraped === 1) {
      result.title = extractTitle(html);
      const meta = extractMetaTags(html);
      result.metaDescription = meta.description || null;
      result.ogDescription = meta["og:description"] || null;
    }

    const content = extractMainContent(html);
    if (content && !seenContent.has(content.slice(0, 200))) {
      seenContent.add(content.slice(0, 200));
      allContent.push(content);
    }
  }

  result.pagesScraped = pagesScraped;
  if (pagesScraped === 0) {
    result.error = "Could not fetch any pages from website";
    return result;
  }

  const combinedText = allContent.join("\n\n").slice(0, 25000);
  result.rawContent = combinedText;

  const patterns = extractPatternMatches(combinedText);
  result.foundedYear = patterns.foundedYear;
  result.yearsInBusiness = patterns.yearsInBusiness;
  result.ownership = [...new Set(patterns.ownership)];
  result.awards = [...new Set(patterns.awards)].slice(0, 5);
  result.foodPhilosophy = [...new Set(patterns.foodPhilosophy)];
  result.signatures = [...new Set(patterns.signatures)].slice(0, 3);
  result.people = [...new Set(patterns.people)].slice(0, 3);
  result.generations = patterns.generations;

  const summaryParts = [];
  if (result.foundedYear) {
    summaryParts.push(`Founded in ${result.foundedYear}`);
  } else if (result.yearsInBusiness) {
    summaryParts.push(`${result.yearsInBusiness}+ years in business`);
  }
  if (result.ownership.length) {
    summaryParts.push(result.ownership.join(", "));
  }
  if (result.people.length) {
    summaryParts.push(`Key people: ${result.people.join(", ")}`);
  }
  if (result.foodPhilosophy.length) {
    summaryParts.push(`Philosophy: ${result.foodPhilosophy.join(", ")}`);
  }
  if (result.awards.length) {
    summaryParts.push(`Recognition: ${result.awards.join(", ")}`);
  }
  if (result.signatures.length) {
    summaryParts.push(`Known for: ${result.signatures.join("; ")}`);
  }
  if (result.generations) {
    summaryParts.push("Multi-generational");
  }

  result.contentSummary = summaryParts.length > 0 ? summaryParts.join(". ") + "." : null;

  return result;
}

export function hasUsefulContext(context) {
  if (!context) return false;
  return Boolean(
    context.foundedYear ||
    context.yearsInBusiness ||
    context.ownership?.length ||
    context.awards?.length ||
    context.foodPhilosophy?.length ||
    context.signatures?.length ||
    context.people?.length ||
    context.generations ||
    context.metaDescription?.length > 50 ||
    context.ogDescription?.length > 50
  );
}
