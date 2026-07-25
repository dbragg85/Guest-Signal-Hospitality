import assert from "node:assert/strict";
import test from "node:test";

import {
  buildApifyInput,
  yelpMaxItemsPerRun,
} from "../lib/apify-yelp-actor.mjs";
import { selectBestYelpBusiness } from "../lib/yelp-fusion-resolve-url.mjs";
import {
  blendCategoryAndRatingBase,
  mentionsCategory,
  ratingBaselineFromReviews,
} from "../run-google-gss-monthly.mjs";

function withEnv(values, fn) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, process.env[key]]),
  );
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("Yelp item cap honors configuration and safe bounds", () => {
  withEnv({ YELP_MAX_ITEMS: null }, () => assert.equal(yelpMaxItemsPerRun(), 10));
  withEnv({ YELP_MAX_ITEMS: "50" }, () => assert.equal(yelpMaxItemsPerRun(), 50));
  withEnv({ YELP_MAX_ITEMS: "1000" }, () => assert.equal(yelpMaxItemsPerRun(), 500));
  withEnv({ YELP_MAX_ITEMS: "not-a-number" }, () => assert.equal(yelpMaxItemsPerRun(), 10));
});

test("agents actor input uses the configured item cap", () => {
  withEnv(
    {
      YELP_MAX_ITEMS: "75",
      YELP_INPUT_STYLE: "agents",
      APIFY_YELP_INPUT_TEMPLATE_JSON: null,
    },
    () => {
      assert.deepEqual(
        buildApifyInput("https://www.yelp.com/biz/example", {
          periodStartIso: "2026-06-01",
          periodEndIso: "2026-06-30",
        }),
        {
          startUrls: ["https://www.yelp.com/biz/example"],
          sortBy: "newest",
          maxItems: 75,
        },
      );
    },
  );
});

test("Fusion matching prefers phone and address evidence over result order", () => {
  const businesses = [
    {
      name: "Guest Signal Cafe Downtown",
      url: "https://www.yelp.com/biz/wrong",
      phone: "+15135550000",
      location: { city: "Cincinnati", state: "OH", zip_code: "45202" },
    },
    {
      name: "Guest Signal Cafe",
      url: "https://www.yelp.com/biz/correct",
      phone: "+15135551212",
      location: { city: "Cincinnati", state: "OH", zip_code: "45202" },
    },
  ];

  const selected = selectBestYelpBusiness(businesses, {
    business: "Guest Signal Cafe",
    venue_phone: "(513) 555-1212",
    city: "Cincinnati",
    state: "OH",
    zip: "45202",
  });

  assert.equal(selected?.url, "https://www.yelp.com/biz/correct");
});

test("Fusion matching fails closed when names and phones do not match", () => {
  const selected = selectBestYelpBusiness(
    [
      {
        name: "Completely Different Venue",
        url: "https://www.yelp.com/biz/different",
        phone: "+15135550000",
        location: { city: "Cincinnati", state: "OH", zip_code: "45202" },
      },
    ],
    {
      business: "Guest Signal Cafe",
      venue_phone: "(513) 555-1212",
      city: "Cincinnati",
      state: "OH",
      zip: "45202",
    },
  );

  assert.equal(selected, null);
});

test("GSS category matching uses word boundaries", () => {
  assert.equal(mentionsCategory("Our waiter was excellent", "speed"), false);
  assert.equal(mentionsCategory("The wait was too long", "speed"), true);
  assert.equal(mentionsCategory("The waiter was excellent", "service"), true);
});

test("GSS uses ratings when category text is unavailable", () => {
  const baseline = ratingBaselineFromReviews([
    { rating: 5, review_text: "" },
    { rating: 4, review_text: null },
  ]);
  assert.equal(baseline, 88);
  assert.equal(blendCategoryAndRatingBase(null, baseline), 88);
  assert.equal(blendCategoryAndRatingBase(70, 90), 74);
});
