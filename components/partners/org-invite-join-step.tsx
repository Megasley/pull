"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { redeemOrgInviteLinkAction } from "@/app/actions/org-invite-flow";
import { Button } from "@/components/ui/button";

type Props = {
  rawToken: string;
  profile: { id: string; username: string; displayName: string; avatar: string | null };
  organization: { name: string; slug: string };
  seatCap: number | null;
  seatCount: number;
};

export function OrgInviteJoinStep({ rawToken, profile, organization, seatCap, seatCount }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seatsRemaining = seatCap !== null ? seatCap - seatCount : null;

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await redeemOrgInviteLinkAction(rawToken);
      if (result.ok) {
        router.push(`/partners/${organization.slug}`);
      } else if (result.reason === "already_member") {
        router.push(`/partners/${organization.slug}`);
      } else {
        setError(
          result.reason === "seats_full"
            ? "This invite link has reached its capacity."
            : "Something went wrong. Please try again.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          You&apos;re invited
        </h1>
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
          Join <strong className="text-foreground">{organization.name}</strong> on Pull to access
          open source contribution opportunities and track your progress.
        </p>
      </div>

      {/* Signed-in account */}
      <div className="border border-border px-5 py-4">
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          You&apos;re signed in as
        </p>
        <div className="mt-2 flex items-center gap-3">
          {profile.avatar && (
            <img src={profile.avatar} alt={profile.displayName} className="size-8 rounded-full" />
          )}
          <div>
            <p className="font-semibold">@{profile.username}</p>
            <p className="font-mono text-xs text-muted-foreground">{profile.displayName}</p>
          </div>
        </div>
        <a
          href={`/sign-in?next=${encodeURIComponent(`/invite/${rawToken}`)}`}
          className="mt-3 block font-mono text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Switch account
        </a>
      </div>

      {/* Joining */}
      <div className="border border-border px-5 py-4">
        <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          Joining
        </p>
        <p className="mt-2 font-semibold">{organization.name}</p>
        {seatsRemaining !== null && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {seatsRemaining} spot{seatsRemaining !== 1 ? "s" : ""} remaining
          </p>
        )}
      </div>

      {error && <p className="font-mono text-xs text-destructive">{error}</p>}

      <Button onClick={handleJoin} disabled={isPending} className="w-full">
        {isPending ? "Joining…" : `Join ${organization.name}`}
      </Button>
    </div>
  );
}
