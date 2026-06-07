# Lambda Backend

A single Go function handles form submissions and writes them to DynamoDB.

## Runtime

- Language: Go, compiled to a `bootstrap` binary.
- Runtime: `provided.al2023` on the ARM64 architecture.
- Exposed via a Lambda **Function URL** (no API Gateway).
- Source: `lambda/main.go`; tests in `lambda/main_test.go` (`npm test`).

## Request handling

- Accepts `POST` with a JSON body
  `{ "email", "motivation", "acknowledged", "website" }`.
- Validates the input: `email` required, a parseable address, at most 320
  characters; `motivation` optional, at most 4096 characters; `acknowledged`
  must be `true`. `website` is the honeypot (see below) and must be empty.
- Stores `{ id, email, motivation, acknowledged, createdAt }` in the DynamoDB
  table; returns the new `id`.
- Non-`POST` methods receive `405`; a disallowed `Origin` receives `403`; a
  source IP over the rate limit receives `429`.

## CORS

CORS is handled **entirely** by the Lambda Function URL CORS configuration
(allowed origins, methods, headers, and the preflight `OPTIONS` response). The
handler itself sets no CORS headers — doing so would emit duplicate
`Access-Control-Allow-Origin` headers, which browsers reject. The allowed
origins are `https://vttu.fi` and `https://www.vttu.fi`.

## Cost & abuse controls

The Function URL is **public and unauthenticated**. The Lambda is configured
with reserved concurrency to cap the cost from a flood of requests. This
throttles abuse but does not block it.

On top of that, the handler runs the **Tier 0** filters from
[securing_the_lambda](securing_the_lambda.md):

- **Honeypot.** The form has a CSS-hidden `website` field that real users never
  see. Any non-empty value marks the request as a bot and is rejected.
- **Origin allowlist.** Requests whose `Origin` header is not in
  `ALLOWED_ORIGINS` (set from the stack to `https://vttu.fi` and
  `https://www.vttu.fi`, mirroring the Function URL CORS allowlist) get `403`.
  Spoofable, but it filters low-effort scripts.
- **Per-IP rate limit.** An atomic hourly counter keyed on the source IP is
  written to the submissions table (item id `ratelimit#<ip>#<hour>`, expired
  automatically via the `expiresAt` TTL attribute). Past 10 submissions/hour the
  IP gets `429`. The check fails open so a DynamoDB hiccup never blocks a real
  applicant.

These stop lazy `curl`/bot abuse but not a determined human who reads the page.
For that, add a challenge (ALTCHA) or put the Function URL behind CloudFront +
AWS WAF — see [securing_the_lambda](securing_the_lambda.md) Tiers 1 and 2.
