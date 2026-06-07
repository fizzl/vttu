import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  /** Steps the surface up to the brightest white. Defaults to the resting body. */
  surface?: boolean;
  children: ReactNode;
};

/**
 * A section carved out of the page slab by a 1px top border (see
 * doc/aerodynamics.md). Padding lives inside; no margins, no gaps.
 */
export function Section({ id, eyebrow, title, surface = false, children }: SectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-4 border-t border-white-300 px-6 py-10 sm:px-10 ${
        surface ? "bg-white-050" : "bg-white-100"
      }`}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-1 text-[1.563rem] font-semibold leading-tight text-ink-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-ink-700">
      {children}
    </span>
  );
}
