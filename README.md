# Demon Kitty — Website (Phase 1–4 build)

Plain HTML/CSS/JS. No build step, no framework, no server — open any page directly in a
browser or deploy the whole folder as-is to GitHub Pages, Netlify, Cloudflare Pages, etc.

## What's actually here

All 14 pages from the sitemap, fully built and cross-linked:
`index` `rules` `services` `gallery` `brands` `about` `reviews` `faq` `journal` `contact`
`privacy` `terms` `cookies` `content-notice`

**Fully working, in the browser, right now:**
- 18+ age-gate overlay (real HTML stays crawlable underneath — see §3.1 / §11 of the spec)
- The full three-theme engine — **Verre / Peau / Écailles** — via the pill button, bottom-right
- "The Sheen" signature light-sweep, tuned differently per theme
- Mobile-first nav: sticky bottom bar, slide-in drawer, safe-area padding
- Rules agreement → sets a token → gates every "Request This" button on Services (try it: visit
  Services first, then Rules, then Services again)
- Cookie consent banner (categorized, not a single Accept-All)
- FAQ accordion, reviews carousel, gallery category tabs + lightbox, demo form confirmations
- SEO/GEO basics: sitemap.xml, robots.txt, llms.txt, OG/Twitter cards, Person/FAQPage schema

**Deliberately stubbed — this is the real remaining work, all called out inline in the code
as `PRODUCTION NOTE` comments:**

| What | Where | What it needs |
|---|---|---|
| Real Tally forms | rules.html, services.html, brands.html, contact.html, reviews collection | Replace the demo `<form>`/JS with the actual embedded Tally forms + hidden fields, per the comments in each file |
| Live stats | index.html, brands.html | Currently sample numbers (128K followers, etc.) — wire to Airtable + a GitHub Actions build step per §9/§13 of the spec |
| Real photography | gallery.html, homepage gallery teaser | Currently gradient placeholder tiles — no real or AI-generated imagery was created for this build; drop real, watermarked photos in and remove the placeholder tiles |
| Watermarking pipeline | — | Add the `sharp`-based GitHub Actions step described in the spec once real photos exist |
| Official Links | header, footer, mobile bar, tribute | Configured with Demon Kitty's 9 official links: LoyalFans, FeetFinder, SextPanther, Twitch, Throne, Cash App, Revolut, YouPay, and X (Twitter) |
| Domain | `build.py` → `BASE_URL` | Set to the real domain, then re-run `python3 build.py && python3 pages.py && python3 legal_pages.py` |
| Legal pages | privacy/terms/cookies/content-notice.html | Real drafts, but every page opens with a flagged disclaimer — **have a lawyer review before publishing**, especially the age-verification approach (self-declaration vs. certified) once it's confirmed how explicit any on-site content will be, and the governing-law/jurisdiction blanks |
| Media kit PDF | brands.html | "Download Media Kit" button is a placeholder link |
| Individual journal posts | journal.html | Cards link to `#` — Phase 4 item |
| Session-unique watermarking, certified age verification | — | Both need a small serverless function (Cloudflare Worker) per §8/§12 of the spec — correctly scoped as Phase 2 add-ons, not MVP |

## Structure

```
index.html, rules.html, ... content-notice.html   ← 14 pages, plain HTML
assets/css/styles.css                              ← full design system + 3-theme engine
assets/js/main.js                                  ← all interactivity, one file, no dependencies
assets/img/mark.svg, logo.svg, og-cover.png         ← brand mark + OG share image
robots.txt, sitemap.xml, llms.txt                   ← SEO/GEO
build.py, pages.py, legal_pages.py                  ← the generator that produced the HTML
```

The HTML is generated from `build.py` (shared header/footer/nav/gate/cookie-banner partials)
and `pages.py` / `legal_pages.py` (per-page content), so the nav and global systems stay
consistent across all 14 pages. If you want to edit copy, it's usually faster to edit the
`.html` files directly — but if you're adding a page or changing something global (the nav
menu, the footer, the age-gate copy), edit the Python and re-run:

```
python3 build.py    # (no output — just defines the shared functions)
python3 pages.py
python3 legal_pages.py
```

## Deploying (GitHub Pages, per §13.1 of the spec)

1. Push this folder's contents to the root of a GitHub repo.
2. Repo → Settings → Pages → set the custom domain. GitHub commits a `CNAME` file automatically.
3. At your registrar (or better, through Cloudflare in front — see §13.1 Option B), point the
   domain's DNS at GitHub Pages' four A records and a `www` CNAME.
4. Back in Settings → Pages, enable "Enforce HTTPS" once the certificate issues.

No build pipeline is required for what's here — it's already static output. You'll add a
GitHub Actions step later specifically for the Airtable → stats and the photo-watermarking
pipeline, per §9 and §8 of the spec.

## A note on the design

Copy, palette, and the theme concept ("The Sheen") follow the original spec closely. Where the
spec left a choice open, this build made one: display typeface is **Fraunces** (loaded from
Google Fonts), body is **Manrope**, small data/labels use **JetBrains Mono**. The crown-shaped
mark reads as a viper's fang, a stiletto's line, and a queen's crown at once — it's a placeholder
for a real designer's pass, but built with intent rather than as a generic filler logo.

No real or AI-generated photography was created for this build — every gallery/image slot is an
intentional placeholder (a labeled gradient tile) waiting on real content.

## Code-health validation

Run the dependency-free validator before publishing:

```bash
node scripts/validate-site.mjs
```

It checks local page and asset references, gallery data, HTML language and heading basics,
sitemap targets, and animation invariants. Missing legacy hero-video files are reported as
runtime-fallback warnings; the existing animated video engine remains enabled.
