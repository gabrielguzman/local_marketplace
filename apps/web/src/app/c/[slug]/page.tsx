import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type {
  CategoryDetailDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

async function getCategory(slug: string): Promise<CategoryDetailDto | null> {
  return apiFetch<CategoryDetailDto>(`/categories/${slug}`).catch(() => null);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  return { title: category?.name ?? 'Categoría' };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { slug } = await params;
  const { cursor } = await searchParams;
  const category = await getCategory(slug);
  if (!category) notFound();

  const apiQuery = new URLSearchParams({ category: slug, limit: '24' });
  if (cursor) apiQuery.set('cursor', cursor);
  const results = await apiFetch<Paginated<ProductSummaryDto>>(
    `/search?${apiQuery}`,
  ).catch((): Paginated<ProductSummaryDto> => ({ items: [], nextCursor: null }));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Link href="/" className="hover:text-brand-600">
          Inicio
        </Link>
        {category.parent && (
          <>
            <span>›</span>
            <Link
              href={`/c/${category.parent.slug}`}
              className="hover:text-brand-600"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <span>›</span>
        <span className="text-zinc-500">{category.name}</span>
      </nav>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        <Link
          href={`/buscar?category=${slug}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          Buscar con filtros →
        </Link>
      </div>

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/c/${child.slug}`}
              className="rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm text-zinc-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {results.items.length === 0 ? (
        <div className="surface-card border-dashed p-14 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 font-medium text-zinc-700">
            Todavía no hay productos en esta categoría.
          </p>
          <Link href="/buscar" className="btn-secondary mt-5">
            Explorar todo
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {results.nextCursor && (
            <div className="mt-8 text-center">
              <Link
                href={`/c/${slug}?cursor=${results.nextCursor}`}
                className="btn-secondary"
              >
                Ver más productos
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
