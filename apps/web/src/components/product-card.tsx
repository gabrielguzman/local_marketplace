import Link from 'next/link';
import type { ProductSummaryDto } from '@marketplace/shared';
import { formatPrice } from '@/lib/format';

export function ProductCard({ product }: { product: ProductSummaryDto }) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="flex h-44 items-center justify-center overflow-hidden bg-zinc-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <span className="text-4xl text-zinc-300">🛍️</span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="text-lg font-semibold">
          {formatPrice(product.priceCents, product.currency)}
        </p>
        <p className="line-clamp-2 text-sm text-zinc-700">{product.title}</p>
        <p className="text-xs text-zinc-400">{product.businessName}</p>
      </div>
    </Link>
  );
}
