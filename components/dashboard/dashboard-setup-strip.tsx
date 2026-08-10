import Link from "next/link";
import { ArrowRight, GitBranch, Hammer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardSetupItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: "github" | "hammer" | "branch";
};

type DashboardSetupStripProps = {
  items: DashboardSetupItem[];
  className?: string;
};

const ICONS = {
  github: GitBranch,
  hammer: Hammer,
  branch: GitBranch,
} as const;

export function DashboardSetupStrip({ items, className }: DashboardSetupStripProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("border border-ink/20 bg-signal/10 p-4 sm:p-5", className)}
      aria-label="Setup checklist"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-ink uppercase">
            setup // next steps
          </p>
          <p className="mt-1 max-w-xl font-mono text-xs text-muted-foreground">
            Finish these once — empty dashboard cards stay hidden until you have real
            activity.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <li
              key={item.id}
              className="flex flex-col border border-border bg-background p-4"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="mt-4 w-fit">
                <Link href={item.href}>
                  {item.actionLabel}
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
