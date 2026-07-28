"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return true;
}

export function ScrollProgress() {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reduceMotion]);

  if (reduceMotion) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 right-0 left-0 z-[60] h-0.5 bg-transparent"
    >
      <div
        className="h-full origin-left bg-ink transition-[width] duration-75 ease-out"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
