const crypto = require('crypto');

// Bearer-secret check for this service's internal API (NOTIFICATIONS_INTERNAL_SECRET).
function authorized(req) {
  const secret = process.env.NOTIFICATIONS_INTERNAL_SECRET;
  if (!secret) return false; // misconfigured: refuse rather than run open
  const got = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  const want = Buffer.from(secret);
  const have = Buffer.from(got);
  return have.length === want.length && crypto.timingSafeEqual(have, want);
}

module.exports = { authorized };
