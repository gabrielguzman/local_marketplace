import Link from 'next/link';
import type { Metadata } from 'next';
import type { BusinessCardDto } from '@marketplace/shared';
import { BusinessCard } from '@/components/business-card';
import { apiFetch } from '@/lib/api';
import { getZona } from '@/lib/zona';

export const metadata: Metadata = {
  title: 'Tiendas',
  description: 'Descubrí las tiendas del marketplace.',
};
export const dynamic = 'force-dynamic';

export default async function TiendasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; near?: string }>;
}) {
  const { q, near } = await searchParams;
  const zona = await getZona();
  const onlyZone = near === '1' && Boolean(zona);

  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (zona) {
    query.set('province', zona.province);
    if (zona.city) query.set('city', zona.city);
    if (onlyZone) query.set('near', '1');
  }
  const businesses = await apiFetch<BusinessCardDto[]>(
    `/businesses${query.toString() ? `?${query}` : ''}`,
  ).catch(() => [] as BusinessCardDto[]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tiendas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {q
              ? `${businesses.length} ${businesses.length === 1 ? 'resultado' : 'resultados'} para “${q}”`
              : zona && !onlyZone
                ? `Mostrando primero las de ${zona.city ?? zona.province}`
                : `${businesses.length} ${businesses.length === 1 ? 'tienda' : 'tiendas'} en Mercato`}
          </p>
        </div>
        <form action="/tiendas" className="relative">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar una tienda…"
            className="w-64 rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
            <path d="m14 14 3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </form>
      </div>

      {zona && (
        <div className="flex gap-1.5 text-sm">
          <Link
            href="/tiendas"
            className={`rounded-full border px-3 py-1 transition ${
              !onlyZone
                ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                : 'border-zinc-200 text-zinc-600 hover:border-brand-300'
            }`}
          >
            Todas
          </Link>
          <Link
            href="/tiendas?near=1"
            className={`rounded-full border px-3 py-1 transition ${
              onlyZone
                ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                : 'border-zinc-200 text-zinc-600 hover:border-brand-300'
            }`}
          >
            📍 Solo {zona.city ?? zona.province}
          </Link>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="surface-card border-dashed p-12 text-center text-zinc-500">
          {q ? (
            <>
              No encontramos tiendas para “{q}”.{' '}
              <Link href="/tiendas" className="text-brand-600 hover:underline">
                Ver todas
              </Link>
            </>
          ) : onlyZone ? (
            <>
              Todavía no hay tiendas en {zona?.city ?? zona?.province}.{' '}
              <Link href="/tiendas" className="text-brand-600 hover:underline">
                Ver todas
              </Link>
            </>
          ) : (
            'Todavía no hay tiendas activas.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {businesses.map((business) => (
            <BusinessCard
              key={business.id}
              business={business}
              zone={zona ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
