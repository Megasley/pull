import { redirect } from "next/navigation";

import { listAllIssueSubmissionsAction } from "@/app/actions/issue-submissions";
import { EmptyState, PageHeader } from "@/components/design-system";
import { AdminIssueSubmissionCard } from "@/components/issues/admin-issue-submission-card";
import { isAdminRole } from "@/lib/auth/roles";
import { bootstrapCurrentUserProfile } from "@/lib/auth/session";

export const metadata = { title: "Admin · Issue submissions" };

export default async function AdminIssuesPage() {
  const profile = await bootstrapCurrentUserProfile();
  if (!profile) redirect("/sign-in?next=/admin/issues");
  if (!isAdminRole(profile.role)) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <PageHeader eyebrow="admin // access denied" title="Nice try, builder" />
      </div>
    );
  }

  const { submissions } = await listAllIssueSubmissionsAction();
  const pendingCount = submissions.filter((item) => item.status === "pending").length;
  const liveCount = submissions.filter((item) => item.status === "approved").length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="admin // issues"
        title="Issue submissions"
        description="Issues builders suggested for the recommendations. Each one is pre-classified from its GitHub labels; adjust anything that's off, then approve it to put it live. Approved issues drop out automatically once they close on GitHub."
        meta={`${pendingCount} pending · ${liveCount} live · ${submissions.length} total`}
      />

      <div className="mt-8">
        {submissions.length === 0 ? (
          <EmptyState title="No submissions yet" description="Nothing has been submitted." />
        ) : (
          <ol className="space-y-3">
            {submissions.map((submission) => (
              <AdminIssueSubmissionCard key={submission.id} submission={submission} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
