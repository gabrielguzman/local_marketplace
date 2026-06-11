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

  const activeCategory = categories.find((c) => c.slug === params.category);
  const hasFilters = Boolean(params.q || params.category || params.min || params.max);

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <aside className="w-full shrink-0 md:w-60">
        <div className="surface-card space-y-6 p-5 md:sticky md:top-32">
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Categorías
            </h2>
            <ul className="space-y-0.5 text-sm">
              <li>
                <Link
                  href={`/buscar?${buildQuery(params, { category: undefined, cursor: undefined })}`}
                  className={`block rounded-md px-2.5 py-1.5 transition ${
                    !params.category
                      ? 'bg-brand-50 font-semibold text-brand-700'
                      : 'text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  Todas
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/buscar?${buildQuery(params, { category: cat.slug, cursor: undefined })}`}
                    className={`block rounded-md px-2.5 py-1.5 transition ${
                      params.category === cat.slug
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <form className="space-y-3" action="/buscar">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {params.category && (
              <input type="hidden" name="category" value={params.category} />
            )}
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Precio
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="min"
                placeholder="Mín"
                defaultValue={params.min}
                className="field-input !px-2.5 !py-1.5"
              />
              <span className="text-zinc-300">–</span>
              <input
                type="number"
                name="max"
                placeholder="Máx"
                defaultValue={params.max}
                className="field-input !px-2.5 !py-1.5"
              />
            </div>
            <button type="submit" className="btn-secondary w-full !py-1.5 text-xs">
              Aplicar
            </button>
          </form>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight">
            {params.q
              ? `Resultados para “${params.q}”`
              : (activeCategory?.name ?? 'Todos los productos')}
          </h1>
          <p className="text-sm text-zinc-400">
            {results.items.length}
            {results.nextCursor ? '+' : ''} productos
          </p>
        </div>

        {results.items.length === 0 ? (
          <div className="surface-card border-dashed p-14 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 font-medium text-zinc-700">
              No encontramos productos
              {params.q ? ` para “${params.q}”` : ' con esos filtros'}.
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Probá con otras palabras o quitá algún filtro.
            </p>
            {hasFilters && (
              <Link href="/buscar" className="btn-secondary mt-5">
                Quitar filtros
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {results.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {results.nextCursor && (
              <div className="mt-8 text-center">
                <Link
                  href={`/buscar?${buildQuery(params, { cursor: results.nextCursor })}`}
                  className="btn-secondary"
                >
                  Ver más productos
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
