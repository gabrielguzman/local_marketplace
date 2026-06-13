import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { FavoriteButton } from '@/components/favorite-button';
import { ProductCard } from '@/components/product-card';
import { getFavorites } from '@/lib/favorites';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Favoritos' };
export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const favorites = await getFavorites();

  if (favorites.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-5xl">🤍</p>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          No tenés favoritos todavía
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Tocá el corazón en cualquier producto para guardarlo acá.
        </p>
        <Link href="/buscar" className="btn-primary mt-6">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Mis favoritos{' '}
        <span className="text-sm font-normal text-zinc-400">
          ({favorites.length})
        </span>
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {favorites.map((product) => (
          <div key={product.id} className="relative">
            <div className="absolute right-2 top-2 z-10">
              <FavoriteButton
                productId={product.id}
                favorited
                variant="icon"
              />
            </div>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
