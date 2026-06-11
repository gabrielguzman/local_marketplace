'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiRequestError, authFetch } from './api';
import type { ActionState } from './auth-actions';
import { getAccessToken } from './session';

function toActionError(err: unknown): ActionState {
  if (err instanceof ApiRequestError) return { error: err.message };
  return { error: 'Algo salió mal, probá de nuevo' };
}

export async function createBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, '/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(formData.get('name') ?? ''),
        description: String(formData.get('description') ?? '') || undefined,
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/vender');
}

export async function updateBusinessAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const logoUrl = String(formData.get('logoUrl') ?? '').trim();
  const bannerUrl = String(formData.get('bannerUrl') ?? '').trim();

  try {
    await authFetch(token, '/businesses/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(formData.get('name') ?? ''),
        description: String(formData.get('description') ?? ''),
        ...(logoUrl && { logoUrl }),
        ...(bannerUrl && { bannerUrl }),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/vender');
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  // El form pide el precio en pesos; la API trabaja en centavos
  const priceCents = Math.round(
    Number(String(formData.get('price') ?? '').replace(',', '.')) * 100,
  );
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return { error: 'El precio tiene que ser un número mayor a cero' };
  }

  const imageUrl = String(formData.get('imageUrl') ?? '').trim();

  try {
    await authFetch(token, '/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? '') || undefined,
        categoryId: String(formData.get('categoryId') ?? ''),
        images: imageUrl ? [imageUrl] : undefined,
        variants: [
          {
            priceCents,
            stock: Number(formData.get('stock') ?? 0),
          },
        ],
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/vender');
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const productId = String(formData.get('productId') ?? '');
  const variantId = String(formData.get('variantId') ?? '');

  const priceCents = Math.round(
    Number(String(formData.get('price') ?? '').replace(',', '.')) * 100,
  );
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    return { error: 'El precio tiene que ser un número mayor a cero' };
  }

  const imageUrl = String(formData.get('imageUrl') ?? '').trim();

  try {
    await authFetch(token, `/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? ''),
        categoryId: String(formData.get('categoryId') ?? ''),
        images: imageUrl ? [imageUrl] : [],
      }),
    });
    await authFetch(token, `/products/${productId}/variants/${variantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceCents,
        stock: Number(formData.get('stock') ?? 0),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/vender');
}

export async function setProductStatusAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/products/${String(formData.get('productId'))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: String(formData.get('status')) }),
  }).catch(() => undefined);
  revalidatePath('/vender');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/products/${String(formData.get('productId'))}`, {
    method: 'DELETE',
  }).catch(() => undefined);
  revalidatePath('/vender');
}
