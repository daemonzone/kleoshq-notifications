const test = require('node:test');
const assert = require('node:assert/strict');
const templates = require('../lib/templates');

test('every beta template renders it and en with subject, html and text', () => {
  const data = {
    first_name: 'Anna', email: 'anna@example.com', link: 'https://sitewitness.app/beta/confirm?t=abc',
    login_url: 'https://sitewitness.app/login', register_url: 'https://sitewitness.app/register',
  };
  for (const type of ['beta_confirm_email', 'beta_received', 'beta_approved', 'beta_declined']) {
    for (const locale of ['it', 'en']) {
      const m = templates[type](data, locale);
      assert.ok(m.subject && m.html && m.text, `${type}/${locale}`);
    }
  }
});

test('user-supplied text is escaped in the html', () => {
  const m = templates.beta_received({ first_name: '<script>alert(1)</script>' }, 'en');
  assert.ok(!m.html.includes('<script>'));
  assert.ok(m.html.includes('&lt;script&gt;'));
});

test('links must be http(s)', () => {
  assert.throws(() => templates.beta_confirm_email({ first_name: 'A', link: 'javascript:alert(1)' }, 'it'));
  assert.throws(() => templates.beta_approved({ first_name: 'A', email: 'a@b.it', login_url: 'https://x.it', register_url: 'nope' }, 'it'));
});

test('the approval mail promises the feedback request in both languages', () => {
  const d = { first_name: 'A', email: 'a@b.it', login_url: 'https://x.it/l', register_url: 'https://x.it/r' };
  assert.ok(templates.beta_approved(d, 'it').text.includes('almeno 1 feedback'));
  assert.ok(templates.beta_approved(d, 'en').text.includes('at least 1 piece of feedback'));
});

test('the approval mail names the address to use', () => {
  const m = templates.beta_approved({ first_name: 'A', email: 'a@b.it', login_url: 'https://x.it/l', register_url: 'https://x.it/r' }, 'it');
  assert.ok(m.text.includes('a@b.it'));
});
