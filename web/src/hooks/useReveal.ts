import { useEffect, useRef, useState } from "react";

type RevealOptions = {
  /** Reveal once and stay revealed (default). Set false to re-trigger on exit. */
  once?: boolean;
  /** Margin around the viewport for the trigger (CSS rootMargin syntax). */
  rootMargin?: string;
};

/**
 * Reveals an element when it scrolls into view. Returns a ref to attach and a
 * `visible` flag to drive the entry transition (see doc/dazzle.md).
 *
 * Under prefers-reduced-motion the element is revealed immediately and never
 * observed: motion is a gift, never a tax.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(options: RevealOptions = {}) {
  const { once = true, rootMargin = "0px 0px -10% 0px" } = options;
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { rootMargin, threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin]);

  return { ref, visible };
}
