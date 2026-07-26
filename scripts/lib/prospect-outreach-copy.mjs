/**
 * Senior VP of marketing voice for restaurant outreach.
 * Uses AI to generate personalized copy when available, with template fallback.
 * Scrapes website metadata to reference business history and philosophy.
 */

import { generateAIOutreachCopy, isAIAvailable } from "./ai-outreach-copy.mjs";
import { scrapeBusinessContext, hasUsefulContext } from "./scrape-business-context.mjs";

function text(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanBrandName(name) {
  return text(name, 200)
    .replace(/\s+LLC\.?$/i, "")
    .replace(/\s+Inc\.?$/i, "")
    .replace(/\s*•.*$/, "")
    .replace(/\s*\|\s*.*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function possessive(name) {
  const brand = text(name, 200);
  if (!brand) return "Your";
  return /s$/i.test(brand) ? `${brand}'` : `${brand}'s`;
}

function formatReviews(count) {
  if (count == null) return null;
  return new Intl.NumberFormat("en-US").format(count);
}

function categoryLabel(category) {
  const raw = text(category, 80);
  if (!raw) return "restaurant";
  return raw.replace(/\s+restaurant$/i, "").trim().toLowerCase() || "restaurant";
}

function ratingBand(rating) {
  if (rating == null) return "unknown";
  if (rating >= 4.7) return "elite";
  if (rating >= 4.5) return "strong";
  if (rating >= 4.2) return "solid";
  if (rating >= 3.8) return "vulnerable";
  return "at_risk";
}

function volumeBand(reviewsCount) {
  if (reviewsCount == null) return "unknown";
  if (reviewsCount >= 2000) return "destination";
  if (reviewsCount >= 500) return "high";
  if (reviewsCount >= 150) return "established";
  return "emerging";
}

function observation({ brand, city, rating, reviewsCount, category }) {
  const reviews = formatReviews(reviewsCount);
  const cat = categoryLabel(category);
  const rBand = ratingBand(rating);
  const vBand = volumeBand(reviewsCount);
  const ratingText = rating != null ? rating.toFixed(1) : null;

  if (vBand === "destination" && (rBand === "strong" || rBand === "elite")) {
    return (
      `${brand} is clearly a ${city} demand engine — ${reviews} public reviews and a ${ratingText} average ` +
      `is the kind of proof most independents never build. At that volume, the marketing risk isn't discovery; ` +
      `it's a quiet theme spike (speed, consistency, value) that starts converting first-time guests away in Maps ` +
      `before your team feels it on the floor.`
    );
  }

  if (rBand === "elite") {
    return (
      `A ${ratingText} public rating in ${city} is rare air for a ${cat} concept. Guests are already pre-sold — ` +
      `which means the reviews that matter now are the ones that chip at expectation. I'd want a crisp monthly ` +
      `read on which themes are protecting that rating versus the ones that could flatten it.`
    );
  }

  if (rBand === "strong" && (vBand === "high" || vBand === "established")) {
    return (
      `${possessive(brand)} ${ratingText} rating across ${reviews} reviews puts you in the ${city} consideration set, ` +
      `not just the browse list. From a marketing seat, that profile is doing paid-media work for free — ` +
      `so the job is protecting conversion: make sure recent guest language still matches the brand promise ` +
      `people click for.`
    );
  }

  if (rBand === "solid" || rBand === "vulnerable") {
    return (
      `At ${ratingText}${reviews ? ` with ${reviews} reviews` : ""} in ${city}, you're close enough to the local pack ` +
      `that small reputation swings change who gets the reservation. Most owners watch the star number; ` +
      `I'd rather know which recurring themes are capping you below the next tenth of a point.`
    );
  }

  if (rBand === "at_risk") {
    return (
      `Your public rating (${ratingText}${reviews ? `, ${reviews} reviews` : ""}) in ${city} is already shaping ` +
      `who never walks through the door. Before spending more on traffic, I'd want a plain-English snapshot ` +
      `of the guest themes dragging trust — because acquisition without reputation repair usually leaks.`
    );
  }

  return (
    `I pulled ${brand}'s public guest feedback footprint in ${city}` +
    `${category ? ` (${cat})` : ""}. There's enough signal there to turn into a short operator brief — ` +
    `what guests reward, what they ding, and what would most improve first-visit conversion.`
  );
}

function askLine(rBand) {
  if (rBand === "elite" || rBand === "strong") {
    return "Want me to prepare a complimentary Guest Signal snapshot that shows the themes protecting your rating — and the two or three that could quietly hurt conversion?";
  }
  if (rBand === "at_risk" || rBand === "vulnerable") {
    return "Want a complimentary Guest Signal snapshot that ranks the guest themes most likely holding back clicks and first visits?";
  }
  return "Want me to prepare a complimentary Guest Signal snapshot with the recurring themes and a short priority list your GM can use this week?";
}

function buildTemplateCopy({
  businessName,
  city,
  state,
  rating,
  reviewsCount,
  category,
}) {
  const brand = cleanBrandName(businessName) || "your restaurant";
  const marketCity = text(city, 80) || "your market";
  const r = number(rating);
  const reviews = number(reviewsCount);
  const rBand = ratingBand(r);
  const reviewsLabel = formatReviews(reviews);

  const subjectOptions = [
    r != null && reviews
      ? `${brand}: ${r.toFixed(1)} stars · ${reviewsLabel} reviews — what's actually driving them`
      : null,
    r != null
      ? `Quick read on ${brand}'s ${r.toFixed(1)} Google rating in ${marketCity}`
      : null,
    `What ${marketCity} guests are signaling about ${brand}`,
  ].filter(Boolean);

  const subject = subjectOptions[0];
  const body =
    `Hi ${brand} team,\n\n` +
    `${observation({ brand, city: marketCity, rating: r, reviewsCount: reviews, category })}\n\n` +
    `I lead review intelligence for independent restaurants — Google + Yelp language scored into one clear ` +
    `Guest Signal and a short action list (not another dashboard).\n\n` +
    `${askLine(rBand)} No card, no obligation` +
    `${state ? ` — happy to do this for your ${marketCity}, ${state} team` : ""}.\n\n` +
    `Start here (free, no card): https://guestsignalhospitality.com/snapshot/?utm_source=outreach&utm_medium=email&utm_campaign=guest1\n\n` +
    `If you'd rather skip the free snapshot and start monthly monitoring, founding clients get ` +
    `Signal Monitor at $99/mo for 3 months with code GUEST1 (GUEST#1 offer — first 100), then $149/mo. ` +
    `Cancel anytime: https://guestsignalhospitality.com/services/?utm_source=outreach&utm_medium=email&utm_campaign=guest1\n\n` +
    `— Guest Signal Hospitality`;

  return {
    draft_subject: subject.slice(0, 180),
    draft_body: body.slice(0, 2500),
    voice: "vp_marketing_v1",
    rating_band: rBand,
    volume_band: volumeBand(reviews),
  };
}

/**
 * Build prospect outreach copy using AI when available, with template fallback.
 * Scrapes website for business context to enable personalized messaging.
 */
export async function buildProspectOutreachCopyAsync({
  businessName,
  city,
  state,
  rating,
  reviewsCount,
  category,
  websiteUrl,
  skipAI = false,
}) {
  const r = number(rating);
  const reviews = number(reviewsCount);

  if (skipAI || !isAIAvailable()) {
    return {
      ...buildTemplateCopy({ businessName, city, state, rating, reviewsCount, category }),
      ai_used: false,
      context_scraped: false,
    };
  }

  let context = null;
  if (websiteUrl) {
    try {
      context = await scrapeBusinessContext({
        websiteUrl,
        businessName,
        maxPages: 4,
      });
    } catch (error) {
      console.warn(`Context scrape failed for ${businessName}: ${error.message}`);
    }
  }

  try {
    const aiResult = await generateAIOutreachCopy({
      businessName,
      city,
      state,
      rating: r,
      reviewsCount: reviews,
      category,
      context: hasUsefulContext(context) ? context : null,
    });

    if (aiResult.success && aiResult.draft_subject && aiResult.draft_body) {
      return {
        draft_subject: aiResult.draft_subject,
        draft_body: aiResult.draft_body,
        voice: aiResult.voice,
        rating_band: aiResult.rating_band,
        volume_band: aiResult.volume_band,
        ai_used: true,
        ai_model: aiResult.ai_model,
        context_scraped: Boolean(context && !context.error),
        context_useful: aiResult.context_used,
        business_context: hasUsefulContext(context)
          ? {
              founded_year: context.foundedYear,
              years_in_business: context.yearsInBusiness,
              ownership: context.ownership,
              awards: context.awards,
              food_philosophy: context.foodPhilosophy,
              people: context.people,
              content_summary: context.contentSummary,
            }
          : null,
      };
    }

    console.warn(`AI generation failed for ${businessName}: ${aiResult.error}`);
  } catch (error) {
    console.warn(`AI outreach error for ${businessName}: ${error.message}`);
  }

  return {
    ...buildTemplateCopy({ businessName, city, state, rating, reviewsCount, category }),
    ai_used: false,
    ai_error: "Fallback to template",
    context_scraped: Boolean(context && !context.error),
  };
}

/**
 * Synchronous template-based copy generation (legacy compatibility).
 * Use buildProspectOutreachCopyAsync for AI-powered personalization.
 */
export function buildProspectOutreachCopy({
  businessName,
  city,
  state,
  rating,
  reviewsCount,
  category,
}) {
  return buildTemplateCopy({ businessName, city, state, rating, reviewsCount, category });
}
