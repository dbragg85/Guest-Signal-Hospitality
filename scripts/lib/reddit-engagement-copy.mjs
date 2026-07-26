/**
 * Value-first Reddit engagement copy for Guest Signal Hosp.
 * Prefer helpful operator advice; soft brand mention only when natural.
 * Hard rule: no coupon blasts, no "DM me", no link dumps in first comment.
 */

const REVIEW_KEYWORDS =
  /\b(google|yelp|review|rating|reputation|guest|complaint|1.?star|respond|response)\b/i;
const OPS_KEYWORDS =
  /\b(pos|toast|payroll|staff|server|tip|menu|labor|owner|opening|restaurant)\b/i;

/**
 * @param {{ title?: string|null, body?: string|null, community?: string|null, url?: string|null }} signal
 */
export function isEngagementCandidate(signal) {
  const hay = `${signal.title || ""} ${signal.body || ""}`;
  if (!signal.url) return false;
  if (REVIEW_KEYWORDS.test(hay)) return true;
  if (OPS_KEYWORDS.test(hay) && /restaurant|restaurateur|KitchenConfidential|serverlife|cincinnati|nashville|charlotte/i.test(signal.community || "")) {
    return true;
  }
  return false;
}

/**
 * @param {{ title?: string|null, body?: string|null, community?: string|null }} signal
 * @returns {{ kind: "comment", text: string, angle: string } | null}
 */
export function draftCommentForSignal(signal) {
  const hay = `${signal.title || ""}\n${signal.body || ""}`;
  const community = signal.community || "restaurant";

  if (REVIEW_KEYWORDS.test(hay)) {
    return {
      kind: "comment",
      angle: "review_ops",
      text: [
        "A pattern I keep seeing with independent restaurants: the rating drop usually isn't one bad night — it's a handful of unanswered 1–2★ reviews sitting next to silent 5★s.",
        "",
        "What tends to help without sounding corporate:",
        "1) Reply to every review within 48h (even the glowing ones — short thank-you).",
        "2) For negatives: acknowledge the specific issue, say what you'll fix, invite them offline. Skip excuses.",
        "3) Track themes weekly (speed, temp, greeting, billing) so you're fixing ops, not chasing stars.",
        "",
        "Happy to share a simple scorecard template if useful — no pitch, just the rubric we use with operators.",
      ].join("\n"),
    };
  }

  if (/\b(pos|toast|clover|square|processing|interchange)\b/i.test(hay)) {
    return {
      kind: "comment",
      angle: "pos_ops",
      text: [
        "On rates: interchange-plus can look great on paper and still hurt if the monthly platform fee + hardware lease isn't offset by labor/time savings.",
        "",
        "Ask them to model three real tickets (lunch, dinner, catering deposit) all-in — processor fee + monthly + chargebacks — not just the +0.10%. Also confirm who owns the customer data if you ever leave.",
        "",
        "If guests are complaining about tips/receipts in reviews later, that's usually a UX/POS receipt setting, not 'marketing.'",
      ].join("\n"),
    };
  }

  if (/\b(tip|tip.?out|busser|server)\b/i.test(hay)) {
    return {
      kind: "comment",
      angle: "tip_ops",
      text: [
        "Transparency beats mystery percentages. The shops that get fewer guest blow-ups usually put tip-out rules in writing for FOH *and* make the guest-facing tip prompt match what staff actually receives.",
        "",
        "If Google/Yelp mentions 'tip bait' or 'service fee confusion,' treat that as a receipt/UX fix the same week — those reviews compound faster than a quiet policy debate in the walk-in.",
      ].join("\n"),
    };
  }

  if (OPS_KEYWORDS.test(hay)) {
    return {
      kind: "comment",
      angle: "general_ops",
      text: [
        `Useful thread — ${community} conversations like this are where the real ops details show up.`,
        "",
        "One thing I'd add from working with independent restaurants: whatever you decide, write the guest-facing version in one sentence. If the team can't explain it at the table (or on a review reply) in under 10 seconds, it'll show up as confusion online later.",
      ].join("\n"),
    };
  }

  return null;
}

/**
 * Optional value post (not a hard sell). Keep rare.
 * @param {string} [subreddit]
 */
export function draftValuePost(subreddit = "restaurateurs") {
  return {
    kind: "post",
    subreddit: subreddit.replace(/^r\//i, ""),
    angle: "value_post_reviews",
    title: "Simple weekly review triage we use with independent restaurants (no software pitch)",
    text: [
      "Sharing a lightweight process that's helped a few independent operators stop drowning in Google/Yelp noise:",
      "",
      "**Monday 20 minutes**",
      "- Pull last 7 days of Google + Yelp",
      "- Tag each review: food / service / wait / cleanliness / billing / other",
      "- Note whether you replied (Y/N) and hours-to-reply",
      "",
      "**Rules that actually move the needle**",
      "1. Reply to *everything* under 48h — short thank-yous on 5★ count.",
      "2. Negatives get: acknowledge → specific fix → offline invite. No arguing facts in public.",
      "3. If the same tag hits 3× in a week, that's an ops ticket, not a 'marketing' problem.",
      "",
      "Happy to drop the one-page scorecard rubric in the comments if anyone wants it. Curious what cadence other owner-ops are using.",
    ].join("\n"),
  };
}
