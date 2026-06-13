import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminProductDto, Page } from '@marketplace/shared';
import { ConfirmForm } from '@/components/confirm-form';
import { Pagination } from '@/components/pagination';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';
import { adminProductStatusAction } from '@/lib/trust-actions';

export const metadata: Metadata = { title: 'Productos' };
export const dynamic = 'force-dynamic';

const EMPTY: Page<AdminProductDto> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Publicado', className: 'bg-green-50 text-green-700' },
  PAUSED: { label: 'Pausado', className: 'bg-amber-50 text-amber-700' },
  DRAFT: { label: 'Borrador', className: 'bg-zinc-100 text-zinc-600' },
  DELETED: { label: 'Eliminado', className: 'bg-red-50 text-red-600' },
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { q, page } = await searchParams;
  const query = new URLSearchParams();
  if (q) query.set('q', q);
  if (page) query.set('page', page);
  const result = await authFetch<Page<AdminProductDto>>(
    token,
    `/admin/products?${query}`,
  ).catch(() => EMPTY);
  const products = result.items;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
        <form action="/admin/productos" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por título…"
            className="field-input w-64 !py-2"
          />
          <button type="submit" className="btn-secondary !py-2">
            Buscar
          </button>
        </form>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-3.5">Producto</th>
              <th className="px-5 py-3.5">Tienda</th>
              <th className="px-5 py-3.5">Precio</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const badge = STATUS_BADGE[product.status];
              return (
                <tr
                  key={product.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/p/${product.slug}`}
                      className="font-medium text-zinc-800 hover:text-brand-600"
                    >
                      {product.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {product.businessName}
                  </td>
                  <td className="px-5 py-3.5 font-medium">
                    {formatPrice(product.priceCents)}
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
                      <form action={adminProductStatusAction}>
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
                          {product.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
                        </button>
                      </form>
                      <ConfirmForm
                        action={adminProductStatusAction}
                        fields={{ productId: product.id, status: 'DELETED' }}
                        confirmText={`¿Eliminar "${product.title}"? No se puede deshacer.`}
                      >
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="p-10 text-center text-sm text-zinc-500">
            No se encontraron productos.
          </p>
        )}
      </div>

      <Pagination
        basePath="/admin/productos"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        params={{ q }}
      />
    </div>
  );
}
