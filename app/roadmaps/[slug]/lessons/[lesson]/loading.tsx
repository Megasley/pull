export default function LessonLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl animate-pulse space-y-6 border-b border-border pb-8">
        <div className="h-3 w-32 rounded-none bg-muted" />
        <div className="h-12 w-full max-w-xl rounded-none bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded-none bg-muted" />
          <div className="h-4 w-5/6 rounded-none bg-muted" />
        </div>
      </div>
    </div>
  );
}
