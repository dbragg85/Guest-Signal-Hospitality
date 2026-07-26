/**
 * Builds free-snapshot deliverable blocks for portal scorecards (marketing parity with /snapshot form).
 */

import {
  buildEvidenceSwot,
  buildExecutiveBrief,
  buildPillarIntelligence,
} from "./scorecard-intelligence.mjs";

const PLAN_LABELS = {
  signal_monitor: { name: "Signal Monitor", price: "$149/mo" },
  signal_growth: { name: "Signal Growth", price: "$499/mo" },
  signal_elevate: { name: "Signal Elevate", price: "$999/mo" },
};

const CATEGORY_FOCUS = {
  food: "Menu execution and consistency — what guests say about taste, portions, and value.",
  service: "Hospitality and floor coordination — greeting, attentiveness, and recovery when things slip.",
  speed: "Throughput and wait-time perception during peak periods.",
  cleanliness: "Dining room and restroom standards guests notice immediately.",
  atmosphere: "Ambience, noise, and comfort signals that shape return intent.",
};

const CATEGORY_ACTIONS = {
  food: "Tighten line checks on top-mentioned dishes and align portion/value language on the menu.",
  service: "Run a brief service huddle on greet, check-back, and issue escalation during rush.",
  speed: "Map peak-hour coverage against the times guests mention delays; adjust expo or staffing.",
  cleanliness: "Audit front-of-house and restroom reset cadence during service transitions.",
  atmosphere: "Address noise, seating comfort, or music levels called out in recent reviews.",
};

function cleanUrl(raw) {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

function humanCategory(cat) {
  return String(cat ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreBand(score) {
  if (score == null || !Number.isFinite(score)) return "insufficient data";
  if (score >= 90) return "strong";
  if (score >= 80) return "solid";
  if (score >= 70) return "mixed";
  return "needs attention";
}

/**
 * @param {string} url
 * @returns {Promise<{ ok: boolean, notes: string[], checks: Record<string, boolean> }>}
 */
export async function auditWebsite(url) {
  const href = cleanUrl(url);
  if (!href) {
    return {
      ok: false,
      notes: ["No website URL was provided on intake — add one so we can scan mobile experience and core CTAs."],
      checks: {},
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(href, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "GuestSignalSnapshotBot/1.0 (+https://guestsignalhospitality.com)" },
    });
    const html = await res.text();
    const lower = html.toLowerCase();
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasTitle = /<title[^>]*>[^<]+<\/title>/i.test(html);
    const hasDescription = /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+/i.test(html);
    const hasHttps = href.startsWith("https://");
    const hasOrderCta =
      /\b(order online|reserve|reservation|book a table|order now|delivery|pickup)\b/i.test(html);
    const notes = [
      `Loaded ${href} (${res.status}) for a lightweight health scan.`,
      hasHttps
        ? "Site uses HTTPS — good for trust and local search signals."
        : "Consider moving to HTTPS if guests still land on an insecure URL.",
      hasViewport
        ? "Mobile viewport meta tag present — baseline for phone-friendly layout."
        : "No viewport meta detected — mobile guests may see a cramped desktop layout.",
      hasTitle ? "Page title tag present." : "Missing or empty title tag — weak signal for search snippets.",
      hasDescription
        ? "Meta description present."
        : "No meta description — opportunity to clarify cuisine and location in search results.",
      hasOrderCta
        ? "Guest-facing order, reserve, or delivery CTA language detected on the page."
        : "No obvious reserve/order CTA in page copy — worth surfacing phone, booking, or online order paths above the fold.",
    ];
    return {
      ok: res.ok,
      notes,
      checks: { hasViewport, hasTitle, hasDescription, hasHttps, hasOrderCta },
    };
  } catch (err) {
    return {
      ok: false,
      notes: [
        `Could not fetch ${href} (${String(err?.message || err).slice(0, 120)}).`,
        "We still captured review and Google visibility signals; re-submit with a public URL if the site blocks automated checks.",
      ],
      checks: {},
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildGbpNotes(lead, { googleCount, periodLabel }) {
  const gbp = cleanUrl(lead?.gbp_url);
  const bullets = [];
  if (gbp) {
    bullets.push(`Listing link on file: ${gbp}`);
  } else {
    bullets.push(
      "No Google Business Profile link was submitted — share your Maps listing on your next intake for faster verification.",
    );
  }
  if (googleCount > 0) {
    bullets.push(
      `${googleCount} Google review(s) analyzed for ${periodLabel} — use this window to align posts, hours, and photos with what guests mention.`,
    );
  } else {
    bullets.push(
      `No in-window Google reviews were available for ${periodLabel}; confirm your listing URL and review volume for the scoring month.`,
    );
  }
  bullets.push(
    "Checklist: hours accuracy, primary category, photos refreshed, and Q&A answered — these drive Maps visibility independent of star rating alone.",
  );
  return bullets;
}

function buildSeoNotes(websiteAudit, lead, cityState) {
  const bullets = [];
  const loc = [lead?.city, lead?.state].filter(Boolean).join(", ");
  if (loc) {
    bullets.push(`Local intent anchor: ${lead.business?.trim() || "your restaurant"} in ${loc}.`);
  }
  if (websiteAudit.checks?.hasDescription === false) {
    bullets.push("Add a meta description with cuisine, neighborhood, and one signature hook guests search for.");
  }
  if (websiteAudit.checks?.hasTitle === false) {
    bullets.push("Strengthen the homepage title with city + primary cuisine for branded and near-me queries.");
  }
  bullets.push(
    "Align Google Business Profile description and website H1 so guests see the same value story in Search and Maps.",
  );
  if (cityState) {
    bullets.push(`Monitor “restaurant near ${lead?.city || "you"}” and cuisine-specific phrases in Growth-tier keyword tracking.`);
  }
  return bullets;
}

function topPriorities(categoryScores) {
  return [...categoryScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((row, idx) => {
      const action = CATEGORY_ACTIONS[row.category] || "Review guest comments in this theme and assign an owner for the next 30 days.";
      return `${idx + 1}. ${humanCategory(row.category)} (${scoreBand(row.score)}, score ${row.score}) — ${action}`;
    });
}

function competitorNotes(competitors, lead) {
  if (competitors?.length) {
    return competitors.slice(0, 5).map((c) => {
      const rating = c.google_rating != null ? `${c.google_rating}★` : "rating n/a";
      const count = c.google_review_count != null ? `${c.google_review_count} reviews` : "review count n/a";
      const dist = c.distance_miles != null ? `${c.distance_miles} mi` : "distance n/a";
      return `${c.name} — ${rating}, ${count}, ~${dist} (${c.cuisine_style || "peer"})`;
    });
  }
  const city = lead?.city ? ` near ${lead.city}` : "";
  return [
    `Baseline positioning uses your review themes${city}; Signal Growth adds tracked peer sets (up to five locations) with rating and visibility comparisons.`,
    "Share competitor names on intake if you want them curated into your next scorecard refresh.",
  ];
}

function planFitBlock(lead) {
  const key = String(lead?.recommended_plan || "signal_monitor").trim();
  const meta = PLAN_LABELS[key] || PLAN_LABELS.signal_monitor;
  let rationale =
    "Based on your intake priority, Monitor is the natural starting point for review visibility and alerts.";
  if (key === "signal_growth") {
    rationale =
      "Your focus maps to active visibility, performance insights, and competitor context — Signal Growth is the recommended fit.";
  } else if (key === "signal_elevate") {
    rationale =
      "Your focus maps to managed reputation, menu intelligence, and executive reporting — Signal Elevate is the recommended fit.";
  }
  const summary = lead?.snapshot_summary;
  if (summary && typeof summary === "object" && summary.priorityLabel) {
    rationale = `You selected “${summary.priorityLabel}” at intake. ${rationale}`;
  }
  return {
    key,
    name: meta.name,
    price: meta.price,
    rationale,
    ctaPath: `/services/inquiry/?plan=${key}`,
  };
}

/**
 * @param {object} params
 * @returns {Promise<{ snapshot_deliverables: object, swot: object }>}
 */
export async function buildSnapshotDeliverablesForScorecard({
  lead,
  overallScore,
  categoryScores,
  pillars,
  googleCount,
  periodLabel,
  competitors,
}) {
  const websiteAudit = await auditWebsite(lead?.website_url);
  const swot = buildEvidenceSwot(categoryScores, pillars, competitors);
  const pillarIntel = buildPillarIntelligence(pillars);
  const executiveBrief = buildExecutiveBrief({
    overallScore,
    periodLabel,
    swot,
    pillars: pillarIntel,
  });
  const priorities = topPriorities(categoryScores);
  const planFit = planFitBlock(lead);

  const sentimentBullets = categoryScores.length
    ? categoryScores
        .slice()
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 5)
        .map(
          (r) =>
            `${humanCategory(r.category)}: ${scoreBand(r.score)} (${r.score}) — ${r.mentions} mention(s) in ${periodLabel}.`,
        )
    : ["Insufficient categorized mentions in this period — volume may be low or themes are still clustering."];

  const items = [
    {
      key: "executive_brief",
      title: "Owner executive brief",
      summary:
        executiveBrief.summary ||
        (overallScore != null
          ? `Headline Guest Signal Score ${overallScore} for ${periodLabel}.`
          : "Score pending sufficient review volume."),
      bullets: [
        ...(executiveBrief.protect || []).map((s) => `Protect: ${s}`),
        ...(executiveBrief.fix_now || []).map((s) => `Fix now: ${s}`),
        executiveBrief.differentiator,
      ].filter(Boolean),
    },
    {
      key: "guest_signal_score",
      title: "Guest Signal Score",
      summary:
        overallScore != null
          ? `Headline score ${overallScore} for ${periodLabel} — weighted pillars (45% Experience / 30% Ops / 25% Emotional), not a vanity star average.`
          : "Score pending sufficient review volume in the scoring window.",
    },
    {
      key: "pillar_playbooks",
      title: "Pillar scores + 30-day playbooks",
      summary: "Each pillar includes why it matters and the next floor move — the gap vs inbox-only reputation tools.",
      bullets: pillarIntel.map((p) =>
        p.score != null
          ? `${p.label} (${p.score}, ${p.band}): ${p.thirty_day_playbook}`
          : `${p.label}: insufficient mention volume this period.`,
      ),
    },
    {
      key: "review_sentiment",
      title: "Review sentiment overview",
      summary: "How guests describe food, service, speed, cleanliness, and atmosphere in the scoring month.",
      bullets: sentimentBullets,
    },
    {
      key: "gbp_visibility",
      title: "Google Business Profile visibility notes",
      summary: "Listing health and review coverage signals tied to how you show up on Maps and Search.",
      bullets: buildGbpNotes(lead, { googleCount, periodLabel }),
    },
    {
      key: "website_mobile_health",
      title: "Website and mobile health notes",
      summary: "Lightweight scan of your public site for mobile readiness and guest-facing CTAs.",
      bullets: websiteAudit.notes,
    },
    {
      key: "seo_opportunities",
      title: "Basic SEO opportunities",
      summary: "Practical findability improvements aligned with your market and guest language.",
      bullets: buildSeoNotes(websiteAudit, lead, true),
    },
    {
      key: "competitor_positioning",
      title: "Competitor positioning notes",
      summary: "How you compare to nearby peers on ratings and review volume where data is available.",
      bullets: competitorNotes(competitors, lead),
    },
    {
      key: "top_priorities",
      title: "Top 3 action priorities",
      summary: "Operational next steps ranked from the lowest-scoring guest themes this period.",
      bullets: priorities.length ? priorities : ["Submit additional review volume or extend the window for sharper priorities."],
    },
    {
      key: "plan_fit",
      title: "Recommended plan fit",
      summary: `${planFit.name} (${planFit.price}) — ${planFit.rationale}`,
      bullets: [
        `Signal Monitor ($149/mo) — foundational monitoring.`,
        `Signal Growth ($499/mo) — performance insights and competitor tracking.`,
        `Signal Elevate ($999/mo) — menu intelligence and managed execution.`,
      ],
    },
  ];

  return {
    snapshot_deliverables: {
      version: 2,
      generated_at: new Date().toISOString(),
      period_label: periodLabel,
      items,
      recommended_plan: planFit,
      guest_signal_score: overallScore,
      executive_brief: executiveBrief,
      pillar_intelligence: pillarIntel,
    },
    swot,
    executive_brief: executiveBrief,
    pillar_intelligence: pillarIntel,
  };
}
