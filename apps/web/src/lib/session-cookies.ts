// Nombres y opciones de las cookies de sesión del frontend (BFF).
// La API entrega su propio refresh_token vía Set-Cookie; acá lo re-empaquetamos
// en cookies del dominio del frontend para poder hacer SSR autenticado.

export const ACCESS_COOKIE = 'mk_access';
export const REFRESH_COOKIE = 'mk_refresh';

export const ACCESS_MAX_AGE = 15 * 60; // igual al TTL del JWT
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export const cookieBase = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
} as const;

// Extrae el refresh_token del Set-Cookie que manda la API
export function extractRefreshToken(res: Response): string | null {
  const cookies = res.headers.getSetCookie();
  const cookie = cookies.find((c) => c.startsWith('refresh_token='));
  if (!cookie) return null;
  return cookie.split(';')[0].slice('refresh_token='.length);
}
