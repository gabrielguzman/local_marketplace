import Link from 'next/link';

// Controles de paginación por número de página. Preserva los demás
// parámetros de búsqueda (p.ej. q) al cambiar de página.
export function Pagination({
  basePath,
  page,
  pageSize,
  total,
  params = {},
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  params?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    query.set('page', String(target));
    return `${basePath}?${query.toString()}`;
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2 text-sm">
      <p className="text-zinc-500">
        {first}–{last} de {total}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className="btn-secondary !px-3 !py-1.5">
            ← Anterior
          </Link>
        ) : (
          <span className="btn-secondary pointer-events-none !px-3 !py-1.5 opacity-40">
            ← Anterior
          </span>
        )}
        <span className="text-zinc-400">
          Página {page} de {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={href(page + 1)} className="btn-secondary !px-3 !py-1.5">
            Siguiente →
          </Link>
        ) : (
          <span className="btn-secondary pointer-events-none !px-3 !py-1.5 opacity-40">
            Siguiente →
          </span>
        )}
      </div>
    </div>
  );
}
