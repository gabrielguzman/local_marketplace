'use server';

import type { MessageThread } from '@marketplace/shared';
import { authFetch } from './api';
import { getAccessToken } from './session';

export async function getOrderThreadAction(
  subOrderId: string,
): Promise<MessageThread | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return authFetch<MessageThread>(
    token,
    `/suborders/${subOrderId}/messages`,
  ).catch(() => null);
}

export async function sendOrderMessageAction(
  subOrderId: string,
  body: string,
): Promise<MessageThread | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const text = body.trim();
  if (!text) return null;
  return authFetch<MessageThread>(token, `/suborders/${subOrderId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: text }),
  }).catch(() => null);
}
