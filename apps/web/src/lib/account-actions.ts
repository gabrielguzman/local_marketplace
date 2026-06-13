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

// Solo manda al PATCH los campos con valor (evita pisar con strings vacíos)
function optional(form: FormData, key: string): string | undefined {
  const value = String(form.get(key) ?? '').trim();
  return value === '' ? undefined : value;
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, '/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: optional(formData, 'name'),
        phone: optional(formData, 'phone'),
        avatarUrl: optional(formData, 'avatarUrl'),
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath('/cuenta');
  return { error: null };
}

export async function createAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, '/me/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        street: String(formData.get('street') ?? ''),
        number: String(formData.get('number') ?? ''),
        city: String(formData.get('city') ?? ''),
        province: String(formData.get('province') ?? ''),
        zipCode: String(formData.get('zipCode') ?? ''),
        isDefault: formData.get('isDefault') === 'on',
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath('/cuenta');
  return { error: null };
}

export async function setDefaultAddressAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/me/addresses/${String(formData.get('addressId'))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isDefault: true }),
  }).catch(() => undefined);
  revalidatePath('/cuenta');
}

export async function deleteAddressAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/me/addresses/${String(formData.get('addressId'))}`, {
    method: 'DELETE',
  }).catch(() => undefined);
  revalidatePath('/cuenta');
}
