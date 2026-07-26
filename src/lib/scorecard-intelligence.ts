/**
 * Portal-side scorecard intelligence (mirrors scripts/lib/scorecard-intelligence.mjs).
 * Derives evidence SWOT + pillar playbooks when scorecard JSON is thin.
 */

export const PILLAR_PLAYBOOKS: Record<
  string,
  { label: string; weightLabel: string; why: string; win: string; fix: string }
> = {
  experience_quality: {
    label: "Experience Quality",
    weightLabel: "45% of headline",
    why: "Guests decide return intent from the overall feel of the visit—not one dish.",
    win: "Protect signature moments guests already praise; script recovery when pacing slips.",
    fix: "Pick one peak daypart; run a 15-minute pre-shift on greet → pace → check-back → goodbye.",
  },
  service_hospitality: {
    label: "Service & Hospitality",
    weightLabel: "Display pillar",
    why: "Warmth and recovery language show up faster in reviews than kitchen changes.",
    win: "Name the hospitality behaviors guests already thank you for in huddles.",
    fix: "48-hour response SLA on negatives + one offline recovery offer owned by a manager.",
  },
  food_beverage: {
    label: "Food & Beverage",
    weightLabel: "Display pillar",
    why: "Taste and value comments compound into star averages when top sellers slip.",
    win: "Double-down on dishes with repeated praise in photo/menu merchandising.",
    fix: "Line-check the 3 most-mentioned items; align portion language on the menu.",
  },
  operational_reliability: {
    label: "Operational Reliability",
    weightLabel: "30% of headline",
    why: "Speed and cleanliness are the fastest ways a 4.5 softens into a 4.2.",
    win: "Document the stations that stay clean under rush—make that the standard.",
    fix: "Map ticket times for the hour guests mention delays; adjust expo or cover.",
  },
  emotional_connection: {
    label: "Emotional Connection",
    weightLabel: "25% of headline",
    why: "Return-intent language predicts loyalty better than a single 5★.",
    win: "Capture and repeat the language guests use when they say they’ll come back.",
    fix: "Add one memorable close (thank-you + invite back) that every server owns.",
  },
};

const CATEGORY_FOCUS: Record<string, string> = {
  food: "Menu execution — taste, portions, and value perception.",
  service: "Hospitality and floor coordination — greeting, attentiveness, recovery.",
  speed: "Throughput and wait-time perception during peak periods.",
  cleanliness: "Dining room and restroom standards guests notice immediately.",
  atmosphere: "Ambience, noise, and comfort that shape return intent.",
  consistency: "Repeatable quality across visits and dayparts.",
  momentum: "Whether recent guest language is improving or softening.",
};

const CATEGORY_ACTIONS: Record<string, string> = {
  food: "Tighten line checks on top-mentioned dishes; align portion/value language on the menu.",
  service: "Run a brief service huddle on greet, check-back, and issue escalation during rush.",
  speed: "Map peak-hour coverage against delay mentions; adjust expo or staffing.",
  cleanliness: "Audit FOH and restroom reset cadence during service transitions.",
  atmosphere: "Address noise, seating comfort, or music levels called out in reviews.",
  consistency: "Standardize recipe/plating steps for items with split reviews.",
  momentum: "Respond to every review in 48h and publish one ops win guests can feel this week.",
};

function humanCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreBand(score: number | null | undefined) {
  if (score == null || !Number.isFinite(score)) return "insufficient data";
  if (score >= 90) return "elite";
  if (score >= 85) return "strong";
  if (score >= 80) return "solid";
  if (score >= 70) return "mixed";
  return "at risk";
}

export type EvidenceSwot = {
  version?: number;
  executive_summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  differentiator?: string;
};

export function buildEvidenceSwotFromCategories(
  categoryScores: Array<{ category: string; score: number; mentions: number | null }>,
  pillars: Array<{ key: string; label: string; score: number | null }>,
  competitors: Array<{ name?: string; google_rating?: number; google_review_count?: number }> = [],
): EvidenceSwot {
  const cats = categoryScores
    .filter((r) => Number.isFinite(r.score))
    .map((r) => ({
      category: r.category.trim().toLowerCase(),
      score: r.score,
      mentions: r.mentions,
    }));
  const sortedHigh = [...cats].sort((a, b) => b.score - a.score);
  const sortedLow = [...cats].sort((a, b) => a.score - b.score);

  const strengths = sortedHigh
    .filter((r) => r.score >= 85)
    .slice(0, 3)
    .map((r) => {
      const mentions =
        r.mentions != null
          ? `${r.mentions} mention${r.mentions === 1 ? "" : "s"}`
          : "theme evidence";
      return `${humanCategory(r.category)} scores ${r.score} (${scoreBand(r.score)}, ${mentions}) — ${CATEGORY_FOCUS[r.category] || "Guests praise this area."} Protect it in training so it stays a differentiator.`;
    });

  const weaknesses = sortedLow
    .filter((r) => r.score < 80)
    .slice(0, 3)
    .map((r) => {
      const mentions =
        r.mentions != null
          ? `${r.mentions} mention${r.mentions === 1 ? "" : "s"}`
          : "recurring theme";
      const action = CATEGORY_ACTIONS[r.category] || "Assign an owner and a 30-day fix.";
      return `${humanCategory(r.category)} at ${r.score} (${scoreBand(r.score)}, ${mentions}) — ${action}`;
    });

  const pillarLow = pillars
    .filter((p) => p.score != null && p.score < 80)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0));

  const opportunities: string[] = [];
  for (const w of sortedLow.filter((r) => r.score < 80).slice(0, 2)) {
    opportunities.push(
      `30-day playbook: lift ${humanCategory(w.category)} from ${w.score} toward 85 — ${CATEGORY_ACTIONS[w.category] || "weekly theme review + owner accountability."}`,
    );
  }
  if (pillarLow[0]) {
    const pb = PILLAR_PLAYBOOKS[pillarLow[0].key];
    opportunities.push(
      `Pillar focus: ${pillarLow[0].label} (${pillarLow[0].score}). ${pb?.fix || "Coach one floor behavior every shift for two weeks."}`,
    );
  }
  opportunities.push(
    "Convert praise into demand: refresh Google posts and website CTAs with the language guests already use in 5★ reviews.",
  );

  const threats: string[] = [];
  const peer = competitors.filter((c) => Number.isFinite(Number(c.google_rating)));
  if (peer.length) {
    const best = [...peer].sort(
      (a, b) => Number(b.google_rating) - Number(a.google_rating),
    )[0];
    threats.push(
      `Local peer pressure: ${best.name || "A nearby competitor"} at ${best.google_rating}★ can win Maps shortlists if your weakest themes stay unanswered.`,
    );
  } else {
    threats.push(
      "Local competitors with faster review response and clearer value messaging capture high-intent “near me” searches even at similar star ratings.",
    );
  }
  threats.push(
    weaknesses.length
      ? "Theme compounding: when the same weakness repeats in public reviews, new guests treat it as a pattern before they visit."
      : "Complacency risk: strong scores without weekly theme triage still soften when peak season stresses the floor.",
  );
  threats.push(
    "Inbox-only tools (alert + AI reply) without ops scorecards leave owners reacting to stars instead of fixing floor causes.",
  );

  const topStrength = sortedHigh[0];
  const topWeak = sortedLow[0];
  const executive_summary = [
    topStrength
      ? `Lead with ${humanCategory(topStrength.category)} (${topStrength.score}) — make that the public promise.`
      : "Build clearer theme volume so strengths can be named with confidence.",
    topWeak && topWeak.score < 80
      ? `Primary risk: ${humanCategory(topWeak.category)} at ${topWeak.score}. One owner, one weekly metric, 30 days.`
      : "No category is critically soft — protect consistency as review volume grows.",
    pillarLow[0]
      ? `Headline pillar to watch: ${pillarLow[0].label} (${pillarLow[0].score}).`
      : "Meta-pillars are holding — keep the 45/30/25 Experience / Ops / Emotional blend green.",
  ].join(" ");

  return {
    version: 2,
    executive_summary,
    strengths: strengths.length
      ? strengths
      : [
          "Guest sentiment supports your core experience when positive themes cluster — keep naming and protecting them.",
        ],
    weaknesses: weaknesses.length
      ? weaknesses
      : [
          "No category scored below 80 this period — maintain standards as volume and peak pressure rise.",
        ],
    opportunities: opportunities.slice(0, 4),
    threats: threats.slice(0, 3),
    differentiator:
      "Guest Signal turns review language into pillar scores + floor playbooks. Competitors sell inboxes and AI replies; you get an operator scorecard.",
  };
}

export function playbookForPillar(
  key: string,
  score: number | null,
): { weightLabel: string; why: string; move: string } {
  const meta = PILLAR_PLAYBOOKS[key];
  if (!meta) {
    return {
      weightLabel: "Display pillar",
      why: "Guest language in this dimension shapes reputation.",
      move: "Assign an owner and review weekly.",
    };
  }
  return {
    weightLabel: meta.weightLabel,
    why: meta.why,
    move: score != null && score < 85 ? meta.fix : meta.win,
  };
}
