# Local Development

How to build, test, and deploy from your own machine. For first-time account
and CI/CD setup, see [`../INSTALL.md`](../INSTALL.md).

## Prerequisites

- Node.js 24+ (LTS)
- npm
- Go 1.24+
- AWS account with:
  - a Route 53 hosted zone for `vttu.fi`
  - CDK bootstrap completed in **both** `eu-central-1` and `us-east-1`
    (the CloudFront certificate stack is deployed to `us-east-1`)

Docker is **not** required: the Go Lambda is built locally with your `go`
toolchain when Docker is unavailable.

## Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   - `CDK_DEFAULT_ACCOUNT` = your AWS account ID
   - `CDK_DEFAULT_REGION` = deployment region (default `eu-central-1`)
   - `HOSTED_ZONE_ID` = Route 53 hosted zone ID for `vttu.fi`

3. Load the variables into your shell:

   ```bash
   set -a
   source .env
   set +a
   ```

## Build, test, synthesize

```bash
npm run build
npm test
npx cdk synth -c hostedZoneId=$HOSTED_ZONE_ID
```

The hosted zone ID is passed via CDK context (`-c hostedZoneId=...`), or read
from the `HOSTED_ZONE_ID` environment variable as a fallback.

## Manual deploy

Deploy both stacks:

```bash
npx cdk deploy --all --require-approval never -c hostedZoneId=$HOSTED_ZONE_ID
```

The stack outputs include the Lambda Function URL and the website URL.

On a first-ever deploy the certificate stack can take several minutes while
ACM completes DNS validation — this is expected.

> Note: pushing to `main` triggers the GitHub Actions deploy. A manual deploy
> and the CI deploy operate on the same stacks, so they are interchangeable.
