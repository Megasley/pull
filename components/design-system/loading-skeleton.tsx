import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent>
        <TextSkeleton lines={2} />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-8 w-28 rounded-none" />
      </CardFooter>
    </Card>
  );
}

export function RoadmapNodeSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-xs rounded-none border border-border bg-card p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Skeleton className="size-8 shrink-0 rounded-none" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-none" />
            <Skeleton className="h-5 w-20 rounded-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full max-w-lg" />
      <Skeleton className="h-5 w-full max-w-2xl" />
    </div>
  );
}

export function GridSkeleton({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}
