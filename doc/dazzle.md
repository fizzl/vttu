# Dazzle

A visual design language. Where [Aerodynamics](aerodynamics.md) decides *how the
page is built* — flat, hard-skinned, falling straight — Dazzle decides *how the
page feels*. The two are partners: aerodynamics gives us the airframe, dazzle
gives us the paint job and the engine note. A page can fall straight and still
arrive boring. Dazzle is the refusal to be boring.

Per [Aesthetics](aesthetics.md) we use **no CSS framework** — no Tailwind, no
build step. The token names below (`grey-900`, `yellow-300`, `orange-500`, …) are
*our* names, not anything the browser or a library hands us. They are defined once
as native [CSS custom properties](#defining-the-tokens) and referenced with
`var(...)` everywhere else. That is the whole system: one `:root` block, plain
CSS, no layer to learn or patch.

The premise: a good interface is **cheery and virile** — bright, confident, alive
under the hand — but it earns that energy by being **grounded in mature grey**.
Yellow and orange are the spark; grey is the chassis that lets the spark read as
craft instead of clamor. Never one without the other.

## Defining the tokens

There is no Tailwind generating `bg-yellow-300` for us, and HTML/CSS ships no
named palette beyond a handful of legacy keywords (`gold`, `orange`, `gray` —
none of them ours). So we declare the entire vocabulary once, as native CSS
custom properties on `:root`, and use `var(--token)` from then on. This *is* the
design system — one block, no dependencies.

```css
:root {
  /* Greys — clean neutral chassis, a whisper warm (never brown/beige) */
  --grey-900: #1C1B1A;  /* primary text, headings        */
  --grey-700: #3A3935;  /* secondary text, strong borders */
  --grey-500: #6F6B63;  /* muted text, captions          */
  --grey-300: #B4B0A6;  /* hairline 1px borders          */
  --grey-200: #D6D4CE;  /* backdrop behind the page slab */
  --grey-100: #E6E4DF;  /* page body, resting surfaces   */
  --grey-050: #FBFBF9;  /* lifted / lightest surface     */

  /* Yellow — the contrast field (attention) */
  --yellow-500: #F5C518; /* the signature                */
  --yellow-300: #F9D85C; /* summary / info box fills     */
  --yellow-100: #FCEFC1; /* hover / zebra washes         */

  /* Orange — the accent (action) */
  --orange-600: #D9531E; /* pressed states, errors       */
  --orange-500: #F26419; /* buttons, links, focus        */
  --orange-300: #F79C6A; /* accent hover wash            */
}

/* Usage everywhere else: */
.summary { background: var(--yellow-300); border: 1px solid var(--grey-300); color: var(--grey-900); }
.btn-primary { background: var(--orange-500); color: var(--grey-050); }
```

The tables that follow are the human-readable index of this block — same names,
same hexes, plus *when and why* to use each.

## The palette

### Greys — the chassis

Grey is the adult in the room. It carries text, structure, borders, and every
surface that isn't asking for attention. It is never cold blue-grey and never
muddy brown-grey — it is a true, slightly warm neutral, so it sits comfortably
next to yellow without clashing.

| Token        | Hex       | Role                                                    |
| ------------ | --------- | ------------------------------------------------------- |
| `grey-900`   | `#1C1B1A` | Primary text, headings. Near-black, warm.               |
| `grey-700`   | `#3A3935` | Secondary text, strong borders.                         |
| `grey-500`   | `#6F6B63` | Muted text, captions, disabled labels.                  |
| `grey-300`   | `#B4B0A6` | Hairline borders (the aerodynamic `1px` skin).          |
| `grey-200`   | `#D6D4CE` | Backdrop behind the page slab — the darker "desk".      |
| `grey-100`   | `#E6E4DF` | Page body, resting surfaces.                            |
| `grey-050`   | `#FBFBF9` | Lifted surfaces, the lightest neutral fill.             |

**Why warm grey.** A neutral with a faint warm bias makes yellow look intentional
rather than accidental — the two share a hint of the same temperature. Cool grey
next to warm yellow reads as a mistake; warm grey next to warm yellow reads as a
decision.

### Yellow — the contrast field

Yellow is not an accent here. Yellow is a **field colour** — it fills areas that
need to lift off the grey and say *read me first*. Summary boxes, info callouts,
the active row, the thing you want the eye to land on. It is the cheery half of
the personality.

| Token         | Hex       | Role                                                   |
| ------------- | --------- | ------------------------------------------------------ |
| `yellow-500`  | `#F5C518` | The signature. Pure, confident, slightly golden.       |
| `yellow-300`  | `#F9D85C` | Info / summary box backgrounds — soft enough to host text. |
| `yellow-100`  | `#FCEFC1` | Faintest wash — hover fills, zebra striping, gentle highlight. |

**Why yellow as the field.** Yellow has the highest luminance of any saturated
hue, so a yellow panel can carry `grey-900` text at full contrast — you get a box
that is unmistakably *bright and friendly* yet still passes accessibility. No
other warm colour lets you fill a large area and still print sharp dark text on
top. That is why the summary box is yellow and not orange.

> **Use `yellow-300` for the summary/info box.** It is the brightest fill you can
> put behind body text and still read it cleanly. Pair it with a `grey-300`
> `1px` border (per aerodynamics — the border, not a gap, names the box) and
> `grey-900` text.

### Orange — the accent

Orange is the **virile** half — heat, drive, the press of a finger. It is used
sparingly and never as a large fill behind text. Orange is for *edges of action*:
the primary button, the focused control, the link you're meant to click, the live
indicator. A little orange goes a long way; flood the page with it and the page
shouts.

| Token         | Hex       | Role                                                    |
| ------------- | --------- | ------------------------------------------------------- |
| `orange-600`  | `#D9531E` | Primary action, pressed states. Deep enough for white text. |
| `orange-500`  | `#F26419` | Default accent — buttons, links, focus rings.           |
| `orange-300`  | `#F79C6A` | Accent hover wash, secondary emphasis.                  |

**Why orange as the accent and not yellow.** Action needs *weight*, not just
brightness. Orange is darker and more saturated than yellow, so it can hold white
text on a button and it advances toward the viewer — it feels closer, hotter,
more pressable. Yellow recedes into "information"; orange leans in and says
"do it." Splitting the two jobs — yellow = *attention*, orange = *action* — keeps
the page legible: the eye learns that bright-flat means "read" and hot-bordered
means "touch."

### The rule of three

Every screen should read as **mostly grey, a clear field of yellow, a spark of
orange.** Roughly 70 / 20 / 10. If orange creeps past ~10% the page loses its
maturity and starts to feel like a warning label. If grey drops below half the
page loses its grounding and the cheer turns into noise.

## Motion — five percent more tangible

Every interaction should feel **5% more tangible than a click.** Not a
showreel — a *touch*. The user shouldn't consciously notice the motion; they
should notice that the thing felt real under their hand. Restraint is the whole
craft. We are adding tactility, not theatrics, and motion must never violate
[Aerodynamics](aerodynamics.md) — a shadow only appears while an element is
genuinely lifted, and returns to flush rest the instant it lands.

### Native HTML/CSS — the everyday tangibility

The vast majority of motion is plain CSS, because it is cheap, accessible, and
respects the airframe.

- **Press.** On `:active`, a control depresses `translateY(1px)` and scales to
  `0.98` over `90ms`. It physically gives. On release it springs back over
  `140ms` with a gentle overshoot (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Hover.** A `120ms` ease on background and border colour — `orange-500` →
  `orange-300` wash, never a jump. Warmth arrives, it doesn't blink on.
- **Focus.** The orange focus ring doesn't pop; it *blooms* — `outline` grows
  from `0` to `2px` over `100ms`. Keyboard users get the same tactility as the
  mouse.
- **Lift.** When something genuinely leaves the page (a menu deploying, a dialog
  arriving), it rises with a short shadow-and-`translateY` pair over `160ms` —
  the only moment a shadow is legal — and sheds it on the way down.

```css
:root {
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-press: 90ms;
  --t-settle: 140ms;
}
.btn:active { transform: translateY(1px) scale(0.98); transition: var(--t-press); }
.btn        { transition: transform var(--t-settle) var(--ease-spring); }
```

### Three.js — the subtle-but-impressive layer

Reserved for the few decorative anchors where a flat surface wants quiet depth —
a hero mark, an empty-state, a loading moment. The brief is **subtle but
impressive**: a viewer should sense richness before they can name it.

- A slow field of low-poly facets in `grey-100`/`grey-050`, catching a single
  warm light so the highlights graze toward `yellow-100`. It reads almost still.
- Geometry drifts on a sub-perceptual cycle (a 20–40s loop). Nothing spins; it
  *breathes*.
- Pointer parallax of **5% max** — the scene leans a hair toward the cursor, so
  the surface feels touchable without becoming a toy. (There is the five percent
  again — it is the whole motion budget, spent everywhere.)
- One — and only one — orange element in the 3D scene, the spark, to tie it to
  the palette.

### The contract

- **`prefers-reduced-motion` is law.** Every animation above collapses to an
  instant state change. The three.js scene freezes to a single handsome frame.
  Tangibility is a gift, never a tax.
- **60fps or it doesn't ship.** A janky press is *less* tangible than no
  animation. Transform and opacity only; never animate layout.
- **Nothing blocks.** Motion decorates an interaction that has already
  succeeded. The click works the instant it's clicked; the 5% is gravy.

## Typography — Cabin

**Cabin** is our typeface, and it earns the whole document. It is a humanist
sans with the proportions of a classic grotesque but the warmth of something
drawn by hand — gently rounded terminals, open apertures, a generous x-height.
That combination is exactly the Dazzle thesis in letterform: **cheery and
mature at once.** It is friendly without being childish and clean without being
clinical.

Praise where praise is due:

- **Clarity.** The open apertures on `c`, `e`, `a`, `s` keep counters from
  closing up at small sizes — captions stay legible, dense tables stay readable.
- **Tasteful shapes.** The slightly rounded stroke endings echo our `2px`
  corners — soft enough to be humane, sharp enough to cut the air. Cabin and the
  aerodynamic airframe were, it turns out, drawn to the same taste.
- **Range.** It carries authority at heading weights and stays calm at body
  weights, so one family covers the whole hierarchy — no second typeface needed,
  no air gap between two voices.

Load `Cabin` for everything; fall back to `system-ui, sans-serif`.

### The type scale

A modular scale (ratio ~1.25). Sizes in `rem`, base `16px`.

| Role         | Size            | Weight        | Colour      | When & why                                            |
| ------------ | --------------- | ------------- | ----------- | ----------------------------------------------------- |
| Display      | `2.441rem` 39px | 700 Bold      | `grey-900`  | One per page. The hero line. Authority on entry.      |
| H1           | `1.953rem` 31px | 700 Bold      | `grey-900`  | Page / section title. Strong, anchors the slab.       |
| H2           | `1.563rem` 25px | 600 SemiBold  | `grey-900`  | Subsection. Present, not shouting.                    |
| H3           | `1.25rem` 20px  | 600 SemiBold  | `grey-700`  | Minor heading, card titles. Steps back to grey-700.   |
| Body         | `1rem` 16px     | 400 Regular   | `grey-900`  | Default reading text. Cabin at its most comfortable.  |
| Body strong  | `1rem` 16px     | 600 SemiBold  | `grey-900`  | Inline emphasis. Weight, never colour, for emphasis.  |
| Small        | `0.8rem` 13px   | 400 Regular   | `grey-500`  | Captions, helper text, metadata. Quiet by design.     |
| Label / Caps | `0.8rem` 13px   | 600 SemiBold  | `grey-700`  | Eyebrows, table headers. Track `+0.04em`, uppercase.  |
| Button       | `1rem` 16px     | 600 SemiBold  | per button  | Action text. SemiBold to feel pressable, not flimsy.  |

### Weight, deliberately

Cabin gives us four working weights — **Regular 400, Medium 500, SemiBold 600,
Bold 700** — and we use them as a *system*, not a free-for-all.

- **400 Regular** — body and anything you read in sentences. The resting state.
- **500 Medium** — the lightest touch of emphasis when 600 is too loud; navigation
  in its idle state.
- **600 SemiBold** — the workhorse of emphasis. Headings below H1, buttons,
  labels, inline strong. *Reach for 600 before you reach for colour.*
- **700 Bold** — top of the hierarchy only: Display and H1. Bold is a scarce
  resource; spend it twice per page at most.

**The discipline:** establish hierarchy with **size and weight first**, colour
second. A heading is big and bold because it is a heading — not because it is
orange. Save orange for things you can *touch*. If everything is coloured to
stand out, nothing does; if hierarchy lives in the type itself, the colour stays
free to mean "action."

### Spacing and measure

- **Line height:** `1.5` for body, `1.2` for headings. Air *inside* the text
  block, none wasted around it — padding within, margins toward zero, exactly as
  the airframe demands.
- **Measure:** `60–75ch` for running text. Beyond that the eye loses the line.
- **Paragraph rhythm:** space paragraphs with `0.75em` of margin — enough to
  separate, not enough to drift into an air gap.

## Components

Every component is grey-grounded, named by a `1px` `grey-300` border (never a
gap, never a drop shadow at rest), and earns its colour by its job. All radii are
`2px`, per the airframe.

### Summary / Info box — *the yellow field*

The flagship. `yellow-300` background, `grey-300` `1px` border, `grey-900` body
text, an optional `600` SemiBold label across the top. This is the one place a
broad warm fill is correct: it is information you want read first, and yellow's
high luminance keeps the dark text crisp. No shadow — it rests flush with the
page like everything else.

### Buttons — *the orange spark*

| Variant       | Fill          | Text       | Border           | Use                                  |
| ------------- | ------------- | ---------- | ---------------- | ------------------------------------ |
| Primary       | `orange-500`  | `grey-050` | none             | The one main action per view.        |
| Primary:hover | `orange-300` wash via 120ms | `grey-050` | — | Warmth arrives on approach.          |
| Primary:active| `orange-600`  | `grey-050` | — | Depresses 1px + 0.98 scale.          |
| Secondary     | `grey-050`    | `grey-900` | `grey-300` 1px   | Supporting actions.                  |
| Ghost         | transparent   | `orange-500` | none           | Tertiary / inline actions.           |

One primary per view — orange is scarce. Everything else steps down to grey so
the single orange button reads instantly as *the* thing to do.

### Links

`orange-500`, no underline at rest, underline blooms in on hover over `120ms`.
Orange because a link is an action; the underline-on-hover is the 5% of
tangibility that says *this responds to you.*

### Cards & sections

`grey-050` or `grey-100` surface, carved from the slab by `1px` `grey-300`
borders sharing edges with their neighbours — no floating, no gaps. A card only
casts a shadow while it is being dragged. Title in H3 `grey-700`, body in `grey-900`.

### Inputs

`grey-050` fill, `grey-300` `1px` border at rest. On `:focus` the border goes
`orange-500` and a `2px` orange ring blooms over `100ms`. Focus is an action
state, so it earns the accent. Helper text below in Small `grey-500`; error text
in `orange-600` (our hottest orange doubles as the alert — no separate red, which
would break the warm family).

### Tables

Header row in Label/Caps `grey-700` on `grey-100`. Zebra striping in `yellow-100`
— the faintest wash, just enough to lead the eye across a row without turning the
table into a highlighter. Active/selected row steps up to `yellow-300`.

## Quick reference

**Colour — what each does and why**

| Use this              | For                                   | Because                                              |
| --------------------- | ------------------------------------- | ---------------------------------------------------- |
| `grey-900` / `700`    | Text and structure                    | The mature ground; carries meaning without shouting  |
| `grey-300`            | `1px` borders                         | Names every element per the airframe                 |
| `grey-100` / `050`    | Surfaces                              | Quiet stage for the warm colours                     |
| `yellow-300`          | Summary/info box fills, active rows   | Brightest fill that still holds sharp dark text      |
| `yellow-100`          | Hover / zebra washes                  | Friendliness at a whisper                            |
| `orange-500`          | Buttons, links, focus — *actions*     | Hot, advancing, weighty enough for white text        |
| `orange-600`          | Pressed states, errors                | Maximum heat for the strongest signals               |

> **Yellow says read it. Orange says touch it. Grey holds it all up.**

**Type — reach in this order**

1. **Size** for hierarchy (the scale above).
2. **Weight** for emphasis (600 before 700; 700 only for Display/H1).
3. **Colour** last, and only to mean *action* (orange) — never to fake hierarchy.

**Motion — the budget**

- Everyday tactility → CSS press / hover / focus, `90–160ms`, spring on settle.
- Decorative depth → three.js, slow breath, ≤5% parallax, one orange spark.
- Always → `prefers-reduced-motion` collapses it; 60fps or cut it; never blocks.

> Cheery, virile, grounded. Bright where it informs, hot where it acts, grey
> everywhere it holds — and every touch five percent more real than a click.
