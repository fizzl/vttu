# vttu

AWS CDK project that deploys:

- Private S3 bucket for static website assets
- CloudFront distribution for `vttu.fi` and `www.vttu.fi`
- Route 53 alias records for both hostnames
- ACM certificate for both names (in `us-east-1` for CloudFront)
- Single Go Lambda Function URL (CORS-enabled)
- DynamoDB table storing submitted strings
- HTML5/CSS/TypeScript frontend form posting to the Lambda URL

## Project structure

- `/lib/vttu-stack.ts` - CDK infrastructure stack
- `/lambda/main.go` - Lambda handler (Go)
- `/web/public` - static site assets
- `/web/src/app.ts` - frontend TypeScript source
- `/.github/workflows/deploy.yml` - GitHub Actions deployment workflow

## Prerequisites

- Node.js 20+
- npm
- Go 1.22+
- AWS account with:
  - Route 53 hosted zone for `vttu.fi`
  - CDK bootstrap completed in target region/account

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy environment template:

   ```bash
   cp .env.example .env
   ```

3. Fill values in `.env`:

   - `CDK_DEFAULT_ACCOUNT` = your AWS account ID
   - `CDK_DEFAULT_REGION` = deployment region (default `eu-north-1`)
   - `HOSTED_ZONE_ID` = Route 53 hosted zone ID for `vttu.fi`

4. Load env vars in your shell (example):

   ```bash
   set -a
   source .env
   set +a
   ```

5. Build, test, and synthesize:

   ```bash
   npm run build
   npm test
   npx cdk synth --parameters HostedZoneId=$HOSTED_ZONE_ID
   ```

## Deploy

```bash
npx cdk deploy --require-approval never --parameters HostedZoneId=$HOSTED_ZONE_ID
```

The stack outputs include the Lambda Function URL and website URL.

## Required AWS role (GitHub Actions OIDC)

Create an IAM role for GitHub Actions to assume via OIDC.

### 1) Trust policy

Replace `<ACCOUNT_ID>` and keep your repository restriction:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:fizzl/vttu:*"
        }
      }
    }
  ]
}
```

### 2) Permissions policy

For initial setup/deployment simplicity, attach `AdministratorAccess` to the role.
For production hardening, replace with least-privilege policy for CDK/CloudFormation, IAM pass-role, S3, CloudFront, Route53, ACM, Lambda, DynamoDB, and SSM lookups.

### 3) Create role with AWS CLI (example)

```bash
aws iam create-role \
  --role-name github-actions-vttu-deploy \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name github-actions-vttu-deploy \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

### 4) Provide role to the system

- In GitHub repository secrets, set:
  - `AWS_ROLE_TO_ASSUME=arn:aws:iam::<ACCOUNT_ID>:role/github-actions-vttu-deploy`
- In GitHub repository variables, set (optional):
  - `AWS_REGION=eu-north-1`
- The workflow in `.github/workflows/deploy.yml` reads these values automatically.

For local development, you can also keep `AWS_ROLE_TO_ASSUME` in `.env` as documentation/reference.

## Frontend behavior

- `web/public/index.html` includes a form with one text field.
- On stack deploy, CDK uploads `config.js` containing the live Lambda Function URL.
- `web/public/app.js` submits JSON `{ "value": "..." }` via `POST`.
- Lambda validates input and stores it into DynamoDB.
