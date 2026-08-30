"use client";

import { deletePartnerOrgAction } from "@/app/actions/partners";
import { Button } from "@/components/ui/button";

type Props = {
  orgId: string;
  orgName: string;
};

export function DeletePartnerOrgButton({ orgId, orgName }: Props) {
  return (
    <form
      action={deletePartnerOrgAction.bind(null, orgId)}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Delete ${orgName}? This permanently removes its invite link, members, skills, and opportunities. This cannot be undone.`,
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" size="sm">
        Delete organization
      </Button>
    </form>
  );
}
