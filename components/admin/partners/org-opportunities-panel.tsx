"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  createOpportunityAction,
  deleteOpportunityAction,
  toggleOpportunityPinnedAction,
  updateOpportunityAction,
  type OpportunityFormState,
} from "@/app/actions/partners";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/lib/partners/opportunities";

type Props = {
  orgSlug: string;
  organizationId: string;
  opportunities: Opportunity[];
};

const DIFFICULTY_OPTIONS = ["beginner", "intermediate", "advanced"] as const;

const fieldClassName =
  "mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function OpportunityForm({
  orgSlug,
  organizationId,
  editing,
  onDone,
}: {
  orgSlug: string;
  organizationId: string;
  editing: Opportunity | null;
  onDone: () => void;
}) {
  const action = editing
    ? updateOpportunityAction.bind(null, editing.id, orgSlug)
    : createOpportunityAction.bind(null, organizationId, orgSlug);

  const [state, formAction, pending] = useActionState<OpportunityFormState, FormData>(
    action,
    null,
  );
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (pending) {
      hasSubmitted.current = true;
      return;
    }
    // Fires once pending flips back to false — only close the form on a
    // real completed submission with no error, never on first mount.
    if (hasSubmitted.current && !state) {
      onDone();
    }
  }, [pending, state, onDone]);

  return (
    <form
      key={editing?.id ?? "new"}
      action={formAction}
      className="space-y-3 border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {editing ? "Edit opportunity" : "Add opportunity"}
        </h3>
        {editing ? (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>

      <div>
        <label htmlFor="opp-title" className="text-xs font-medium">
          Title
        </label>
        <input
          id="opp-title"
          name="title"
          required
          defaultValue={editing?.title}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="opp-description" className="text-xs font-medium">
          Description
        </label>
        <textarea
          id="opp-description"
          name="description"
          rows={2}
          defaultValue={editing?.description ?? ""}
          className={fieldClassName}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="opp-difficulty" className="text-xs font-medium">
            Difficulty
          </label>
          <select
            id="opp-difficulty"
            name="difficulty"
            defaultValue={editing?.difficulty ?? "beginner"}
            className={fieldClassName}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="opp-contribution-type" className="text-xs font-medium">
            Contribution type
          </label>
          <input
            id="opp-contribution-type"
            name="contributionType"
            placeholder="e.g. good-first-issue"
            defaultValue={editing?.contributionType ?? ""}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="opp-skills" className="text-xs font-medium">
          Skills
        </label>
        <input
          id="opp-skills"
          name="skills"
          placeholder="Rust, Bitcoin, CLI"
          defaultValue={editing?.skills.join(", ") ?? ""}
          className={fieldClassName}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">Comma-separated.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="opp-repo-url" className="text-xs font-medium">
            Repository URL
          </label>
          <input
            id="opp-repo-url"
            name="repositoryUrl"
            type="url"
            placeholder="https://github.com/org/repo"
            defaultValue={editing?.repositoryUrl ?? ""}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="opp-issue-url" className="text-xs font-medium">
            Issue URL
          </label>
          <input
            id="opp-issue-url"
            name="issueUrl"
            type="url"
            placeholder="https://github.com/org/repo/issues/1"
            defaultValue={editing?.issueUrl ?? ""}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="opp-why" className="text-xs font-medium">
          Why recommended
        </label>
        <textarea
          id="opp-why"
          name="whyRecommended"
          rows={2}
          placeholder="Shown to members as context for why this fits them"
          defaultValue={editing?.whyRecommended ?? ""}
          className={fieldClassName}
        />
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          name="isPinned"
          defaultChecked={editing?.isPinned ?? false}
          className="accent-[var(--ink)]"
        />
        Pin to top
      </label>

      {state?.error ? (
        <p className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Saving…" : editing ? "Save changes" : "Add opportunity"}
      </Button>
    </form>
  );
}

function OpportunityRow({
  orgSlug,
  opportunity,
  onEdit,
}: {
  orgSlug: string;
  opportunity: Opportunity;
  onEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{opportunity.title}</p>
          {opportunity.isPinned ? (
            <span className="border border-ink bg-signal px-1.5 py-0.5 font-mono text-[10px] text-signal-foreground uppercase">
              Pinned
            </span>
          ) : null}
          <span className="border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase">
            {opportunity.difficulty}
          </span>
        </div>
        {opportunity.description ? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {opportunity.description}
          </p>
        ) : null}
        {opportunity.skills.length > 0 ? (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {opportunity.skills.join(" · ")}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await toggleOpportunityPinnedAction(opportunity.id, orgSlug, !opportunity.isPinned);
            })
          }
        >
          {opportunity.isPinned ? "Unpin" : "Pin"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              if (confirm(`Delete "${opportunity.title}"?`)) {
                await deleteOpportunityAction(opportunity.id, orgSlug);
              }
            })
          }
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

/**
 * Manages org_opportunities — the curated opportunities shown on a partner's
 * hub (app/partners/[slug]/page.tsx). Before this existed, the backend CRUD
 * functions (lib/partners/opportunities.ts) had no caller anywhere, so every
 * org silently fell back to auto-suggested discovery-catalog repos instead.
 */
export function OrgOpportunitiesPanel({ orgSlug, organizationId, opportunities }: Props) {
  const [editingId, setEditingId] = useState<string | null | "new">(null);
  const editing = editingId && editingId !== "new" ? opportunities.find((o) => o.id === editingId) ?? null : null;

  return (
    <div className="space-y-6">
      <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted-foreground">
        Curated opportunities take priority over auto-suggested repos on this partner&apos;s hub.
        With none added, members see generic discovery-catalog suggestions instead.
      </p>

      {opportunities.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          No curated opportunities yet — members are seeing auto-suggested repos.
        </p>
      ) : (
        <ul>
          {opportunities.map((opportunity) => (
            <OpportunityRow
              key={opportunity.id}
              orgSlug={orgSlug}
              opportunity={opportunity}
              onEdit={() => setEditingId(opportunity.id)}
            />
          ))}
        </ul>
      )}

      {editingId === "new" || editing ? (
        <OpportunityForm
          orgSlug={orgSlug}
          organizationId={organizationId}
          editing={editing}
          onDone={() => setEditingId(null)}
        />
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setEditingId("new")}>
          + Add opportunity
        </Button>
      )}
    </div>
  );
}
