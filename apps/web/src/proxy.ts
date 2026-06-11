import { NextResponse, type NextRequest } from 'next/server';
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieBase,
  extractRefreshToken,
} from './lib/session-cookies';

const API_URL = process.env.API_URL ?? 'http://localhost:3001/api/v1';

// Si el access token venció pero hay refresh, renovamos la sesión acá:
// los server components no pueden escribir cookies, el proxy sí.
export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE);
  const refresh = request.cookies.get(REFRESH_COOKIE);
  if (access || !refresh) return NextResponse.next();

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { cookie: `refresh_token=${refresh.value}` },
  }).catch(() => null);

  if (!res || !res.ok) {
    const response = NextResponse.next();
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  const { accessToken } = (await res.json()) as { accessToken: string };
  const newRefresh = extractRefreshToken(res);

  // que el render de ESTE request ya vea la sesión renovada
  request.cookies.set(ACCESS_COOKIE, accessToken);
  const response = NextResponse.next({ request });

  response.cookies.set(ACCESS_COOKIE, accessToken, {
    ...cookieBase,
    maxAge: ACCESS_MAX_AGE,
  });
  if (newRefresh) {
    response.cookies.set(REFRESH_COOKIE, newRefresh, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE,
    });
  }
  return response;
}

export const config = {
  // todo menos assets estáticos
  matcher: ['/((?!_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)).*)'],
};
