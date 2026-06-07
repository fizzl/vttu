import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";
import { Eyebrow } from "./Eyebrow";
import { accentAt } from "./accents";

type SectionProps = {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  /** Index into the accent cycle, so each section differs from its neighbour. */
  accent?: number;
  /** Steps the surface up to the brightest white. Defaults to the resting body. */
  surface?: boolean;
  children: ReactNode;
};

/**
 * A section carved out of the page slab by a 1px top border (see
 * doc/aerodynamics.md). The slab frame stays put; only the content inside rises
 * and fades in, so the seams never break and nothing flutters loose.
 */
export function Section({
  id,
  eyebrow,
  title,
  accent = 0,
  surface = false,
  children,
}: SectionProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section
      id={id}
      className={`scroll-mt-4 border-t border-white-300 px-6 py-10 sm:px-10 ${
        surface ? "bg-white-050" : "bg-white-100"
      }`}
    >
      <div ref={ref} data-visible={visible} className="reveal">
        <Eyebrow accent={accentAt(accent)} visible={visible}>
          {eyebrow}
        </Eyebrow>
        <h2 className="mt-2 text-[1.563rem] font-semibold leading-tight text-ink-900">
          {title}
        </h2>
        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}
