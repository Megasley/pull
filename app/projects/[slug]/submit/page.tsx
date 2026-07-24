import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ProjectSubmissionForm } from "@/components/projects/project-submission-form";
import { ProjectSubmissionHistory } from "@/components/projects/project-submission-history";
import { ReviewTimeline } from "@/components/reviews/review-timeline";
import { Button } from "@/components/ui/button";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";
import { isDatabaseConfigured } from "@/lib/db/env";
import { getProjectBySlug } from "@/lib/projects/catalog";
import {
  getClaimMinutes,
  getRequiredApprovals,
} from "@/lib/reviews/community";
import { listSubmissionTimeline } from "@/lib/reviews/repository";
import {
  getActiveSubmission,
  listUserSubmissionsForProject,
} from "@/lib/submissions/repository";
import { LOCKED_SUBMISSION_STATUSES } from "@/types/submission";

type SubmitPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SubmitPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return { title: "Submit project" };
  }

  return {
    title: `Submit · ${project.title}`,
    description: `Submit your ${project.title} build for review.`,
  };
}

export default async function ProjectSubmitPage({ params }: SubmitPageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const profile = await bootstrapCurrentUserProfile();

  if (!profile) {
    redirect(`/sign-in?next=/projects/${slug}/submit`);
  }

  const submissions = isDatabaseConfigured()
    ? await listUserSubmissionsForProject(profile.id, slug)
    : [];
  const active = isDatabaseConfigured()
    ? await getActiveSubmission(profile.id, slug)
    : null;
  const draft =
    active?.status === "draft" || active?.status === "needs_changes"
      ? active
      : null;
  const locked = active
    ? LOCKED_SUBMISSION_STATUSES.includes(active.status)
    : false;

  const timeline =
    active && isDatabaseConfigured()
      ? await listSubmissionTimeline(active.id)
      : [];

  const requiredApprovals = getRequiredApprovals();
  const claimMinutes = getClaimMinutes();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-8">
        <Link href={`/projects/${slug}`}>
          <ArrowLeft aria-hidden />
          cd ../project
        </Link>
      </Button>

      <p className="tech-eyebrow">submit // {slug}</p>
      <h1 className="mt-3 text-[clamp(2rem,5vw,3.25rem)] leading-[1.08] font-bold tracking-[-0.04em]">
        Submit {project.title}
      </h1>
      <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
        Share your repository, demos, and notes. Save a draft anytime, then
        submit when you are ready for review.
      </p>

      <section className="mt-8 rounded-none border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          How review works
        </h2>
        <ol className="mt-4 space-y-3 font-mono text-sm leading-relaxed text-muted-foreground">
          <li>
            <span className="text-foreground">1.</span> You submit artifacts.
            Nothing is auto-approved.
          </li>
          <li>
            <span className="text-foreground">2.</span> Eligible peers or staff
            claim your submission ({claimMinutes} min lock) and leave feedback.
          </li>
          <li>
            <span className="text-foreground">3.</span> Approval needs{" "}
            {requiredApprovals} peer votes. Staff can finalize alone.
          </li>
          <li>
            <span className="text-foreground">4.</span> One request-changes
            returns the build to you. Fix, resubmit, and a new review round
            starts.
          </li>
        </ol>
      </section>

        {!isDatabaseConfigured() ? (
          <p className="mt-8 rounded-none border border-border bg-card p-4 text-sm text-muted-foreground">
            Database is not configured. Add <code>DATABASE_URL</code> to enable
            submissions.
          </p>
        ) : (
          <div className="mt-10 space-y-10">
            <section className="rounded-none border border-border bg-card p-5 sm:p-6">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                {locked
                  ? "Active submission"
                  : draft?.status === "needs_changes"
                    ? "Update after review"
                    : draft
                      ? "Edit draft"
                      : "New submission"}
              </h2>
              <ProjectSubmissionForm
                projectSlug={slug}
                initial={active}
                locked={locked}
              />
            </section>

            {timeline.length > 0 ? (
              <section className="rounded-none border border-border bg-card p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight">
                  Review timeline
                </h2>
                <ReviewTimeline events={timeline} />
              </section>
            ) : null}

            <section className="space-y-4">
              <h2 className="text-lg font-semibold tracking-tight">
                Submission history
              </h2>
              <ProjectSubmissionHistory submissions={submissions} />
            </section>
          </div>
        )}
    </div>
  );
}
