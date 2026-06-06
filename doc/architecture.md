# Architecture

AWS CDK project that deploys a static website with a small submission backend.

## What gets deployed

- Private S3 bucket for static website assets
- CloudFront distribution for `vttu.fi` and `www.vttu.fi`
- Route 53 alias records (A + AAAA) for both hostnames
- ACM certificate for both names (in `us-east-1`, required by CloudFront)
- A single Go Lambda exposed via a Function URL (CORS configured on the URL)
- DynamoDB table storing submitted strings
- HTML5/CSS/TypeScript frontend form that posts to the Lambda URL

## Stacks

The app synthesizes two CloudFormation stacks:

- **`VttuCertificateStack`** (`us-east-1`) — the ACM certificate. CloudFront
  requires its certificate in `us-east-1`, so it lives in its own stack and is
  shared with the main stack via CDK cross-region references. The certificate is
  DNS-validated automatically against the Route 53 hosted zone.
- **`VttuStack`** (`eu-central-1` by default) — everything else: S3 bucket,
  CloudFront distribution, Lambda + Function URL, DynamoDB table, and the
  Route 53 alias records.

The deployment region defaults to `eu-central-1` and can be overridden with
`CDK_DEFAULT_REGION`. The certificate region is always `us-east-1`.

## Request flow

- **Static content:** browser → CloudFront → S3 (private, served via Origin
  Access Control). `403`/`404` responses fall back to `/index.html`.
- **Form submission:** browser → Lambda Function URL → DynamoDB.

## Project structure

- `/bin/vttu.ts` — CDK app entry point (wires the two stacks together)
- `/lib/certificate-stack.ts` — ACM certificate stack (`us-east-1`)
- `/lib/vttu-stack.ts` — main infrastructure stack
- `/lambda/main.go` — Lambda handler (Go)
- `/web/public` — static site assets
- `/web/src/app.ts` — frontend TypeScript source
- `/.github/workflows/deploy.yml` — GitHub Actions deployment workflow

See also: [frontend](frontend.md), [lambda](lambda.md),
[local development](local-development.md).
