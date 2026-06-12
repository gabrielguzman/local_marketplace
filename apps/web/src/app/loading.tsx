// Skeleton genérico mientras carga cualquier ruta sin loading propio
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Cargando…">
      <div className="h-7 w-56 rounded-lg bg-zinc-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="surface-card overflow-hidden">
            <div className="aspect-[4/3] bg-zinc-100" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-24 rounded bg-zinc-200" />
              <div className="h-4 w-full rounded bg-zinc-100" />
              <div className="h-3 w-20 rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
