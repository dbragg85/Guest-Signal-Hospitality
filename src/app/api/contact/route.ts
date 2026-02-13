import { NextResponse } from "next/server";

function sanitize(input: string | null): string {
  if (!input) return "";
  return input.toString().trim().slice(0, 5000);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const name = sanitize(form.get("name") as string | null);
    const email = sanitize(form.get("email") as string | null);
    const business = sanitize(form.get("business") as string | null);
    const googleUrl = sanitize(form.get("googleUrl") as string | null);
    const message = sanitize(form.get("message") as string | null);

    // Create email body
    const emailBody = `
New Contact Form Submission from Guest Signal Hospitality

Name: ${name}
Email: ${email}
Restaurant/Business: ${business}
Google Listing URL: ${googleUrl || "Not provided"}
Message: ${message || "No message provided"}

Submitted: ${new Date().toISOString()}
    `.trim();

    // Create mailto link (will open email client)
    // For production, replace with Resend/SendGrid API
    const mailtoLink = `mailto:audit@guestsignalhospitality.com?subject=New Contact Form Submission - ${encodeURIComponent(business || "Guest Signal")}&body=${encodeURIComponent(emailBody)}`;

    // Log for server-side tracking
    console.log("CONTACT_SUBMISSION", {
      name,
      email,
      business,
      googleUrl,
      message,
      ts: new Date().toISOString(),
    });

    // For now, redirect to mailto (opens email client)
    // TODO: Replace with Resend/SendGrid API call when ready
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev',
    //   to: 'audit@guestsignalhospitality.com',
    //   subject: `New Contact: ${business}`,
    //   html: emailBody.replace(/\n/g, '<br>'),
    // });

    return NextResponse.redirect(mailtoLink);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Failed to submit" }, { status: 500 });
  }
}
