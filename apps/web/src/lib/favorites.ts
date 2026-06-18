import 'server-only';
import { cache } from 'react';
import type { ProductSummaryDto } from '@marketplace/shared';
import { authFetch } from './api';
import { getAccessToken } from './session';

// Lista de productos favoritos del usuario actual (vacía si no hay sesión)
export async function getFavorites(): Promise<ProductSummaryDto[]> {
  const token = await getAccessToken();
  if (!token) return [];
  return authFetch<ProductSummaryDto[]>(token, '/me/favorites').catch(() => []);
}

// Set de ids favoritos, para marcar corazones en listados/detalle.
// cache(): si varias secciones lo piden en el mismo render, una sola llamada.
export const getFavoriteIds = cache(async (): Promise<Set<string>> => {
  const token = await getAccessToken();
  if (!token) return new Set();
  const ids = await authFetch<string[]>(token, '/me/favorites/ids').catch(
    () => [],
  );
  return new Set(ids);
});
