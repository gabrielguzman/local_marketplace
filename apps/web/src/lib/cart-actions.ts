'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { OrderDto } from '@marketplace/shared';
import { ApiRequestError, apiFetch, authFetch } from './api';
import type { ActionState } from './auth-actions';
import { ensureCartHeaders } from './cart-session';
import { getAccessToken } from './session';

function toActionError(err: unknown): ActionState {
  if (err instanceof ApiRequestError) return { error: err.message };
  return { error: 'Algo salió mal, probá de nuevo' };
}

export async function addToCartAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const headers = await ensureCartHeaders();
    await apiFetch('/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        variantId: String(formData.get('variantId') ?? ''),
        quantity: Number(formData.get('quantity') ?? 1),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  // Quedamos en el producto: el feedback lo da un toast y el badge del header
  // se refresca desde el cliente (router.refresh).
  return { error: null, ok: true };
}

export async function updateCartItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const itemId = String(formData.get('itemId') ?? '');
  const quantity = Number(formData.get('quantity') ?? 1);

  try {
    const headers = await ensureCartHeaders();
    if (quantity < 1) {
      await apiFetch(`/cart/items/${itemId}`, { method: 'DELETE', headers });
    } else {
      await apiFetch(`/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
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
  const headers = await ensureCartHeaders();
  await apiFetch(`/cart/items/${String(formData.get('itemId'))}`, {
    method: 'DELETE',
    headers,
  }).catch(() => undefined);
  revalidatePath('/carrito');
}

export async function checkoutAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const address = {
    street: String(formData.get('street') ?? ''),
    number: String(formData.get('number') ?? ''),
    city: String(formData.get('city') ?? ''),
    province: String(formData.get('province') ?? ''),
    zipCode: String(formData.get('zipCode') ?? ''),
  };

  let shipping: { businessId: string; method: string }[] = [];
  try {
    shipping = JSON.parse(String(formData.get('shipping') ?? '[]')) as {
      businessId: string;
      method: string;
    }[];
  } catch {
    shipping = [];
  }

  let order: OrderDto;
  try {
    order = await authFetch<OrderDto>(token, '/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...address, shipping }),
    });
  } catch (err) {
    return toActionError(err);
  }

  // Guardar la dirección en la cuenta si lo pidió (no bloquea la compra)
  if (formData.get('saveAddress') === 'on') {
    await authFetch(token, '/me/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    }).catch(() => undefined);
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

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const orderId = String(formData.get('orderId') ?? '');
  await authFetch(token, `/orders/${orderId}/cancel`, { method: 'POST' }).catch(
    () => undefined,
  );
  revalidatePath(`/compras/${orderId}`);
  revalidatePath('/compras');
}

export async function updateSaleStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const trackingCode = String(formData.get('trackingCode') ?? '').trim();
  const cancelReason = String(formData.get('cancelReason') ?? '').trim();
  try {
    await authFetch(
      token,
      `/suborders/${String(formData.get('subOrderId'))}/status`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: String(formData.get('status')),
          ...(trackingCode && { trackingCode }),
          ...(cancelReason && { cancelReason }),
        }),
      },
    );
  } catch (err) {
    revalidatePath('/vender/ventas');
    return toActionError(err);
  }
  revalidatePath('/vender/ventas');
  revalidatePath('/vender');
  return { error: null, ok: true };
}
