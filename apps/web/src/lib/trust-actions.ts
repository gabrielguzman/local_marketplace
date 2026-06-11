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

export async function resendVerificationAction(): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  await authFetch(token, '/auth/resend-verification', {
    method: 'POST',
  }).catch(() => undefined);
  redirect('/verificar?enviado=1');
}

export async function createReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const orderId = String(formData.get('orderId') ?? '');
  try {
    await authFetch(
      token,
      `/products/${String(formData.get('productId'))}/reviews`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: Number(formData.get('rating') ?? 0),
          comment: String(formData.get('comment') ?? '') || undefined,
        }),
      },
    );
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/compras/${orderId}`);
  return { error: null };
}

export async function reportProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  try {
    await authFetch(
      token,
      `/products/${String(formData.get('productId'))}/report`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: String(formData.get('reason') ?? 'OTHER'),
          details: String(formData.get('details') ?? '') || undefined,
        }),
      },
    );
  } catch (err) {
    return toActionError(err);
  }
  return { error: null };
}

// ── Acciones de admin ──────────────────────────────────────

export async function adminResolveReportAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/admin/reports/${String(formData.get('reportId'))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: String(formData.get('status')) }),
  }).catch(() => undefined);
  revalidatePath('/admin');
}

export async function adminProductStatusAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(
    token,
    `/admin/products/${String(formData.get('productId'))}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: String(formData.get('status')) }),
    },
  ).catch(() => undefined);
  revalidatePath('/admin');
  revalidatePath('/admin/productos');
}

export async function adminUserStatusAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(
    token,
    `/admin/users/${String(formData.get('userId'))}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: String(formData.get('status')) }),
    },
  ).catch(() => undefined);
  revalidatePath('/admin/usuarios');
}

export async function adminUserRoleAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(
    token,
    `/admin/users/${String(formData.get('userId'))}/role`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: String(formData.get('role')) }),
    },
  ).catch(() => undefined);
  revalidatePath('/admin/usuarios');
}

export async function adminBusinessStatusAction(
  formData: FormData,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(
    token,
    `/admin/businesses/${String(formData.get('businessId'))}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: String(formData.get('status')) }),
    },
  ).catch(() => undefined);
  revalidatePath('/admin');
  revalidatePath('/admin/negocios');
}
