"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createPartnerOrgAction } from "@/app/actions/partners";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded-none border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const labelCls = "block font-mono text-xs font-semibold text-muted-foreground uppercase";

export function NewPartnerOrgForm() {
  const [state, formAction, isPending] = useActionState(createPartnerOrgAction, null);

  return (
    <form action={formAction} className="mt-10 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={labelCls}>Organization Name</label>
        <input id="name" name="name" placeholder="The Buidl" required className={inputCls} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="slug" className={labelCls}>Slug</label>
        <input id="slug" name="slug" placeholder="the-buidl" required pattern="[a-z0-9-]+" className={inputCls} />
        <p className="font-mono text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only. Used in URLs.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className={labelCls}>Description</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="In-person Rust for Bitcoin learning pathway..."
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
        <input id="website" name="website" type="url" placeholder="https://thebuidl.xyz" className={inputCls} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="logo_url" className={labelCls}>Logo URL (optional)</label>
        <input id="logo_url" name="logo_url" type="url" placeholder="https://..." className={inputCls} />
      </div>

      {state?.error && (
        <p className="font-mono text-xs text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create Organization"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/partners">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
