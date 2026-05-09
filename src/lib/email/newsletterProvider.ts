export type NewsletterEmailPayload = {
  subject: string;
  markdown: string;
  html: string;
};

async function sendViaResend(payload: NewsletterEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const audience = process.env.NEWSLETTER_EMAIL_TO;
  const from = process.env.NEWSLETTER_EMAIL_FROM ?? "Guest Signal <newsletter@guestsignalhospitality.com>";
  if (!apiKey || !audience) throw new Error("Resend missing configuration.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: audience.split(",").map((v) => v.trim()).filter(Boolean),
      subject: payload.subject,
      html: payload.html,
      text: payload.markdown,
    }),
  });
  if (!response.ok) throw new Error(`Resend send failed: ${response.status}`);
}

async function sendViaButtondown(payload: NewsletterEmailPayload): Promise<void> {
  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) throw new Error("Buttondown missing configuration.");

  const response = await fetch("https://api.buttondown.email/v1/emails", {
    method: "POST",
    headers: {
      Authorization: `Token ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: payload.subject,
      body: payload.markdown,
    }),
  });
  if (!response.ok) throw new Error(`Buttondown send failed: ${response.status}`);
}

export async function sendNewsletterEmail(payload: NewsletterEmailPayload): Promise<void> {
  const provider = (process.env.NEWSLETTER_EMAIL_PROVIDER ?? "").toLowerCase();

  if (!provider) {
    console.log("Email provider not configured; website newsletter published only.");
    return;
  }

  if (provider === "resend") {
    await sendViaResend(payload);
    return;
  }
  if (provider === "buttondown") {
    await sendViaButtondown(payload);
    return;
  }
  if (provider === "mailchimp" || provider === "brevo" || provider === "convertkit") {
    console.log(`${provider} provider adapter is not configured in this build; website newsletter published only.`);
    return;
  }

  console.log("Email provider not configured; website newsletter published only.");
}
