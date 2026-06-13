'use client';

import { useActionState } from 'react';
import { changePasswordAction } from '@/lib/account-actions';
import type { ActionState } from '@/lib/auth-actions';
import { FormFeedback } from './form-feedback';

const initialState: ActionState = { error: null };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="field-label">Contraseña actual</span>
        <input
          name="currentPassword"
          type="password"
          required
          className="field-input"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Nueva contraseña</span>
          <input
            name="newPassword"
            type="password"
            required
            minLength={8}
            maxLength={72}
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Repetir nueva</span>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            maxLength={72}
            className="field-input"
          />
        </label>
      </div>

      <FormFeedback state={state} okMessage="Contraseña actualizada" />

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  );
}
