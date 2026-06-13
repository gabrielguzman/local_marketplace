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

  const images = parseImageList(String(formData.get('images') ?? ''));
  const status = formData.get('status') === 'DRAFT' ? 'DRAFT' : 'ACTIVE';

  try {
    await authFetch(token, '/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? '') || undefined,
        categoryId: String(formData.get('categoryId') ?? ''),
        status,
        images: images.length > 0 ? images : undefined,
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
  redirect('/vender/productos');
}

// una URL por línea, máximo 8
function parseImageList(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
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

  try {
    await authFetch(token, `/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: String(formData.get('title') ?? ''),
        description: String(formData.get('description') ?? ''),
        categoryId: String(formData.get('categoryId') ?? ''),
        images: parseImageList(String(formData.get('images') ?? '')),
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
  redirect('/vender/productos');
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
  revalidatePath('/vender/productos');
  revalidatePath('/vender');
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/products/${String(formData.get('productId'))}`, {
    method: 'DELETE',
  }).catch(() => undefined);
  revalidatePath('/vender/productos');
  revalidatePath('/vender');
}

// ── Variantes ──────────────────────────────────────────────

// "color=rojo, talle=M" → {color: "rojo", talle: "M"}
function parseAttributes(input: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const pair of input.split(',')) {
    const [key, ...rest] = pair.split('=');
    if (key?.trim() && rest.length > 0) {
      attributes[key.trim()] = rest.join('=').trim();
    }
  }
  return attributes;
}

function parsePriceCents(raw: string): number | null {
  const cents = Math.round(Number(raw.replace(',', '.')) * 100);
  return Number.isInteger(cents) && cents > 0 ? cents : null;
}

export async function addVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const priceCents = parsePriceCents(String(formData.get('price') ?? ''));
  if (!priceCents) {
    return { error: 'El precio tiene que ser un número mayor a cero' };
  }

  const productId = String(formData.get('productId') ?? '');
  try {
    await authFetch(token, `/products/${productId}/variants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: parseAttributes(String(formData.get('attributes') ?? '')),
        priceCents,
        stock: Number(formData.get('stock') ?? 0),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/vender/productos/${productId}/editar`);
  return { error: null, ok: true };
}

export async function updateVariantInlineAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const priceCents = parsePriceCents(String(formData.get('price') ?? ''));
  if (!priceCents) {
    return { error: 'Precio inválido' };
  }

  const productId = String(formData.get('productId') ?? '');
  try {
    await authFetch(
      token,
      `/products/${productId}/variants/${String(formData.get('variantId'))}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceCents,
          stock: Number(formData.get('stock') ?? 0),
        }),
      },
    );
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/vender/productos/${productId}/editar`);
  return { error: null, ok: true };
}

export async function deleteVariantAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const productId = String(formData.get('productId') ?? '');
  try {
    await authFetch(
      token,
      `/products/${productId}/variants/${String(formData.get('variantId'))}`,
      { method: 'DELETE' },
    );
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/vender/productos/${productId}/editar`);
  return { error: null };
}
