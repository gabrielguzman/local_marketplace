'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { addToCartAction } from '@/lib/cart-actions';

const initialState: ActionState = { error: null };

export function AddToCart({
  variantId,
  disabled,
}: {
  variantId: string;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    addToCartAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="variantId" value={variantId} />
      <input type="hidden" name="quantity" value={1} />
      <button
        type="submit"
        disabled={disabled || pending}
        className="btn-primary w-full"
      >
        {pending ? 'Agregando…' : disabled ? 'Sin stock' : 'Agregar al carrito'}
      </button>
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
