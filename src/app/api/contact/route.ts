import { NextResponse } from "next/server";

function sanitize(input: string | null): string {
  if (!input) return "";
  return input.toString().trim().slice(0, 5000);
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const payload = {
      name: sanitize(form.get("name") as string | null),
      email: sanitize(form.get("email") as string | null),
      business: sanitize(form.get("business") as string | null),
      googleUrl: sanitize(form.get("googleUrl") as string | null),
      message: sanitize(form.get("message") as string | null),
      ts: new Date().toISOString(),
    };

    // Replace this with Resend/SendGrid/etc.
    console.log("CONTACT_SUBMISSION", payload);

    return NextResponse.redirect(new URL("/contact?sent=1", req.url), 303);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Failed to submit" }, { status: 500 });
  }
}
