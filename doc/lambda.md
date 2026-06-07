# Lambda Backend

A single Go function handles form submissions and writes them to DynamoDB.

## Runtime

- Language: Go, compiled to a `bootstrap` binary.
- Runtime: `provided.al2023` on the ARM64 architecture.
- Exposed via a Lambda **Function URL** (no API Gateway).
- Source: `lambda/main.go`; tests in `lambda/main_test.go` (`npm test`).

## Request handling

- Accepts `POST` with a JSON body `{ "email", "motivation", "acknowledged" }`.
- Validates the input: `email` required, a parseable address, at most 320
  characters; `motivation` optional, at most 4096 characters; `acknowledged`
  must be `true`.
- Stores `{ id, email, motivation, acknowledged, createdAt }` in the DynamoDB
  table; returns the new `id`.
- Non-`POST` methods receive `405`.

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

For real bot protection, put the Function URL behind CloudFront + AWS WAF, or
add a CAPTCHA check in the handler.
