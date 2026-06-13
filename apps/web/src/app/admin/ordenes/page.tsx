import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminOrderDto, Page } from '@marketplace/shared';
import { Pagination } from '@/components/pagination';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Órdenes' };
export const dynamic = 'force-dynamic';

const EMPTY: Page<AdminOrderDto> = { items: [], total: 0, page: 1, pageSize: 20 };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { page } = await searchParams;
  const query = page ? `?page=${page}` : '';
  const result = await authFetch<Page<AdminOrderDto>>(
    token,
    `/admin/orders${query}`,
  ).catch(() => EMPTY);
  const orders = result.items;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Órdenes{' '}
        <span className="text-sm font-normal text-zinc-400">
          ({result.total})
        </span>
      </h1>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-3.5">Orden</th>
              <th className="px-5 py-3.5">Comprador</th>
              <th className="px-5 py-3.5">Tiendas</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const badge = ORDER_STATUS_LABEL[order.status];
              return (
                <tr
                  key={order.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">
                    #{order.id.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {order.buyerEmail}
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {order.subOrderCount}
                  </td>
                  <td className="px-5 py-3.5 font-medium">
                    {formatPrice(order.totalCents, order.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="p-10 text-center text-sm text-zinc-500">
            Todavía no hay órdenes.
          </p>
        )}
      </div>

      <Pagination
        basePath="/admin/ordenes"
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
