'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { ZONA_COOKIE } from './zona';

export async function setZonaAction(formData: FormData): Promise<void> {
  const province = String(formData.get('province') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const store = await cookies();

  if (!province) {
    store.delete(ZONA_COOKIE);
  } else {
    store.set(ZONA_COOKIE, JSON.stringify({ province, city: city || undefined }), {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
    });
  }
  // re-renderiza todo (home, tiendas, header) con la nueva zona
  revalidatePath('/', 'layout');
}
