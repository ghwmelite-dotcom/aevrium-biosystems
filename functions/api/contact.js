/**
 * Cloudflare Pages Function — POST /api/contact
 * Handles investor-deck requests from the contact form.
 *
 * Optional environment variables (set in the Cloudflare dashboard or wrangler):
 *   RESEND_API_KEY  — if set, sends a notification email via Resend
 *   NOTIFY_TO       — destination address (default: contact@aevrium.com)
 *   NOTIFY_FROM     — verified sender (default: noreply@aevrium.com)
 *   LEADS           — (optional) KV namespace binding to persist leads
 *
 * With no env configured, the function still validates and returns 200,
 * so the form works on a fresh deploy. Wire RESEND_API_KEY to receive email.
 */

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function clean(v, max = 2000) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  // Honeypot — pretend success for bots.
  if (clean(data.company_url)) return json({ ok: true });

  const name = clean(data.name, 200);
  const firm = clean(data.firm, 200);
  const email = clean(data.email, 320);
  const message = clean(data.message, 4000);

  if (!name) return json({ ok: false, error: "Name is required." }, 422);
  if (!email || !EMAIL_RE.test(email))
    return json({ ok: false, error: "A valid email is required." }, 422);

  const lead = {
    name,
    firm,
    email,
    message,
    receivedAt: new Date().toISOString(),
    ua: request.headers.get("user-agent") || "",
    ip: request.headers.get("cf-connecting-ip") || "",
  };

  // Persist to KV if a namespace is bound.
  if (env.LEADS && typeof env.LEADS.put === "function") {
    try {
      await env.LEADS.put(`lead:${lead.receivedAt}:${email}`, JSON.stringify(lead));
    } catch (e) {
      // non-fatal
    }
  }

  // Send notification email via Resend if configured.
  if (env.RESEND_API_KEY) {
    const to = env.NOTIFY_TO || "contact@aevrium.com";
    const from = env.NOTIFY_FROM || "Aevrium Website <noreply@aevrium.com>";
    const text =
      `New investor-deck request\n\n` +
      `Name:  ${name}\n` +
      `Firm:  ${firm || "—"}\n` +
      `Email: ${email}\n\n` +
      `Message:\n${message || "—"}\n\n` +
      `Received: ${lead.receivedAt}`;

    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `Investor deck request — ${name}${firm ? " · " + firm : ""}`,
          text,
        }),
      });
      if (!r.ok) {
        const detail = await r.text();
        return json({ ok: false, error: "Email provider error.", detail }, 502);
      }
    } catch (e) {
      return json({ ok: false, error: "Failed to send notification." }, 502);
    }
  }

  return json({ ok: true });
}
// Note: any non-POST method to /api/contact is answered with an automatic
// 405 Method Not Allowed by Pages, because only onRequestPost is defined.
