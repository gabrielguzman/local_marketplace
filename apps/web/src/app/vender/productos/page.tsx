import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessDto, ProductDetailDto } from '@marketplace/shared';
import { DeleteProductButton } from '@/components/delete-product-button';
import { Pagination } from '@/components/pagination';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import {
  duplicateProductAction,
  setProductStatusAction,
} from '@/lib/seller-actions';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Mis productos' };
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

const STATUS_BADGE: Record<
  ProductDetailDto['status'],
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Publicado', className: 'bg-green-50 text-green-700' },
  PAUSED: { label: 'Pausado', className: 'bg-amber-50 text-amber-700' },
  DRAFT: { label: 'Borrador', className: 'bg-zinc-100 text-zinc-600' },
  DELETED: { label: 'Eliminado', className: 'bg-red-50 text-red-600' },
};

export default async function SellerProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );
  if (!business) redirect('/vender');

  const products = await authFetch<ProductDetailDto[]>(
    token,
    '/products/mine',
  ).catch(() => []);

  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const pageProducts = products.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          Mis productos{' '}
          <span className="text-sm font-normal text-zinc-400">
            ({products.length})
          </span>
        </h1>
        <Link href="/vender/productos/nuevo" className="btn-primary">
          + Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="surface-card border-dashed p-14 text-center">
          <p className="text-4xl">📦</p>
          <p className="mt-3 font-medium text-zinc-700">
            Todavía no publicaste productos
          </p>
          <Link href="/vender/productos/nuevo" className="btn-primary mt-5">
            Publicar mi primer producto
          </Link>
        </div>
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">Producto</th>
                <th className="px-5 py-3.5">Precio</th>
                <th className="px-5 py-3.5">Variantes</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageProducts.map((product) => {
                const variant =
                  product.variants.find((v) => v.isDefault) ??
                  product.variants[0];
                const stock = product.variants.reduce(
                  (sum, v) => sum + v.stock,
                  0,
                );
                const badge = STATUS_BADGE[product.status];
                return (
                  <tr
                    key={product.id}
                    className="border-b border-zinc-50 transition last:border-0 hover:bg-zinc-50/60"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/p/${product.slug}`}
                        className="font-medium text-zinc-800 hover:text-brand-600"
                      >
                        {product.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      {variant
                        ? formatPrice(variant.priceCents, variant.currency)
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600">
                      {product.variants.length}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={stock <= 3 ? 'font-semibold text-amber-600' : 'text-zinc-600'}>
                        {stock}
                        {stock <= 3 && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/vender/productos/${product.id}/editar`}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Editar
                        </Link>
                        {product.status !== 'DELETED' && (
                          <form action={setProductStatusAction}>
                            <input type="hidden" name="productId" value={product.id} />
                            <input
                              type="hidden"
                              name="status"
                              value={product.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'}
                            />
                            <button
                              type="submit"
                              className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                            >
                              {product.status === 'ACTIVE' ? 'Pausar' : 'Publicar'}
                            </button>
                          </form>
                        )}
                        <form action={duplicateProductAction}>
                          <input
                            type="hidden"
                            name="productId"
                            value={product.id}
                          />
                          <button
                            type="submit"
                            className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                          >
                            Duplicar
                          </button>
                        </form>
                        <DeleteProductButton productId={product.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {products.length > PAGE_SIZE && (
        <Pagination
          basePath="/vender/productos"
          page={current}
          pageSize={PAGE_SIZE}
          total={products.length}
        />
      )}
    </div>
  );
}
