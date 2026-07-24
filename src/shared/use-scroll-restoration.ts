/**
 * useScrollRestoration — restore scroll position of an internal scroll container
 * across navigation.
 *
 * Browsers only auto-restore window scroll on back nav. When a screen uses an
 * internal `overflow-y-auto` div (most of this app), we have to save/restore
 * manually. This hook stashes `scrollTop` in sessionStorage keyed by the
 * provided key (typically `location.pathname + location.search`), restores it
 * on mount, and flushes again on unmount so the position is fresh when the
 * user comes back.
 *
 * Usage:
 *   const scrollRef = useScrollRestoration(location.pathname);
 *   return <div ref={scrollRef} className="overflow-y-auto">...</div>;
 */

import { useEffect, useLayoutEffect, useRef } from "react";

// Module-level Map — survives navigations within the SPA without serialization.
// Each route's last-known scrollTop is stored here so back-nav can restore it.
const scrollPositions = new Map<string, number>();

export function useScrollRestoration(key: string) {
  const ref = useRef<HTMLDivElement>(null);

  // Restore on mount with retry — content may still be loading when component
  // remounts, so scrollHeight is short and browser clamps scrollTop. Retry up
  // to 60 frames (~1 second) as cards/images fill in.
  useLayoutEffect(() => {
    const target = scrollPositions.get(key) ?? 0;
    if (target === 0) return;

    let attempts = 0;
    let cancelled = false;
    const tryRestore = () => {
      if (cancelled) return;
      const el = ref.current;
      if (!el) {
        if (++attempts < 60) requestAnimationFrame(tryRestore);
        return;
      }
      el.scrollTop = target;
      attempts++;
      if (el.scrollTop >= target - 2) return;
      if (attempts >= 60) return;
      requestAnimationFrame(tryRestore);
    };
    requestAnimationFrame(tryRestore);

    return () => { cancelled = true; };
  }, [key]);

  // Save on every scroll + on global pre-navigation events.
  // The pointerdown listener captures position BEFORE the morph card animation
  // can mess with the scroll element. pagehide handles browser tab close/reload.
  // We DON'T save in cleanup — by then the scroll element may be detached/
  // animating, and el.scrollTop reads 0, overwriting the good value captured
  // by pointerdown.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const save = () => {
      // Defensive: skip writing 0 if we already have a meaningful saved value.
      // This prevents an accidental zero-write during unmount from clobbering
      // the position captured by pointerdown.
      const next = el.scrollTop;
      if (next === 0 && (scrollPositions.get(key) ?? 0) > 0) return;
      scrollPositions.set(key, next);
    };
    el.addEventListener("scroll", save, { passive: true });
    document.addEventListener("pointerdown", save, { capture: true, passive: true });
    window.addEventListener("pagehide", save);
    return () => {
      el.removeEventListener("scroll", save);
      document.removeEventListener("pointerdown", save, { capture: true } as EventListenerOptions);
      window.removeEventListener("pagehide", save);
    };
  }, [key]);

  return ref;
}
