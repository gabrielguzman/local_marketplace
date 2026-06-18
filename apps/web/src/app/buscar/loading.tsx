import { CardSkeleton } from '@/components/home-skeletons';

export default function Loading() {
  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="hidden w-60 shrink-0 md:block">
        <div className="surface-card space-y-3 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-full animate-pulse rounded bg-zinc-100"
            />
          ))}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-5 h-6 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
