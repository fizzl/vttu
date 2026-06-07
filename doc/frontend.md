# Frontend

A small **React + Tailwind** single-page app, built with Vite and served as
static assets from S3 via CloudFront. It is a satirical showcase for
[Valtion Työ- ja Tuotantounioni](../web/public/index.html) and the design system
in [aesthetics](aesthetics.md), [aerodynamics](aerodynamics.md), and
[dazzle](dazzle.md).

## Behaviour

- The page is **client-only. It makes no network requests and collects no data.**
  The application form is handled entirely in React state: on submit it shows a
  local acknowledgement and resets. Nothing is sent anywhere. The form **does
  nothing yet** by design.
- Everything is one continuous white slab, sections carved out by `1px`
  `white-300` borders (see [aerodynamics](aerodynamics.md)), warm yellow and
  orange used only where they earn it (see [dazzle](dazzle.md)).

## Source

- `web/src/` holds the React components and the Tailwind entry CSS (the
  `@theme` block from [dazzle](dazzle.md) lives here).
- `web/index.html` is the Vite entry; it loads Cabin from Google Fonts and mounts
  the React root.
- `npm run dev` runs the Vite dev server; `npm run build` emits the static bundle
  that gets uploaded to S3.

## Page structure

Start the site over from this outline. Keep the existing Finnish copy (it is the
satire), but organize it in this order. The masthead, navigation, hero, and the
Three.js backdrop from the earlier draft are gone; the structure below replaces
them.

1. **Header** — the wordmark `VTTU`, with a subheading line
   `Valtion Työ- ja Tuotantounioni`.

2. **Info box** (yellow field, the flagship component) — `bg-yellow-300`,
   `border border-white-300`, `text-ink-900`:

   > Mee VTTU töihin!
   > Internetissä oletkin saattanut törmätä tähän iloiseen hihkaisuun!
   > Olet ehkä törmännyt ihka aitoon VTTU-toimihenkilöön! Me VTTU:lla haluamme,
   > että kaikki menee **VTTU töihin**!

3. **Esittely** — the lead paragraph (`Kuka tahansa voi hakeutua unionin
   palvelukseen ...`) introducing the open work-and-learning model.

4. **Miten VTTU toimii** — the four principle cards: *Työ jokaiselle*,
   *Valtiorahoitteinen alku*, *Tuttu organisaatio*, *Yksilön vapaus*.

5. **Lyhyesti** — the key/value facts list (Peruspalkka, Vertailu, Palkanmaksu,
   Pätevyysvaatimus, Toimipisteet).

6. **Palkka ja elinkustannusindeksi** — the regional pay table plus the
   diminishing-increment note.

7. **Kaikki työ on projektilähtöistä** — the project-work prose (the 20 %
   tulevaisuusrahasto split) and the badges.

8. **Työtä koko Suomelle** — the longer mission statement.

9. **Usein kysyttyä** — the FAQ block (`Entä jos projekti tuottaa ...`).

10. **Hae VTTU töihin!** — the application form. Two fields only:
    - an **email address** input, and
    - a free-text **"motivaatio"** box.

    Submit shows a local acknowledgement and resets. The form sends nothing.

11. **Footer** — `VTTU x Maxpower, (c) 2026`, then the satire tell on its own
    line: `Tämä sivu on satiiria ja höpöhöpöä.`

## The Lambda is still there

The backend Lambda and DynamoDB table described in
[architecture](architecture.md) and [lambda](lambda.md) are **still deployed**.
The infrastructure is intact and ready to wire up. This satirical skeleton simply
does not call it: there is no `config.js` injection and no `fetch`. If a future
version needs to persist a real submission, the Function URL and handler are
waiting; add the generated `config.js` and a `fetch` in the form component to use
them.
