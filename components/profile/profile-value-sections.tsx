import Link from "next/link";

import { ExternalLinkIcon } from "@/components/icons/outline-icons";
import {
  formatProfileDate,
  formatRelativeActivity,
} from "@/lib/profile/public-insights";
import type {
  ProfileCollaborationCta,
  PublicContributionMix,
  PublicProfileActivity,
} from "@/types/profile";
import { cn } from "@/lib/utils";

import { PortfolioSection } from "./portfolio-sections";

type ProfileActivityStripProps = {
  activity: PublicProfileActivity;
};

export function ProfileActivityStrip({ activity }: ProfileActivityStripProps) {
  const lastSeen = formatRelativeActivity(activity.lastActiveAt);
  const lastContribution = formatRelativeActivity(activity.lastContributionAt);
  const memberSince = formatProfileDate(activity.memberSince);

  const items = [
    activity.activeRecently
      ? { label: "Status", value: "Active this week", accent: true }
      : lastSeen
        ? { label: "Last active", value: lastSeen, accent: false }
        : null,
    activity.streak.current > 0
      ? {
          label: "Streak",
          value: `${activity.streak.current} day${activity.streak.current === 1 ? "" : "s"}`,
          accent: false,
        }
      : activity.streak.longest > 0
        ? {
            label: "Best streak",
            value: `${activity.streak.longest} days`,
            accent: false,
          }
        : null,
    lastContribution
      ? { label: "Last contribution", value: lastContribution, accent: false }
      : null,
    { label: "On Pull since", value: memberSince, accent: false },
  ].filter(Boolean) as Array<{ label: string; value: string; accent: boolean }>;

  if (items.length === 0) return null;

  return (
    <div className="profile-activity-strip">
      {items.map((item) => (
        <div key={item.label} className="profile-activity-item">
          <p className="profile-activity-label">{item.label}</p>
          <p
            className={cn(
              "profile-activity-value",
              item.accent && "profile-activity-value-accent",
            )}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

type ProfileCollaborationCtasProps = {
  ctas: ProfileCollaborationCta[];
};

export function ProfileCollaborationCtas({ ctas }: ProfileCollaborationCtasProps) {
  if (ctas.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {ctas.map((cta) => (
        <div key={cta.id} className="profile-collab-cta">
          <div className="min-w-0 flex-1">
            <p className="profile-collab-label">{cta.label}</p>
            <p className="profile-collab-message">{cta.message}</p>
          </div>
          <Link
            href={cta.href}
            className="profile-collab-action"
            {...(cta.external ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {cta.actionLabel}
            {cta.external ? <ExternalLinkIcon className="size-3" /> : null}
          </Link>
        </div>
      ))}
    </div>
  );
}

type ProfileContributionMixSectionProps = {
  mix: PublicContributionMix;
};

function MixBar({
  label,
  count,
  percent,
}: {
  label: string;
  count: number;
  percent: number;
}) {
  return (
    <div className="profile-mix-row">
      <div className="flex items-baseline justify-between gap-3">
        <p className="profile-mix-label">{label}</p>
        <p className="profile-mix-meta">
          {count} · {percent}%
        </p>
      </div>
      <div className="profile-mix-track">
        <div className="profile-mix-fill" style={{ width: `${Math.max(percent, 4)}%` }} />
      </div>
    </div>
  );
}

export function ProfileContributionMixSection({ mix }: ProfileContributionMixSectionProps) {
  const hasPrTypes = mix.prTypes.length > 0;
  const hasActivityTypes = mix.activityTypes.length > 0;

  if (!hasPrTypes && !hasActivityTypes) return null;

  return (
    <PortfolioSection
      title="Contribution mix"
      description="How this builder contributes — merged PR types and overall activity."
      profile
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {hasPrTypes ? (
          <div className="profile-mix-panel">
            <p className="profile-mix-heading">Merged PR types</p>
            <div className="space-y-3">
              {mix.prTypes.map((item) => (
                <MixBar key={item.label} {...item} />
              ))}
            </div>
          </div>
        ) : null}
        {hasActivityTypes ? (
          <div className="profile-mix-panel">
            <p className="profile-mix-heading">Activity breakdown</p>
            <div className="space-y-3">
              {mix.activityTypes.map((item) => (
                <MixBar key={item.label} {...item} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PortfolioSection>
  );
}
