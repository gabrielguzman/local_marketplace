import Link from 'next/link';
import type { ProductSummaryDto } from '@marketplace/shared';
import { formatPrice } from '@/lib/format';

export function ProductCard({ product }: { product: ProductSummaryDto }) {
  return (
    <Link
      href={`/p/${product.slug}`}
      className="group surface-card overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
        {product.condition === 'USED' && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            Usado
          </span>
        )}
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-12 w-12 text-zinc-300"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="m4 17 5-5 4 4 3-3 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <p className="text-lg font-bold tracking-tight text-zinc-900">
          {formatPrice(product.priceCents, product.currency)}
        </p>
        {product.rating.count > 0 && (
          <p className="flex items-center gap-1 text-xs">
            <span aria-hidden="true" className="text-amber-500">
              ★
            </span>
            <span className="font-medium text-zinc-700">
              {product.rating.avg}
            </span>
            <span className="text-zinc-400">({product.rating.count})</span>
          </p>
        )}
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600">
          {product.title}
        </p>
        <p className="flex items-center gap-1 text-xs text-zinc-400">
          <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M2 6.5 4 3h8l2 3.5a2 2 0 0 1-2 2 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-2-2Z" />
            <path d="M3 9.5V13h10V9.5a3.4 3.4 0 0 1-2 .1 3.4 3.4 0 0 1-3-.6 3.4 3.4 0 0 1-3 .6 3.4 3.4 0 0 1-2-.1Z" />
          </svg>
          {product.businessName}
        </p>
      </div>
    </Link>
  );
}
