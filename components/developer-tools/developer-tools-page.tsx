"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useMemo, useTransition } from "react";

import { EmptyState } from "@/components/design-system";
import { DeveloperToolCard } from "@/components/developer-tools/developer-tool-card";
import { DeveloperToolFilters } from "@/components/developer-tools/developer-tool-filters";
import { DeveloperToolSearch } from "@/components/developer-tools/developer-tool-search";
import type {
  DeveloperTool,
  DeveloperToolCategory,
  DeveloperToolFilter,
} from "@/lib/developer-tools";

type DeveloperToolsPageClientProps = {
  tools: DeveloperTool[];
  categories: DeveloperToolCategory[];
  initialQuery: string;
  initialCategory: DeveloperToolFilter;
};

export function DeveloperToolsPageClient({
  tools,
  categories,
  initialQuery,
  initialCategory,
}: DeveloperToolsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const query = searchParams.get("q") ?? initialQuery;
  const categoryParam = searchParams.get("category");
  const category: DeveloperToolFilter =
    categoryParam === "All" ||
    (categoryParam !== null &&
      categories.includes(categoryParam as DeveloperToolCategory))
      ? (categoryParam as DeveloperToolFilter)
      : initialCategory;

  const deferredQuery = useDeferredValue(query);

  const pushState = useCallback(
    (next: { q?: string; category?: DeveloperToolFilter }) => {
      const params = new URLSearchParams();
      const q = next.q ?? "";
      const cat = next.category ?? "All";
      if (q.trim()) params.set("q", q.trim());
      if (cat !== "All") params.set("category", cat);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/developer-tools?${qs}` : "/developer-tools");
      });
    },
    [router],
  );

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return tools.filter((tool) => {
      if (category !== "All" && tool.category !== category) return false;
      if (!q) return true;
      const haystack = [tool.name, tool.description, tool.category, ...tool.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [tools, deferredQuery, category]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DeveloperToolSearch
          value={query}
          disabled={pending}
          onChange={(q) => pushState({ q, category })}
        />
      </div>

      <DeveloperToolFilters
        value={category}
        categories={categories}
        disabled={pending}
        onChange={(next) => pushState({ q: query, category: next })}
      />

      {visible.length === 0 ? (
        <EmptyState
          title="No tools found."
          description="Try adjusting your filters."
          actionLabel="Clear filters"
          onAction={() => pushState({ q: "", category: "All" })}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tool) => (
            <li key={tool.id}>
              <DeveloperToolCard tool={tool} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
