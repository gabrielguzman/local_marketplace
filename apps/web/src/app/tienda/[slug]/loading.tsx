import { CardSkeleton } from '@/components/home-skeletons';

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="h-4 w-48 animate-pulse rounded bg-zinc-100" />

      <section className="surface-card overflow-hidden">
        <div className="h-32 animate-pulse bg-zinc-100" />
        <div className="flex items-end gap-4 px-6 pb-6">
          <div className="-mt-12 h-24 w-24 animate-pulse rounded-2xl border-4 border-white bg-zinc-200" />
          <div className="flex-1 space-y-2 pt-3">
            <div className="h-6 w-48 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-zinc-100" />
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-4 h-6 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="surface-card h-48 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
