# Aesthetics

Less is more, within reason. An earlier draft of this project chased a
no-framework, hand-rolled, pure-HTML ideal with a bespoke CSS design system and a
Three.js hero. The ambition outran the payoff. This is a small satirical site; it
does not need a hand-built platform under it. So we picked the boring, productive
tools and pointed the effort at the page itself.

## What we use

- **React.** Components let us reorganize the page without copy-pasting markup,
  and the form is just a component with a little state. It is a tool everyone
  knows, well supported, and it gets out of the way.
- **Tailwind.** One theme block holds the palette and type tokens (see
  [dazzle](dazzle.md)), and the rest is utility classes on the markup. No bespoke
  CSS system to invent, document, and maintain.
- **Vite.** Standard React + Tailwind dev server and build. `npm run dev` to work,
  `npm run build` to produce the static assets that go to S3.

## Still less is more

Choosing a framework is not a licence to sprawl. The values that survived the
rethink:

- **Least code that does the job.** Every line is a liability to write, read, and
  keep working. The win is still in deletion. If a feature can be left out, leave
  it out.
- **Static by default.** The whole site is a built bundle uploaded once to S3 and
  cached at the edge. It has no runtime and no way to fail under load. We reach
  for dynamic behaviour only where the work genuinely demands it.
- **Keep the AWS stack only as complex as necessary.** A private S3 bucket behind
  CloudFront, one Go Lambda on a Function URL, a DynamoDB table, and the DNS and
  certificate to make it reachable. No API Gateway where a Function URL suffices.
  Two CloudFormation stacks exist only because CloudFront forces the ACM
  certificate into `us-east-1`, not because we wanted two.

## The boundary

Prefer static content. Compose dynamically only where the content depends on
something the server knows and a file cannot hold. Today the application form is
**inert**: it lives entirely in the browser and sends nothing. The backend Lambda
and DynamoDB table are still deployed and ready, so wiring the form up later is a
small change, not a rebuild.

Complexity is a cost paid forever. Spend it only when the alternative costs more.

See also: [architecture](architecture.md), [frontend](frontend.md),
[dazzle](dazzle.md), [aerodynamics](aerodynamics.md).
