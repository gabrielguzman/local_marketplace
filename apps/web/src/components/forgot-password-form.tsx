'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  if (state.ok) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
        Si el email está registrado, te enviamos un enlace para restablecer la
        contraseña. Revisá tu casilla (y el correo no deseado).
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="field-label">Email</span>
        <input
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className="field-input"
        />
      </label>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Enviando…' : 'Enviar enlace'}
      </button>
    </form>
  );
}
