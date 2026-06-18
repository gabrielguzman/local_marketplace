import 'server-only';
import { authFetch } from './api';
import { getAccessToken } from './session';

// Compras del usuario actual en una tienda (0 si no hay sesión).
export async function getStoreLoyalty(businessId: string): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;
  const res = await authFetch<{ purchases: number }>(
    token,
    `/businesses/${businessId}/loyalty`,
  ).catch(() => ({ purchases: 0 }));
  return res.purchases;
}
