const crypto = require('crypto');

// Verifies a Resend (Svix) webhook: HMAC-SHA256 of "<svix-id>.<svix-timestamp>.<raw body>" keyed with the
// base64 part of the whsec_ secret; the svix-signature header holds one or more "v1,<base64>" values.
function verifySvix(raw, headers, secret, { toleranceSeconds = 300, now = Date.now() } = {}) {
  const id = headers['svix-id'];
  const ts = headers['svix-timestamp'];
  const sigs = String(headers['svix-signature'] || '');
  if (!id || !ts || !sigs || !secret) return false;
  const age = Math.abs(now / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > toleranceSeconds) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${raw}`).digest();
  return sigs.split(' ').some((part) => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const got = Buffer.from(value, 'base64');
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  });
}

module.exports = { verifySvix };
