"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updatePublicProfileAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { LOOKING_FOR_OPTIONS } from "@/lib/builders/looking-for";
import { formatSkillsForInput } from "@/lib/profile/portfolio";
import type { BuilderProfile } from "@/types/user";

type ProfileEditFormProps = {
  profile: BuilderProfile;
};

const fieldClassName =
  "mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-5"
      action={(formData) => {
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const result = await updatePublicProfileAction(formData);
          if (!result.ok) {
            if (result.reason === "unauthenticated") {
              router.push("/sign-in?next=/settings/profile");
              return;
            }
            setError(
              "error" in result && result.error
                ? result.error
                : "Could not save profile.",
            );
            return;
          }
          setMessage("Portfolio updated.");
          router.refresh();
        });
      }}
    >
      <div>
        <label htmlFor="displayName" className="text-sm font-medium">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          defaultValue={profile.displayName}
          disabled={pending}
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio}
          disabled={pending}
          placeholder="What you’re building and why…"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="skills" className="text-sm font-medium">
          Skills
        </label>
        <textarea
          id="skills"
          name="skills"
          rows={3}
          defaultValue={formatSkillsForInput(profile.skills)}
          disabled={pending}
          placeholder="TypeScript, Rust, Open Source, Systems Design"
          className={fieldClassName}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Comma-separated. Shown on your public Builder Portfolio (up to 24).
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Looking For</legend>
        <p className="text-xs text-muted-foreground">
          Optional. Shown on your profile and in the Builders Directory so maintainers
          know how to engage you.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {LOOKING_FOR_OPTIONS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-2.5 border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/20"
            >
              <input
                type="checkbox"
                name="lookingFor"
                value={option.id}
                defaultChecked={profile.lookingFor.includes(option.id)}
                disabled={pending}
                className="mt-0.5 accent-[var(--ink)]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-border p-4">
        <legend className="px-1 text-sm font-medium">Visibility</legend>
        <p className="text-xs text-muted-foreground">
          Control who can view your portfolio and whether you appear in the public
          Builders Directory.
        </p>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="profilePublic"
            value="on"
            defaultChecked={profile.profilePublic}
            disabled={pending}
            className="mt-0.5 accent-[var(--ink)]"
          />
          <span>
            <span className="font-medium">Public profile</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Anyone can open <span className="font-mono">/u/{profile.username}</span>
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            name="listedInDirectory"
            value="on"
            defaultChecked={profile.listedInDirectory && profile.profilePublic}
            disabled={pending}
            className="mt-0.5 accent-[var(--ink)]"
          />
          <span>
            <span className="font-medium">List me in Builders Directory</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Appear on <span className="font-mono">/builders</span> and the homepage.
              Requires a public profile.
            </span>
          </span>
        </label>
      </fieldset>

      <div>
        <label htmlFor="website" className="text-sm font-medium">
          Website
        </label>
        <input
          id="website"
          name="website"
          type="url"
          defaultValue={profile.website ?? ""}
          disabled={pending}
          placeholder="https://"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="twitterUrl" className="text-sm font-medium">
          X / Twitter
        </label>
        <input
          id="twitterUrl"
          name="twitterUrl"
          type="url"
          defaultValue={profile.twitterUrl ?? ""}
          disabled={pending}
          placeholder="https://x.com/…"
          className={fieldClassName}
        />
      </div>

      <div>
        <label htmlFor="linkedinUrl" className="text-sm font-medium">
          LinkedIn
        </label>
        <input
          id="linkedinUrl"
          name="linkedinUrl"
          type="url"
          defaultValue={profile.linkedinUrl ?? ""}
          disabled={pending}
          placeholder="https://linkedin.com/in/…"
          className={fieldClassName}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Username and GitHub come from your Pull / GitHub account and can’t be edited
        here. Public portfolio: <span className="font-mono">/u/{profile.username}</span>
      </p>

      {error ? (
        <p
          className="rounded-none border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="rounded-none border border-border bg-transparent px-3 py-2 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending}>
          {pending ? "Saving…" : "Save portfolio"}
        </Button>
        <Button asChild type="button" variant="outline">
          <a href={`/u/${profile.username}`}>View public portfolio</a>
        </Button>
      </div>
    </form>
  );
}
