import { listReviewRequestsAction } from "@/app/actions/pr-reviews";
import { PrReviewQueue } from "@/components/pr-reviews/pr-review-queue";

export async function PrReviewList() {
  const result = await listReviewRequestsAction();
  const requests = result.ok ? result.requests : [];
  const viewerSignedIn = result.ok ? result.viewerSignedIn : false;

  return <PrReviewQueue requests={requests} viewerSignedIn={viewerSignedIn} />;
}
