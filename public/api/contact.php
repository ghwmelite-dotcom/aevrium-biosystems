<?php
/**
 * Aevrium Biosystems — contact form handler (cPanel / PHP).
 *
 * PHP port of the former Cloudflare Worker (src/index.js). Handles
 * POST /api/contact (routed here from /api/contact by .htaccess):
 *   - validates name + email, honours the company_url honeypot
 *   - emails the lead via Resend if RESEND_API_KEY is configured,
 *     otherwise falls back to PHP mail()
 *   - always returns JSON { ok: true } on success
 *
 * Configuration lives in config.php (gitignored — copy config.sample.php).
 * With no config, validation still runs and mail() is attempted, so the
 * front-end's graceful mailto fallback never strands a visitor.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/* ---- Config: getenv defaults, overridden by config.php if present ---- */
$defaults = [
    'RESEND_API_KEY' => getenv('RESEND_API_KEY') ?: '',
    'NOTIFY_TO'      => getenv('NOTIFY_TO') ?: 'contact@aevrium.com',
    'NOTIFY_FROM'    => getenv('NOTIFY_FROM') ?: 'Aevrium Website <noreply@aevrium.com>',
];
$cfg = is_file(__DIR__ . '/config.php')
    ? array_merge($defaults, (array) require __DIR__ . '/config.php')
    : $defaults;

function respond(array $body, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function clean($v, int $max = 2000): string
{
    return mb_substr(trim((string) ($v ?? '')), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    respond(['ok' => false, 'error' => 'Method Not Allowed.'], 405);
}

$data = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($data)) {
    respond(['ok' => false, 'error' => 'Invalid JSON body.'], 400);
}

/* Honeypot — pretend success for bots. */
if (clean($data['company_url'] ?? '') !== '') {
    respond(['ok' => true]);
}

$name    = clean($data['name'] ?? '', 200);
$firm    = clean($data['firm'] ?? '', 200);
$email   = clean($data['email'] ?? '', 320);
$message = clean($data['message'] ?? '', 4000);

if ($name === '') {
    respond(['ok' => false, 'error' => 'Name is required.'], 422);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(['ok' => false, 'error' => 'A valid email is required.'], 422);
}

$receivedAt = gmdate('c');
$subject    = "Investor deck request — {$name}" . ($firm !== '' ? " · {$firm}" : '');
$text =
    "New investor-deck request\n\n" .
    "Name:  {$name}\n" .
    "Firm:  " . ($firm !== '' ? $firm : '—') . "\n" .
    "Email: {$email}\n\n" .
    "Message:\n" . ($message !== '' ? $message : '—') . "\n\n" .
    "Received: {$receivedAt}";

$to   = (string) $cfg['NOTIFY_TO'];
$from = (string) $cfg['NOTIFY_FROM'];

/* ---- Send via Resend if configured, else PHP mail() ---- */
if (!empty($cfg['RESEND_API_KEY']) && function_exists('curl_init')) {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $cfg['RESEND_API_KEY'],
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS     => json_encode([
            'from'     => $from,
            'to'       => [$to],
            'reply_to' => $email,
            'subject'  => $subject,
            'text'     => $text,
        ]),
    ]);
    curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($code < 200 || $code >= 300) {
        respond(['ok' => false, 'error' => 'Email provider error.'], 502);
    }
} else {
    $headers = implode("\r\n", [
        'From: ' . $from,
        'Reply-To: ' . $email,
        'Content-Type: text/plain; charset=utf-8',
    ]);
    if (!@mail($to, $subject, $text, $headers)) {
        respond(['ok' => false, 'error' => 'Failed to send notification.'], 502);
    }
}

respond(['ok' => true]);
