# Aevrium Biosystems — Investor Website

A world-class, accessible investor site for **Aevrium Biosystems** (Aevrium Select — a consumables-led reproductive microfluidics wedge for IVF labs). Built as a static site served by a **Cloudflare Worker** (Workers Static Assets) with a small Worker API for the investor-deck form. Deploys straight from GitHub via **Workers Builds**.

**Design system:** *Clinical Precision* — deep-ink dark surfaces, a serif/grotesque/mono type system, and three semantic accents (cyan = signal, mint = viability, gold = Fareban provenance).

---

## Project structure

```
.
├── public/                     # Static assets (served by the Worker)
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
├── src/
│   └── index.js                # Worker: serves assets + POST /api/contact
├── wrangler.toml               # name, main, [assets] binding
├── package.json
└── README.md
```

---

## Local development

Prerequisites: **Node 18+**.

**Full preview (recommended — runs the Worker + `/api/contact`):**

```bash
npm install
npm run dev          # → http://localhost:8788
```

**Static-only preview (no Worker; the form falls back to a mailto link):**

```bash
npm run static       # → http://localhost:5050
# or, with Python already installed:
python -m http.server 5050 --directory public
```

---

## Deploy to Cloudflare (Workers Builds, via GitHub)

> Cloudflare has merged Pages into Workers. New Git-connected projects are
> created from the **Workers** side as **Workers Builds** — that's what this
> repo targets (a Worker that serves static assets + the form API).

1. **Push to GitHub** (already a repo? skip to step 2):
   ```bash
   git remote add origin https://github.com/<you>/aevrium-biosystems.git
   git push -u origin main
   ```

2. **Create the Worker from the repo**
   - Cloudflare Dashboard → **Workers & Pages → Create → Workers → Import a repository**
     (or **Connect to Git**).
   - Select the repo. Cloudflare reads `wrangler.toml`, so:
     - **Build command:** *(leave empty)*
     - **Deploy command:** `npx wrangler deploy` (the default)
   - **Create and deploy.** The `[assets]` block serves `public/`; `src/index.js`
     handles `POST /api/contact`.

   _CLI alternative:_ `npx wrangler login` then `npm run deploy`.

3. **(Optional) Wire up the form email**
   - Get a [Resend](https://resend.com) API key and verify your sending domain.
   - Worker → **Settings → Variables & Secrets**:
     - `RESEND_API_KEY` = your key (add as a **Secret**)
     - `NOTIFY_TO` = `contact@aevrium.com`
     - `NOTIFY_FROM` = `Aevrium Website <noreply@aevrium.com>`
   - Redeploy. Without a key the form still validates and returns success; the
     client also falls back to `mailto:` if the API is unreachable.

4. **(Optional) Persist leads to KV**
   ```bash
   npx wrangler kv namespace create LEADS
   ```
   Add the printed `id` to `wrangler.toml` under a `[[kv_namespaces]]` block
   with `binding = "LEADS"`, commit, and redeploy.

5. **Custom domain:** Worker → **Settings → Domains & Routes → Add** → `aevrium.com`.
   Update the absolute URLs in `index.html` (canonical/OG), `robots.txt`, and
   `sitemap.xml` if the domain differs.

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
