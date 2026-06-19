import { useEffect, useRef } from "react";

/**
 * Attach to a section ref. When the section enters the viewport:
 * - If no staggerSelector: adds "nm-revealed" to the section itself.
 * - If staggerSelector: adds "nm-revealed" (with increasing delay) to each
 *   matching child; the section container is left un-animated so it stays
 *   visible and the cards cascade inside it.
 */
export function useReveal(staggerSelector?: string) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const trigger = () => {
      if (staggerSelector) {
        el.querySelectorAll<HTMLElement>(staggerSelector).forEach((child, i) => {
          child.style.transitionDelay = reduced ? "0ms" : `${i * 120}ms`;
          child.classList.add("nm-revealed");
        });
      } else {
        el.classList.add("nm-revealed");
      }
    };

    if (reduced) {
      trigger();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        trigger();
        observer.unobserve(el);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [staggerSelector]);

  return ref;
}
