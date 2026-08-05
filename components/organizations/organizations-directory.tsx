import { OrganizationCard } from "@/components/organizations/organization-card";
import { EmptyState } from "@/components/design-system";
import type { OrganizationDirectoryCard } from "@/lib/organizations/catalog";

type OrganizationsDirectoryProps = {
  organizations: OrganizationDirectoryCard[];
};

export function OrganizationsDirectory({
  organizations,
}: OrganizationsDirectoryProps) {
  if (organizations.length === 0) {
    return (
      <EmptyState
        title="No organizations yet"
        description="Community organization profiles will appear here as Pull indexes public ecosystems."
      />
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((organization) => (
        <li key={organization.slug}>
          <OrganizationCard organization={organization} />
        </li>
      ))}
    </ul>
  );
}
