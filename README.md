# kleoshq-notifications

Outbound notifications for the SiteWitness services. Today: e-mail through Resend. One endpoint, one
template set, no database, no stored log (the provider's dashboard has the history). Owns its own Resend credentials; the older senders
(`kleoshq-orders`, `kleoshq-ingestion-analyzer`) still send on their own and are moved here one at a time.

## API

`POST /api/send` — `Authorization: Bearer <NOTIFICATIONS_INTERNAL_SECRET>`

```json
{ "type": "beta_confirm_email", "to": "anna@example.com", "locale": "it", "data": { "first_name": "Anna", "link": "https://…" } }
```

`200 { ok, outcome: "sent" | "dry-run" }`, `400 invalid_request | invalid_data`, `401`, `502 send_failed`.

| type | data | purpose |
|---|---|---|
| `beta_confirm_email` | `first_name`, `link` | double opt-in link (valid 48 h) |
| `beta_received` | `first_name` | "request received, we answer within 7 days" |
| `beta_approved` | `first_name`, `email`, `login_url`, `register_url`, `months?` | selected: sign in / sign up with this address |
| `beta_declined` | `first_name` | not this time |

Add a template: a renderer `(data, locale) => { subject, html, text }` in `lib/templates/`, listed in `lib/templates/index.js`.
User-supplied text is escaped; links must be http(s).

## Without RESEND_API_KEY / EMAIL_FROM

Dry-run: the message (body with its links too, outside production) is printed in the container log, nothing is stored. This is the local state: `docker logs kleoshq-notifications`.

## Environment

See `env.sample`. Local: `docker compose up -d notifications` → http://localhost:4007. Tests: `npm test`.
