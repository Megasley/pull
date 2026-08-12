import { OrganizationSection } from "@/components/organizations/organization-section";
import type { OrganizationProfile } from "@/lib/organizations/types";

type OrganizationAboutProps = {
  organization: OrganizationProfile;
};

export function OrganizationAbout({ organization }: OrganizationAboutProps) {
  return (
    <OrganizationSection
      id="about"
      eyebrow="about // mission"
      title={`About ${organization.name}`}
      description={organization.description}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-background p-5">
          <h3 className="text-sm font-semibold tracking-tight">Mission</h3>
          <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">
            {organization.mission}
          </p>
        </div>
        <div className="border border-border bg-background p-5">
          <h3 className="text-sm font-semibold tracking-tight">Why contribute</h3>
          <ul className="mt-3 space-y-2.5">
            {organization.whyContribute.map((reason) => (
              <li
                key={reason}
                className="flex gap-2 font-mono text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 bg-signal" aria-hidden />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </OrganizationSection>
  );
}
