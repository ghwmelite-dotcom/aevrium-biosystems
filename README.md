# Aevrium Biosystems — Investor Website

A world-class, accessible investor site for **Aevrium Biosystems** (Aevrium Select — a consumables-led reproductive microfluidics wedge for IVF labs). Built as a zero-build static site plus a Cloudflare Pages Function for the investor-deck form. Deploys to **Cloudflare Pages** straight from GitHub.

**Design system:** *Clinical Precision* — deep-ink dark surfaces, a serif/grotesque/mono type system, and three semantic accents (cyan = signal, mint = viability, gold = Fareban provenance).

---

## Project structure

```
.
├── public/                     # ← Cloudflare Pages build output dir
│   ├── index.html              # Main investor site
│   ├── 404.html                # Custom not-found page
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── site.webmanifest
│   ├── _headers                # Security headers + cache policy + CSP
│   └── assets/
│       ├── css/styles.css      # Design system
│       ├── js/main.js          # Scrollspy, reveal, counters, form
│       └── img/                # favicon.svg, og.svg
├── functions/
│   └── api/contact.js          # POST /api/contact (Pages Function)
├── wrangler.toml
├── package.json
└── README.md
```

---

## Local development

Prerequisites: **Node 18+**.

**Full preview (recommended — runs the `/api/contact` Function):**

```bash
npm install
npm run dev          # → http://localhost:8788
```

**Static-only preview (no Function; the form falls back to a mailto link):**

```bash
npm run static       # → http://localhost:5050
# or, with Python already installed:
python -m http.server 5050 --directory public
```

---

## Deploy to Cloudflare Pages (via GitHub)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Aevrium Biosystems investor site"
   git branch -M main
   git remote add origin https://github.com/<you>/aevrium-biosystems.git
   git push -u origin main
   ```

2. **Create the Pages project**
   - Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**
   - Select the repo.
   - Build settings:
     - **Framework preset:** `None`
     - **Build command:** *(leave empty)*
     - **Build output directory:** `public`
   - Deploy. Functions in `functions/` are detected automatically.

3. **(Optional) Wire up the form email**
   - Get a [Resend](https://resend.com) API key and verify your sending domain.
   - Pages project → **Settings → Environment variables**:
     - `RESEND_API_KEY` = your key (encrypt as a Secret)
     - `NOTIFY_TO` = `contact@aevrium.com`
     - `NOTIFY_FROM` = `Aevrium Website <noreply@aevrium.com>`
   - Redeploy. Without a key, the form still validates and returns success; the client also falls back to `mailto:` if the API is unreachable.

4. **(Optional) Persist leads to KV**
   ```bash
   npx wrangler kv namespace create LEADS
   ```
   Add the binding `LEADS` in **Settings → Functions → KV namespace bindings** (and uncomment the block in `wrangler.toml` for local dev).

5. **Custom domain:** Pages project → **Custom domains → Set up** → `aevrium.com`. Update the absolute URLs in `index.html` (canonical/OG), `robots.txt`, and `sitemap.xml` if the domain differs.

> CLI alternative to the dashboard: `npm run deploy` (after `npx wrangler login`).

---

## Features

- **Accessibility (WCAG AA):** skip link, visible focus rings, keyboard nav, semantic headings, `aria-live` form errors, AA contrast, full `prefers-reduced-motion` support.
- **Interaction:** scroll progress bar, scrollspy nav, IntersectionObserver reveal animations, animated metric counter, accessible mobile menu.
- **Form:** client + server validation, honeypot spam trap, graceful `mailto` fallback, optional Resend email + KV persistence.
- **SEO:** descriptive meta, Open Graph + Twitter cards, JSON-LD Organization schema, `sitemap.xml`, `robots.txt`.
- **Security:** strict CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Performance:** zero JS framework, `font-display: swap`, deferred script, immutable asset caching, single stylesheet.

---

## Disclosure posture

All public content is **non-enabling and patent-safe** — no device geometry, dimensions, drawings, or operating recipes. Market figures are management assumptions for discussion only and are not guarantees, clinical claims, regulatory clearance, or investment advice.
