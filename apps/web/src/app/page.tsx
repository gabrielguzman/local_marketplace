import Link from 'next/link';
import type {
  CategoryDto,
  Paginated,
  ProductSummaryDto,
} from '@marketplace/shared';
import { ProductCard } from '@/components/product-card';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [categories, recent] = await Promise.all([
    apiFetch<CategoryDto[]>('/categories').catch(() => []),
    apiFetch<Paginated<ProductSummaryDto>>('/search?limit=12').catch(() => ({
      items: [],
      nextCursor: null,
    })),
  ]);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/buscar?category=${cat.slug}`}
            className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-700 hover:border-zinc-500"
          >
            {cat.name}
          </Link>
        ))}
      </section>

      <section>
        <h1 className="mb-4 text-lg font-semibold">Publicados recientemente</h1>
        {recent.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
            Todavía no hay productos publicados.{' '}
            <Link href="/vender" className="font-medium underline">
              Sé el primero en vender
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recent.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
