require('dotenv').config();
const { getPool } = require('../../lib/db');
const { verifySvix } = require('../../lib/svix');

// POST /api/webhooks/resend — delivery events (Resend dashboard > Webhooks; signing secret =
// RESEND_WEBHOOK_SECRET). Stores the last event on the matching email_log row, so the admin can see
// whether a message was delivered, bounced or marked as spam.
// Needs the RAW body to check the signature (config below turns the body parser off on Vercel).
const EVENTS = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.delivery_delayed': 'delayed',
  'email.failed': 'failed',
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const secret = (process.env.RESEND_WEBHOOK_SECRET || '').trim();
  if (!secret) return res.status(501).json({ error: 'not_configured' });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');

  if (!verifySvix(raw, req.headers, secret)) return res.status(400).json({ error: 'invalid_signature' });

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const label = EVENTS[event?.type];
  const id = event?.data?.email_id;
  if (label && id) {
    try {
      await getPool().query('UPDATE email_log SET event = $2, event_at = now() WHERE provider_id = $1', [id, label]);
    } catch (err) {
      console.error('[notifications] webhook update failed:', err.message);
      return res.status(500).json({ error: 'server_error' }); // Resend retries
    }
  }
  return res.status(200).json({ ok: true });
};

module.exports.config = { api: { bodyParser: false } };
