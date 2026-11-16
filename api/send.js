require('dotenv').config();
const { authorized } = require('../lib/auth');
const { sendEmail } = require('../lib/send');
const templates = require('../lib/templates');

// POST /api/send
// Header: Authorization: Bearer <NOTIFICATIONS_INTERNAL_SECRET>
// Body:   { type, to, locale?: 'it'|'en', data? }   (type: see lib/templates)
// 200 { ok, outcome: 'sent'|'dry-run' } · 400 invalid_request · 401 · 502 send_failed
//
// Callers write their own DB change first and treat a failure here as best-effort,
// unless the message IS the feature (a confirmation link): then they surface the error.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!authorized(req)) return res.status(401).json({ ok: false, error: 'unauthorized' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { type, to, data } = body;
  const locale = body.locale === 'en' ? 'en' : 'it';
  const render = Object.hasOwn(templates, type) ? templates[type] : null;
  if (!render || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    return res.status(400).json({ ok: false, error: 'invalid_request' });
  }

  let message;
  try {
    message = render(data && typeof data === 'object' ? data : {}, locale);
  } catch (err) {
    return res.status(400).json({ ok: false, error: 'invalid_data', detail: err.message });
  }

  try {
    const { outcome } = await sendEmail({ type, to, locale, ...message });
    return res.status(200).json({ ok: true, outcome });
  } catch (err) {
    console.error('[notifications] send failed:', err.message);
    return res.status(502).json({ ok: false, error: 'send_failed' });
  }
};
