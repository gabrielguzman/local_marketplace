// Placeholders de carga para las secciones del home (mientras streamean).

function HeadingBar() {
  return <div className="mb-4 h-6 w-48 animate-pulse rounded bg-zinc-200" />;
}

export function GridSectionSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <section>
      <HeadingBar />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="surface-card overflow-hidden">
            <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoriesSkeleton() {
  return (
    <section>
      <HeadingBar />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="surface-card flex items-center gap-3 p-4"
          >
            <div className="h-11 w-11 animate-pulse rounded-xl bg-zinc-100" />
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
              <div className="h-3 w-12 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
