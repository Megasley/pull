"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePartnerOrgAction } from "@/app/actions/partners";
import { Button } from "@/components/ui/button";
import type { PartnerOrg } from "@/lib/partners/orgs";

const inputCls =
  "w-full rounded-none border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const labelCls = "block font-mono text-xs font-semibold text-muted-foreground uppercase";

type Props = {
  org: PartnerOrg;
  skills: string[];
};

export function EditPartnerOrgForm({ org, skills }: Props) {
  const [state, formAction, isPending] = useActionState(
    updatePartnerOrgAction.bind(null, org.id),
    null,
  );

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={labelCls}>Organization Name</label>
        <input
          id="name"
          name="name"
          required
          defaultValue={org.name}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className={labelCls}>Slug</label>
        <input value={org.slug} disabled className={`${inputCls} opacity-60`} />
        <p className="font-mono text-xs text-muted-foreground">
          Slugs can&apos;t be changed after creation — it&apos;s baked into the invite link URL.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className={labelCls}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={org.description}
          className="w-full resize-none rounded-none border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="skills" className={labelCls}>Skills</label>
        <input
          id="skills"
          name="skills"
          placeholder="Rust, Bitcoin, Open Source"
          required
          defaultValue={skills.join(", ")}
          className={inputCls}
        />
        <p className="font-mono text-xs text-muted-foreground">
          Comma-separated. What this organization&apos;s participants learn — used to match them
          to relevant contribution opportunities (real open source projects and issues) when they
          join Pull.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="website" className={labelCls}>Website (optional)</label>
        <input
          id="website"
          name="website"
          type="url"
          defaultValue={org.website ?? ""}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="logo_url" className={labelCls}>Logo URL (optional)</label>
        <input
          id="logo_url"
          name="logo_url"
          type="url"
          defaultValue={org.logoUrl ?? ""}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="status" className={labelCls}>Status</label>
        <select
          id="status"
          name="status"
          defaultValue={org.status}
          className={inputCls}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {state?.error && (
        <p className="font-mono text-xs text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/admin/partners/${org.slug}`}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
