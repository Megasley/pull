import { CheckCircle2 } from "lucide-react";

/**
 * End-of-lesson summary: the few ideas a learner should keep.
 *
 * <Recap points={["First takeaway", "Second takeaway"]} />
 */
export function Recap({ points }: { points: string[] }) {
  return (
    <aside className="not-prose my-8 border border-ink bg-signal/15 px-5 py-4 shadow-[var(--shadow-off-sm)]">
      <p className="tech-eyebrow mb-3">recap // what to remember</p>
      <ul className="space-y-2">
        {points.map((point) => (
          <li
            key={point}
            className="flex gap-2.5 text-sm leading-relaxed text-foreground"
          >
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
