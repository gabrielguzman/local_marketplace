import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { NotificationType } from '@marketplace/shared';
import { markNotificationsReadAction } from '@/lib/notification-actions';
import { getNotifications } from '@/lib/notifications';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Notificaciones' };
export const dynamic = 'force-dynamic';

const ICON: Record<NotificationType, string> = {
  SALE: '💰',
  ORDER_STATUS: '📦',
  QUESTION: '❓',
  QUESTION_ANSWERED: '💬',
  REVIEW_REPLY: '⭐',
};

export default async function NotificationsPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const { items, unreadCount } = await getNotifications();

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Notificaciones{' '}
          {unreadCount > 0 && (
            <span className="align-middle text-sm font-normal text-zinc-400">
              ({unreadCount} sin leer)
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <form action={markNotificationsReadAction}>
            <button
              type="submit"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Marcar todas como leídas
            </button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-md py-16 text-center">
          <p className="text-5xl">🔔</p>
          <p className="mt-4 font-medium text-zinc-700">
            No tenés notificaciones
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Acá vas a ver tus ventas, respuestas y el estado de tus compras.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const inner = (
              <div
                className={`flex gap-3 rounded-xl border p-4 transition ${
                  n.read
                    ? 'border-zinc-200 bg-white'
                    : 'border-brand-200 bg-brand-50/40'
                } ${n.link ? 'hover:border-brand-300' : ''}`}
              >
                <span className="text-xl" aria-hidden="true">
                  {ICON[n.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                    {n.title}
                    {!n.read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    )}
                  </p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(n.createdAt).toLocaleString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? <Link href={n.link}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
