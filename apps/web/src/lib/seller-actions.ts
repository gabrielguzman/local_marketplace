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

  const str = (k: string) => String(formData.get(k) ?? '').trim();
  const logoUrl = str('logoUrl');
  const bannerUrl = str('bannerUrl');

  try {
    await authFetch(token, '/businesses/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: str('name'),
        description: str('description'),
        ...(logoUrl && { logoUrl }),
        ...(bannerUrl && { bannerUrl }),
        phone: str('phone'),
        whatsapp: str('whatsapp'),
        email: str('email'),
        website: str('website'),
        instagram: str('instagram'),
        address: str('address'),
        city: str('city'),
        province: str('province'),
        hours: str('hours'),
        policies: str('policies'),
        pickupEnabled: formData.get('pickupEnabled') === 'on',
        shippingCents: shippingCostToCents(str('shippingCost')),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/vender');
}

// pesos → centavos; vacío = null (no ofrece envío)
function shippingCostToCents(raw: string): number | null {
  if (!raw) return null;
  const cents = Math.round(Number(raw.replace(',', '.')) * 100);
  return Number.isInteger(cents) && cents >= 0 ? cents : null;
}

function parseJson<T>(raw: unknown, fallback: T): T {
  try {
    return JSON.parse(String(raw ?? '')) as T;
  } catch {
    return fallback;
  }
}

// Campos comunes de la ficha (marca, condición, specs, imágenes)
function productFields(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    description: String(formData.get('description') ?? '') || undefined,
    categoryId: String(formData.get('categoryId') ?? ''),
    brand: String(formData.get('brand') ?? '').trim() || undefined,
    condition: formData.get('condition') === 'USED' ? 'USED' : 'NEW',
    specs: parseJson<{ key: string; value: string }[]>(
      formData.get('specs'),
      [],
    ),
    images: parseJson<string[]>(formData.get('images'), []),
  };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  // El form manda cada variante con precio en pesos → la API usa centavos
  const rawVariants = parseJson<
    { attrs: string; price: string; stock: string }[]
  >(formData.get('variants'), []);
  const variants = [];
  for (const r of rawVariants) {
    const priceCents = Math.round(
      Number(String(r.price).replace(',', '.')) * 100,
    );
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      return { error: 'Cada variante necesita un precio mayor a cero' };
    }
    variants.push({
      attributes: parseAttributes(r.attrs ?? ''),
      priceCents,
      stock: Number(r.stock) || 0,
    });
  }
  if (variants.length === 0) {
    return { error: 'Agregá al menos un precio y stock' };
  }

  const fields = productFields(formData);
  const status = formData.get('status') === 'DRAFT' ? 'DRAFT' : 'ACTIVE';

  try {
    await authFetch(token, '/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...fields,
        status,
        images: fields.images.length > 0 ? fields.images : undefined,
        variants,
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect('/vender/productos');
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const productId = String(formData.get('productId') ?? '');
  // Las variantes se editan aparte (VariantManager). Acá sólo la ficha.
  try {
    await authFetch(token, `/products/${productId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productFields(formData)),
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

export async function duplicateProductAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const created = await authFetch<{ id: string }>(
    token,
    `/products/${String(formData.get('productId'))}/duplicate`,
    { method: 'POST' },
  ).catch(() => null);

  revalidatePath('/vender/productos');
  if (created) redirect(`/vender/productos/${created.id}/editar`);
  redirect('/vender/productos');
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
