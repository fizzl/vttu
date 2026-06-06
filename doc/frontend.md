# Frontend

The frontend is a single static HTML page with a one-field form, served from
S3 via CloudFront.

## Behavior

- `web/public/index.html` includes a form with one text field.
- On stack deploy, CDK uploads a generated `config.js` containing the live
  Lambda Function URL (`window.VTTU_CONFIG = { apiUrl: "..." }`).
- `web/public/app.js` reads that URL and submits JSON `{ "value": "..." }` via
  `POST`.
- The Lambda validates the input and stores it in DynamoDB.

## Source

- `web/src/app.ts` — TypeScript source, compiled to `web/public/app.js`
  (`npm run build:web`).
- `web/public/` — the static assets that get uploaded to S3.

Because `config.js` is generated at deploy time, the frontend never hardcodes
the backend URL.
