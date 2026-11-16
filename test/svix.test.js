const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { verifySvix } = require('../lib/svix');

const secret = 'whsec_' + Buffer.from('super-secret-key').toString('base64');
function sign(id, ts, body) {
  const key = Buffer.from(secret.replace('whsec_', ''), 'base64');
  return 'v1,' + crypto.createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');
}

test('accepts a valid signature, rejects tampering, stale timestamps and missing headers', () => {
  const now = Date.now(), ts = String(Math.floor(now / 1000)), body = '{"type":"email.delivered"}';
  const headers = { 'svix-id': 'msg_1', 'svix-timestamp': ts, 'svix-signature': sign('msg_1', ts, body) };
  assert.equal(verifySvix(body, headers, secret, { now }), true);
  assert.equal(verifySvix(body + ' ', headers, secret, { now }), false);
  assert.equal(verifySvix(body, headers, secret, { now: now + 10 * 60_000 }), false);
  assert.equal(verifySvix(body, { ...headers, 'svix-signature': '' }, secret, { now }), false);
  assert.equal(verifySvix(body, headers, '', { now }), false);
});
