# Aerodynamics

A UX design philosophy. The premise is simple: a page is a physical object, and a
well-designed page is one that falls cleanly. Every visual decision is judged by a
single question — *does this help the page drop straight and stable through the air?*

Drag is the enemy. Drag is anything that catches wind: a needless gap, a soft edge,
a shadow with nothing under it. We design the page like a falling plate, not a
fluttering leaf.

## Principles

### 1. Minimally rounded corners

Sharp corners cut the air. We round only enough to avoid drawing blood — a 2px
radius, no more. Large radii are rounded bulges that create turbulence at the
leading edge and slow the descent. A corner is a place where two surfaces meet,
not a decoration.

```
radius: 2px        /* the whole vocabulary */
```

### 2. Borders as element indicators

An element earns a `1px` border. That border is the *only* thing announcing where
one element ends and the next begins — no soft halos, no background tint games, no
whitespace moats. The border is the skin of the element. It is hard, thin, and
flush with the airflow. If you cannot see where a thing starts, give it a border,
not a shadow and not a gap.

### 3. Drop shadows only when elements actually float

A shadow is a physical claim: *this surface is above that one.* You may cast a
shadow only when an element is genuinely lifted off the page and moving
independently through the air — a menu mid-deploy, a dialog caught between the user
and the page, a card being dragged. A resting element casts no shadow, because a
resting element is flush with the body and shares its airflow. Decorative shadows
are lies about altitude, and the page will tumble for them.

### 4. No air gaps

Gaps are pockets where wind gets in. Adjacent elements sit border-to-border,
sharing edges. Padding lives *inside* an element to give its content room; margin
between elements trends to zero. The layout is a soldered circuit board, not a
scatter of tiles. Where two regions meet, they meet on a shared `1px` line — one
seam, not two edges with a void between them.

### 5. The page is monolithic

There is one body, not an archipelago of floating panels. Sections are carved out
of a single slab by borders, the way rooms are carved out of a house by walls — the
house does not float apart into rooms. A monolithic page has one center of mass,
one moment of inertia, one continuous skin meeting the air. Cards drifting on a
gray sea is the failure mode: each tile becomes its own little parachute, and the
composition flutters.

## The freefall test

Assemble the page, then drop it.

- **Rounded, bulgy corners** → turbulence at the edges → it yaws.
- **Shadows under resting elements** → phantom surfaces grabbing air → it pitches.
- **Air gaps between sections** → wind pockets, uneven drag → it spins.
- **Floating panels** → many small parachutes → it flutters and stalls.

A page built to this philosophy has a flat profile, a hard continuous skin, sharp
edges that shed air, and a single mass. Released into freefall, it falls flat,
fast, and dead stable — no flutter, no tumble, no yaw. That stability is not a
metaphor for good design. It *is* the test. If the page would tumble, it is
over-decorated; strip it until it falls straight.

## Quick reference

| Decision        | Aerodynamic rule                                    |
| --------------- | --------------------------------------------------- |
| Corners         | `2px` radius, never more                            |
| Element edges   | `1px` border — the primary indicator                |
| Shadows         | Only on elements genuinely floating above the page  |
| Spacing         | Padding inside, margins → 0, no gaps between elements|
| Composition     | One monolithic slab, sections divided by borders    |

> Design for the fall. A page that drops straight is a page with nothing left to
> catch the wind.
