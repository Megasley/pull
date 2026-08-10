import { cn } from "@/lib/utils";
import type { OrganizationDifficulty } from "@/lib/organizations/types";

export const difficultyLabel: Record<OrganizationDifficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const difficultyClassName: Record<OrganizationDifficulty, string> = {
  beginner: "border-ink/20 bg-signal text-ink",
  intermediate: "border-ink/30 bg-ink/10 text-ink",
  advanced: "border-ink bg-ink text-[var(--background)]",
};

export function OrganizationSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("scroll-mt-20 border-t border-border pt-12", className)}
    >
      <div className="mb-8 max-w-3xl">
        <p className="tech-eyebrow">{eyebrow}</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
