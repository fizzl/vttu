# Frontend

The frontend is a single static HTML page, served from S3 via CloudFront. It is
a satirical showcase for [Valtion Työ- ja Tuotantounioni](../web/public/index.html)
and the design system in [aesthetics](aesthetics.md), [aerodynamics](aerodynamics.md),
and [dazzle](dazzle.md).

## Behavior

- `web/public/index.html` is the whole page: masthead, nav, hero, and a set of
  component sections (summary box, cards, facts list, table, form, footer) that
  double as the living style reference.
- The page is **client-only — it makes no network requests and collects no
  data.** The application form is handled entirely in the browser: on submit it
  shows a local acknowledgement and resets. Nothing is sent anywhere.
- `web/public/app.js` wires up that local form behavior. It is defensive — if
  the form elements are absent it does nothing rather than throwing.
- `web/public/hero.js` is a native ES module that draws the decorative Three.js
  hero backdrop (see [Hero backdrop](#hero-backdrop) below).

## Source

- `web/src/app.ts` — TypeScript source, compiled to `web/public/app.js`
  (`npm run build:web`).
- `web/public/hero.js` — hand-written ES module, **not** part of the `tsc`
  build. It imports Three.js directly from a CDN, so there is no build step and
  no dependency in `package.json`.
- `web/public/` — the static assets that get uploaded to S3.

## Hero backdrop

`hero.js` renders the "subtle but impressive" decorative layer from
[dazzle](dazzle.md#threejs--the-subtle-but-impressive-layer): a slow field of
low-poly grey facets under a single warm light, one orange spark, ≤5% pointer
parallax, and a sub-perceptual breathing motion. It respects
`prefers-reduced-motion` by freezing to a single static frame. Three.js is
loaded as an ES module from a CDN (`https://esm.sh/three`), keeping the
no-build-step rule intact.

## The Lambda is still there

The backend Lambda + DynamoDB table described in [architecture](architecture.md)
and [lambda](lambda.md) are **still deployed** — the infrastructure is intact
and ready to wire up. This satirical skeleton simply does not call it: there is
no `config.js` injection and no `fetch`. If a future version needs to persist a
real submission, the Function URL and handler are waiting; reintroduce the
generated `config.js` and a `fetch` in `app.ts` to use them.
