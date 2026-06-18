import Link from 'next/link';
import type {
  BusinessCardDto,
  CategoryDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
import { BusinessCard } from '@/components/business-card';
import { ProductCard } from '@/components/product-card';
import { RecentlyViewed } from '@/components/recently-viewed';
import { apiFetch } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-dynamic';

// JSON-LD: organización + buscador (sitelinks searchbox de Google)
const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Mercato',
  url: SITE_URL,
};
const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mercato',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/buscar?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  tecnologia: '💻',
  hogar: '🛋️',
  indumentaria: '👕',
  alimentos: '🛒',
  deportes: '🚴',
};

// color del ícono por rubro, para que la grilla no sea toda del mismo tono
const CATEGORY_COLORS: Record<string, string> = {
  tecnologia: 'bg-indigo-50 group-hover:bg-indigo-100',
  hogar: 'bg-amber-50 group-hover:bg-amber-100',
  indumentaria: 'bg-rose-50 group-hover:bg-rose-100',
  alimentos: 'bg-emerald-50 group-hover:bg-emerald-100',
  deportes: 'bg-sky-50 group-hover:bg-sky-100',
};

export default async function Home() {
  const [categories, recent, bestSellers, stores] = await Promise.all([
    apiFetch<CategoryDto[]>('/categories').catch(() => []),
    apiFetch<Paginated<ProductSummaryDto>>('/search?limit=12').catch(() => ({
      items: [],
      nextCursor: null,
    })),
    apiFetch<ProductSummaryDto[]>('/search/best-sellers').catch(
      () => [] as ProductSummaryDto[],
    ),
    apiFetch<BusinessCardDto[]>('/businesses?limit=4').catch(
      () => [] as BusinessCardDto[],
    ),
  ]);

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-14 text-white sm:px-12">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Los negocios de tu zona,
            <br />
            ahora a un click.
          </h1>
          <p className="mt-3 text-base text-brand-100">
            Comprá directo a las tiendas de tu barrio o abrí la tuya y empezá a
            vender hoy mismo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/buscar"
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            >
              Explorar productos
            </Link>
            <Link
              href="/vender"
              className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Quiero vender
            </Link>
          </div>
        </div>
        {/* decoración */}
        <svg
          className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 text-white/10"
          viewBox="0 0 200 200"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="100" />
        </svg>
        <svg
          className="pointer-events-none absolute -bottom-16 right-24 h-56 w-56 text-white/5"
          viewBox="0 0 200 200"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="100" />
        </svg>
      </section>

      {/* Categorías */}
      {categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            Explorá por categoría
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/buscar?category=${cat.slug}`}
                className="surface-card group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-card-hover)]"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl transition ${
                    CATEGORY_COLORS[cat.slug] ?? 'bg-zinc-50 group-hover:bg-zinc-100'
                  }`}
                >
                  {CATEGORY_ICONS[cat.slug] ?? '🏷️'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-800 group-hover:text-brand-700">
                    {cat.name}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {cat.children.length} rubros
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tiendas destacadas */}
      {stores.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">
              🏪 Tiendas destacadas
            </h2>
            <Link
              href="/tiendas"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {stores.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      )}

      {/* Más vendidos */}
      {bestSellers.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            🔥 Lo más vendido
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Vistos recientemente (cliente, localStorage) */}
      <RecentlyViewed />

      {/* Recientes */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            Publicados recientemente
          </h2>
          <Link
            href="/buscar"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        {recent.items.length === 0 ? (
          <div className="surface-card border-dashed p-12 text-center">
            <p className="text-zinc-500">
              Todavía no hay productos publicados.
            </p>
            <Link href="/vender" className="btn-primary mt-4">
              Sé el primero en vender
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Propuesta de valor */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: '🏪',
            title: 'Negocios reales',
            text: 'Cada producto pertenece a una tienda verificada de tu zona.',
          },
          {
            icon: '🔒',
            title: 'Pago seguro',
            text: 'Comprá en un entorno protegido, con tus datos siempre cifrados.',
          },
          {
            icon: '🚀',
            title: 'Vendé en minutos',
            text: 'Creá tu negocio gratis y publicá tu primer producto hoy.',
          },
        ].map((item) => (
          <div key={item.title} className="surface-card flex gap-4 p-5">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-5 text-zinc-500">{item.text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
