import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type {
  BusinessDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {business.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={business.bannerUrl}
            alt=""
            className="h-40 w-full object-cover"
          />
        )}
        <div className="flex items-center gap-4 p-5">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
            <img
              src={business.logoUrl}
              alt=""
              className="h-16 w-16 rounded-full border border-zinc-200 object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
              🏪
            </span>
          )}
          <div>
            <h1 className="text-xl font-semibold">{business.name}</h1>
            {business.description && (
              <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                {business.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Productos</h2>
        {products.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
            Esta tienda todavía no tiene publicaciones.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
