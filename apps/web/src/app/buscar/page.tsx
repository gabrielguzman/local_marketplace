import Link from 'next/link';
import type {
  CategoryDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  category?: string;
  min?: string; // pesos
  max?: string;
  cursor?: string;
}

function buildQuery(params: SearchParams, overrides: Partial<SearchParams> = {}) {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (merged.q) query.set('q', merged.q);
  if (merged.category) query.set('category', merged.category);
  if (merged.min) query.set('min', merged.min);
  if (merged.max) query.set('max', merged.max);
  if (merged.cursor) query.set('cursor', merged.cursor);
  return query.toString();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const apiQuery = new URLSearchParams({ limit: '24' });
  if (params.q) apiQuery.set('q', params.q);
  if (params.category) apiQuery.set('category', params.category);
  if (params.min) {
    apiQuery.set('minPriceCents', String(Math.round(Number(params.min) * 100)));
  }
  if (params.max) {
    apiQuery.set('maxPriceCents', String(Math.round(Number(params.max) * 100)));
  }
  if (params.cursor) apiQuery.set('cursor', params.cursor);

  const [categories, results] = await Promise.all([
    apiFetch<CategoryDto[]>('/categories').catch(() => []),
    apiFetch<Paginated<ProductSummaryDto>>(`/search?${apiQuery}`).catch(() => ({
      items: [],
      nextCursor: null,
    })),
  ]);

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <aside className="w-full shrink-0 space-y-6 md:w-56">
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Categorías
          </h2>
          <ul className="space-y-1 text-sm">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/buscar?${buildQuery(params, { category: cat.slug, cursor: undefined })}`}
                  className={
                    params.category === cat.slug
                      ? 'font-semibold text-zinc-900'
                      : 'text-zinc-600 hover:underline'
                  }
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <form className="space-y-2" action="/buscar">
          {params.q && <input type="hidden" name="q" value={params.q} />}
          {params.category && (
            <input type="hidden" name="category" value={params.category} />
          )}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Precio
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="min"
              placeholder="Mín"
              defaultValue={params.min}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
            />
            <span className="text-zinc-400">–</span>
            <input
              type="number"
              name="max"
              placeholder="Máx"
              defaultValue={params.max}
              className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-zinc-900 py-1.5 text-sm text-white hover:bg-zinc-700"
          >
            Filtrar
          </button>
        </form>
      </aside>

      <section className="flex-1">
        <h1 className="mb-4 text-lg font-semibold">
          {params.q ? `Resultados para “${params.q}”` : 'Todos los productos'}
        </h1>
        {results.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
            No encontramos productos con esos filtros.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {results.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {results.nextCursor && (
              <div className="mt-6 text-center">
                <Link
                  href={`/buscar?${buildQuery(params, { cursor: results.nextCursor })}`}
                  className="inline-block rounded-md border border-zinc-300 bg-white px-6 py-2 text-sm hover:bg-zinc-100"
                >
                  Ver más
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
