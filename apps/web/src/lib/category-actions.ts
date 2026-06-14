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

function revalidateAll(): void {
  revalidatePath('/admin/categorias');
  revalidatePath('/', 'layout'); // el header muestra las categorías
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const parentId = String(formData.get('parentId') ?? '');
  try {
    await authFetch(token, '/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(formData.get('name') ?? ''),
        parentId: parentId || undefined,
      }),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidateAll();
  return { error: null, ok: true };
}

export async function renameCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, `/categories/${String(formData.get('id'))}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: String(formData.get('name') ?? '') }),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidateAll();
  return { error: null, ok: true };
}

export async function deleteCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(token, `/categories/${String(formData.get('id'))}`, {
      method: 'DELETE',
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidateAll();
  return { error: null, ok: true };
}
