# Lambda Backend

A single Go function handles form submissions and writes them to DynamoDB.

## Runtime

- Language: Go, compiled to a `bootstrap` binary.
- Runtime: `provided.al2023` on the ARM64 architecture.
- Exposed via a Lambda **Function URL** (no API Gateway).
- Source: `lambda/main.go`; tests in `lambda/main_test.go` (`npm test`).

## Request handling

- Serves two methods on the one Function URL:
  - `GET` returns a fresh signed **ALTCHA** challenge for the form widget to
    solve (see Cost & abuse controls below).
  - `POST` accepts a submission with a JSON body
    `{ "email", "motivation", "acknowledged", "website", "altcha" }`.
- Validates the input: `email` required, a parseable address, at most 320
  characters; `motivation` optional, at most 4096 characters; `acknowledged`
  must be `true`. `website` is the honeypot (see below) and must be empty;
  `altcha` is the ALTCHA solution and must verify.
- Stores `{ id, email, motivation, acknowledged, createdAt }` in the DynamoDB
  table; returns the new `id`.
- Unsupported methods receive `405`; a disallowed `Origin` receives `403`; a
  failed/missing ALTCHA solution receives `400`; a source IP over the rate limit
  receives `429`.

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

On top of that, the handler runs these **Tier 0** filters:

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

On top of Tier 0, the handler runs the **Tier 1A ALTCHA** proof-of-work
challenge — the real bot filter:

- **Challenge (`GET`).** Returns `{ algorithm, challenge, maxnumber, salt,
  signature }`. `salt` carries an `expires` timestamp; `signature` is an HMAC of
  the challenge hash. The widget brute-forces the number whose `SHA-256(salt+n)`
  equals `challenge`.
- **Verify (`POST`).** The handler re-derives the hash, checks its HMAC
  signature and the salt's expiry, then records `altcha#<hash>` in the table
  (TTL via `expiresAt`) so each solution is single-use (replay protection).
- **Secret.** The HMAC key is an SSM SecureString (`/vttu/altcha-hmac-secret`,
  env `ALTCHA_SECRET_PARAM`), read once at cold start and cached on the handler.
  CDK only references the parameter — it cannot create a SecureString value — so
  it must be created out of band before the first deploy:

  ```bash
  aws ssm put-parameter --name /vttu/altcha-hmac-secret \
    --type SecureString --value "$(openssl rand -hex 32)"
  ```

These together stop lazy `curl`/bot abuse and make mass spam expensive. For
organized abuse, the next step is to put the Function URL behind CloudFront + AWS
WAF.
