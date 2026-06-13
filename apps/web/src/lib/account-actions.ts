'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiRequestError, authFetch } from './api';
import type { ActionState } from './auth-actions';
import { clearSessionCookies, getAccessToken } from './session';

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
  return { error: null, ok: true };
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
  return { error: null, ok: true };
}

export async function updateAddressAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, `/me/addresses/${String(formData.get('addressId'))}`, {
      method: 'PATCH',
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
  revalidatePath('/cuenta');
  return { error: null, ok: true };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const newPassword = String(formData.get('newPassword') ?? '');
  if (newPassword !== String(formData.get('confirmPassword') ?? '')) {
    return { error: 'Las contraseñas nuevas no coinciden' };
  }

  try {
    await authFetch(token, '/me/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: String(formData.get('currentPassword') ?? ''),
        newPassword,
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  return { error: null, ok: true };
}

export async function deleteAccountAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, '/me', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: String(formData.get('password') ?? '') }),
    });
  } catch (err) {
    return toActionError(err);
  }
  await clearSessionCookies();
  redirect('/');
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
