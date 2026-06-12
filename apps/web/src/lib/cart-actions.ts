'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { OrderDto } from '@marketplace/shared';
import { ApiRequestError, authFetch } from './api';
import type { ActionState } from './auth-actions';
import { getAccessToken } from './session';

function toActionError(err: unknown): ActionState {
  if (err instanceof ApiRequestError) return { error: err.message };
  return { error: 'Algo salió mal, probá de nuevo' };
}

export async function addToCartAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, '/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: String(formData.get('variantId') ?? ''),
        quantity: Number(formData.get('quantity') ?? 1),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/carrito');
}

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const itemId = String(formData.get('itemId') ?? '');
  const quantity = Number(formData.get('quantity') ?? 1);

  try {
    if (quantity < 1) {
      await authFetch(token, `/cart/items/${itemId}`, { method: 'DELETE' });
    } else {
      await authFetch(token, `/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
    }
  } catch (err) {
    // p.ej. stock insuficiente al subir cantidad
    revalidatePath('/carrito');
    return toActionError(err);
  }
  revalidatePath('/carrito');
  return { error: null };
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/cart/items/${String(formData.get('itemId'))}`, {
    method: 'DELETE',
  }).catch(() => undefined);
  revalidatePath('/carrito');
}

export async function checkoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  let order: OrderDto;
  try {
    order = await authFetch<OrderDto>(token, '/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        street: String(formData.get('street') ?? ''),
        number: String(formData.get('number') ?? ''),
        city: String(formData.get('city') ?? ''),
        province: String(formData.get('province') ?? ''),
        zipCode: String(formData.get('zipCode') ?? ''),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect(`/compras/${order.id}`);
}

export async function payOrderAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const orderId = String(formData.get('orderId') ?? '');
  await authFetch(token, `/orders/${orderId}/pay`, { method: 'POST' }).catch(
    () => undefined, // si falla (p.ej. stock), la página muestra el estado real
  );
  revalidatePath(`/compras/${orderId}`);
  revalidatePath('/compras');
}

export async function updateSaleStatusAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(
    token,
    `/suborders/${String(formData.get('subOrderId'))}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: String(formData.get('status')) }),
    },
  ).catch(() => undefined);
  revalidatePath('/vender/ventas');
}
