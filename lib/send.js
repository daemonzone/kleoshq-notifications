// The one place that talks to Resend. Returns { outcome, provider_id }:
//   'sent'     Resend accepted it
//   'dry-run'  no RESEND_API_KEY / EMAIL_FROM (local development): logged only (nothing is stored)
// Throws when Resend refuses, after logging the failure.
async function sendEmail({ type, to, locale, subject, html, text }) {
  const recipient = (to || '').trim();
  if (!recipient) throw new Error('no_recipient');

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    console.log(`[notifications] DRY-RUN (set RESEND_API_KEY + EMAIL_FROM to send) ${type} → ${recipient} "${subject}"`);
    // Local development only: show the body too, so links (confirmations, invitations) can be opened by hand.
    if (process.env.NODE_ENV !== 'production' && text) console.log(`[notifications] DRY-RUN body:\n${text}`);
    return { outcome: 'dry-run', provider_id: null };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: recipient, subject, html, text,
        ...(process.env.REPLY_TO ? { reply_to: process.env.REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(Number(process.env.EMAIL_TIMEOUT_MS) || 15_000),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json().catch(() => ({}));
    console.log(`[notifications] ${type} sent to ${recipient}`);
    return { outcome: 'sent', provider_id: body.id || null };
  } catch (err) {
    console.error(`[notifications] ${type} to ${recipient} failed: ${String(err.message).slice(0, 300)}`);
    throw err;
  }
}

module.exports = { sendEmail };
