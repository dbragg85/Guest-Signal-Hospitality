import assert from "node:assert/strict";
import test from "node:test";
import { pickBestPublicEmail } from "../lib/discover-business-email.mjs";

test("prefers role inbox on the business domain", () => {
  const chosen = pickBestPublicEmail(
    ["noreply@cdn.example.com", "hello@inclinepublichouse.com", "bob@gmail.com"],
    "https://www.inclinepublichouse.com/",
  );
  assert.equal(chosen, "hello@inclinepublichouse.com");
});

test("rejects tracking and platform addresses", () => {
  const chosen = pickBestPublicEmail(
    ["support@wixpress.com", "pixel@sentry.io"],
    "https://noliakitchen.com/",
  );
  assert.equal(chosen, null);
});
