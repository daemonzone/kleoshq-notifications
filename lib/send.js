const { getPool } = require('./db');

// The one place that talks to Resend. Returns { outcome, provider_id }:
//   'sent'     Resend accepted it
//   'dry-run'  no RESEND_API_KEY / EMAIL_FROM (local development): logged only
// Throws when Resend refuses, after recording a 'failed' row.
async function sendEmail({ type, to, locale, subject, html, text }) {
  const recipient = (to || '').trim();
  if (!recipient) throw new Error('no_recipient');

  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!key || !from) {
    console.log(`[notifications] DRY-RUN (set RESEND_API_KEY + EMAIL_FROM to send) ${type} → ${recipient} "${subject}"`);
    // Local development only: show the body too, so links (confirmations, invitations) can be opened by hand.
    if (process.env.NODE_ENV !== 'production' && text) console.log(`[notifications] DRY-RUN body:\n${text}`);
    await record({ type, recipient, locale, subject, outcome: 'dry-run' });
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
    await record({ type, recipient, locale, subject, outcome: 'sent', provider_id: body.id || null });
    console.log(`[notifications] ${type} sent to ${recipient}`);
    return { outcome: 'sent', provider_id: body.id || null };
  } catch (err) {
    await record({ type, recipient, locale, subject, outcome: 'failed', error: String(err.message).slice(0, 500) });
    throw err;
  }
}

// A log failure must never turn a sent message into an error for the caller.
async function record({ type, recipient, locale, subject, outcome, provider_id = null, error = null }) {
  try {
    await getPool().query(
      `INSERT INTO email_log (type, recipient, locale, subject, outcome, provider_id, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [type, recipient, locale || null, subject || null, outcome, provider_id, error],
    );
  } catch (err) {
    console.error('[notifications] email_log insert failed:', err.message);
  }
}

module.exports = { sendEmail };
