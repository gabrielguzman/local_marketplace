import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminOrderDetailDto } from '@marketplace/shared';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL, SUB_ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Detalle de orden' };
export const dynamic = 'force-dynamic';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { id } = await params;
  const order = await authFetch<AdminOrderDetailDto>(
    token,
    `/admin/orders/${id}`,
  ).catch(() => null);
  if (!order) notFound();

  const badge = ORDER_STATUS_LABEL[order.status];
  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      <nav className="text-xs text-zinc-400">
        <Link href="/admin/ordenes" className="hover:text-brand-600">
          Órdenes
        </Link>{' '}
        › #{order.id.slice(0, 8)}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Orden #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {new Date(order.createdAt).toLocaleString('es-AR')}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Comprador</h2>
          <p className="mt-2 text-sm text-zinc-700">{order.buyerName}</p>
          <p className="text-xs text-zinc-400">{order.buyerEmail}</p>
        </div>
        <div className="surface-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Envío a</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {address.street} {address.number}
            <br />
            {address.city}, {address.province} ({address.zipCode})
          </p>
        </div>
        <div className="surface-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Pago</h2>
          <p className="mt-2 text-2xl font-extrabold tracking-tight">
            {formatPrice(order.totalCents, order.currency)}
          </p>
          <p className="text-xs text-zinc-400">
            {order.paymentStatus ?? 'Sin pago'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {order.subOrders.map((subOrder) => {
          const subBadge = SUB_ORDER_STATUS_LABEL[subOrder.status];
          return (
            <section key={subOrder.id} className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
                <Link
                  href={`/tienda/${subOrder.business.slug}`}
                  className="text-sm font-semibold text-zinc-700 hover:text-brand-600"
                >
                  🏪 {subOrder.business.name}
                </Link>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${subBadge.className}`}
                >
                  {subBadge.label}
                </span>
              </div>
              <ul className="divide-y divide-zinc-50">
                {subOrder.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-800">{item.title}</p>
                      {Object.values(item.attributes).length > 0 && (
                        <p className="text-xs text-zinc-400">
                          {Object.values(item.attributes).join(' · ')}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-zinc-500">
                      {item.quantity} ×{' '}
                      {formatPrice(item.unitPriceCents, order.currency)}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="border-t border-zinc-100 px-5 py-3 text-right text-sm">
                Subtotal:{' '}
                <strong>
                  {formatPrice(subOrder.subtotalCents, order.currency)}
                </strong>
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
