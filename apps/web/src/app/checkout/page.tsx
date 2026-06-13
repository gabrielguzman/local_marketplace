import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AddressDto, CartDto } from '@marketplace/shared';
import { CheckoutForm } from '@/components/checkout-form';
import { authFetch } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Checkout' };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const [cart, addresses] = await Promise.all([
    authFetch<CartDto>(token, '/cart').catch(
      (): CartDto => ({ items: [], totalCents: 0, currency: 'ARS' }),
    ),
    authFetch<AddressDto[]>(token, '/me/addresses').catch(
      () => [] as AddressDto[],
    ),
  ]);
  if (cart.items.length === 0) redirect('/carrito');

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="surface-card p-7">
          <h2 className="mb-5 text-base font-bold tracking-tight">
            Dirección de envío
          </h2>
          <CheckoutForm addresses={addresses} />
        </div>

        <aside>
          <div className="surface-card p-6">
            <h2 className="text-sm font-bold tracking-tight">Tu pedido</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {cart.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="line-clamp-1 text-zinc-600">
                    {item.quantity}× {item.product.title}
                  </span>
                  <span className="shrink-0 font-medium">
                    {formatPrice(
                      item.variant.priceCents * item.quantity,
                      item.variant.currency,
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-zinc-100 pt-3 font-bold">
              <span>Total</span>
              <span>{formatPrice(cart.totalCents, cart.currency)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
