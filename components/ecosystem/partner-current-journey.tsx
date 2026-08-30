import { Badge } from "@/components/ui/badge";
import { PartnerInviteCta, type PartnerCtaState } from "@/components/ecosystem/partner-invite-cta";
import {
  PARTNER_JOURNEY_STATUS_LABELS,
  type PartnerJourney,
} from "@/lib/ecosystem/partners";

const STATUS_VARIANT: Record<PartnerJourney["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  applications_closed: "secondary",
  coming_soon: "outline",
};

type PartnerCurrentJourneyProps = {
  journey: PartnerJourney;
  /** Admin-configured org skills (falls back to the static journey.skills if the org has none yet). */
  skills: string[];
  orgSlug: string;
  orgName: string;
  ctaState: PartnerCtaState;
  pagePath: string;
};

export function PartnerCurrentJourney({
  journey,
  skills,
  orgSlug,
  orgName,
  ctaState,
  pagePath,
}: PartnerCurrentJourneyProps) {
  return (
    <div className="border border-border p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold tracking-tight">{journey.name}</h3>
        <Badge variant={STATUS_VARIANT[journey.status]} className="text-[10px]">
          {PARTNER_JOURNEY_STATUS_LABELS[journey.status]}
        </Badge>
      </div>

      <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
        {journey.summary}
      </p>

      {skills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wide"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-border pt-6">
        <PartnerInviteCta
          state={ctaState}
          orgSlug={orgSlug}
          orgName={orgName}
          pagePath={pagePath}
          variant="journey"
        />
      </div>
    </div>
  );
}
