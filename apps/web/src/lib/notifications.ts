import 'server-only';
import type { NotificationsResponse } from '@marketplace/shared';
import { authFetch } from './api';
import { getAccessToken } from './session';

const EMPTY: NotificationsResponse = { items: [], unreadCount: 0 };

export async function getNotifications(): Promise<NotificationsResponse> {
  const token = await getAccessToken();
  if (!token) return EMPTY;
  return authFetch<NotificationsResponse>(token, '/me/notifications').catch(
    () => EMPTY,
  );
}

export async function getUnreadCount(): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;
  return authFetch<{ count: number }>(token, '/me/notifications/unread-count')
    .then((r) => r.count)
    .catch(() => 0);
}
