import { SiteContainer } from "@/components/layout/site-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationLoading() {
  return (
    <SiteContainer className="pt-10 pb-20 sm:pt-12">
      <div className="space-y-8" aria-busy="true" aria-label="Loading organization">
        <Skeleton className="h-20 w-full rounded-none" />
        <div className="flex gap-5">
          <Skeleton className="size-24 shrink-0 rounded-none" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-40 rounded-none" />
            <Skeleton className="h-10 w-64 rounded-none" />
            <Skeleton className="h-16 w-full max-w-2xl rounded-none" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 rounded-none" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    </SiteContainer>
  );
}
