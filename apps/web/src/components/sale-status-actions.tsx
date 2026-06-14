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
              const form = e.currentTarget;
              if (action.status === 'SHIPPED') {
                const code = prompt(
                  'Número de seguimiento (opcional, podés dejarlo vacío):',
                  '',
                );
                if (code === null) {
                  e.preventDefault();
                  return;
                }
                (
                  form.querySelector(
                    'input[name="trackingCode"]',
                  ) as HTMLInputElement
                ).value = code.trim();
              }
              if (action.status === 'CANCELLED') {
                const reason = prompt(
                  '¿Por qué cancelás la venta? (el comprador lo va a ver)',
                  '',
                );
                if (reason === null || reason.trim() === '') {
                  e.preventDefault();
                  return;
                }
                (
                  form.querySelector(
                    'input[name="cancelReason"]',
                  ) as HTMLInputElement
                ).value = reason.trim();
              }
            }}
          >
            <input type="hidden" name="subOrderId" value={subOrderId} />
            <input type="hidden" name="status" value={action.status} />
            <input type="hidden" name="trackingCode" value="" />
            <input type="hidden" name="cancelReason" value="" />
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
