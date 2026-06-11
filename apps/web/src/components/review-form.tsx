'use client';

import { useActionState, useState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { createReviewAction } from '@/lib/trust-actions';

const initialState: ActionState = { error: null };

export function ReviewForm({
  productId,
  orderId,
  productTitle,
}: {
  productId: string;
  orderId: string;
  productTitle: string;
}) {
  const [state, formAction, pending] = useActionState(
    createReviewAction,
    initialState,
  );
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [sent, setSent] = useState(false);

  if (sent && !state.error) {
    return <p className="text-xs text-green-600">¡Gracias por tu reseña!</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        ★ Calificar
      </button>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setSent(true)}
      className="mt-2 w-full space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="rating" value={rating} />

      <p className="text-xs font-medium text-zinc-600">
        ¿Qué te pareció {productTitle}?
      </p>
      <div className="flex gap-1 text-xl">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} estrellas`}
            onClick={() => setRating(value)}
            className={
              value <= rating ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-300'
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
        placeholder="Contanos tu experiencia (opcional)"
        className="field-input !py-2 text-xs"
      />
      {state.error && (
        <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary !px-3 !py-1.5 text-xs">
          {pending ? 'Enviando…' : 'Publicar reseña'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-400 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
