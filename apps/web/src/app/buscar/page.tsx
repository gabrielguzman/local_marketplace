import Link from 'next/link';
import type {
  CategoryDto,
  Paginated,
  ProductSummaryDto,
  SearchFacets,
} from '@marketplace/shared';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  category?: string;
  min?: string; // pesos
  max?: string;
  rating?: string; // 1..5
  condition?: string; // NEW | USED
  brand?: string;
  sort?: string;
  cursor?: string;
}

function buildQuery(params: SearchParams, overrides: Partial<SearchParams> = {}) {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (merged.q) query.set('q', merged.q);
  if (merged.category) query.set('category', merged.category);
  if (merged.min) query.set('min', merged.min);
  if (merged.max) query.set('max', merged.max);
  if (merged.rating) query.set('rating', merged.rating);
  if (merged.condition) query.set('condition', merged.condition);
  if (merged.brand) query.set('brand', merged.brand);
  if (merged.sort) query.set('sort', merged.sort);
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
  if (params.rating) apiQuery.set('minRating', params.rating);
  if (params.condition) apiQuery.set('condition', params.condition);
  if (params.brand) apiQuery.set('brand', params.brand);
  if (params.sort) apiQuery.set('sort', params.sort);
  if (params.cursor) apiQuery.set('cursor', params.cursor);

  const [categories, results, facets] = await Promise.all([
    apiFetch<CategoryDto[]>('/categories').catch(() => []),
    apiFetch<Paginated<ProductSummaryDto>>(`/search?${apiQuery}`).catch(() => ({
      items: [],
      nextCursor: null,
    })),
    // facetas dinámicas: marcas y categorías presentes en este resultado
    apiFetch<SearchFacets>(`/search/facets?${apiQuery}`).catch(() => ({
      brands: [],
      categories: [],
    })),
  ]);
  const brands = facets.brands;

  // Si no hay resultados, ofrecemos lo más vendido para no dejar la página vacía.
  const suggestions =
    results.items.length === 0
      ? await apiFetch<ProductSummaryDto[]>('/search/best-sellers').catch(
          () => [],
        )
      : [];

  const activeCategory = categories.find((c) => c.slug === params.category);
  const hasFilters = Boolean(
    params.q ||
      params.category ||
      params.min ||
      params.max ||
      params.rating ||
      params.condition ||
      params.brand,
  );

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
              {facets.categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/buscar?${buildQuery(params, { category: cat.slug, cursor: undefined })}`}
                    className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 transition ${
                      params.category === cat.slug
                        ? 'bg-brand-50 font-semibold text-brand-700'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-zinc-400">{cat.count}</span>
                  </Link>
                </li>
              ))}
              {facets.categories.length === 0 && (
                <li className="px-2.5 py-1.5 text-xs text-zinc-400">
                  Sin categorías para esta búsqueda
                </li>
              )}
            </ul>
          </div>

          <form className="space-y-3" action="/buscar">
            {params.q && <input type="hidden" name="q" value={params.q} />}
            {params.category && (
              <input type="hidden" name="category" value={params.category} />
            )}
            {params.sort && (
              <input type="hidden" name="sort" value={params.sort} />
            )}
            {params.rating && (
              <input type="hidden" name="rating" value={params.rating} />
            )}
            {params.condition && (
              <input type="hidden" name="condition" value={params.condition} />
            )}
            {params.brand && (
              <input type="hidden" name="brand" value={params.brand} />
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

          {brands.length > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Marca
              </h2>
              <ul className="space-y-0.5 text-sm">
                {brands.map((b) => {
                  const active = params.brand === b;
                  return (
                    <li key={b}>
                      <Link
                        href={`/buscar?${buildQuery(params, {
                          brand: active ? undefined : b,
                          cursor: undefined,
                        })}`}
                        className={`block rounded-md px-2.5 py-1.5 transition ${
                          active
                            ? 'bg-brand-50 font-semibold text-brand-700'
                            : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {b}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Condición
            </h2>
            <ul className="space-y-0.5 text-sm">
              {[
                { value: 'NEW', label: 'Nuevo' },
                { value: 'USED', label: 'Usado' },
              ].map((c) => {
                const active = params.condition === c.value;
                return (
                  <li key={c.value}>
                    <Link
                      href={`/buscar?${buildQuery(params, {
                        condition: active ? undefined : c.value,
                        cursor: undefined,
                      })}`}
                      className={`block rounded-md px-2.5 py-1.5 transition ${
                        active
                          ? 'bg-brand-50 font-semibold text-brand-700'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Calificación
            </h2>
            <ul className="space-y-0.5 text-sm">
              {[4, 3, 2].map((stars) => {
                const active = params.rating === String(stars);
                return (
                  <li key={stars}>
                    <Link
                      href={`/buscar?${buildQuery(params, {
                        rating: active ? undefined : String(stars),
                        cursor: undefined,
                      })}`}
                      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition ${
                        active
                          ? 'bg-brand-50 font-semibold text-brand-700'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      <span aria-hidden="true" className="text-amber-500">
                        {'★'.repeat(stars)}
                        <span className="text-zinc-300">
                          {'★'.repeat(5 - stars)}
                        </span>
                      </span>
                      <span className="text-xs text-zinc-400">y más</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
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

        <div className="mb-5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 font-medium uppercase tracking-wider text-zinc-400">
            Ordenar
          </span>
          {[
            { value: undefined, label: 'Más recientes' },
            ...(params.q
              ? [{ value: 'relevance', label: 'Más relevantes' }]
              : []),
            { value: 'price_asc', label: 'Menor precio' },
            { value: 'price_desc', label: 'Mayor precio' },
          ].map((option) => (
            <Link
              key={option.label}
              href={`/buscar?${buildQuery(params, { sort: option.value, cursor: undefined })}`}
              className={`rounded-full border px-3 py-1 transition ${
                (params.sort ?? undefined) === option.value
                  ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                  : 'border-zinc-200 text-zinc-600 hover:border-brand-300'
              }`}
            >
              {option.label}
            </Link>
          ))}
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
            {suggestions.length > 0 && (
              <div className="mt-10 text-left">
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
                  Quizás te interese
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {suggestions.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
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
