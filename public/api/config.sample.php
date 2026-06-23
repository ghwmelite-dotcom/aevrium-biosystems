<?php
/**
 * Copy this file to config.php (same directory) on the cPanel server and
 * fill in your values. config.php is gitignored and is NOT overwritten by
 * the FTP auto-deploy, so your secrets persist across deploys.
 *
 * If RESEND_API_KEY is left blank, the handler falls back to PHP mail().
 */
return [
    // Optional: a Resend API key (https://resend.com) for reliable delivery.
    'RESEND_API_KEY' => '',

    // Where investor-deck requests are sent.
    'NOTIFY_TO'      => 'contact@aevrium.com',

    // Verified sender. With Resend this domain must be verified; with
    // mail() use an address on this hosting account for best deliverability.
    'NOTIFY_FROM'    => 'Aevrium Website <noreply@aevrium.com>',
];
