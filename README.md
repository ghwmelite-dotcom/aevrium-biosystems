<div align="center">

<img src="public/assets/img/favicon.svg" width="76" alt="Aevrium Biosystems logo" />

# Aevrium Biosystems

### *Aevrium Select — reproductive microfluidics for IVF labs*

A world-class, accessible **investor website** for a patent-pending biotech raising a seed round around **Aevrium Select**: a consumables-led sperm-selection cartridge that returns a selected fraction **plus a point-of-use confidence signal** to fertility laboratories.

<br />

![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Zero-build static](https://img.shields.io/badge/Build-zero--build_static-66c8ff)
![Vanilla JS](https://img.shields.io/badge/JS-vanilla_·_no_framework-eef4fb)
![Accessibility](https://img.shields.io/badge/A11y-WCAG_AA-94e2b2)
![License](https://img.shields.io/badge/License-proprietary-d8b36a)

</div>

<br />

---

## Overview

Aevrium Biosystems is **a Fareban operating company**. This repository is its investor introduction site — a single-page narrative engineered to earn trust at first glance and read like a scientific instrument, not a generic startup.

It ships as a **static site served by a Cloudflare Worker** (Workers Static Assets), with a small Worker API powering the investor-deck request form. No framework, no build step — it deploys straight from GitHub via **Workers Builds** and auto-redeploys on every push to `main`.

> [!IMPORTANT]
> **Disclosure posture.** All public content is **non-enabling and patent-safe** — no device geometry, dimensions, drawings, or operating recipes. Market figures are management assumptions for discussion only and are not guarantees, clinical claims, regulatory clearance, or investment advice.

---

## Design system — *Clinical Precision*

A deep-ink, premium, scientific-credibility aesthetic. Every choice answers one question: *does this make a careful investor believe these are serious scientists?*

| Layer | Choice | Why |
| --- | --- | --- |
| **Display type** | Fraunces (high-contrast serif) | Editorial, peer-reviewed gravitas |
| **Body type** | Inter | Fast, neutral, highly legible |
| **Data type** | JetBrains Mono · tabular figures | Numbers read like an instrument; never shift layout |
| **Signal** | Cyan `#66c8ff` | CTAs, links, the *Select* step, data highlights |
| **Viability** | Mint `#94e2b2` | Biology / positive signals / the selection node |
| **Provenance** | Gold `#d8b36a` | **Fareban links only** — kept scarce so the parent tie stays legible |
| **Surface** | Ink `#07111f` | Calm, controlled, expensive |

A subtle **microfluidic channel motif** signs the brand to the actual cartridge while staying patent-safe.

---

## Features

- **Accessibility (WCAG AA)** — skip link, visible focus rings, full keyboard nav, semantic headings, `aria-live` form errors, AA contrast, and complete `prefers-reduced-motion` support.
- **Interaction layer** — scroll progress bar, scrollspy navigation, IntersectionObserver reveal-on-scroll, an animated metric counter, and an accessible mobile menu.
- **Progressive enhancement** — reveal styles are JS-gated, so **all content stays visible if scripts fail to load**.
- **Investor-deck form** — client + server validation, honeypot spam trap, graceful `mailto:` fallback, optional Resend email delivery, and optional KV lead persistence.
- **SEO** — descriptive meta, Open Graph + Twitter cards, JSON-LD `Organization` schema, `sitemap.xml`, `robots.txt`, and a generated OG share image.
- **Security** — strict Content-Security-Policy (with a hashed inline marker), HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- **Performance** — no JS framework, `font-display: swap`, deferred script, immutable asset caching, single stylesheet.

---

## Project structure

```
.
├── public/                     # Static assets (served by the Worker)
│   ├── index.html              # Main investor site
│   ├── 404.html                # Custom not-found page
│   ├── robots.txt · sitemap.xml · site.webmanifest
│   ├── _headers                # Security headers + cache policy + CSP
│   └── assets/
│       ├── css/styles.css      # Clinical Precision design system
│       ├── js/main.js          # Scrollspy · reveal · counters · form
│       └── img/                # favicon.svg · og.svg
├── src/
│   └── index.js                # Worker: serves assets + POST /api/contact
├── docs/                       # README media
├── wrangler.toml               # name · main · [assets] binding
├── package.json
└── README.md
```

---

## Local development

Prerequisites: **Node 18+**.

```bash
# Full preview — runs the Worker + /api/contact
npm install
npm run dev          # → http://localhost:8788
```

```bash
# Static-only preview — no Worker; the form falls back to a mailto link
npm run static       # → http://localhost:5050
# or, with Python:
python -m http.server 5050 --directory public
```

---

## Deploy to Cloudflare (Workers Builds, via GitHub)

> Cloudflare has merged Pages into Workers. New Git-connected projects are created from the **Workers** side as **Workers Builds** — that's what this repo targets.

1. **Push to GitHub** (already done if you cloned this):
   ```bash
   git push origin main
   ```
2. **Create the Worker from the repo**
   - Dashboard → **Workers & Pages → Create → Workers → Import a repository**
   - Select the repo. Cloudflare reads `wrangler.toml`, so leave the defaults:
     - **Build command:** *(empty)*
     - **Deploy command:** `npx wrangler deploy`
   - **Create and deploy.** The `[assets]` block serves `public/`; `src/index.js` handles `POST /api/contact`.

   _CLI alternative:_ `npx wrangler login` then `npm run deploy`.

---

## Configuration

The form works on a fresh deploy with **no configuration** (it validates and returns success; the client falls back to `mailto:`). To deliver email, add these to the Worker → **Settings → Variables & Secrets**:

| Name | Type | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | Enables email delivery via [Resend](https://resend.com) |
| `NOTIFY_TO` | Variable | Destination address (default `contact@aevrium.com`) |
| `NOTIFY_FROM` | Variable | Verified sender (default `noreply@aevrium.com`) |

**Optional — persist leads to KV:**

```bash
npx wrangler kv namespace create LEADS
```

Add the printed `id` to `wrangler.toml` under a `[[kv_namespaces]]` block with `binding = "LEADS"`, commit, and redeploy.

**Custom domain:** Worker → **Settings → Domains & Routes → Add** → `aevrium.com`. If the live domain differs, update the absolute URLs in `index.html` (canonical / OG), `robots.txt`, and `sitemap.xml`.

---

## API

### `POST /api/contact`

```jsonc
// Request body
{ "name": "Jane Investor", "firm": "Acme Capital", "email": "jane@fund.com", "message": "..." }
```

| Status | Meaning |
| --- | --- |
| `200` | `{ "ok": true }` — accepted (and emailed if configured) |
| `422` | Validation failed (missing name / invalid email) |
| `400` | Malformed JSON |
| `405` | Method other than `POST` |

---

<div align="center">

**© Aevrium Biosystems — proprietary. All rights reserved.**

A Fareban operating company.

</div>
