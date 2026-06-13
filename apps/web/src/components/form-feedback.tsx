'use client';

import type { ActionState } from '@/lib/auth-actions';

// Muestra el resultado de una acción: error (rojo) o éxito (verde).
// Pensado para usarse con useActionState.
export function FormFeedback({
  state,
  okMessage = 'Guardado',
}: {
  state: ActionState;
  okMessage?: string;
}) {
  if (state.error) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
        <span aria-hidden="true">⚠️</span> {state.error}
      </p>
    );
  }

  if (state.ok) {
    return (
      <p
        role="status"
        className="flex items-center gap-2 rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700"
      >
        <span aria-hidden="true">✓</span> {okMessage}
      </p>
    );
  }

  return null;
}
