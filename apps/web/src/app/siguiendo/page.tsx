import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessCardDto, ProductSummaryDto } from '@marketplace/shared';
import { BusinessCard } from '@/components/business-card';
import { ProductCard } from '@/components/product-card';
import { apiFetch, authFetch } from '@/lib/api';
import { getFavoriteIds } from '@/lib/favorites';
import { getFollowingIds } from '@/lib/follows';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Siguiendo' };
export const dynamic = 'force-dynamic';

export default async function SiguiendoPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const [feed, followingIds, favoriteIds] = await Promise.all([
    authFetch<ProductSummaryDto[]>(token, '/me/following/feed').catch(
      () => [] as ProductSummaryDto[],
    ),
    getFollowingIds(),
    getFavoriteIds(),
  ]);

  if (followingIds.size === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-5xl">🔔</p>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          Todavía no seguís ninguna tienda
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Seguí a tus tiendas favoritas y mirá acá sus novedades.
        </p>
        <Link href="/tiendas" className="btn-primary mt-6">
          Explorar tiendas
        </Link>
      </div>
    );
  }

  const allStores = await apiFetch<BusinessCardDto[]>('/businesses').catch(
    () => [] as BusinessCardDto[],
  );
  const stores = allStores.filter((b) => followingIds.has(b.id));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Siguiendo</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Novedades de las {followingIds.size}{' '}
          {followingIds.size === 1 ? 'tienda' : 'tiendas'} que seguís.
        </p>
      </div>

      {stores.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight">Tus tiendas</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {stores.map((business) => (
              <BusinessCard key={business.id} business={business} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          ✨ Novedades
        </h2>
        {feed.length === 0 ? (
          <div className="surface-card border-dashed p-12 text-center text-sm text-zinc-500">
            Tus tiendas todavía no publicaron productos nuevos.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {feed.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                favorited={favoriteIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
