'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authFetch } from './api';
import { getAccessToken } from './session';

// Alterna un producto en favoritos. `favorited` es el estado ACTUAL.
export async function toggleFavoriteAction(formData: FormData): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const productId = String(formData.get('productId') ?? '');
  const favorited = formData.get('favorited') === '1';
  const slug = String(formData.get('slug') ?? '');

  await authFetch(token, `/me/favorites/${productId}`, {
    method: favorited ? 'DELETE' : 'PUT',
  }).catch(() => undefined);

  if (slug) revalidatePath(`/p/${slug}`);
  revalidatePath('/favoritos');
}
