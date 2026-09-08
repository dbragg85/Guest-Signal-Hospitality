import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("browser-emitted events are represented in the canonical taxonomy", () => {
  const taxonomy = read("src/lib/analytics-events.ts");
  const componentFiles = [
    "src/components/CheckoutReturnBanner.tsx", "src/components/LeadIntakeForm.tsx",
    "src/components/NewsletterForm.tsx", "src/components/SnapshotIntakeForm.tsx",
    "src/components/StripeCheckoutButton.tsx", "src/components/TrackingClickEvents.tsx",
  ];
  for (const file of componentFiles) {
    const source = read(file);
    for (const match of source.matchAll(/trackEvent\((?:\s*)["']([^"']+)["']/g)) {
      assert.match(taxonomy, new RegExp(`"${match[1]}"`), `${file}: ${match[1]}`);
    }
  }
});

test("checkout button emits one canonical start and is not click-autotracked", () => {
  const source = read("src/components/StripeCheckoutButton.tsx");
  assert.equal((source.match(/trackEvent\("checkout_start"/g) ?? []).length, 1);
  assert.doesNotMatch(source, /data-track=/);
  assert.match(source, /trackEvent\("checkout_created"/);
  assert.match(source, /trackEvent\("checkout_fail"/);
});

test("browser return events never assert a canonical purchase and cancellation is distinct", () => {
  const source = read("src/components/CheckoutReturnBanner.tsx");
  assert.match(source, /"checkout_returned"/);
  assert.match(source, /"checkout_cancelled"/);
  assert.doesNotMatch(source, /checkout_completed/);
  assert.doesNotMatch(source, /"checkout_fail"/);
});

test("native invalid submissions emit sanitized validation events", () => {
  for (const file of ["src/components/LeadIntakeForm.tsx", "src/components/SnapshotIntakeForm.tsx"]) {
    const source = read(file);
    assert.match(source, /onInvalidCapture=/, file);
    assert.match(source, /trackEvent\("form_validation_fail"/, file);
    assert.match(source, /field: field\.name \|\| "unknown"/, file);
    assert.doesNotMatch(source, /form_validation_fail[\s\S]{0,250}field\.value/, file);
  }
});

test("Stripe webhook covers idempotency and retained-revenue lifecycle", () => {
  const source = read("supabase/functions/stripe-webhook/index.ts");
  for (const event of ["checkout.session.completed", "customer.subscription.deleted", "invoice.payment_failed", "charge.refunded"]) {
    assert.match(source, new RegExp(event.replaceAll(".", "\\.")));
  }
  assert.match(source, /stripe_webhook_events/);
  assert.match(source, /duplicate: true/);
  assert.match(source, /status: "failed"/);
  assert.match(source, /claim_stripe_webhook_event/);
  assert.match(source, /lifecycle_update_failed/);
  assert.match(source, /checkout_insert_failed/);
});

test("root route is unambiguous and utility intake routes are noindex", () => {
  assert.equal(fs.existsSync(new URL("../../src/app/page.js", import.meta.url)), false);
  assert.equal(fs.existsSync(new URL("../../src/app/layout.js", import.meta.url)), false);
  const snapshot = read("src/app/snapshot/page.tsx");
  const sitemap = read("src/lib/seo/sitemap-paths.ts");
  assert.doesNotMatch(snapshot, /robots: \{ index: false/);
  assert.match(snapshot, /canonical: "\/snapshot\/"/);
  assert.match(sitemap, /path: "snapshot"/);
  assert.match(read("src/app/services/inquiry/page.tsx"), /robots: \{ index: false, follow: true \}/);
});
