'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { authFetch } from './api';
import { getAccessToken } from './session';

export async function markNotificationsReadAction(): Promise<void> {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  await authFetch(token, '/me/notifications/read', { method: 'POST' }).catch(
    () => undefined,
  );
  revalidatePath('/notificaciones');
  revalidatePath('/', 'layout');
}
