'use server';

import { redirect } from 'next/navigation';
import type { AuthResponse } from '@marketplace/shared';
import { API_URL, apiFetch } from './api';
import { clearGuestCart, getGuestToken } from './cart-session';
import { extractRefreshToken } from './session-cookies';
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from './session';

export interface ActionState {
  error: string | null;
  // true cuando la acción terminó bien (para mostrar "✓ Guardado")
  ok?: boolean;
}

async function authenticate(
  endpoint: 'login' | 'register',
  payload: Record<string, string>,
): Promise<ActionState | never> {
  const res = await fetch(`${API_URL}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join('. ')
      : (body?.message ?? 'Algo salió mal, probá de nuevo');
    return { error: message };
  }

  const auth = (await res.json()) as AuthResponse;
  await setSessionCookies(auth.accessToken, extractRefreshToken(res));
  await mergeGuestCart(auth.accessToken);
  redirect('/');
}

// Vuelca el carrito de invitado en el del usuario recién logueado.
async function mergeGuestCart(accessToken: string): Promise<void> {
  const guestToken = await getGuestToken();
  if (!guestToken) return;
  await apiFetch('/cart/merge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ guestToken }),
  }).catch(() => undefined);
  await clearGuestCart();
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return authenticate('login', {
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return authenticate('register', {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  });
}

// Parsea el mensaje de error de una respuesta del API
async function errorFrom(res: Response): Promise<string> {
  const body = (await res.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  return Array.isArray(body?.message)
    ? body.message.join('. ')
    : (body?.message ?? 'Algo salió mal, probá de nuevo');
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(formData.get('email') ?? '') }),
  }).catch(() => null);
  // siempre OK: no revelamos si el email existe
  if (!res || (!res.ok && res.status !== 202)) {
    return { error: 'No pudimos procesar el pedido, probá de nuevo' };
  }
  return { error: null, ok: true };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: String(formData.get('token') ?? ''),
      password: String(formData.get('password') ?? ''),
    }),
  });
  if (!res.ok) return { error: await errorFrom(res) };
  redirect('/login?reset=1');
}

export async function logoutAction(): Promise<void> {
  const refresh = await getRefreshToken();
  if (refresh) {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: { cookie: `refresh_token=${refresh}` },
    }).catch(() => undefined);
  }
  await clearSessionCookies();
  redirect('/');
}
