import Link from "next/link";

import { OrgInviteJoinStep } from "@/components/partners/org-invite-join-step";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import {
  checkOrgInviteLinkValidity,
  resolveOrgInviteLinkByToken,
} from "@/lib/partners/org-invites";

export const metadata = { title: "You've been invited · Pull" };

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;

  if (!isDatabaseConfigured()) {
    return <InviteError title="Service unavailable" description="Please try again later." />;
  }

  const link = await resolveOrgInviteLinkByToken(token);

  if (!link) {
    return (
      <InviteError
        title="This invite link is invalid."
        description="The link may have expired or been revoked. Ask your organizer for a fresh one."
      />
    );
  }

  const validity = checkOrgInviteLinkValidity(link);

  if (!validity.valid) {
    if (validity.reason === "seats_full") {
      return (
        <InviteError
          title="This invite link is full."
          description={`${link.organization.name} has reached its capacity. Contact your organizer.`}
        />
      );
    }
    return (
      <InviteError
        title={validity.reason === "expired" ? "This invite link has expired." : "This invite link is no longer active."}
        description="Ask your organizer for a new link."
      />
    );
  }

  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    return (
      <InviteShell>
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight leading-tight">
              You&apos;re invited
            </h1>
            <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
              Join <strong className="text-foreground">{link.organization.name}</strong> on Pull to
              access open source contribution opportunities and track your progress.
            </p>
          </div>
          <Link
            href={`/sign-in?next=${encodeURIComponent(`/invite/${token}`)}`}
            className="inline-block border border-ink bg-ink px-5 py-3 text-center font-mono text-sm text-[var(--background)] transition-colors hover:bg-ink/90"
          >
            Sign in to join →
          </Link>
          {link.seatCap !== null && (
            <p className="font-mono text-xs text-muted-foreground text-center">
              {link.seatCap - link.seatCount} spot{link.seatCap - link.seatCount !== 1 ? "s" : ""} remaining
            </p>
          )}
        </div>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <OrgInviteJoinStep
        rawToken={token}
        profile={{
          id: profile.id,
          username: profile.username,
          displayName: profile.displayName,
          avatar: profile.avatar ?? null,
        }}
        organization={link.organization}
        seatCap={link.seatCap}
        seatCount={link.seatCount}
      />
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-6 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        Pull // Invitation
      </p>
      {children}
    </div>
  );
}

function InviteError({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-6 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        Pull // Invitation
      </p>
      <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
      {description && (
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
