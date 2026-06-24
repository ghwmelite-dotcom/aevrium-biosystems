# Deploying to Namecheap cPanel

The `aevrium.com` site auto-deploys to cPanel over FTPS on every push to `main`,
via `.github/workflows/deploy-cpanel.yml`:

| Source folder | cPanel target   | Live URL              | Site                                |
| ------------- | --------------- | --------------------- | ----------------------------------- |
| `/apex`       | `/public_html/` | `aevrium.com` / `www` | Aevrium Biosystems single-page site |

`/apex` is a single fully self-contained `index.html` (all CSS/JS/images inline)
plus favicon + OG assets under `/apex/assets`. The contact CTAs are `mailto:`
links — there is no server-side form, PHP, or database. The deploy job is
**not** clean-slate, so server-side files like `.well-known` (AutoSSL) and
`cgi-bin` are left untouched.

## 1. One-time: add GitHub repository secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret         | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| `FTP_SERVER`   | Your cPanel FTP host, e.g. `ftp.aevrium.com` or the server hostname. |
| `FTP_USERNAME` | A cPanel **FTP account** username (cPanel → *FTP Accounts*).         |
| `FTP_PASSWORD` | That FTP account's password.                                         |

> Use a dedicated FTP account scoped to the docroot rather than the main cPanel
> login. The workflow uses **FTPS on port 21** (explicit TLS) — the Namecheap
> default. Adjust `protocol`/`port` in the workflow if your plan differs.

## 2. Domain + HTTPS

`aevrium.com` (+ `www`) already resolves to the cPanel server. If you ever
re-point it: set `@` and `www` A records to the cPanel shared IP (or use the
Namecheap hosting nameservers), then run cPanel **SSL/TLS Status → Run AutoSSL**
so HTTPS is issued.

## 3. Activate

Push to `main`, or run the workflow manually via **Actions → Deploy to cPanel →
Run workflow**. First run uploads everything; later runs are incremental.

## Regenerating brand assets

The favicon is inlined in `apex/index.html`; the OG image lives at
`apex/assets/aevrium-og.png` with its source at `apex/assets/aevrium-og.svg`.
