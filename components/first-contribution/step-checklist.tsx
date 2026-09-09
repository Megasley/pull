"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Local, ephemeral checklist state — intentionally not persisted. This is a
 *  scratch aid for working through a step's sub-tasks in one sitting; the
 *  durable, resumable signal is the step-level "Mark step complete" action
 *  (see lib/first-contribution/progress.ts), which these checkboxes don't
 *  affect. */
export function StepChecklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const isChecked = Boolean(checked[index]);
        return (
          <li key={item}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() =>
                  setChecked((prev) => ({ ...prev, [index]: !prev[index] }))
                }
                className="mt-0.5 size-4 shrink-0 accent-foreground"
              />
              <span
                className={cn(
                  "leading-relaxed",
                  isChecked && "text-muted-foreground line-through",
                )}
              >
                {item}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
