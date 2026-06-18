import Link from 'next/link';
import type { BusinessCardDto } from '@marketplace/shared';

// Paleta de degradados para el banner: cada tienda tiene su color (por slug),
// así la fila de tiendas no se ve monótona aunque no tengan banner propio.
const GRADIENTS = [
  'from-indigo-500 to-violet-400',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-fuchsia-500 to-purple-400',
];

function gradientFor(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997;
  return GRADIENTS[h % GRADIENTS.length];
}

export function BusinessCard({ business }: { business: BusinessCardDto }) {
  const location = [business.city, business.province]
    .filter(Boolean)
    .join(', ');
  const initial = business.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/tienda/${business.slug}`}
      className="surface-card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[var(--shadow-card-hover)]"
    >
      <div
        className={`relative h-24 overflow-hidden bg-gradient-to-br ${gradientFor(business.slug)}`}
      >
        {business.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
          <img
            src={business.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <svg
            className="absolute -right-6 -top-8 h-32 w-32 text-white/15"
            viewBox="0 0 100 100"
            fill="currentColor"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="50" />
          </svg>
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="relative z-10 -mt-7 mb-2">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP
            <img
              src={business.logoUrl}
              alt=""
              className="h-14 w-14 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
            />
          ) : (
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br ${gradientFor(business.slug)} text-xl font-bold text-white shadow-sm`}
            >
              {initial}
            </span>
          )}
        </div>

        <h3 className="truncate font-semibold text-zinc-900 group-hover:text-brand-700">
          {business.name}
        </h3>
        {location && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-400">
            <span aria-hidden="true">📍</span>
            {location}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs">
          {business.rating.avg !== null ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
              <span>★</span>
              {business.rating.avg}
              <span className="font-normal text-amber-600/70">
                ({business.rating.count})
              </span>
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
              Nueva
            </span>
          )}
          <span className="text-zinc-500">
            {business.productCount}{' '}
            {business.productCount === 1 ? 'producto' : 'productos'}
          </span>
        </div>
      </div>
    </Link>
  );
}
