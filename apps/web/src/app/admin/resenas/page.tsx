import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminReviewDto } from '@marketplace/shared';
import { ConfirmForm } from '@/components/confirm-form';
import { authFetch } from '@/lib/api';
import {
  adminDeleteReviewAction,
  adminDismissReviewReportsAction,
} from '@/lib/trust-actions';
import { getAccessToken } from '@/lib/session';

export const metadata: Metadata = { title: 'Reseñas denunciadas' };
export const dynamic = 'force-dynamic';

export default async function AdminReviewsPage() {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const reviews = await authFetch<AdminReviewDto[]>(
    token,
    '/admin/reviews/reported',
  ).catch(() => []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Reseñas denunciadas{' '}
        <span className="text-sm font-normal text-zinc-400">
          ({reviews.length})
        </span>
      </h1>

      {reviews.length === 0 ? (
        <div className="surface-card border-dashed p-12 text-center text-zinc-500">
          🎉 No hay reseñas denunciadas.
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-amber-500" aria-hidden="true">
                    {'★'.repeat(review.rating)}
                    <span className="text-zinc-200">
                      {'★'.repeat(5 - review.rating)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-700">
                    “{review.comment || 'Sin comentario'}”
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {review.authorName} · en{' '}
                    <Link
                      href={`/p/${review.productSlug}`}
                      className="text-brand-600 hover:underline"
                    >
                      {review.productTitle}
                    </Link>
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                  {review.reportCount}{' '}
                  {review.reportCount === 1 ? 'denuncia' : 'denuncias'}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <ConfirmForm
                  action={adminDeleteReviewAction}
                  fields={{ reviewId: review.id }}
                  confirmText="¿Borrar esta reseña? No se puede deshacer."
                >
                  <button
                    type="submit"
                    className="btn-secondary !py-1.5 text-xs !text-red-600"
                  >
                    Borrar reseña
                  </button>
                </ConfirmForm>
                <form action={adminDismissReviewReportsAction}>
                  <input type="hidden" name="reviewId" value={review.id} />
                  <button
                    type="submit"
                    className="text-xs text-zinc-400 hover:underline"
                  >
                    Descartar denuncias
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
