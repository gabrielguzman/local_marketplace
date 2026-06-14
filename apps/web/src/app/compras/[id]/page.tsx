import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { SHIPPING_METHOD_LABELS, type OrderDto } from '@marketplace/shared';
import { ConfirmForm } from '@/components/confirm-form';
import { OrderTimeline } from '@/components/order-timeline';
import { ReviewForm } from '@/components/review-form';
import { authFetch } from '@/lib/api';
import { cancelOrderAction, payOrderAction } from '@/lib/cart-actions';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL, SUB_ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Detalle de compra' };
export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { id } = await params;
  const order = await authFetch<OrderDto>(token, `/orders/${id}`).catch(
    () => null,
  );
  if (!order) notFound();

  const badge = ORDER_STATUS_LABEL[order.status];
  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav className="text-xs text-zinc-400">
        <Link href="/compras" className="hover:text-brand-600">
          Mis compras
        </Link>{' '}
        › #{order.id.slice(0, 8)}
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compra #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            {new Date(order.createdAt).toLocaleDateString('es-AR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(order.status === 'PAID' || order.status === 'REFUNDED') && (
            <Link
              href={`/compras/${order.id}/comprobante`}
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Comprobante ↓
            </Link>
          )}
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {order.status === 'PENDING_PAYMENT' && (
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 border-amber-200 bg-amber-50/50 p-5">
          <div>
            <p className="font-semibold text-zinc-800">
              Tu orden está esperando el pago
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              Total a pagar:{' '}
              <strong>{formatPrice(order.totalCents, order.currency)}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ConfirmForm
              action={cancelOrderAction}
              fields={{ orderId: order.id }}
              confirmText="¿Cancelar esta orden? No vas a poder retomarla."
            >
              <button
                type="submit"
                className="btn-secondary !border-red-200 !text-red-600"
              >
                Cancelar
              </button>
            </ConfirmForm>
            <form action={payOrderAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="btn-primary">
                Pagar ahora (simulado)
              </button>
            </form>
          </div>
        </div>
      )}

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
                  <li key={item.id} className="px-5 py-3.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-800">
                          {item.title}
                        </p>
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
                    </div>
                    {subOrder.status === 'DELIVERED' && (
                      <div className="mt-1.5">
                        <ReviewForm
                          productId={item.productId}
                          orderId={order.id}
                          productTitle={item.title}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {order.status === 'PAID' && (
                <div className="border-t border-zinc-100 px-5 py-4">
                  <OrderTimeline status={subOrder.status} />
                </div>
              )}
              {subOrder.trackingCode && (
                <p className="border-t border-zinc-100 px-5 py-2.5 text-sm text-zinc-600">
                  📦 Seguimiento:{' '}
                  <strong className="font-mono">{subOrder.trackingCode}</strong>
                </p>
              )}
              {subOrder.cancelReason && (
                <p className="border-t border-zinc-100 bg-red-50/40 px-5 py-2.5 text-sm text-red-700">
                  Cancelada: {subOrder.cancelReason}
                </p>
              )}
              <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-sm text-zinc-500">
                <span>
                  {SHIPPING_METHOD_LABELS[subOrder.shippingMethod]}
                  {subOrder.shippingCents > 0 &&
                    ` · ${formatPrice(subOrder.shippingCents, order.currency)}`}
                </span>
                <span>
                  Subtotal:{' '}
                  <strong className="text-zinc-800">
                    {formatPrice(
                      subOrder.subtotalCents + subOrder.shippingCents,
                      order.currency,
                    )}
                  </strong>
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Envío a</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {address.street} {address.number}
            <br />
            {address.city}, {address.province} ({address.zipCode})
          </p>
        </div>
        <div className="surface-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Total</h2>
          {order.shippingCents > 0 && (
            <dl className="mt-2 space-y-1 text-sm text-zinc-500">
              <div className="flex justify-between">
                <dt>Productos</dt>
                <dd>
                  {formatPrice(
                    order.totalCents - order.shippingCents,
                    order.currency,
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Envío</dt>
                <dd>{formatPrice(order.shippingCents, order.currency)}</dd>
              </div>
            </dl>
          )}
          <p className="mt-1 text-2xl font-extrabold tracking-tight">
            {formatPrice(order.totalCents, order.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}
