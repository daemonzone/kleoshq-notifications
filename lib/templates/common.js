// Shared bits of the e-mail templates. Everything that comes from a user goes through esc().
const esc = (v) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(title, bodyHtml) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;color:#18181b">
      <h2 style="margin:0 0 16px">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:32px;color:#a1a1aa;font-size:12px">SiteWitness</p>
    </div>`;
}

function button(href, label) {
  return `<p style="margin-top:24px"><a href="${esc(href)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:8px">${esc(label)}</a></p>`;
}

const p = (html) => `<p style="margin:12px 0;font-size:14px;line-height:1.5">${html}</p>`;

// Only http(s) links go into a message: a template never builds a clickable link from arbitrary input.
function safeLink(v) {
  try {
    const u = new URL(String(v));
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

module.exports = { esc, wrap, button, p, safeLink };
