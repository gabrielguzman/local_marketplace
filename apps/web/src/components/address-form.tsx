'use client';

import { useActionState, useRef } from 'react';
import { createAddressAction } from '@/lib/account-actions';
import type { ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

export function AddressForm() {
  const [state, formAction, pending] = useActionState(
    createAddressAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-4"
    >
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

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input name="isDefault" type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
        Usar como dirección principal
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? 'Guardando…' : 'Agregar dirección'}
      </button>
    </form>
  );
}
