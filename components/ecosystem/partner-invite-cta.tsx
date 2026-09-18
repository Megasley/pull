import Link from "next/link";

import { Button } from "@/components/ui/button";

export type PartnerCtaState = "member" | "signed_in_non_member" | "signed_out";

type PartnerInviteCtaProps = {
  state: PartnerCtaState;
  orgSlug: string;
  orgName: string;
  /** Current page path, preserved as the sign-in redirect target. */
  pagePath: string;
};

/**
 * Membership-aware CTA reused wherever a partner page needs to route a
 * visitor toward their contribution experience without bypassing cohort
 * access control — the org invite link is never re-derivable from here.
 */
export function PartnerInviteCta({ state, orgSlug, orgName, pagePath }: PartnerInviteCtaProps) {
  if (state === "member") {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs text-muted-foreground">
          You&apos;re a member of {orgName} on Pull.
        </p>
        <Button asChild className="w-fit">
          <Link href={`/partners/${orgSlug}`}>
            Continue your contribution journey →
          </Link>
        </Button>
      </div>
    );
  }

  const explainer = `Available to qualified ${orgName} participants. Already part of ${orgName}? Use the invitation link from your program to join Pull.`;

  if (state === "signed_in_non_member") {
    return (
      <p className="max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
        {explainer}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-md font-mono text-xs leading-relaxed text-muted-foreground">
        {explainer}
      </p>
      <Button asChild variant="outline" className="w-fit">
        <Link href={`/sign-in?next=${encodeURIComponent(pagePath)}`}>
          Sign in to check your access
        </Link>
      </Button>
    </div>
  );
}
