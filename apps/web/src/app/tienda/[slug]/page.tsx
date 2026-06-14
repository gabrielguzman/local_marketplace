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

export const dynamic = 'force-dynamic';

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

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  if (!business) notFound();

  const products = await apiFetch<Paginated<ProductSummaryDto>>(
    `/search?business=${business.slug}&limit=24`,
  ).catch(() => ({ items: [], nextCursor: null }));

  return (
    <div className="space-y-8">
      <section className="surface-card overflow-hidden">
        {business.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={business.bannerUrl}
            alt=""
            className="h-44 w-full object-cover"
          />
        ) : (
          <div className="h-28 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-400" />
        )}
        <div className="flex flex-wrap items-end gap-4 px-6 pb-6">
          <div className="-mt-9">
            {business.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
              <img
                src={business.logoUrl}
                alt=""
                className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-brand-50 text-4xl shadow-md">
                🏪
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
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            Productos{' '}
            <span className="text-sm font-normal text-zinc-400">
              ({products.items.length}
              {products.nextCursor ? '+' : ''})
            </span>
          </h2>
          {products.items.length === 0 ? (
            <div className="surface-card border-dashed p-12 text-center text-zinc-500">
              Esta tienda todavía no tiene publicaciones.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {products.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
