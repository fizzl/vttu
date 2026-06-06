# Aesthetics

Less is more. This project is built on the belief that the best code is the
code you don't write, and the best system is the one with the fewest moving
parts that still does the job.

## Principles

- **No frameworks.** No React, no Vue, no build-time magic beyond a single
  TypeScript compile. The browser already knows how to render HTML and run
  JavaScript; we don't add a layer that has to be learned, updated, and
  patched for the privilege of standing between us and the platform.
- **Pure HTML.** Markup is content, not configuration. A page is a file you
  can open and read. What you see in `web/public/index.html` is what the
  browser receives.
- **Least code possible.** Every line is a liability — to write, to read, to
  debug, to keep working five years from now. The win is in deletion, not
  addition. If a feature can be left out, leave it out.

## Static content vs. dynamic composition

Prefer static content. A file on disk, uploaded once to S3 and cached at the
edge, has no runtime, no cold start, and no way to fail under load. Compose
dynamically only where the content genuinely depends on something the server
knows and the file can't: the form submission talks to a Lambda because it
must write to a database, and the Lambda URL is injected at deploy time via a
generated `config.js` rather than hardcoded. That is the boundary — static by
default, dynamic only where the work demands it.

## AWS stack only as complex as absolutely necessary

The cloud will happily sell you more services than you need. Resist. Every
resource added is something to provision, secure, monitor, and pay for.

The whole site is a private S3 bucket behind CloudFront, one Go Lambda on a
Function URL, a DynamoDB table, and the DNS and certificate to make it
reachable. No API Gateway where a Function URL suffices. No container
orchestration where a single function suffices. No server where a static file
suffices. Two CloudFormation stacks exist only because CloudFront forces the
ACM certificate into `us-east-1` — not because we wanted two.

Complexity is a cost paid forever. Spend it only when the alternative costs
more.

See also: [architecture](architecture.md), [frontend](frontend.md).
