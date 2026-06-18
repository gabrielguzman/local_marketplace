import type { Metadata } from 'next';
import type { BusinessCardDto } from '@marketplace/shared';
import { BusinessCard } from '@/components/business-card';
import { apiFetch } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Tiendas',
  description: 'Descubrí las tiendas del marketplace.',
};
export const dynamic = 'force-dynamic';

export default async function TiendasPage() {
  const businesses = await apiFetch<BusinessCardDto[]>('/businesses').catch(
    () => [] as BusinessCardDto[],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tiendas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {businesses.length}{' '}
          {businesses.length === 1
            ? 'tienda publicando'
            : 'tiendas publicando'}{' '}
          en Mercato.
        </p>
      </div>

      {businesses.length === 0 ? (
        <div className="surface-card border-dashed p-12 text-center text-zinc-500">
          Todavía no hay tiendas activas.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} />
          ))}
        </div>
      )}
    </div>
  );
}
