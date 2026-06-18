import Link from 'next/link';
import type { BusinessCardDto } from '@marketplace/shared';

export function BusinessCard({ business }: { business: BusinessCardDto }) {
  const location = [business.city, business.province]
    .filter(Boolean)
    .join(', ');

  return (
    <Link
      href={`/tienda/${business.slug}`}
      className="surface-card group overflow-hidden transition hover:border-brand-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div className="relative h-20 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-400">
        {business.bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={business.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="-mt-6 mb-2">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
            <img
              src={business.logoUrl}
              alt=""
              className="h-12 w-12 rounded-xl border-4 border-white bg-white object-cover shadow-sm"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border-4 border-white bg-brand-50 text-xl shadow-sm">
              🏪
            </span>
          )}
        </div>
        <h3 className="truncate font-semibold text-zinc-900 group-hover:text-brand-700">
          {business.name}
        </h3>
        {location && (
          <p className="mt-0.5 truncate text-xs text-zinc-400">📍 {location}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          {business.rating.avg !== null && (
            <span className="font-medium text-zinc-700">
              <span className="text-amber-500">★</span> {business.rating.avg}
            </span>
          )}
          <span>
            {business.productCount}{' '}
            {business.productCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>
    </Link>
  );
}
