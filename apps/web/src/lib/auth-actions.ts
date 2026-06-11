'use server';

import { redirect } from 'next/navigation';
import type { AuthResponse } from '@marketplace/shared';
import { API_URL } from './api';
import { extractRefreshToken } from './session-cookies';
import {
  clearSessionCookies,
  getRefreshToken,
  setSessionCookies,
} from './session';

export interface ActionState {
  error: string | null;
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
  redirect('/');
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
