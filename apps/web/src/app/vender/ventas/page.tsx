import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { BusinessDto, SellerSubOrderDto } from '@marketplace/shared';
import { SaleStatusActions } from '@/components/sale-status-actions';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { SELLER_NEXT_ACTIONS, SUB_ORDER_STATUS_LABEL } from '@/lib/labels';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Mis ventas' };
export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const business = await authFetch<BusinessDto>(token, '/businesses/me').catch(
    () => null,
  );
  if (!business) redirect('/vender');

  const sales = await authFetch<SellerSubOrderDto[]>(
    token,
    '/businesses/me/suborders',
  ).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <nav className="text-xs text-zinc-400">
          <Link href="/vender" className="hover:text-brand-600">
            Panel de vendedor
          </Link>{' '}
          › Ventas
        </nav>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Mis ventas</h1>
      </div>

      {sales.length === 0 ? (
        <div className="surface-card border-dashed p-14 text-center">
          <p className="text-4xl">💸</p>
          <p className="mt-3 font-medium text-zinc-700">
            Todavía no tenés ventas
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Cuando alguien pague una compra en tu tienda, va a aparecer acá.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sales.map((sale) => {
            const badge = SUB_ORDER_STATUS_LABEL[sale.status];
            return (
              <li key={sale.id} className="surface-card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      Venta #{sale.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {new Date(sale.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      · Comprador: {sale.buyerName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <ul className="divide-y divide-zinc-50">
                  {sale.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                    >
                      <span className="text-zinc-700">{item.title}</span>
                      <span className="shrink-0 text-zinc-500">
                        {item.quantity} ×{' '}
                        {formatPrice(item.unitPriceCents, 'ARS')}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3.5">
                  <div className="text-sm text-zinc-500">
                    <p>
                      Enviar a: {sale.shippingAddress.street}{' '}
                      {sale.shippingAddress.number}, {sale.shippingAddress.city}
                    </p>
                    <p className="mt-1 text-xs">
                      Subtotal {formatPrice(sale.subtotalCents, 'ARS')}
                      {sale.shippingCents > 0 && (
                        <> · Envío {formatPrice(sale.shippingCents, 'ARS')}</>
                      )}{' '}
                      · Comisión −{formatPrice(sale.feeCents, 'ARS')} ·{' '}
                      <strong className="text-zinc-800">
                        Recibís{' '}
                        {formatPrice(
                          sale.subtotalCents - sale.feeCents + sale.shippingCents,
                          'ARS',
                        )}
                      </strong>
                    </p>
                  </div>
                  <SaleStatusActions
                    subOrderId={sale.id}
                    actions={SELLER_NEXT_ACTIONS[sale.status]}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
