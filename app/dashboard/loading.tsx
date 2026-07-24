import {
  CardSkeleton,
  GridSkeleton,
  PageHeaderSkeleton,
} from "@/components/design-system/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeaderSkeleton />

      <div className="mt-8 flex items-center gap-4 rounded-none border border-border bg-card p-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="mt-8">
        <CardSkeleton />
      </div>

      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <CardSkeleton />
        <div className="space-y-10">
          <CardSkeleton />
          <GridSkeleton count={2} className="grid-cols-1 sm:grid-cols-2" />
        </div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
