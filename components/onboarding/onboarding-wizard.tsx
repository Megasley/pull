"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { completeOnboardingAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { availableRoadmaps } from "@/lib/landing-data";
import { listCountriesForSelect } from "@/lib/geo/countries";
import { cn } from "@/lib/utils";

const WEEKLY_GOAL_PRESETS = [
  "Complete 1 lesson",
  "Open 1 pull request",
  "Browse Open Source Projects for a contribution",
] as const;

const COUNTRY_OPTIONS = listCountriesForSelect();

type OnboardingWizardProps = {
  githubConnected: boolean;
};

export function OnboardingWizard({ githubConnected }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [roadmapSlug, setRoadmapSlug] = useState("bitcoin");
  const [weeklyGoal, setWeeklyGoal] = useState<string>(WEEKLY_GOAL_PRESETS[0]);
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tracks = availableRoadmaps.filter((item) => item.status === "available");

  function finish() {
    setError(null);
    startTransition(async () => {
      const result = await completeOnboardingAction({
        roadmapSlug,
        weeklyGoalTitle: weeklyGoal,
        country: country || undefined,
      });

      if (!result.ok) {
        setError(
          result.reason === "database_unconfigured"
            ? "Database is not configured."
            : result.reason === "invalid_roadmap"
              ? "Pick Bitcoin or Lightning to continue."
              : result.reason === "invalid_country"
                ? "Please choose a country from the list, or leave it blank."
                : "Could not save onboarding. Try again.",
        );
        return;
      }

      router.push(`/roadmaps/${roadmapSlug}`);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">
        onboarding // step {step + 1} of 3
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome to Pull
      </h1>
      <p className="mt-3 text-muted-foreground">
        Pick a track, connect GitHub when you are ready, and set a weekly goal.
      </p>

      {step === 0 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Choose your track</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {tracks.map((track) => (
              <button
                key={track.slug}
                type="button"
                onClick={() => setRoadmapSlug(track.slug)}
                className={cn(
                  "rounded-none border p-4 text-left transition-colors",
                  roadmapSlug === track.slug
                    ? "border-foreground bg-muted"
                    : "border-border hover:border-foreground/40",
                )}
              >
                <p className="font-medium">{track.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {track.description}
                </p>
              </button>
            ))}
          </div>
          <Button className="mt-6" onClick={() => setStep(1)}>
            Continue
          </Button>
          <p className="text-sm text-muted-foreground">
            Want to skip ahead and make your first pull request today instead?{" "}
            <Link
              href="/first-contribution"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Try First Contribution
            </Link>
            .
          </p>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Connect GitHub</h2>
          <p className="text-sm text-muted-foreground">
            Sync repos, PRs, and activity for smarter recommendations. You can skip and
            connect later from settings.
          </p>
          {githubConnected ? (
            <p className="rounded-none border border-border bg-muted p-4 text-sm">
              GitHub is connected.
            </p>
          ) : (
            <Button asChild variant="outline">
              <Link href="/settings/github?next=/onboarding">Connect GitHub</Link>
            </Button>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={() => setStep(2)}>Continue</Button>
            <Button variant="ghost" onClick={() => setStep(2)}>
              Skip for now
            </Button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-semibold">Weekly goal</h2>
          <p className="text-sm text-muted-foreground">
            We seed your dashboard with default goals. Pick what matters most this week.
          </p>
          <div className="space-y-2">
            {WEEKLY_GOAL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setWeeklyGoal(preset)}
                className={cn(
                  "w-full rounded-none border p-3 text-left text-sm",
                  weeklyGoal === preset
                    ? "border-foreground bg-muted"
                    : "border-border",
                )}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label htmlFor="onboarding-country" className="text-sm font-medium">
              Country <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <select
              id="onboarding-country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              disabled={pending}
              className="mt-1.5 w-full rounded-none border border-border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Prefer not to say</option>
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Never shown on your public profile. Helps Pull report where its contributors come
              from — change or remove it any time in Settings.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setStep(1)} disabled={pending}>
              Back
            </Button>
            <Button onClick={finish} disabled={pending}>
              {pending ? "Saving…" : "Start building"}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
