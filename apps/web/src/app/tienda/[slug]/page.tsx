import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type {
  BusinessDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
import { BusinessInfo } from '@/components/business-info';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';
import { storeGradient } from '@/lib/store-style';

export const dynamic = 'force-dynamic';

interface StoreParams {
  q?: string;
  sort?: string;
  cursor?: string;
}

const SORTS = [
  { value: undefined, label: 'Más recientes' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
];

async function getBusiness(slug: string): Promise<BusinessDto | null> {
  try {
    return await apiFetch<BusinessDto>(`/businesses/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);
  return { title: business?.name ?? 'Tienda no encontrada' };
}

// Construye un href a la misma tienda combinando filtros (sin el cursor salvo
// que se pida), para los chips de orden, el buscador y "ver más".
function storeHref(
  slug: string,
  params: StoreParams,
  overrides: Partial<StoreParams>,
): string {
  const merged = { ...params, ...overrides };
  const query = new URLSearchParams();
  if (merged.q) query.set('q', merged.q);
  if (merged.sort) query.set('sort', merged.sort);
  if (merged.cursor) query.set('cursor', merged.cursor);
  const qs = query.toString();
  return `/tienda/${slug}${qs ? `?${qs}` : ''}`;
}

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<StoreParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const business = await getBusiness(slug);
  if (!business) notFound();

  const query = new URLSearchParams({ business: business.slug, limit: '24' });
  if (sp.q) query.set('q', sp.q);
  if (sp.sort) query.set('sort', sp.sort);
  if (sp.cursor) query.set('cursor', sp.cursor);
  const products = await apiFetch<Paginated<ProductSummaryDto>>(
    `/search?${query}`,
  ).catch(() => ({ items: [], nextCursor: null }));

  const initial = business.name.charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-brand-600">
          Inicio
        </Link>
        <span>›</span>
        <Link href="/tiendas" className="hover:text-brand-600">
          Tiendas
        </Link>
        <span>›</span>
        <span className="truncate text-zinc-500">{business.name}</span>
      </nav>

      <section className="surface-card overflow-hidden">
        {business.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={business.bannerUrl}
            alt=""
            className="h-44 w-full object-cover"
          />
        ) : (
          <div
            className={`relative h-32 overflow-hidden bg-gradient-to-br ${storeGradient(business.slug)}`}
          >
            <svg
              className="absolute -right-10 -top-12 h-48 w-48 text-white/15"
              viewBox="0 0 100 100"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="50" cy="50" r="50" />
            </svg>
          </div>
        )}
        <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
          <div className="relative z-10 -mt-12">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
              <img
                src={business.logoUrl}
                alt=""
                className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
              />
            ) : (
              <span
                className={`flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br ${storeGradient(business.slug)} text-4xl font-bold text-white shadow-md`}
              >
                {initial}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {business.name}
            </h1>
            {business.description && (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">
                {business.description}
              </p>
            )}
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            ● Tienda activa
          </span>
        </div>

        <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-zinc-100 px-6 py-4 text-sm">
          {business.rating.avg !== null && (
            <div className="flex items-baseline gap-1.5">
              <dt className="font-bold text-zinc-900">
                <span className="text-amber-500">★</span> {business.rating.avg}
              </dt>
              <dd className="text-zinc-400">
                ({business.rating.count}{' '}
                {business.rating.count === 1 ? 'reseña' : 'reseñas'})
              </dd>
            </div>
          )}
          {business.stats && (
            <>
              <div className="flex items-baseline gap-1.5">
                <dt className="font-bold text-zinc-900">
                  {business.stats.productCount}
                </dt>
                <dd className="text-zinc-400">
                  {business.stats.productCount === 1
                    ? 'producto'
                    : 'productos'}
                </dd>
              </div>
              <div className="flex items-baseline gap-1.5">
                <dt className="font-bold text-zinc-900">
                  {business.stats.salesCount}
                </dt>
                <dd className="text-zinc-400">
                  {business.stats.salesCount === 1
                    ? 'venta concretada'
                    : 'ventas concretadas'}
                </dd>
              </div>
            </>
          )}
          <div className="flex items-baseline gap-1.5">
            <dt className="text-zinc-400">En Mercato desde</dt>
            <dd className="font-medium text-zinc-700">
              {new Date(business.createdAt).toLocaleDateString('es-AR', {
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">
              {sp.q ? (
                <>
                  Resultados para “{sp.q}”{' '}
                  <Link
                    href={storeHref(business.slug, sp, {
                      q: undefined,
                      cursor: undefined,
                    })}
                    className="text-sm font-normal text-brand-600 hover:underline"
                  >
                    (limpiar)
                  </Link>
                </>
              ) : (
                'Productos'
              )}
            </h2>
            <form action={`/tienda/${business.slug}`} className="relative">
              {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
              <input
                type="search"
                name="q"
                defaultValue={sp.q}
                placeholder="Buscar en esta tienda…"
                className="w-56 rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
              />
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                <path
                  d="m14 14 3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </form>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="mr-1 font-medium uppercase tracking-wider text-zinc-400">
              Ordenar
            </span>
            {SORTS.map((option) => {
              const active = (sp.sort ?? undefined) === option.value;
              return (
                <Link
                  key={option.label}
                  href={storeHref(business.slug, sp, {
                    sort: option.value,
                    cursor: undefined,
                  })}
                  className={`rounded-full border px-3 py-1 transition ${
                    active
                      ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                      : 'border-zinc-200 text-zinc-600 hover:border-brand-300'
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          {products.items.length === 0 ? (
            <div className="surface-card border-dashed p-12 text-center text-zinc-500">
              {sp.q
                ? `No encontramos productos para “${sp.q}” en esta tienda.`
                : 'Esta tienda todavía no tiene publicaciones.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {products.nextCursor && (
            <div className="mt-8 flex justify-center">
              <Link
                href={storeHref(business.slug, sp, {
                  cursor: products.nextCursor,
                })}
                className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Ver más productos
              </Link>
            </div>
          )}
        </section>

        <aside className="lg:order-last">
          <BusinessInfo business={business} />
        </aside>
      </div>
    </div>
  );
}
