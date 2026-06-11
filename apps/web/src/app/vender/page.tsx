import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessDto, ProductDetailDto } from '@marketplace/shared';
import { BusinessForm } from '@/components/business-form';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Vender' };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<ProductDetailDto['status'], string> = {
  ACTIVE: 'Publicado',
  PAUSED: 'Pausado',
  DRAFT: 'Borrador',
  DELETED: 'Eliminado',
};

export default async function SellerPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );

  if (!business) {
    return (
      <div className="mx-auto max-w-md py-10">
        <h1 className="mb-2 text-xl font-semibold">Creá tu negocio</h1>
        <p className="mb-6 text-sm text-zinc-600">
          Para publicar productos primero necesitás una tienda. Es gratis y te
          toma un minuto.
        </p>
        <BusinessForm />
      </div>
    );
  }

  const products = await authFetch<ProductDetailDto[]>(
    token,
    '/products/mine',
  ).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{business.name}</h1>
          <Link
            href={`/tienda/${business.slug}`}
            className="text-sm text-zinc-500 hover:underline"
          >
            Ver mi tienda pública →
          </Link>
        </div>
        <Link
          href="/vender/productos/nuevo"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-500">
          Todavía no publicaste productos.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variant =
                  product.variants.find((v) => v.isDefault) ??
                  product.variants[0];
                return (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/p/${product.slug}`}
                        className="font-medium hover:underline"
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {variant
                        ? formatPrice(variant.priceCents, variant.currency)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {product.variants.reduce((sum, v) => sum + v.stock, 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          product.status === 'ACTIVE'
                            ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                            : 'rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'
                        }
                      >
                        {STATUS_LABEL[product.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
