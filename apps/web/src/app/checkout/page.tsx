import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AddressDto, CartDto } from '@marketplace/shared';
import { CheckoutForm } from '@/components/checkout-form';
import { authFetch } from '@/lib/api';
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
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>
      <div className="surface-card p-7">
        <CheckoutForm cart={cart} addresses={addresses} />
      </div>
    </div>
  );
}
