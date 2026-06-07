import type { ReactNode } from "react";
import type { Accent } from "./accents";

type EyebrowProps = {
  accent: Accent;
  /** Drives the marker's draw-in, shared with the section's reveal. */
  visible: boolean;
  children: ReactNode;
};

/**
 * The Label/Caps eyebrow (see doc/dazzle.md), prefixed by a small accent marker
 * that draws itself in when the section reveals: a bar grows from the left, a
 * dot pops. The marker is the section's tiny signature.
 */
export function Eyebrow({ accent, visible, children }: EyebrowProps) {
  const motion =
    "shrink-0 transition-transform duration-500 ease-out motion-reduce:transition-none";
  const marker =
    accent.shape === "bar"
      ? `h-[3px] w-6 origin-left rounded-sm ${accent.marker} ${
          visible ? "scale-x-100" : "scale-x-0"
        }`
      : `h-[7px] w-[7px] rounded-full ${accent.marker} ${
          visible ? "scale-100" : "scale-0"
        }`;

  return (
    <span className="flex items-center gap-2">
      <span aria-hidden="true" className={`${motion} ${marker}`} />
      <span className="text-[0.8rem] font-semibold uppercase tracking-[0.04em] text-ink-700">
        {children}
      </span>
    </span>
  );
}
