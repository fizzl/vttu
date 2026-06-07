import { principles } from "../content";

/**
 * The principle cards, carved from the slab by shared 1px seams (no gaps, no
 * float — see doc/aerodynamics.md). Dazzle lives in the hover: a card warms to
 * the faint yellow wash under the hand. Background only, so the seams never move.
 */
export function PrincipleGrid() {
  return (
    <div className="grid gap-px border border-white-300 bg-white-300 sm:grid-cols-2">
      {principles.map((p) => (
        <article
          key={p.title}
          className="bg-white-050 p-6 transition-colors duration-200 hover:bg-yellow-100 motion-reduce:transition-none"
        >
          <h3 className="text-[1.25rem] font-semibold text-ink-700">{p.title}</h3>
          <p className="mt-2 leading-relaxed text-ink-900">{p.body}</p>
        </article>
      ))}
    </div>
  );
}
