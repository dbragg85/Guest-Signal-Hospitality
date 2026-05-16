/**
 * Signal Elevate deliverables + missing-info gaps (menu, social, competitors, etc.).
 */

const ELEVATE_GAP_DEFS = [
  {
    key: "menu_upload",
    title: "Menu on file",
    resolvesWith: ["menu_text", "menu_source_url"],
    clientAsk:
      "Paste your current menu or share a public PDF / web menu link so we can map guest comments to specific items.",
  },
  {
    key: "social_handles",
    title: "Social handles",
    resolvesWith: ["social_presence_note"],
    clientAsk: "Share Instagram, Facebook, and TikTok handles you want tracked with your reviews.",
  },
  {
    key: "competitor_set",
    title: "Competitor set",
    resolvesWith: ["competitors_note", "competitors"],
    clientAsk: "Name up to five local competitors (concept + neighborhood) for monthly positioning.",
  },
  {
    key: "review_responses",
    title: "Response tone",
    resolvesWith: ["goals"],
    clientAsk: "Confirm review response tone and any phrases to avoid for drafted replies.",
  },
  {
    key: "recovery_playbook",
    title: "Recovery playbook",
    resolvesWith: ["goals", "message"],
    clientAsk: "Describe escalation and comp limits for negative review recovery.",
  },
];

function hasText(v) {
  return typeof v === "string" && v.trim().length > 8;
}

function parseMenuLines(menuText) {
  if (!hasText(menuText)) return [];
  const lines = String(menuText)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !/^[-=*#]{2,}$/.test(l));
  const items = [];
  for (const line of lines) {
    const priceMatch = line.match(/\$[\d,.]+(?:\s*[-–]\s*\$[\d,.]+)?/);
    const withoutPrice = line.replace(/\$[\d,.]+(?:\s*[-–]\s*\$[\d,.]+)?/g, "").trim();
    const name = withoutPrice.replace(/^[-•*]\s*/, "").trim();
    if (name.length < 2) continue;
    if (/^(appetizers|entrees|mains|desserts|drinks|beverages|sides|lunch|dinner|brunch)\b/i.test(name) && !priceMatch) {
      continue;
    }
    items.push({ name: name.slice(0, 120), price: priceMatch ? priceMatch[0] : null });
    if (items.length >= 80) break;
  }
  return items;
}

function foodMentionThemes(categoryScores) {
  const food = (categoryScores ?? []).find((r) => String(r.category).toLowerCase() === "food");
  if (!food) return { score: null, band: "unknown" };
  const score = food.score;
  let band = "mixed";
  if (score >= 85) band = "strong";
  else if (score < 75) band = "needs attention";
  return { score, band };
}

/**
 * @param {object} ctx
 * @returns {{ elevate_gaps: object[], elevate_deliverables: object | null, elevate_unlock_preview: object | null }}
 */
export function buildElevatePackage(ctx) {
  const {
    lead = null,
    restaurant = null,
    categoryScores = [],
    overallScore = null,
    periodLabel = "this period",
    inquiryPlan = "free_snapshot",
  } = ctx;

  const menuText = hasText(restaurant?.menu_text)
    ? restaurant.menu_text
    : hasText(lead?.menu_text)
      ? lead.menu_text
      : null;
  const menuUrl = hasText(restaurant?.menu_source_url)
    ? restaurant.menu_source_url
    : hasText(lead?.menu_source_url)
      ? lead.menu_source_url
      : null;
  const social = hasText(lead?.social_presence_note) ? lead.social_presence_note.trim() : null;
  const competitorsNote = hasText(lead?.competitors_note) ? lead.competitors_note.trim() : null;
  let competitors = [];
  if (Array.isArray(restaurant?.competitors)) competitors = restaurant.competitors;
  const goals = hasText(lead?.goals) ? lead.goals.trim() : null;
  const message = hasText(lead?.message) ? lead.message.trim() : null;

  const context = {
    menu_text: menuText,
    menu_source_url: menuUrl,
    social_presence_note: social,
    competitors_note: competitorsNote,
    competitors: competitors.length ? competitors : null,
    goals,
    message,
  };

  const elevate_gaps = ELEVATE_GAP_DEFS.filter((def) => {
    const satisfied = def.resolvesWith.some((field) => {
      const v = context[field];
      if (field === "competitors") return Array.isArray(v) && v.length > 0;
      return hasText(v) || (field === "menu_source_url" && hasText(v));
    });
    return !satisfied;
  }).map((def) => ({
    key: def.key,
    title: def.title,
    clientAsk: def.clientAsk,
    intakeField:
      def.key === "menu_upload"
        ? "menu_text"
        : def.key === "social_handles"
          ? "social_presence_note"
          : def.key === "competitor_set"
            ? "competitors_note"
            : "goals",
  }));

  const menuItems = parseMenuLines(menuText);
  const foodTheme = foodMentionThemes(categoryScores);
  const items = [];

  if (menuItems.length >= 3) {
    const sample = menuItems.slice(0, 8).map((i) => (i.price ? `${i.name} (${i.price})` : i.name));
    items.push({
      key: "menu_inventory",
      title: "Menu inventory captured",
      summary: `${menuItems.length} line items parsed from your menu for ${periodLabel}.`,
      bullets: [
        ...sample.map((s) => `On menu: ${s}`),
        menuItems.length > 8 ? `…and ${menuItems.length - 8} more items on file.` : null,
      ].filter(Boolean),
    });
    items.push({
      key: "menu_intelligence",
      title: "Menu intelligence (baseline)",
      summary:
        foodTheme.score != null
          ? `Food theme score ${foodTheme.score} (${foodTheme.band}) — cross-walk guest language to menu items in the next Elevate refresh.`
          : "Food theme clustering will sharpen as review volume grows in-category.",
      bullets: [
        "Star performers: items guests praise repeatedly (match menu names to review noun phrases).",
        "Risk items: dishes with value, portion, or consistency complaints — prioritize line checks.",
        "Pricing perception: compare price tiers on menu vs value language in reviews.",
        "Throughput: items mentioned with wait-time or kitchen timing themes during peak hours.",
      ],
    });
  }

  if (social) {
    items.push({
      key: "social_tracking",
      title: "Social tracking scope",
      summary: "Handles on file for cross-channel reputation monitoring.",
      bullets: social.split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 6),
    });
  }

  if (competitors.length) {
    items.push({
      key: "competitive_intel",
      title: "Competitive intelligence",
      summary: `${competitors.length} peer location(s) tracked on this scorecard.`,
      bullets: competitors.slice(0, 5).map((c) => {
        const rating = c.google_rating != null ? `${c.google_rating}★` : "rating n/a";
        return `${c.name} — ${rating}`;
      }),
    });
  }

  if (goals) {
    items.push({
      key: "managed_goals",
      title: "Elevate execution priorities",
      summary: "Goals from intake guiding response drafting and executive reporting.",
      bullets: [goals.length > 220 ? `${goals.slice(0, 217)}…` : goals],
    });
  }

  const elevate_deliverables =
    items.length > 0
      ? {
          version: 1,
          generated_at: new Date().toISOString(),
          period_label: periodLabel,
          items,
          guest_signal_score: overallScore,
        }
      : null;

  const isFree = inquiryPlan === "free_snapshot";
  const elevate_unlock_preview = isFree
    ? {
        version: 1,
        headline: "Unlock with Signal Elevate ($999/mo)",
        items: [
          {
            key: "menu_intelligence",
            title: "Menu Intelligence Analysis",
            summary: "Item-level sentiment clustering and pricing perception — requires menu on file.",
          },
          {
            key: "review_responses",
            title: "Professional review responses",
            summary: "Up to 30 drafted owner responses per month in your brand voice.",
          },
          {
            key: "social",
            title: "Social + review cross-signals",
            summary: "Instagram, Facebook, and TikTok mention tracking where handles are provided.",
          },
          {
            key: "executive",
            title: "Executive performance reporting",
            summary: "Monthly leadership readout with operational tradeoffs and recovery playbook.",
          },
        ],
        gaps_count: elevate_gaps.length,
      }
    : null;

  return { elevate_gaps, elevate_deliverables, elevate_unlock_preview };
}
