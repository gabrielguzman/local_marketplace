'use client';

import { useActionState, useState } from 'react';
import { deleteAccountAction } from '@/lib/account-actions';
import type { ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

export function DeleteAccountForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteAccountAction,
    initialState,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-600 hover:underline"
      >
        Eliminar mi cuenta
      </button>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            'Vas a eliminar tu cuenta de forma permanente. ¿Continuar?',
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-3 rounded-xl border border-red-200 bg-red-50/50 p-4"
    >
      <p className="text-sm text-zinc-600">
        Se borran tus datos personales y direcciones, y tu cuenta queda
        inutilizable. Confirmá con tu contraseña.
      </p>
      <input
        name="password"
        type="password"
        required
        placeholder="Tu contraseña"
        className="field-input max-w-xs"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-400 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
