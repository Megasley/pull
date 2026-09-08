"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updatePublicProfileAction } from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { LOOKING_FOR_OPTIONS, type LookingForId } from "@/lib/builders/looking-for";
import { countryFlagEmoji, listCountriesForSelect } from "@/lib/geo/countries";
import { formatSkillsForInput } from "@/lib/profile/portfolio";
import { cn } from "@/lib/utils";
import type { BuilderProfile } from "@/types/user";

const COUNTRY_OPTIONS = listCountriesForSelect();

type ProfileEditFormProps = {
  profile: BuilderProfile;
};

const fieldClassName =
  "mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const toggleRowClassName =
  "flex cursor-pointer items-start gap-2.5 rounded-none border border-transparent px-2.5 py-2 text-sm transition-colors has-[:checked]:border-ink/20 has-[:checked]:bg-signal/10";

type SectionTone = "signal" | "ink";

function Section({
  title,
  tone = "ink",
  description,
  children,
}: {
  title: string;
  tone?: SectionTone;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className={cn(
        "space-y-3 border border-border border-l-4 p-4",
        tone === "signal" ? "border-l-signal" : "border-l-ink/25",
      )}
    >
      <legend className="tech-eyebrow px-1 text-foreground/80">{title}</legend>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </fieldset>
  );
}

export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [country, setCountry] = useState(profile.country ?? "");
  const [showCountryPublicly, setShowCountryPublicly] = useState(
    profile.showCountryPublicly,
  );
  const [lookingFor, setLookingFor] = useState<Set<LookingForId>>(
    () => new Set(profile.lookingFor),
  );
  const flag = countryFlagEmoji(country);

  function toggleLookingFor(id: LookingForId) {
    setLookingFor((current) => {
      const next = new Set(current);
      if (id === "not_actively_looking") {
        // Mutually exclusive with every other interest — "not looking" can't
        // coexist with "looking for X".
        return next.has(id) ? new Set() : new Set(["not_actively_looking"]);
      }
      next.delete("not_actively_looking");
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const activeLookingFor = LOOKING_FOR_OPTIONS.filter(
    (option) => option.id !== "not_actively_looking",
  );
  const notActivelyLooking = LOOKING_FOR_OPTIONS.find(
    (option) => option.id === "not_actively_looking",
  )!;

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
      <Section title="Identity" tone="ink">
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
      </Section>

      <Section
        title="Looking for"
        tone="signal"
        description="Optional. Shown on your profile and in the Builders Directory so maintainers know how to engage you."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {activeLookingFor.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-2.5 border border-border px-3 py-2.5 text-sm transition-colors has-[:checked]:border-ink/25 has-[:checked]:bg-signal/15 hover:bg-muted/20"
            >
              <input
                type="checkbox"
                name="lookingFor"
                value={option.id}
                checked={lookingFor.has(option.id)}
                onChange={() => toggleLookingFor(option.id)}
                disabled={pending}
                className="mt-0.5 accent-[var(--ink)]"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>

        <div className="border-t border-border pt-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="lookingFor"
              value={notActivelyLooking.id}
              checked={lookingFor.has(notActivelyLooking.id)}
              onChange={() => toggleLookingFor(notActivelyLooking.id)}
              disabled={pending}
              className="mt-0.5 accent-[var(--ink)]"
            />
            <span>
              <span className="font-medium text-foreground">
                {notActivelyLooking.label}
              </span>
              <span className="mt-0.5 block text-xs">
                Clears the interests above — mutually exclusive with them.
              </span>
            </span>
          </label>
        </div>
      </Section>

      <Section
        title="Visibility"
        tone="signal"
        description="Control who can view your portfolio and whether you appear in the public Builders Directory."
      >
        <label className={toggleRowClassName}>
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
        <label className={toggleRowClassName}>
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
      </Section>

      <Section title="Links" tone="ink">
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
      </Section>

      <Section title="Location" tone="signal">
        <div>
          <label htmlFor="country" className="text-sm font-medium">
            Country <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <select
            id="country"
            name="country"
            value={country}
            onChange={(event) => {
              const next = event.target.value;
              setCountry(next);
              if (!next) setShowCountryPublicly(false);
            }}
            disabled={pending}
            className={fieldClassName}
          >
            <option value="">Prefer not to say</option>
            {COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Hidden by default. Used in aggregate to help Pull report where its
            contributors come from — never inferred, and you can change or remove it any
            time.
          </p>
        </div>

        <label className={cn(toggleRowClassName, !country && "cursor-not-allowed opacity-60")}>
          <input
            type="checkbox"
            name="showCountryPublicly"
            value="on"
            checked={showCountryPublicly}
            onChange={(event) => setShowCountryPublicly(event.target.checked)}
            disabled={pending || !country}
            className="mt-0.5 accent-[var(--ink)]"
          />
          <span>
            <span className="font-medium">
              Show my country flag on my public profile{" "}
              {flag && showCountryPublicly ? <span aria-hidden>{flag}</span> : null}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {country
                ? "Shows the flag next to your name on your builder card and public portfolio. Off by default."
                : "Pick a country above to enable this."}
            </span>
          </span>
        </label>
      </Section>

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
          className="rounded-none border border-ink/20 bg-signal/15 px-3 py-2 text-sm"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap gap-2 border-t border-border bg-card/95 px-5 py-3 backdrop-blur sm:-mx-6 sm:px-6">
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
