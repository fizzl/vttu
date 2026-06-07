/**
 * The VTTU logograph. The single orange "T" is the one spark in the mark. With
 * `spark`, the T gives a one-time pop as the page arrives; on hover it lifts a
 * hair, the small tangibility that says the mark is alive (see doc/dazzle.md).
 */
export function Wordmark({
  className = "",
  spark = false,
}: {
  className?: string;
  spark?: boolean;
}) {
  return (
    <span
      className={`group font-bold tracking-tight text-ink-900 ${className}`}
      aria-hidden="true"
    >
      V
      <span
        className={`inline-block text-orange-500 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transition-none ${
          spark ? "spark" : ""
        }`}
      >
        T
      </span>
      TU
    </span>
  );
}
