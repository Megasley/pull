"use client";

import { Children, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "clip" | "fade" | "zoom";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  variant?: RevealVariant;
  /** Fraction of element that must be visible (0-1). */
  threshold?: number;
};

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const show = () => setVisible(true);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          show();
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.88 && rect.bottom > 0) {
      show();
    }

    return () => observer.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
}

export function Reveal({
  children,
  className,
  delayMs = 0,
  variant = "up",
  threshold,
}: RevealProps) {
  const { ref, visible } = useInView(threshold);

  return (
    <div
      ref={ref}
      data-visible={visible ? "true" : "false"}
      className={cn("reveal", `reveal-${variant}`, className)}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}

type RevealStaggerProps = {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  /** Stagger between each direct child in ms. */
  stepMs?: number;
  variant?: RevealVariant;
  threshold?: number;
};

/** Reveals children together when the group enters view, with staggered delay. */
export function RevealStagger({
  children,
  className,
  itemClassName,
  stepMs = 90,
  variant = "up",
  threshold,
}: RevealStaggerProps) {
  const { ref, visible } = useInView(threshold);
  const items = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {items.map((child, index) => (
        <div
          key={
            typeof child === "object" && child !== null && "key" in child && child.key != null
              ? String(child.key)
              : index
          }
          data-visible={visible ? "true" : "false"}
          className={cn("reveal", `reveal-${variant}`, itemClassName)}
          style={{ transitionDelay: `${index * stepMs}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
