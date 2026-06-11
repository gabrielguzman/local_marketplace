'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { checkoutAction } from '@/lib/cart-actions';

const initialState: ActionState = { error: null };

export function CheckoutForm() {
  const [state, formAction, pending] = useActionState(
    checkoutAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-[1fr_110px] gap-4">
        <label className="block">
          <span className="field-label">Calle</span>
          <input name="street" type="text" required maxLength={120} className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">Número</span>
          <input name="number" type="text" required maxLength={10} className="field-input" />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Ciudad</span>
          <input name="city" type="text" required maxLength={80} className="field-input" />
        </label>
        <label className="block">
          <span className="field-label">Provincia</span>
          <input name="province" type="text" required maxLength={80} className="field-input" />
        </label>
      </div>

      <label className="block max-w-40">
        <span className="field-label">Código postal</span>
        <input name="zipCode" type="text" required maxLength={12} className="field-input" />
      </label>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Creando orden…' : 'Confirmar compra'}
      </button>
      <p className="text-center text-xs text-zinc-400">
        Después de confirmar vas a poder pagar la orden.
      </p>
    </form>
  );
}
