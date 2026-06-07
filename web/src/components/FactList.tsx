import { facts } from "../content";

/**
 * Key/value facts as a definition list. Each row warms to the faint yellow wash
 * on hover, leading the eye across the pair without moving a single seam.
 */
export function FactList() {
  return (
    <dl className="divide-y divide-white-300 border border-white-300">
      {facts.map(([key, val]) => (
        <div
          key={key}
          className="group grid sm:grid-cols-[16rem_1fr] sm:divide-x sm:divide-white-300"
        >
          <dt className="bg-white-100 px-3 py-2 font-semibold text-ink-700 transition-colors duration-200 group-hover:bg-yellow-100 motion-reduce:transition-none">
            {key}
          </dt>
          <dd className="bg-white-050 px-3 py-2 text-ink-900 transition-colors duration-200 group-hover:bg-yellow-100 motion-reduce:transition-none">
            {val}
          </dd>
        </div>
      ))}
    </dl>
  );
}
