# Guest Signal Hospitality — SEO Implementation

**Site:** https://guestsignalhospitality.com  
**Positioning:** Hospitality Operational Intelligence for Restaurants, Bars, Hotels, and Service-Based Businesses  
**Deploy:** Static export (GitHub Pages) — no server-side 301s; legacy URLs use client redirect + `rel=canonical`

---

## 1. Implementation plan (completed in codebase)

| Phase | Status | Summary |
|-------|--------|---------|
| Technical SEO | Done | `robots.ts`, dynamic `sitemap.ts`, canonicals, OG/Twitter, noindex rules |
| URL restructuring | Done | `/insights/{short-slug}/` canonical; `/newsletter/{legacy}/` redirects |
| Content architecture | Done | `/insights/`, `/topics/{category}/`, breadcrumbs, related articles |
| Internal linking | Done | Per-article service/contact/home links + related briefs |
| Structured data | Done | Organization, WebSite, LocalBusiness, Service, Article, BreadcrumbList, CollectionPage |
| Content quality | Partial | Flagship briefs expanded; continue 900–1500w on new issues |
| Indexing priority | Done | Sitemap priorities; portal/test/inquiry excluded or noindex |
| Performance | Baseline | `loading="lazy"` on images; static export; further CWV in Phase 8 roadmap |
| Positioning copy | Done | Root metadata + homepage H1 area unchanged visually |
| Safety | Done | `npm run build` passes; styling preserved |

---

## 2. SEO architecture

```
/                          → Homepage (priority 1.0)
/services/                 → Plans (0.95)
/industries/restaurants/   → Vertical (0.9)
/contact/                  → Lead (0.9)
/team/                     → About (0.85)
/insights/                 → Intelligence hub (0.9)
/insights/{slug}/          → Articles (0.82–0.88)
/topics/{category}/        → Topical hubs (0.8)
/resources/ + guides       → Evergreen (0.85)
/newsletter/               → Archive (0.75, canonical → /insights/)
/newsletter/{legacy}/      → Redirect only (noindex)
/portal/*                  → noindex
/test/, /inquiry/          → noindex
```

**Code locations:**
- Sitemap: `src/lib/seo/sitemap-paths.ts`, `src/app/sitemap.ts`
- Robots: `src/app/robots.ts`
- Schema: `src/lib/seo/schema.ts`
- Categories: `src/lib/seo/categories.ts`
- Content: `src/lib/newsletter/content.ts`
- Redirect map: `src/lib/seo/redirects.ts`

---

## 3. Recommended folder structure

```
src/
  app/
    insights/[slug]/page.tsx      # Canonical articles
    insights/page.tsx             # Hub
    topics/[slug]/page.tsx        # Category hubs
    newsletter/[slug]/page.tsx    # Legacy redirects only
    newsletter/page.js            # Archive (points to /insights/)
  components/
    insights/InsightArticle.tsx
    seo/                            # Breadcrumbs, JsonLd, RelatedArticles, etc.
  content/newsletter/*.md           # Frontmatter-driven articles
  lib/
    newsletter/content.ts
    seo/
```

---

## 4. Redirect map (301-style via client + canonical)

| Legacy URL | Canonical URL |
|------------|---------------|
| `/newsletter/2026-04-15-this-week-in-hospitality-signals-menu-value-positioning-for-repeat-vi/` | `/insights/menu-value-positioning/` |
| `/newsletter/2026-04-22-this-week-in-hospitality-signals-service-consistency-under-pressure-d/` | `/insights/service-consistency/` |
| `/newsletter/2026-04-29-this-week-in-hospitality-signals-guest-recovery-playbooks-for-frontli/` | `/insights/guest-recovery-playbooks/` |
| `/newsletter/2026-04-08-this-week-in-hospitality-signals-review-response-speed-that-protects-/` | `/insights/review-response-speed/` |
| `/newsletter/2026-05-06-this-week-in-hospitality-signals-local-marketing-signal-alignment-wit/` | `/insights/restaurant-local-marketing/` |
| `/newsletter/2026-05-09-this-week-in-hospitality-signals-restaurant-value-menus/` | `/insights/restaurant-value-menus/` (draft, noindex) |

New issues: generator writes `legacySlug` + short `slug` automatically.

**GSC action:** URL Inspection → request indexing for each `/insights/{slug}/` → Validate fix on old URLs after deploy.

---

## 5. Schema examples

See live output on pages. Representative Article + Breadcrumb:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Menu value positioning for repeat-visit confidence",
  "datePublished": "2026-04-15T12:00:00.000Z",
  "author": { "@type": "Organization", "name": "Guest Signal Hospitality" },
  "mainEntityOfPage": "https://guestsignalhospitality.com/insights/menu-value-positioning/"
}
```

Homepage includes: `Organization`, `WebSite`, `LocalBusiness`, `Service`.

---

## 6. Metadata examples

| Page | Title | Canonical |
|------|-------|-----------|
| Home | Hospitality Operational Intelligence for Restaurants & Hotels | `/` |
| Insights hub | Hospitality Operational Intelligence & Weekly Signals | `/insights/` |
| Article | Menu Value Positioning for Restaurants \| Hospitality Operational Intelligence | `/insights/menu-value-positioning/` |
| Restaurants | Restaurant Reputation & Guest Experience Intelligence | `/industries/restaurants/` |

Template: `%s | Guest Signal Hospitality` (root `layout.tsx`).

---

## 7. Content optimization recommendations

1. **Expand flagship briefs** to 900–1500 words with operator case patterns (Cincinnati + national).
2. **Publish draft** `restaurant-value-menus` when ready; set `draft: false` and `featured: true`.
3. **Cross-link** resource guides from insight articles (review monitoring, Cincinnati reputation).
4. **Add FAQ sections** to `/services/` and `/industries/restaurants/` for `FAQPage` schema (future).
5. **Weekly generator:** keep `NEWSLETTER_AUTO_PUBLISH=true` only when content is review-ready.
6. **Avoid** generic “read more” anchors — use semantic hospitality anchors (implemented in components).

---

## 8. Technical SEO checklist (pre/post deploy)

- [ ] `npm run build` succeeds
- [ ] Deploy `out/` to production
- [ ] Verify https://guestsignalhospitality.com/robots.txt
- [ ] Verify https://guestsignalhospitality.com/sitemap.xml includes `/insights/*` and `/topics/*`
- [ ] Test legacy newsletter URL → lands on `/insights/{slug}/`
- [ ] Rich Results Test on homepage + one article
- [ ] GSC: submit sitemap, request indexing for high-priority URLs
- [ ] GSC: mark old newsletter URLs as redirected (after crawl)
- [ ] Confirm `/portal/` not indexed
- [ ] Lighthouse SEO ≥ 90 on home, insights, services

---

## 9. Crawl / indexation improvement summary

**Root causes addressed for “Discovered – currently not indexed”:**
- Long, diluted URLs → short `/insights/{topic}/` slugs
- Weak internal links → hub, topics, homepage featured block, related articles
- Portal/low-value URLs in sitemap → removed; robots disallow on dashboard paths
- Draft content indexed → drafts excluded from sitemap and insights static params
- Missing topical structure → 10 category hubs with linked articles
- Thin duplicate paths → newsletter canonical points to insights

---

## 10. Priority roadmap (fastest gains)

| Week | Action |
|------|--------|
| 1 | Deploy + GSC sitemap resubmit + index `/`, `/services/`, `/insights/*`, `/industries/restaurants/` |
| 1 | Request indexing for 5 canonical insight URLs |
| 2 | Expand 2 resource guides; add FAQ schema on services |
| 2 | Google Business Profile: align description with “operational intelligence” positioning |
| 3–4 | Backlink outreach: hospitality associations, Cincinnati restaurant groups, podcast guest posts |
| 4+ | Publish weekly insights with `featured` rotation; monitor GSC coverage report |

### Backlink outreach (targets)

- Local restaurant associations and Ohio restaurant org content roundups
- “Operator playbook” guest posts on hospitality SaaS blogs
- Cincinnati business journals (data-led reputation stories)

### Google Business Profile

- Primary category: Business management consultant or Marketing agency (whichever matches verification)
- Description lead: “Hospitality operational intelligence — Guest Signal Score, review monitoring, and service recovery systems for restaurants.”
- Add `/insights/` as appointment/website deep link in posts

---

## Post-deploy validation commands

```bash
npm run build
# Inspect out/sitemap.xml and out/robots.txt
```

Validate redirects manually in browser from each legacy `/newsletter/.../` URL.
