import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { OrderDto } from '@marketplace/shared';
import { PrintButton } from '@/components/print-button';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Comprobante' };
export const dynamic = 'force-dynamic';

export default async function ReceiptPage({
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

  const address = order.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2 print:py-6">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/compras/${order.id}`}
          className="text-sm text-zinc-500 hover:text-brand-600"
        >
          ← Volver a la compra
        </Link>
        <PrintButton />
      </div>

      <div className="surface-card p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-zinc-100 pb-5">
          <div>
            <p className="text-xl font-extrabold tracking-tight text-brand-600">
              Mercato
            </p>
            <p className="text-xs text-zinc-400">Comprobante de compra</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-semibold">#{order.id.slice(0, 8)}</p>
            <p className="text-zinc-400">
              {new Date(order.createdAt).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              {ORDER_STATUS_LABEL[order.status].label}
            </p>
          </div>
        </div>

        <div className="border-b border-zinc-100 py-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Envío a
          </p>
          <p className="mt-1 text-zinc-700">
            {address.street} {address.number}, {address.city}, {address.province}{' '}
            (CP {address.zipCode})
          </p>
        </div>

        {order.subOrders.map((subOrder) => (
          <div key={subOrder.id} className="border-b border-zinc-100 py-4">
            <p className="mb-2 text-sm font-semibold text-zinc-700">
              {subOrder.business.name}
            </p>
            <table className="w-full text-sm">
              <tbody>
                {subOrder.items.map((item) => (
                  <tr key={item.id} className="text-zinc-600">
                    <td className="py-1">
                      {item.title}
                      {Object.values(item.attributes).length > 0 && (
                        <span className="text-zinc-400">
                          {' '}
                          ({Object.values(item.attributes).join(', ')})
                        </span>
                      )}
                    </td>
                    <td className="py-1 text-right tabular-nums text-zinc-500">
                      {item.quantity} ×{' '}
                      {formatPrice(item.unitPriceCents, order.currency)}
                    </td>
                    <td className="py-1 pl-4 text-right font-medium tabular-nums">
                      {formatPrice(
                        item.unitPriceCents * item.quantity,
                        order.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {order.shippingCents > 0 && (
          <div className="flex justify-between pt-4 text-sm text-zinc-500">
            <span>Envío</span>
            <span className="tabular-nums">
              {formatPrice(order.shippingCents, order.currency)}
            </span>
          </div>
        )}
        <div className="flex justify-between pt-2 text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(order.totalCents, order.currency)}
          </span>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Gracias por tu compra en Mercato · {order.id}
        </p>
      </div>
    </div>
  );
}
