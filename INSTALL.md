# Installation & Deployment Setup

This document describes the **one-time setup** required to deploy `vttu.fi` and
how the automated deployment works afterwards. For the architecture and
day-to-day development workflow, see [`doc/`](doc/).

Deployment is fully automated: once the setup below is done, every push to
`main` builds, tests, and deploys the whole stack via GitHub Actions using
short-lived credentials (GitHub OIDC — no AWS access keys are stored anywhere).

---

## Prerequisites

### Tools (local machine, for the one-time setup)

- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [GitHub CLI (`gh`)](https://cli.github.com/), authenticated (`gh auth status`)
- Node.js 24+ (LTS) and npm — only if you also want to deploy manually
- Go 1.24+ — only if you also want to deploy manually

### AWS account

- A Route 53 **hosted zone for `vttu.fi`** must already exist.
- Credentials with permission to create IAM resources and run CDK bootstrap
  (an admin user is fine for this one-time setup).

Throughout this document, replace `<ACCOUNT_ID>` with your AWS account ID
(`aws sts get-caller-identity --query Account --output text`).

---

## 1. Bootstrap the CDK in both regions

The CloudFront ACM certificate must live in `us-east-1`, while everything else
deploys to `eu-central-1`. Both regions must be bootstrapped:

```bash
npx cdk bootstrap aws://<ACCOUNT_ID>/eu-central-1 aws://<ACCOUNT_ID>/us-east-1
```

This creates the `cdk-hnb659fds-*` roles that the deployment assumes.

---

## 2. Create the GitHub OIDC provider in IAM

This lets GitHub Actions exchange a workflow token for AWS credentials, so no
long-lived access keys are ever stored.

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

(Only one OIDC provider per account is needed; skip this if it already exists.)

---

## 3. Create the deployment role

The role is restricted to this repository and follows least privilege: it can
do exactly one thing — assume the CDK bootstrap roles. CloudFormation then
performs the actual resource changes through CDK's `cfn-exec` role, so the
GitHub credentials cannot be used to act on the account directly.

**Trust policy** (`trust-policy.json`) — locks the role to `repo:fizzl/vttu:*`:

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

**Permissions policy** (`permissions-policy.json`) — assume CDK roles only:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AssumeCdkBootstrapRoles",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::<ACCOUNT_ID>:role/cdk-hnb659fds-*-<ACCOUNT_ID>-*"
    }
  ]
}
```

**Create the role and attach the policy:**

```bash
aws iam create-role \
  --role-name github-actions-vttu-deploy \
  --assume-role-policy-document file://trust-policy.json

aws iam put-role-policy \
  --role-name github-actions-vttu-deploy \
  --policy-name assume-cdk-bootstrap-roles \
  --policy-document file://permissions-policy.json
```

> For a quick start you can instead attach `AdministratorAccess`
> (`aws iam attach-role-policy ... --policy-arn arn:aws:iam::aws:policy/AdministratorAccess`),
> but the scoped policy above is recommended.

---

## 4. Configure the GitHub repository

The workflow reads the role ARN from a secret and the hosted zone ID from a
repository variable:

```bash
gh secret set AWS_ROLE_TO_ASSUME \
  --body "arn:aws:iam::<ACCOUNT_ID>:role/github-actions-vttu-deploy"

gh variable set HOSTED_ZONE_ID --body "<HOSTED_ZONE_ID>"

# Optional — defaults to eu-central-1 if unset:
# gh variable set AWS_REGION --body "eu-central-1"
```

Get the hosted zone ID with:

```bash
aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='vttu.fi.'].Id" --output text
```

---

## 5. Deploy

With the above in place, you can deploy in either of two ways:

- **Automatically** — push to `main`, or trigger the workflow manually:
  ```bash
  gh workflow run Deploy
  ```
- **Manually** from your machine — see
  [`doc/local-development.md`](doc/local-development.md).

---

## What happens after commit & push

A push to `main` (or a manual `workflow_dispatch`) runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. **Checkout** the repository.
2. **Set up Node.js 24** (with npm caching).
3. **Set up Go 1.24** (with module caching from `lambda/go.sum`).
4. **`npm ci`** — install dependencies.
5. **`npm test`** — run the Go Lambda unit tests.
6. **`npm run build`** — compile the frontend and CDK TypeScript.
7. **Configure AWS credentials** via OIDC — assume `github-actions-vttu-deploy`.
   No access keys are involved; the credentials are short-lived.
8. **`cdk deploy --all`** — deploy both stacks:
   - `VttuCertificateStack` (ACM certificate in `us-east-1`)
   - `VttuStack` (S3, CloudFront, Lambda, DynamoDB, Route 53 records in
     `eu-central-1`); compiles the Go Lambda, uploads the static site to S3, and
     invalidates the CloudFront cache.

If any test or build step fails, the deploy step does not run.

---

## Credentials & configuration summary

| Where | Name | Type | Value |
| --- | --- | --- | --- |
| AWS IAM | GitHub OIDC provider | — | `token.actions.githubusercontent.com` |
| AWS IAM | `github-actions-vttu-deploy` | Role | Trusts `repo:fizzl/vttu:*`; may assume `cdk-hnb659fds-*` roles |
| GitHub secret | `AWS_ROLE_TO_ASSUME` | Secret | Role ARN |
| GitHub variable | `HOSTED_ZONE_ID` | Variable | Route 53 zone ID for `vttu.fi` |
| GitHub variable | `AWS_REGION` | Variable (optional) | Defaults to `eu-central-1` |

No long-lived AWS access keys are stored in GitHub or anywhere else.
