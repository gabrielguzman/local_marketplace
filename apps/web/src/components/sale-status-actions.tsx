'use client';

import { useActionState } from 'react';
import type { SubOrderStatus } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { updateSaleStatusAction } from '@/lib/cart-actions';

const initialState: ActionState = { error: null };

export function SaleStatusActions({
  subOrderId,
  actions,
}: {
  subOrderId: string;
  actions: { status: SubOrderStatus; label: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    updateSaleStatusAction,
    initialState,
  );

  if (actions.length === 0 && !state.ok && !state.error) return null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        {actions.map((action) => (
          <form
            key={action.status}
            action={formAction}
            onSubmit={(e) => {
              if (
                action.status === 'CANCELLED' &&
                !confirm('¿Cancelar esta venta? Avisale al comprador.')
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="subOrderId" value={subOrderId} />
            <input type="hidden" name="status" value={action.status} />
            <button
              type="submit"
              disabled={pending}
              className={
                action.status === 'CANCELLED'
                  ? 'btn-secondary !py-1.5 text-xs !text-red-600'
                  : 'btn-primary !py-1.5 text-xs'
              }
            >
              {pending ? '…' : action.label}
            </button>
          </form>
        ))}
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.ok && (
        <p className="text-xs font-medium text-green-600">
          ✓ Estado actualizado
        </p>
      )}
    </div>
  );
}
