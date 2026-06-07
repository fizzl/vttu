/** The VTTU logograph. The single orange "T" is the one spark in the mark. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight text-ink-900 ${className}`} aria-hidden="true">
      V<span className="text-orange-500">T</span>TU
    </span>
  );
}
