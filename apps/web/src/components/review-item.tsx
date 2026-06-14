'use client';

import { useActionState, useState } from 'react';
import type { ReviewDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import {
  deleteReviewAction,
  editReviewAction,
  replyReviewAction,
  reportReviewAction,
  voteReviewHelpfulAction,
} from '@/lib/trust-actions';

const initialState: ActionState = { error: null };

function StarRow({ rating }: { rating: number }) {
  return (
    <span aria-hidden="true" className="text-sm text-amber-500">
      {'★'.repeat(rating)}
      <span className="text-zinc-200">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewItem({
  review,
  productSlug,
  isMine,
  canReply,
  canReport,
  canVote,
}: {
  review: ReviewDto;
  productSlug: string;
  isMine: boolean;
  canReply: boolean;
  canReport: boolean;
  canVote: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [reported, setReported] = useState(false);
  const [rating, setRating] = useState(review.rating);

  const [editState, editAction, editing_] = useActionState(
    editReviewAction,
    initialState,
  );
  const [replyState, replyAction, replying_] = useActionState(
    replyReviewAction,
    initialState,
  );

  const hidden = (
    <>
      <input type="hidden" name="productId" value={review.productId} />
      <input type="hidden" name="reviewId" value={review.id} />
      <input type="hidden" name="slug" value={productSlug} />
    </>
  );

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <StarRow rating={review.rating} />
        <span className="text-xs font-medium text-zinc-600">
          {review.authorName}
        </span>
        <span className="text-xs text-zinc-400">
          ·{' '}
          {new Date(review.createdAt).toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long',
          })}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
          ✓ Compra verificada
        </span>
        {isMine && !editing && (
          <span className="ml-auto flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setRating(review.rating);
                setEditing(true);
              }}
              className="font-medium text-brand-600 hover:underline"
            >
              Editar
            </button>
            <form
              action={deleteReviewAction}
              onSubmit={(e) => {
                if (!confirm('¿Borrar tu reseña?')) e.preventDefault();
              }}
            >
              {hidden}
              <button
                type="submit"
                className="text-zinc-400 hover:text-red-600 hover:underline"
              >
                Borrar
              </button>
            </form>
          </span>
        )}
        {canReport && !isMine && (
          <span className="ml-auto text-xs">
            {reported ? (
              <span className="text-zinc-400">Denunciada ✓</span>
            ) : (
              <form
                action={reportReviewAction}
                onSubmit={() => setReported(true)}
              >
                {hidden}
                <button
                  type="submit"
                  className="text-zinc-400 hover:text-red-600 hover:underline"
                >
                  Denunciar
                </button>
              </form>
            )}
          </span>
        )}
      </div>

      {editing ? (
        <form action={editAction} className="mt-2 space-y-2">
          {hidden}
          <input type="hidden" name="rating" value={rating} />
          <div className="flex gap-1 text-xl">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} estrellas`}
                onClick={() => setRating(value)}
                className={
                  value <= rating
                    ? 'text-amber-500'
                    : 'text-zinc-300 hover:text-amber-300'
                }
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            name="comment"
            rows={2}
            maxLength={2000}
            defaultValue={review.comment}
            className="field-input !py-2 text-sm"
          />
          {editState.error && (
            <p className="text-xs text-red-600">{editState.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={editing_}
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              {editing_ ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-zinc-400 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        review.comment && (
          <p className="mt-1.5 text-sm leading-6 text-zinc-600">
            {review.comment}
          </p>
        )
      )}

      {/* Respuesta del vendedor */}
      {review.sellerResponse && (
        <div className="mt-2.5 rounded-lg border-l-2 border-brand-200 bg-brand-50/40 py-2 pl-3 pr-2">
          <p className="text-xs font-semibold text-brand-700">
            Respuesta del vendedor
          </p>
          <p className="mt-0.5 text-sm leading-6 text-zinc-600">
            {review.sellerResponse}
          </p>
        </div>
      )}

      {canReply && !review.sellerResponse && !replying && (
        <button
          type="button"
          onClick={() => setReplying(true)}
          className="mt-2 text-xs font-medium text-brand-600 hover:underline"
        >
          Responder
        </button>
      )}

      {replying && (
        <form action={replyAction} className="mt-2 space-y-2">
          {hidden}
          <textarea
            name="response"
            rows={2}
            required
            maxLength={2000}
            placeholder="Respondé públicamente a esta reseña"
            className="field-input !py-2 text-sm"
          />
          {replyState.error && (
            <p className="text-xs text-red-600">{replyState.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={replying_}
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              {replying_ ? 'Enviando…' : 'Publicar respuesta'}
            </button>
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="text-xs text-zinc-400 hover:underline"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* "¿Te resultó útil?" */}
      <div className="mt-2.5 flex items-center gap-3 text-xs">
        {canVote && !isMine ? (
          <form action={voteReviewHelpfulAction}>
            {hidden}
            <button
              type="submit"
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition ${
                review.votedHelpful
                  ? 'border-brand-300 bg-brand-50 text-brand-700'
                  : 'border-zinc-200 text-zinc-500 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              👍 Útil{review.helpfulCount > 0 && ` (${review.helpfulCount})`}
            </button>
          </form>
        ) : (
          review.helpfulCount > 0 && (
            <span className="text-zinc-400">
              👍 {review.helpfulCount}{' '}
              {review.helpfulCount === 1
                ? 'persona la encontró útil'
                : 'personas la encontraron útil'}
            </span>
          )
        )}
      </div>
    </li>
  );
}
