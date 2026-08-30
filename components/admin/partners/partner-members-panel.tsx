"use client";

import { useTransition } from "react";

import { setMembershipQualificationStatusAction } from "@/app/actions/partners";
import type { OrgMembershipWithUser } from "@/lib/partners/memberships";

type Props = {
  orgSlug: string;
  members: OrgMembershipWithUser[];
};

const STATUS_OPTIONS = ["none", "qualified", "completed", "graduated"] as const;

function QualificationSelect({ orgSlug, membership }: { orgSlug: string; membership: OrgMembershipWithUser }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={membership.qualificationStatus}
      disabled={isPending}
      onChange={(event) => {
        const status = event.target.value;
        startTransition(async () => {
          await setMembershipQualificationStatusAction(membership.id, status, orgSlug);
        });
      }}
      className="border border-border bg-transparent px-2 py-1 font-mono text-xs"
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  );
}

/**
 * Sets org_memberships.qualificationStatus — Pull's only signal for external
 * program completion (e.g. "this member graduated Thebuidl's own
 * curriculum"). Deliberately admin-only and explicit: Pull cannot observe
 * this on its own. See lib/partners/memberships.ts:setMembershipQualificationStatus.
 */
export function PartnerMembersPanel({ orgSlug, members }: Props) {
  return (
    <div>
      <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
        &ldquo;Qualification&rdquo; records that a member completed this partner&apos;s own external
        pathway (e.g. a curriculum Pull can&apos;t see). Set it here — Pull never infers it from
        activity.
      </p>

      {members.length === 0 ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">No members yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-4 font-normal uppercase">Member</th>
                <th className="py-2 pr-4 font-normal uppercase">Joined</th>
                <th className="py-2 pr-4 font-normal uppercase">Qualification</th>
              </tr>
            </thead>
            <tbody>
              {members.map((membership) => (
                <tr key={membership.id} className="border-b border-border/60">
                  <td className="py-2 pr-4">
                    <a
                      href={`/u/${membership.user.username}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {membership.user.displayName}
                    </a>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {new Date(membership.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4">
                    <QualificationSelect orgSlug={orgSlug} membership={membership} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
