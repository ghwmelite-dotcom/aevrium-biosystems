# Deploying to Namecheap cPanel

The aevrium.com site auto-deploys to cPanel over FTPS on every push to `main`,
via `.github/workflows/deploy-cpanel.yml`:

| Source folder | cPanel target   | Live URL              | Site                              |
| ------------- | --------------- | --------------------- | --------------------------------- |
| `/apex`       | `/public_html/` | `aevrium.com` / `www` | Aevrium Biosystems single-page site |

`/apex` is a single self-contained `index.html`. The job is **not** clean-slate,
so server-side files like `.well-known` (AutoSSL) and `cgi-bin` are left
untouched.

> The former **investor.aevrium.com** target (`/public`) was decommissioned. Its
> live content was wiped via the one-shot `decommission-investor.yml` workflow;
> the `/public` source remains in the repo (dormant) and the subdomain itself is
> removed in cPanel separately.

## 1. One-time: add GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret            | Value                                                                 |
| ----------------- | --------------------------------------------------------------------- |
| `FTP_SERVER`      | Your cPanel FTP host, e.g. `ftp.aevrium.com` or the server hostname.   |
| `FTP_USERNAME`    | A cPanel **FTP account** username (cPanel → *FTP Accounts*).           |
| `FTP_PASSWORD`    | That FTP account's password.                                          |
| `FTP_REMOTE_DIR`  | *(optional)* Target dir. Defaults to `/public_html/`. For an addon/sub domain use that domain's docroot, e.g. `/public_html/aevrium.com/`. Must start and end with `/`. |

> Use a dedicated FTP account scoped to the docroot rather than the main
> cPanel login. The workflow uses **FTPS on port 21** (explicit TLS) — the
> Namecheap default. If your plan requires it, switch `protocol`/`port` in
> the workflow.

## 2. One-time: place the mail config on the server

The form sends email via [Resend](https://resend.com) if configured, else PHP `mail()`.

1. In cPanel **File Manager**, go to `public_html/api/`.
2. Copy `config.sample.php` → `config.php`.
3. Edit `config.php` and set `RESEND_API_KEY` (recommended) and `NOTIFY_TO`.

`config.php` is gitignored and excluded from the deploy, so it persists and is
never overwritten. Leaving `RESEND_API_KEY` blank falls back to `mail()`.

## 3. Point the domain at cPanel

`aevrium.com` is registered at Namecheap but must resolve to this hosting:

- **If using Namecheap hosting nameservers:** set the domain to use them
  (Namecheap → Domain List → *Nameservers* → *Namecheap Web Hosting DNS*).
- **Or keep BasicDNS and add A records:** point `@` and `www` to your cPanel
  **shared/dedicated IP** (shown in cPanel sidebar → *Shared IP Address*).

Then in cPanel run **SSL/TLS Status → Run AutoSSL** so HTTPS is issued (the
`.htaccess` force-HTTPS rule depends on a valid certificate).

## 4. Activate

Merge this to `main` (or run the workflow manually via **Actions →
Deploy to cPanel → Run workflow**). Watch the run under the **Actions** tab.
First run uploads everything; later runs are incremental.

## 5. Decommission Cloudflare (optional)

This repo previously auto-built to Cloudflare Workers. To stop double-deploys,
disconnect the build in the **Cloudflare dashboard → Workers & Pages →
aevrium-biosystems → Settings → Builds**. The `wrangler.toml`, `src/`, and
`_headers` files can stay in the repo as a fallback — they're ignored by the
cPanel deploy.
