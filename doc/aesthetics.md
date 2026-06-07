# Aesthetics

Less is more, within reason. This is a small satirical site: quick to load, easy
to read, light on its feet. The craft goes into the page, not the machinery
beneath it. Boring, productive tools; the saved effort spent where a visitor
notices.

## What we use

- **React.** Components for layout and the form's small bit of state.
- **Tailwind.** One theme block holds the palette and type tokens (see
  [dazzle](dazzle.md)); utility classes everywhere else. No bespoke CSS system.
- **Vite.** `npm run dev` to work, `npm run build` for the static assets that go
  to S3.

## Still less is more

- **Least code that does the job.** Every line is a liability. The win is in
  deletion. If a feature can be left out, leave it out.
- **Static by default.** The site is a built bundle on S3, cached at the edge. No
  runtime, no way to fail under load. Dynamic behaviour only where the work
  demands it.
- **AWS stack only as complex as necessary.** A private S3 bucket behind
  CloudFront, one Go Lambda on a Function URL, a DynamoDB table, plus DNS and
  certificate. Two CloudFormation stacks because CloudFront forces the ACM
  certificate into `us-east-1`.

## The boundary

Prefer static content. Compose dynamically only where the content depends on
something the server knows and a file cannot hold. The one dynamic piece is the
application form: it posts to the Go Lambda, which verifies an ALTCHA
proof-of-work and writes the submission to DynamoDB. Everything else is static.

Complexity is a cost paid forever. Spend it only when the alternative costs more.

See also: [architecture](architecture.md), [dazzle](dazzle.md),
[aerodynamics](aerodynamics.md).
