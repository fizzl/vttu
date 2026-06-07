/**
 * Per-section accent markers. Cycled by index so each section reads a touch
 * differently from the one before it (see doc/dazzle.md). Yellow leads — it is
 * the "read me" field colour — with orange spent sparingly (one in four) so it
 * stays the scarce spark, and a calm ink variant for breathing room.
 */
export type Accent = {
  /** Tailwind background utility for the marker. */
  marker: string;
  /** Marker silhouette: a growing bar or a popping dot. */
  shape: "bar" | "dot";
};

export const accents: Accent[] = [
  { marker: "bg-yellow-500", shape: "bar" },
  { marker: "bg-orange-500", shape: "dot" },
  { marker: "bg-yellow-300", shape: "bar" },
  { marker: "bg-ink-700", shape: "dot" },
];

export function accentAt(index: number): Accent {
  return accents[index % accents.length];
}
