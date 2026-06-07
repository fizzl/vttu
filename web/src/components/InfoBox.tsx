import { useReveal } from "../hooks/useReveal";

/**
 * Info box: the flagship yellow field. It deliberately breaks aerodynamics
 * (doc/aerodynamics.md). The wrapper spans the full slab width and is shoved
 * right by the overflow amount, so the box is indented from the slab's left edge
 * by the same ~10% it spills past the right edge into the page background.
 *
 * The drop shadow must land ONLY on the backmost page background (the desk),
 * never on the slab. There is no clean CSS way to clip a shadow to "outside the
 * slab", so we use a shadow-only div: a sibling sized to the overflow strip,
 * painted under the box, whose only job is to cast the shadow out onto the desk.
 * The opaque yellow box covers the strip itself and the inward shadow; only the
 * outward spill, which is over the desk, shows. The exception strengthens the
 * rule.
 *
 * Dazzle: as the box enters view it fades up (fade only — its transform slot is
 * spent on the spill offset) and a single light sweeps across the yellow once.
 */
export function InfoBox() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="border-t border-white-300 bg-white-100 py-10">
      <div
        ref={ref}
        data-visible={visible}
        className="reveal-fade relative w-full translate-x-[5%]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-[5%] rounded-sm shadow-[7px_8px_12px_4px_rgba(26,28,32,0.25)]"
        />
        <div className="relative overflow-hidden rounded-sm border border-white-300 bg-yellow-300 px-4 py-3">
          <span aria-hidden="true" data-run={visible} className="shimmer" />
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-ink-900">
            Mee VTTU töihin!
          </span>
          <p className="mt-1 text-ink-900">
            Internetissä oletkin saattanut törmätä tähän iloiseen hihkaisuun! Olet ehkä törmännyt
            ihka aitoon VTTU-toimihenkilöön! Me VTTU:lla haluamme, että kaikki menee{" "}
            <strong className="font-semibold">VTTU töihin</strong>!
          </p>
        </div>
      </div>
    </section>
  );
}
