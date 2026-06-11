import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { OrderDto } from '@marketplace/shared';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Mis compras' };
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const orders = await authFetch<OrderDto[]>(token, '/orders').catch(() => []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Mis compras</h1>

      {orders.length === 0 ? (
        <div className="surface-card border-dashed p-14 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 font-medium text-zinc-700">
            Todavía no hiciste ninguna compra
          </p>
          <Link href="/buscar" className="btn-primary mt-5">
            Explorar productos
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const badge = ORDER_STATUS_LABEL[order.status];
            const itemCount = order.subOrders.reduce(
              (sum, s) => sum + s.items.reduce((q, i) => q + i.quantity, 0),
              0,
            );
            return (
              <li key={order.id}>
                <Link
                  href={`/compras/${order.id}`}
                  className="surface-card flex flex-wrap items-center gap-4 p-5 transition hover:border-brand-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-800">
                      {itemCount} {itemCount === 1 ? 'producto' : 'productos'} ·{' '}
                      {order.subOrders.length}{' '}
                      {order.subOrders.length === 1 ? 'tienda' : 'tiendas'}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      · #{order.id.slice(0, 8)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <p className="font-bold">
                    {formatPrice(order.totalCents, order.currency)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
