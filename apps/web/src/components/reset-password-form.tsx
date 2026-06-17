'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <label className="block">
        <span className="field-label">Nueva contraseña</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres"
          className="field-input"
        />
      </label>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
