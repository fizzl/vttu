# Dazzle

A visual design language. Where [Aerodynamics](aerodynamics.md) decides *how the
page is built* (flat, hard-skinned, falling straight), Dazzle decides *how the
page feels*. The two are partners: aerodynamics gives us the airframe, dazzle
gives us the paint job. A page can fall straight and still arrive boring. Dazzle
is the refusal to be boring.

We build with **React and Tailwind**. The token names below (`white-050`,
`yellow-300`, `orange-500`, ...) are *our* names. We register them once in
Tailwind's theme and then use the utilities Tailwind generates (`bg-white-050`,
`text-ink-900`, `border-white-300`, `bg-yellow-300`) everywhere else. That is the
whole system: one theme block, then plain utility classes.

The premise: a good interface is **cheery and confident**, bright and alive under
the hand, but it earns that energy by being **grounded in clean white**. Yellow
and orange are the spark; white is the page that lets the spark read as craft
instead of clamor. Never one without the other.

## Defining the tokens

Tailwind v4 reads its theme from a `@theme` block in your main CSS file. We
declare the entire vocabulary once there, and use the generated utilities from
then on. This *is* the design system: one block, no other dependency.

```css
/* app.css */
@import "tailwindcss";

@theme {
  /* Ink — text and structure, a clean near-neutral, faintly cool */
  --color-ink-900: #1A1C20;  /* primary text, headings        */
  --color-ink-700: #3B3E44;  /* secondary text, strong borders */
  --color-ink-500: #70747C;  /* muted text, captions          */

  /* Whites — subtle shades of white, the brightest a whisper blue */
  --color-white-300: #D7DBE0; /* hairline 1px borders          */
  --color-white-200: #E9ECF1; /* backdrop behind the page slab */
  --color-white-100: #F4F6F9; /* page body, resting surfaces   */
  --color-white-050: #FBFCFF; /* lifted / brightest surface    */

  /* Yellow — the contrast field (attention) */
  --color-yellow-500: #F5C518; /* the signature                */
  --color-yellow-300: #F9D85C; /* info box fills               */
  --color-yellow-100: #FCEFC1; /* hover / zebra washes         */

  /* Orange — the accent (action) */
  --color-orange-600: #D9531E; /* pressed states, errors       */
  --color-orange-500: #F26419; /* buttons, links, focus        */
  --color-orange-300: #F79C6A; /* accent hover wash            */
}
```

```jsx
// Usage everywhere else, as Tailwind utilities:
<div className="bg-yellow-300 border border-white-300 text-ink-900">…</div>
<button className="bg-orange-500 text-white-050">…</button>
```

The tables that follow are the human-readable index of this block: same names,
same hexes, plus *when and why* to use each.

## The palette

### Whites — the page

White is the clean room. It carries every surface that is not asking for
attention: the body, the cards, the table, the resting fields. We do not use a
flat single white. We use **subtle shades of white**, separated by a few points
of lightness, so structure reads without a single hard line doing all the work.
The brightest shades carry **the tiniest bit of blue**, which keeps them looking
crisp and lit rather than dingy or cream.

| Token        | Hex       | Role                                                    |
| ------------ | --------- | ------------------------------------------------------- |
| `white-300`  | `#D7DBE0` | Hairline borders (the aerodynamic `1px` skin).          |
| `white-200`  | `#E9ECF1` | Backdrop behind the page slab, the slightly cooler "desk". |
| `white-100`  | `#F4F6F9` | Page body, resting surfaces.                            |
| `white-050`  | `#FBFCFF` | Lifted surfaces, the brightest fill, a whisper of blue. |

Text and structure ride on a separate **ink** ramp, a clean near-neutral with a
faint cool bias so it sits naturally on the white shades.

| Token        | Hex       | Role                                                    |
| ------------ | --------- | ------------------------------------------------------- |
| `ink-900`    | `#1A1C20` | Primary text, headings. Near-black, faintly cool.       |
| `ink-700`    | `#3B3E44` | Secondary text, strong borders.                         |
| `ink-500`    | `#70747C` | Muted text, captions, disabled labels.                  |

**Why cool white with a blue whisper.** A bright neutral with a hair of blue in
its lightest shades reads as *daylight* rather than *paper*. It throws the warm
yellow and orange forward: the page is a clean, cool ground, and the warm colours
are unmistakably the spark on top of it. The ramp stays subtle on purpose. The
steps are small so the page still reads as one continuous white slab, not a stack
of obviously different greys.

### Yellow — the contrast field

Yellow is not an accent here. Yellow is a **field colour**: it fills areas that
need to lift off the white and say *read me first*. The info box, callouts, the
active row, the thing you want the eye to land on. It is the cheery half of the
personality.

| Token         | Hex       | Role                                                   |
| ------------- | --------- | ------------------------------------------------------ |
| `yellow-500`  | `#F5C518` | The signature. Pure, confident, slightly golden.       |
| `yellow-300`  | `#F9D85C` | Info box backgrounds, soft enough to host text.        |
| `yellow-100`  | `#FCEFC1` | Faintest wash: hover fills, zebra striping, highlight. |

**Why yellow as the field.** Yellow has the highest luminance of any saturated
hue, so a yellow panel can carry `ink-900` text at full contrast: a box that is
unmistakably *bright and friendly* yet still passes accessibility. Against the
cool white ground the warm yellow lands even harder. That is why the info box is
yellow and not orange.

> **Use `yellow-300` for the info box.** It is the brightest fill you can put
> behind body text and still read it cleanly. Pair it with a `white-300` `1px`
> border (per aerodynamics, the border names the box) and `ink-900` text.

### Orange — the accent

Orange is the **driving** half: heat, the press of a finger. It is used sparingly
and never as a large fill behind text. Orange is for *edges of action*: the
primary button, the focused control, the link you are meant to click. A little
orange goes a long way; flood the page with it and the page shouts.

| Token         | Hex       | Role                                                    |
| ------------- | --------- | ------------------------------------------------------- |
| `orange-600`  | `#D9531E` | Primary action, pressed states. Deep enough for white text. |
| `orange-500`  | `#F26419` | Default accent: buttons, links, focus rings.            |
| `orange-300`  | `#F79C6A` | Accent hover wash, secondary emphasis.                  |

**Why orange as the accent and not yellow.** Action needs *weight*, not just
brightness. Orange is darker and more saturated than yellow, so it can hold white
text on a button and it advances toward the viewer. Yellow recedes into
"information"; orange leans in and says "do it." Splitting the two jobs (yellow =
*attention*, orange = *action*) keeps the page legible: the eye learns that
bright-flat means "read" and hot-bordered means "touch."

### The rule of three

Every screen should read as **mostly white, a clear field of yellow, a spark of
orange**, roughly 70 / 20 / 10. If orange creeps past about 10% the page loses its
calm and starts to feel like a warning label. If white drops below half the page
loses its grounding and the cheer turns into noise.

## Motion, kept simple

Every interaction should feel slightly more tangible than a bare click. Not a
showreel, a *touch*. With Tailwind this is almost free: transition utilities plus
`active:` and `focus-visible:` variants cover the everyday tactility, and they
respect [Aerodynamics](aerodynamics.md). A shadow only appears while an element is
genuinely lifted, and it returns to flush rest the instant it lands.

- **Press.** On `active:`, a control depresses and scales down a hair, then
  springs back. `active:translate-y-px active:scale-[0.98]` with a short
  `transition` does it.
- **Hover.** A short ease on background and border colour: `orange-500` to an
  `orange-300` wash. `transition-colors duration-150`. Warmth arrives, it does
  not blink on.
- **Focus.** The orange focus ring blooms rather than pops:
  `focus-visible:outline-2 focus-visible:outline-orange-500`.
- **Lift.** When something genuinely leaves the page (a menu, a dialog), it rises
  with a short shadow, the only moment a shadow is legal, and sheds it on the way
  down.

```jsx
<button
  className="bg-orange-500 text-white-050 rounded-sm
             transition-transform duration-150 active:translate-y-px active:scale-[0.98]
             focus-visible:outline-2 focus-visible:outline-orange-500"
>
  Lähetä
</button>
```

### The contract

- **`prefers-reduced-motion` is law.** Tailwind ships `motion-reduce:` variants;
  use them to collapse any transition to an instant state change. Tangibility is
  a gift, never a tax.
- **60fps or it does not ship.** Transform and opacity only; never animate layout.
- **Nothing blocks.** Motion decorates an interaction that already succeeded.

> We deliberately dropped the decorative Three.js hero from the earlier draft.
> The ambition outran the point of the page. If a quiet bit of depth is ever
> wanted again, add it as one isolated React component behind a
> `prefers-reduced-motion` guard, and nowhere else.

## Typography, Cabin

**Cabin** is our typeface, and it earns the whole document. It is a humanist sans
with the proportions of a classic grotesque but the warmth of something drawn by
hand: gently rounded terminals, open apertures, a generous x-height. That
combination is exactly the Dazzle thesis in letterform, **cheery and mature at
once.** It is friendly without being childish and clean without being clinical.

Load `Cabin` for everything; fall back to `system-ui, sans-serif`. The open
apertures keep counters from closing up at small sizes, the rounded stroke
endings echo our `2px` corners, and one family carries authority at heading
weights and stays calm at body weights, so no second typeface is needed.

### The type scale

A modular scale (ratio about 1.25). Sizes in `rem`, base `16px`. Map these to
Tailwind text utilities or extend the theme's `--text-*` tokens.

| Role         | Size            | Weight        | Colour      | When & why                                            |
| ------------ | --------------- | ------------- | ----------- | ----------------------------------------------------- |
| Display      | `2.441rem` 39px | 700 Bold      | `ink-900`   | One per page. The hero line. Authority on entry.      |
| H1           | `1.953rem` 31px | 700 Bold      | `ink-900`   | Page / section title. Strong, anchors the slab.       |
| H2           | `1.563rem` 25px | 600 SemiBold  | `ink-900`   | Subsection. Present, not shouting.                    |
| H3           | `1.25rem` 20px  | 600 SemiBold  | `ink-700`   | Minor heading, card titles. Steps back to ink-700.    |
| Body         | `1rem` 16px     | 400 Regular   | `ink-900`   | Default reading text. Cabin at its most comfortable.  |
| Body strong  | `1rem` 16px     | 600 SemiBold  | `ink-900`   | Inline emphasis. Weight, never colour, for emphasis.  |
| Small        | `0.8rem` 13px   | 400 Regular   | `ink-500`   | Captions, helper text, metadata. Quiet by design.     |
| Label / Caps | `0.8rem` 13px   | 600 SemiBold  | `ink-700`   | Eyebrows, table headers. Track `+0.04em`, uppercase.  |
| Button       | `1rem` 16px     | 600 SemiBold  | per button  | Action text. SemiBold to feel pressable, not flimsy.  |

### Weight, deliberately

Cabin gives us four working weights, **Regular 400, Medium 500, SemiBold 600,
Bold 700**, and we use them as a *system*, not a free-for-all.

- **400 Regular** for body and anything you read in sentences. The resting state.
- **500 Medium** for the lightest touch of emphasis when 600 is too loud; idle
  navigation.
- **600 SemiBold** is the workhorse of emphasis: headings below H1, buttons,
  labels, inline strong. *Reach for 600 before you reach for colour.*
- **700 Bold** for the top of the hierarchy only: Display and H1. Spend it twice
  per page at most.

**The discipline:** establish hierarchy with **size and weight first**, colour
second. A heading is big and bold because it is a heading, not because it is
orange. Save orange for things you can *touch*.

### Spacing and measure

- **Line height:** `1.5` for body, `1.2` for headings (`leading-relaxed` /
  `leading-tight`).
- **Measure:** `60–75ch` for running text (`max-w-prose`). Beyond that the eye
  loses the line.
- **Paragraph rhythm:** about `0.75em` between paragraphs, enough to separate,
  not enough to drift into an air gap.

## Components

Every component is white-grounded, named by a `1px` `white-300` border (never a
gap, never a drop shadow at rest), and earns its colour by its job. All radii are
`2px` (`rounded-sm`), per the airframe.

### Info box, *the yellow field*

The flagship. `bg-yellow-300`, `border border-white-300`, `text-ink-900` body, an
optional `font-semibold` label across the top. This is the one place a broad warm
fill is correct: it is information you want read first, and yellow's high
luminance keeps the dark text crisp on it. No shadow; it rests flush with the page.

### Buttons, *the orange spark*

| Variant       | Fill          | Text       | Border           | Use                                  |
| ------------- | ------------- | ---------- | ---------------- | ------------------------------------ |
| Primary       | `orange-500`  | `white-050`| none             | The one main action per view.        |
| Primary:hover | `orange-300` wash | `white-050` | —           | Warmth arrives on approach.          |
| Primary:active| `orange-600`  | `white-050`| —                | Depresses 1px + 0.98 scale.          |
| Secondary     | `white-050`   | `ink-900`  | `white-300` 1px  | Supporting actions.                  |
| Ghost         | transparent   | `orange-500` | none           | Tertiary / inline actions.           |

One primary per view; orange is scarce. Everything else steps down to white so
the single orange button reads instantly as *the* thing to do.

### Links

`text-orange-500`, no underline at rest, underline on hover. Orange because a link
is an action; the underline on hover is the small tangibility that says *this
responds to you.*

### Cards & sections

`bg-white-050` or `bg-white-100` surface, carved from the slab by `1px`
`white-300` borders sharing edges with their neighbours: no floating, no gaps.
Title in H3 `ink-700`, body in `ink-900`.

### Inputs

`bg-white-050` fill, `border border-white-300` at rest. On focus the border goes
`orange-500` and a `2px` orange ring blooms
(`focus-visible:outline-2 focus-visible:outline-orange-500`). Helper text below in
Small `ink-500`; error text in `orange-600` (our hottest orange doubles as the
alert, so no separate red breaks the warm family).

### Tables

Header row in Label/Caps `ink-700` on `white-100`. Zebra striping in `yellow-100`,
the faintest wash, just enough to lead the eye across a row. Active/selected row
steps up to `yellow-300`.

## Quick reference

**Colour, what each does and why**

| Use this              | For                                   | Because                                              |
| --------------------- | ------------------------------------- | ---------------------------------------------------- |
| `ink-900` / `700`     | Text and structure                    | The mature ground; carries meaning without shouting  |
| `white-300`           | `1px` borders                         | Names every element per the airframe                 |
| `white-100` / `050`   | Surfaces                              | Clean, cool stage for the warm colours               |
| `yellow-300`          | Info box fills, active rows           | Brightest fill that still holds sharp dark text      |
| `yellow-100`          | Hover / zebra washes                  | Friendliness at a whisper                            |
| `orange-500`          | Buttons, links, focus, *actions*      | Hot, advancing, weighty enough for white text        |
| `orange-600`          | Pressed states, errors                | Maximum heat for the strongest signals               |

> **Yellow says read it. Orange says touch it. White holds it all up.**

**Type, reach in this order**

1. **Size** for hierarchy (the scale above).
2. **Weight** for emphasis (600 before 700; 700 only for Display/H1).
3. **Colour** last, and only to mean *action* (orange), never to fake hierarchy.

> Cheery, confident, grounded. Bright where it informs, hot where it acts, clean
> white everywhere it holds.
