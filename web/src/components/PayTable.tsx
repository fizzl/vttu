import { payRows } from "../content";

/**
 * The pay table. On hover a row warms to the faintest yellow wash, just enough
 * to lead the eye across it. Background only — the table never shifts.
 */
export function PayTable() {
  return (
    <div className="overflow-x-auto border border-white-300">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-white-100 text-[0.8rem] uppercase tracking-[0.04em] text-ink-700">
            <th className="px-3 py-2 font-semibold">Seutu</th>
            <th className="px-3 py-2 font-semibold">Peruspalkka</th>
            <th className="px-3 py-2 font-semibold">Indeksikorotus</th>
            <th className="px-3 py-2 font-semibold">Yhteensä / kk</th>
          </tr>
        </thead>
        <tbody>
          {payRows.map((row) => (
            <tr
              key={row[0]}
              className="border-t border-white-300 transition-colors duration-200 hover:bg-yellow-100 motion-reduce:transition-none"
            >
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`px-3 py-2 text-ink-900 ${i === 0 ? "font-semibold" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
