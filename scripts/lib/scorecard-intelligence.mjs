/**
 * Best-in-class scorecard intelligence: pillar playbooks, evidence-backed SWOT,
 * and an owner executive brief. Differentiator vs Birdeye/Podium inbox tools —
 * ops priorities from guest language, not just alerts.
 */

export const PILLAR_PLAYBOOKS = {
  experience_quality: {
    label: "Experience Quality",
    weightLabel: "45% of headline (meta)",
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
    weightLabel: "30% of headline (meta)",
    why: "Speed and cleanliness are the fastest ways a 4.5 softens into a 4.2.",
    win: "Document the stations that stay clean under rush—make that the standard.",
    fix: "Map ticket times for the hour guests mention delays; adjust expo or cover.",
  },
  emotional_connection: {
    label: "Emotional Connection",
    weightLabel: "25% of headline (meta)",
    why: "Return-intent language predicts loyalty better than a single 5★.",
    win: "Capture and repeat the language guests use when they say they’ll come back.",
    fix: "Add one memorable close (thank-you + invite back) that every server owns.",
  },
};

const CATEGORY_FOCUS = {
  food: "Menu execution — taste, portions, and value perception.",
  service: "Hospitality and floor coordination — greeting, attentiveness, recovery.",
  speed: "Throughput and wait-time perception during peak periods.",
  cleanliness: "Dining room and restroom standards guests notice immediately.",
  atmosphere: "Ambience, noise, and comfort that shape return intent.",
  consistency: "Repeatable quality across visits and dayparts.",
  momentum: "Whether recent guest language is improving or softening.",
  hospitality: "Warmth and care in guest interactions.",
  return_intent: "Whether guests signal they will return or recommend.",
};

const CATEGORY_ACTIONS = {
  food: "Tighten line checks on top-mentioned dishes; align portion/value language on the menu.",
  service: "Run a brief service huddle on greet, check-back, and issue escalation during rush.",
  speed: "Map peak-hour coverage against delay mentions; adjust expo or staffing.",
  cleanliness: "Audit FOH and restroom reset cadence during service transitions.",
  atmosphere: "Address noise, seating comfort, or music levels called out in reviews.",
  consistency: "Standardize the recipe/plating steps for the items with split reviews.",
  momentum: "Respond to every review in 48h and publish one ops win guests can feel this week.",
  hospitality: "Coach one recovery phrase managers use when a guest is disappointed.",
  return_intent: "Close every table with a specific invite-back tied to a signature item or night.",
};

function humanCategory(cat) {
  return String(cat ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreBand(score) {
  if (score == null || !Number.isFinite(score)) return "insufficient data";
  if (score >= 90) return "elite";
  if (score >= 85) return "strong";
  if (score >= 80) return "solid";
  if (score >= 70) return "mixed";
  return "at risk";
}

/**
 * @param {Array<{category:string, score:number, mentions?:number|null}>} categoryScores
 * @param {Array<{key?:string, label?:string, score:number|null}>} pillars
 * @param {Array<{name?:string, google_rating?:number, google_review_count?:number}>} [competitors]
 */
export function buildEvidenceSwot(categoryScores = [], pillars = [], competitors = []) {
  const cats = (categoryScores || [])
    .filter((r) => r && Number.isFinite(r.score))
    .map((r) => ({
      category: String(r.category || "").toLowerCase(),
      score: Number(r.score),
      mentions: Number.isFinite(Number(r.mentions)) ? Number(r.mentions) : null,
    }));

  const sortedHigh = [...cats].sort((a, b) => b.score - a.score);
  const sortedLow = [...cats].sort((a, b) => a.score - b.score);

  const strengths = sortedHigh
    .filter((r) => r.score >= 85)
    .slice(0, 3)
    .map((r) => {
      const mentions =
        r.mentions != null ? `${r.mentions} mention${r.mentions === 1 ? "" : "s"}` : "theme evidence";
      return `${humanCategory(r.category)} scores ${r.score} (${scoreBand(r.score)}, ${mentions}) — ${CATEGORY_FOCUS[r.category] || "Guests praise this area."} Protect it in training so it stays a differentiator.`;
    });

  const weaknesses = sortedLow
    .filter((r) => r.score < 80)
    .slice(0, 3)
    .map((r) => {
      const mentions =
        r.mentions != null ? `${r.mentions} mention${r.mentions === 1 ? "" : "s"}` : "recurring theme";
      const action = CATEGORY_ACTIONS[r.category] || "Assign an owner and a 30-day fix.";
      return `${humanCategory(r.category)} at ${r.score} (${scoreBand(r.score)}, ${mentions}) — ${action}`;
    });

  const pillarLow = (pillars || [])
    .filter((p) => p && p.score != null && Number.isFinite(p.score) && p.score < 80)
    .sort((a, b) => a.score - b.score);

  const opportunities = [];
  for (const w of sortedLow.filter((r) => r.score < 80).slice(0, 2)) {
    opportunities.push(
      `30-day playbook: lift ${humanCategory(w.category)} from ${w.score} toward 85 — ${CATEGORY_ACTIONS[w.category] || "weekly theme review + owner accountability."}`,
    );
  }
  if (pillarLow[0]) {
    const label = pillarLow[0].label || humanCategory(pillarLow[0].key);
    const pb = PILLAR_PLAYBOOKS[pillarLow[0].key] || null;
    opportunities.push(
      `Pillar focus: ${label} (${pillarLow[0].score}). ${pb?.fix || "Pick one floor behavior to coach every shift for two weeks."}`,
    );
  }
  opportunities.push(
    "Convert praise into demand: refresh Google posts and website CTAs with the language guests already use in 5★ reviews.",
  );

  const threats = [];
  const peer = (competitors || []).filter((c) => c && Number.isFinite(Number(c.google_rating)));
  if (peer.length) {
    const best = [...peer].sort((a, b) => Number(b.google_rating) - Number(a.google_rating))[0];
    const vol = Number.isFinite(Number(best.google_review_count))
      ? `${best.google_review_count} reviews`
      : "active review volume";
    threats.push(
      `Local peer pressure: ${best.name || "A nearby competitor"} at ${best.google_rating}★ (${vol}) can win Maps shortlists if your weakest themes stay unanswered.`,
    );
  } else {
    threats.push(
      "Local competitors with faster review response and clearer value messaging capture high-intent “near me” searches even at similar star ratings.",
    );
  }
  if (weaknesses.length) {
    threats.push(
      "Theme compounding: when the same weakness repeats in public reviews, new guests treat it as a pattern—not a one-off—before they visit.",
    );
  } else {
    threats.push(
      "Complacency risk: strong scores without weekly theme triage still soften when volume dips or a busy season stresses the floor.",
    );
  }
  threats.push(
    "Inbox-only tools (alert + AI reply) without ops scorecards leave owners reacting to stars instead of fixing the floor causes behind them.",
  );

  const topStrength = sortedHigh[0];
  const topWeak = sortedLow[0];
  const executiveSummary = [
    topStrength
      ? `Lead with ${humanCategory(topStrength.category)} (${topStrength.score}) — make that the public promise.`
      : "Build clearer theme volume so strengths can be named with confidence.",
    topWeak && topWeak.score < 80
      ? `Primary risk: ${humanCategory(topWeak.category)} at ${topWeak.score}. One owner, one weekly metric, 30 days.`
      : "No category is critically soft — protect consistency as review volume grows.",
    pillarLow[0]
      ? `Headline pillar to watch: ${pillarLow[0].label || humanCategory(pillarLow[0].key)} (${pillarLow[0].score}).`
      : "Meta-pillars are holding — keep the 45/30/25 Experience / Ops / Emotional blend green.",
  ].join(" ");

  return {
    version: 2,
    generated_at: new Date().toISOString(),
    executive_summary: executiveSummary,
    strengths: strengths.length
      ? strengths
      : ["Guest sentiment supports your core experience when positive themes cluster — keep naming and protecting them."],
    weaknesses: weaknesses.length
      ? weaknesses
      : ["No category scored below 80 this period — maintain standards as volume and peak pressure rise."],
    opportunities: opportunities.slice(0, 4),
    threats: threats.slice(0, 3),
    differentiator:
      "Guest Signal turns review language into pillar scores + floor playbooks. Competitors sell inboxes and AI replies; you get an operator scorecard.",
  };
}

/**
 * @param {Array<{key:string, score:number|null, label?:string}>} pillars
 */
export function buildPillarIntelligence(pillars = []) {
  return (pillars || []).map((p) => {
    const meta = PILLAR_PLAYBOOKS[p.key] || {
      label: p.label || humanCategory(p.key),
      weightLabel: "Display pillar",
      why: "Guest language in this dimension shapes reputation.",
      win: "Protect what guests already praise.",
      fix: "Assign an owner and review weekly.",
    };
    const score = p.score;
    const band = scoreBand(score);
    return {
      key: p.key,
      label: meta.label,
      score: score ?? null,
      band,
      weight_label: meta.weightLabel,
      why_it_matters: meta.why,
      protect_move: meta.win,
      thirty_day_playbook: score != null && score < 85 ? meta.fix : meta.win,
    };
  });
}

export function buildExecutiveBrief({ overallScore, periodLabel, swot, pillars }) {
  const low = (pillars || []).filter((p) => p.score != null && p.score < 80);
  const high = (pillars || []).filter((p) => p.score != null && p.score >= 85);
  return {
    version: 2,
    period_label: periodLabel || null,
    headline_score: overallScore ?? null,
    summary: swot?.executive_summary || null,
    protect: high.slice(0, 2).map((p) => `${p.label || p.key}: ${p.score}`),
    fix_now: low.slice(0, 2).map((p) => `${p.label || p.key}: ${p.score}`),
    differentiator: swot?.differentiator || null,
  };
}
