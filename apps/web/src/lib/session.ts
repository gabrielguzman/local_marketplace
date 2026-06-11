import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { UserDto } from '@marketplace/shared';
import { apiFetch } from './api';
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieBase,
} from './session-cookies';

export async function setSessionCookies(
  accessToken: string,
  refreshToken: string | null,
): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, accessToken, {
    ...cookieBase,
    maxAge: ACCESS_MAX_AGE,
  });
  if (refreshToken) {
    store.set(REFRESH_COOKIE, refreshToken, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE,
    });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

// Usuario actual para SSR. cache() deduplica dentro del mismo request.
export const getCurrentUser = cache(async (): Promise<UserDto | null> => {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await apiFetch<UserDto>('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
});
