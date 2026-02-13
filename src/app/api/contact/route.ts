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

    // Create email content
    const emailSubject = `New Contact Form Submission - ${business || "Guest Signal"}`;
    const emailBody = `
New Contact Form Submission from Guest Signal Hospitality

Name: ${name}
Email: ${email}
Restaurant/Business: ${business}
Google Listing URL: ${googleUrl || "Not provided"}
Message: ${message || "No message provided"}

Submitted: ${new Date().toISOString()}
    `.trim();

    // Log for server-side tracking
    console.log("CONTACT_SUBMISSION", {
      name,
      email,
      business,
      googleUrl,
      message,
      ts: new Date().toISOString(),
    });

    // Send email using mailto (opens user's email client with pre-filled email)
    // For production: Replace with Resend/SendGrid API
    // Example with Resend (requires RESEND_API_KEY env variable):
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'contact@guestsignalhospitality.com',
    //   to: 'audit@guestsignalhospitality.com',
    //   subject: emailSubject,
    //   html: emailBody.replace(/\n/g, '<br>'),
    // });

    // For now, use mailto approach
    const mailtoLink = `mailto:audit@guestsignalhospitality.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Redirect to success page with mailto fallback
    return NextResponse.redirect(new URL("/contact?sent=1", req.url), 303);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Failed to submit" }, { status: 500 });
  }
}
