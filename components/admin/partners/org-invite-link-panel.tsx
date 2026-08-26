"use client";

import { useState, useTransition } from "react";

import {
  generateOrgInviteLinkAction,
  revokeOrgInviteLinkAction,
} from "@/app/actions/org-invites";
import { CopyValueButton } from "@/components/support/copy-button";
import { Button } from "@/components/ui/button";

type Props = {
  orgSlug: string;
  linkExists: boolean;
  seatCount: number;
  seatCap: number | null;
};

export function OrgInviteLinkPanel({ orgSlug, linkExists, seatCount: initialSeatCount, seatCap: initialSeatCap }: Props) {
  // The raw URL is only ever returned at generation time and isn't stored —
  // once this component unmounts (e.g. page reload), it has to be regenerated.
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [hasLink, setHasLink] = useState(linkExists);
  const [seatCount, setSeatCount] = useState(initialSeatCount);
  const [seatCap, setSeatCap] = useState(initialSeatCap);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateOrgInviteLinkAction(orgSlug);
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setLinkUrl(result.url);
      setHasLink(true);
      setSeatCount(0);
      setSeatCap(result.seatCap);
    });
  }

  function handleRevoke() {
    setError(null);
    startTransition(async () => {
      await revokeOrgInviteLinkAction(orgSlug);
      setLinkUrl(null);
      setHasLink(false);
    });
  }

  return (
    <div className="border border-border p-6">
      <h2 className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        Invite link
      </h2>
      <p className="mt-2 max-w-xl font-mono text-xs leading-relaxed text-muted-foreground">
        One shared link for everyone at this organization. Anyone who signs in through it joins
        automatically — no per-person invite or verification needed.
      </p>

      {hasLink ? (
        <div className="mt-4 flex flex-col gap-3">
          {linkUrl ? (
            <div className="flex flex-wrap items-center gap-2">
              <code className="max-w-full truncate border border-border bg-muted/30 px-3 py-2 font-mono text-xs">
                {linkUrl}
              </code>
              <CopyValueButton value={linkUrl} />
            </div>
          ) : (
            <p className="font-mono text-xs text-muted-foreground">
              A link is active but its URL is only shown once, at generation time. Regenerate to
              get a fresh copyable link (this invalidates the old one).
            </p>
          )}
          <p className="font-mono text-xs text-muted-foreground">
            {seatCount} joined{seatCap !== null ? ` · ${seatCap - seatCount} spot${seatCap - seatCount !== 1 ? "s" : ""} remaining` : ""}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleGenerate}>
              {isPending ? "Regenerating…" : "Regenerate link"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={handleRevoke}>
              {isPending ? "Revoking…" : "Revoke link"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button type="button" size="sm" disabled={isPending} onClick={handleGenerate}>
            {isPending ? "Generating…" : "Generate invite link"}
          </Button>
        </div>
      )}

      {error && <p className="mt-3 font-mono text-xs text-destructive">{error}</p>}
    </div>
  );
}
