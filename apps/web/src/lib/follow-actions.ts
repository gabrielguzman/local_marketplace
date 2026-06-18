'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authFetch } from './api';
import { getAccessToken } from './session';

// Alterna seguir/dejar de seguir una tienda. `following` es el estado ACTUAL.
export async function toggleFollowAction(
  businessId: string,
  following: boolean,
  slug?: string,
): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  await authFetch(token, `/businesses/${businessId}/follow`, {
    method: following ? 'DELETE' : 'PUT',
  }).catch(() => undefined);

  if (slug) revalidatePath(`/tienda/${slug}`);
  revalidatePath('/siguiendo');
}
