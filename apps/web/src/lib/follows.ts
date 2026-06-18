import 'server-only';
import { cache } from 'react';
import { authFetch } from './api';
import { getAccessToken } from './session';

// Set de ids de tiendas que sigue el usuario (vacío si no hay sesión).
// cache(): una sola llamada por render aunque la pidan varias secciones.
export const getFollowingIds = cache(async (): Promise<Set<string>> => {
  const token = await getAccessToken();
  if (!token) return new Set();
  const ids = await authFetch<string[]>(token, '/me/following/ids').catch(
    () => [],
  );
  return new Set(ids);
});
