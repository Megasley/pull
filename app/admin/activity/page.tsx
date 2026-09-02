import Link from "next/link";

import { getAdminActivitySummary, listActivityFeed } from "@/lib/admin/activity";
import { MILESTONE_ICONS, MILESTONE_LABELS } from "@/components/admin/milestone-icon";
import { PageHeader } from "@/components/design-system";
import { formatRelativeTimestamp } from "@/lib/milestones/format";
import { MILESTONE_TYPES, type MilestoneType } from "@/lib/milestones/types";
import { isDatabaseConfigured } from "@/lib/db/env";
import { cn } from "@/lib/utils";

export const metadata = { title: "Activity · Admin" };

const PAGE_SIZE = 25;

const DATE_RANGES = [
  { value: "today", label: "Today", days: 1 },
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "all", label: "All time", days: null },
] as const;

type DateRangeValue = (typeof DATE_RANGES)[number]["value"];

function isMilestoneType(value: string | undefined): value is MilestoneType {
  return Boolean(value) && (MILESTONE_TYPES as string[]).includes(value as string);
}

function isDateRange(value: string | undefined): value is DateRangeValue {
  return DATE_RANGES.some((range) => range.value === value);
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; range?: string; page?: string }>;
}) {
  const params = await searchParams;
  const milestoneType = isMilestoneType(params.type) ? params.type : undefined;
  const range: DateRangeValue = isDateRange(params.range) ? params.range : "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  if (!isDatabaseConfigured()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="admin // activity"
          title="Live activity"
          description="Database is not configured."
        />
      </div>
    );
  }

  const now = new Date();
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
  const weekSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const selectedRange = DATE_RANGES.find((item) => item.value === range) ?? DATE_RANGES[3];
  const since =
    selectedRange.days != null
      ? new Date(now.getTime() - selectedRange.days * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

  const [summary, feed] = await Promise.all([
    getAdminActivitySummary({ todaySince: startOfToday, weekSince }),
    listActivityFeed({
      milestoneType,
      since,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(feed.total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // activity"
        title="Live activity"
        description="Pull's operational pulse — new builders, opportunities explored, and contribution milestones as they happen."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="New developers today" value={summary.newDevelopersToday} />
        <SummaryStat label="New developers this week" value={summary.newDevelopersThisWeek} />
        <SummaryStat
          label="Opportunities explored today"
          value={summary.opportunitiesExploredToday}
        />
        <SummaryStat label="PRs opened today" value={summary.prsOpenedToday} />
        <SummaryStat label="PRs submitted today" value={summary.prsSubmittedToday} />
        <SummaryStat label="PRs merged today" value={summary.prsMergedToday} />
        <SummaryStat label="Milestones achieved today" value={summary.milestonesAchievedToday} />
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex flex-wrap gap-1.5">
          <FilterLink
            label="All types"
            active={!milestoneType}
            href={buildQuery({ range, page: undefined })}
          />
          {MILESTONE_TYPES.map((type) => (
            <FilterLink
              key={type}
              label={MILESTONE_LABELS[type]}
              active={milestoneType === type}
              href={buildQuery({ type, range, page: undefined })}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DATE_RANGES.map((item) => (
            <FilterLink
              key={item.value}
              label={item.label}
              active={range === item.value}
              href={buildQuery({ type: milestoneType, range: item.value, page: undefined })}
            />
          ))}
        </div>
      </div>

      <ol className="mt-2 divide-y divide-border">
        {feed.items.length === 0 ? (
          <li className="py-10 text-center text-sm text-muted-foreground">
            No milestones in this range yet.
          </li>
        ) : (
          feed.items.map((item) => {
            const Icon = MILESTONE_ICONS[item.milestoneType];
            return (
              <li key={item.id} className="flex items-start gap-3 py-3.5">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-border bg-card">
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Link
                      href={`/admin/users/${item.userId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.displayName}
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {formatRelativeTimestamp(item.achievedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {MILESTONE_LABELS[item.milestoneType]}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    {item.repository ? <span>{item.repository}</span> : null}
                    {item.pullRequestUrl ? (
                      <a
                        href={item.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View PR{item.pullRequestNumber ? ` #${item.pullRequestNumber}` : ""}
                      </a>
                    ) : null}
                    <Link
                      href={`/admin/users/${item.userId}`}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      View builder
                    </Link>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ol>

      {totalPages > 1 ? (
        <nav
          className="mt-6 flex items-center justify-between border-t border-border pt-4"
          aria-label="Activity feed pagination"
        >
          <PageLink
            label="← Newer"
            page={page - 1}
            disabled={page <= 1}
            milestoneType={milestoneType}
            range={range}
          />
          <span className="font-mono text-[11px] text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <PageLink
            label="Older →"
            page={page + 1}
            disabled={page >= totalPages}
            milestoneType={milestoneType}
            range={range}
          />
        </nav>
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-none border border-border bg-card p-4">
      <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function FilterLink({
  label,
  active,
  href,
}: {
  label: string;
  active: boolean;
  href: string;
}) {
  return (
    <Link
      href={`/admin/activity${href}`}
      aria-current={active ? "true" : undefined}
      className={cn(
        "border px-2.5 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors",
        active
          ? "border-ink bg-ink text-[var(--background)]"
          : "border-border text-muted-foreground hover:border-ink/40 hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}

function PageLink({
  label,
  page,
  disabled,
  milestoneType,
  range,
}: {
  label: string;
  page: number;
  disabled: boolean;
  milestoneType: MilestoneType | undefined;
  range: DateRangeValue;
}) {
  if (disabled) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground/40 uppercase">{label}</span>
    );
  }

  return (
    <Link
      href={`/admin/activity${buildQuery({ type: milestoneType, range, page: String(page) })}`}
      className="font-mono text-[11px] text-muted-foreground uppercase hover:text-foreground"
    >
      {label}
    </Link>
  );
}
