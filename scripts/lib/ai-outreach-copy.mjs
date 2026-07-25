/**
 * AI-powered prospect outreach copy generation.
 * Assumes Senior VP of Marketing voice, references business history,
 * and generates personalized emails that get past spam filters and earn attention.
 */

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_TIMEOUT_MS = 25000;

function cleanBrandName(name) {
  return (name || "")
    .trim()
    .slice(0, 200)
    .replace(/\s+LLC\.?$/i, "")
    .replace(/\s+Inc\.?$/i, "")
    .replace(/\s*•.*$/, "")
    .replace(/\s*\|\s*.*$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatNumber(count) {
  if (count == null) return null;
  return new Intl.NumberFormat("en-US").format(count);
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

function buildBusinessContext(context) {
  if (!context) return "";
  
  const parts = [];
  
  if (context.foundedYear) {
    const yearsOld = new Date().getFullYear() - context.foundedYear;
    parts.push(`Founded in ${context.foundedYear} (${yearsOld} years in business)`);
  } else if (context.yearsInBusiness) {
    parts.push(`${context.yearsInBusiness}+ years in business`);
  }
  
  if (context.ownership?.length) {
    parts.push(`Ownership: ${context.ownership.join(", ")}`);
  }
  
  if (context.people?.length) {
    parts.push(`Key people: ${context.people.join(", ")}`);
  }
  
  if (context.foodPhilosophy?.length) {
    parts.push(`Food philosophy: ${context.foodPhilosophy.join(", ")}`);
  }
  
  if (context.awards?.length) {
    parts.push(`Awards/Recognition: ${context.awards.join(", ")}`);
  }
  
  if (context.signatures?.length) {
    parts.push(`Known for: ${context.signatures.join("; ")}`);
  }
  
  if (context.generations) {
    parts.push("Multi-generational operation");
  }
  
  if (context.metaDescription) {
    parts.push(`Website description: "${context.metaDescription}"`);
  }
  
  return parts.join("\n");
}

function buildSystemPrompt() {
  return `You are a Senior VP of Marketing at Guest Signal Hospitality, a restaurant reputation intelligence company. You write outreach emails to independent restaurant owners and operators.

Your voice is:
- Executive-level but approachable — not salesy or desperate
- Knowledgeable about restaurant operations, not just marketing fluff
- Direct and confident, like someone who has run P&L responsibility
- Specific and observational — you reference concrete details, never generic platitudes
- Respectful of operators' time — you get to the point quickly

Your emails:
- Open with a SPECIFIC observation about their business that shows you've done research
- Never use "I noticed your restaurant" or "I came across your profile" — these are spam triggers
- Reference their actual history, philosophy, awards, or unique positioning when available
- Connect their reputation signals (rating, review volume) to business outcomes
- Offer a clear, low-friction next step (complimentary snapshot, not a sales call)
- Are 4-6 sentences in the body, never longer
- Sound like they came from a person who actually looked at the restaurant, not a mail merge

NEVER:
- Use "just reaching out" or "I wanted to reach out"
- Use corporate buzzwords like "synergy", "leverage", "circle back"
- Sound like a template or mass email
- Promise things you can't deliver
- Be pushy about scheduling calls
- Use exclamation points excessively
- Mention competitors by name`;
}

function buildUserPrompt({ businessName, city, state, rating, reviewsCount, category, context }) {
  const brand = cleanBrandName(businessName) || "the restaurant";
  const ratingText = rating != null ? rating.toFixed(1) : null;
  const reviewsText = formatNumber(reviewsCount);
  const rBand = ratingBand(rating);
  const vBand = volumeBand(reviewsCount);
  
  let signalDescription = "";
  if (ratingText && reviewsText) {
    signalDescription = `${ratingText} rating with ${reviewsText} Google reviews`;
  } else if (ratingText) {
    signalDescription = `${ratingText} Google rating`;
  } else if (reviewsText) {
    signalDescription = `${reviewsText} Google reviews`;
  }
  
  const businessContext = buildBusinessContext(context);
  
  return `Write an outreach email for:

RESTAURANT: ${brand}
LOCATION: ${city}${state ? `, ${state}` : ""}
CATEGORY: ${category || "restaurant"}
PUBLIC SIGNALS: ${signalDescription || "Limited public data available"}
RATING BAND: ${rBand} (${rBand === "elite" ? "top tier, protect it" : rBand === "strong" ? "solid position, optimize it" : rBand === "solid" ? "middle pack, room to move up" : rBand === "vulnerable" ? "at risk of slipping" : rBand === "at_risk" ? "needs attention" : "assess carefully"})
VOLUME BAND: ${vBand} (${vBand === "destination" ? "major traffic driver" : vBand === "high" ? "well-established presence" : vBand === "established" ? "building momentum" : "growth opportunity"})

${businessContext ? `BUSINESS CONTEXT FROM THEIR WEBSITE:\n${businessContext}` : "No detailed business context available from website — focus on their public signals."}

Generate:
1. EMAIL SUBJECT LINE (compelling, under 60 chars, references something specific about them)
2. EMAIL BODY (4-6 sentences, Senior VP of Marketing voice, references their history/philosophy if available, connects to reputation intelligence value)

The email should:
- Open by acknowledging something specific about their business (history, philosophy, positioning, or signals)
- Connect that to why reputation intelligence matters for a business like theirs
- Offer a complimentary Guest Signal snapshot showing their review themes and a short priority list
- Close with a simple call to action (reply if interested, no pressure)
- Sign off as "— Guest Signal Hospitality"

Format your response exactly as:
SUBJECT: [your subject line]
BODY:
[your email body]`;
}

async function callOpenAI(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
      signal: controller.signal,
    });
    
    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`OpenAI API error (${response.status}): ${errorBody.slice(0, 200)}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } finally {
    clearTimeout(timer);
  }
}

function parseAIResponse(response) {
  if (!response) return null;
  
  const subjectMatch = response.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
  const bodyMatch = response.match(/BODY:\s*([\s\S]+?)(?:$)/i);
  
  if (!subjectMatch || !bodyMatch) return null;
  
  const subject = subjectMatch[1].trim().slice(0, 180);
  let body = bodyMatch[1].trim();
  
  if (!body.includes("Guest Signal")) {
    body = body.replace(/\n*$/, "\n\n— Guest Signal Hospitality");
  }
  
  return {
    subject,
    body: body.slice(0, 2500),
  };
}

export async function generateAIOutreachCopy({
  businessName,
  city,
  state,
  rating,
  reviewsCount,
  category,
  context,
}) {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    businessName,
    city,
    state,
    rating,
    reviewsCount,
    category,
    context,
  });
  
  try {
    const response = await callOpenAI(systemPrompt, userPrompt);
    const parsed = parseAIResponse(response);
    
    if (!parsed) {
      return {
        success: false,
        error: "Failed to parse AI response",
        draft_subject: null,
        draft_body: null,
      };
    }
    
    return {
      success: true,
      error: null,
      draft_subject: parsed.subject,
      draft_body: parsed.body,
      voice: "vp_marketing_ai_v1",
      rating_band: ratingBand(rating),
      volume_band: volumeBand(reviewsCount),
      ai_model: OPENAI_MODEL,
      context_used: Boolean(context && (
        context.foundedYear ||
        context.yearsInBusiness ||
        context.ownership?.length ||
        context.awards?.length ||
        context.foodPhilosophy?.length ||
        context.people?.length
      )),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      draft_subject: null,
      draft_body: null,
    };
  }
}

export function isAIAvailable() {
  return Boolean(process.env.OPENAI_API_KEY);
}
