'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { updateCartItemAction } from '@/lib/cart-actions';

const initialState: ActionState = { error: null };

// Controles −/+ de un ítem del carrito. Muestra el error de la API
// (p.ej. stock insuficiente) en vez de silenciarlo.
export function CartQuantity({
  itemId,
  quantity,
  stock,
}: {
  itemId: string;
  quantity: number;
  stock: number;
}) {
  const [state, formAction, pending] = useActionState(
    updateCartItemAction,
    initialState,
  );

  return (
    <div>
      <div className="flex items-center rounded-lg border border-zinc-200">
        <form action={formAction}>
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="quantity" value={quantity - 1} />
          <button
            type="submit"
            aria-label="Restar uno"
            disabled={pending}
            className="px-2.5 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
          >
            −
          </button>
        </form>
        <span className="min-w-8 text-center text-sm font-medium">
          {quantity}
        </span>
        <form action={formAction}>
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="quantity" value={quantity + 1} />
          <button
            type="submit"
            aria-label="Sumar uno"
            disabled={pending || quantity >= stock}
            className="px-2.5 py-1 text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
          >
            +
          </button>
        </form>
      </div>
      {state.error && (
        <p className="mt-1.5 text-xs text-red-600">{state.error}</p>
      )}
    </div>
  );
}
