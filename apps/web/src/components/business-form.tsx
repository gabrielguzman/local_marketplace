'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { createBusinessAction } from '@/lib/seller-actions';

const initialState: ActionState = { error: null };

export function BusinessForm() {
  const [state, formAction, pending] = useActionState(
    createBusinessAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="field-label">Nombre del negocio</span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={60}
          placeholder="Ej: Almacén Doña Rosa"
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">
          Descripción <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Contale a tus clientes qué vendés"
          className="field-input"
        />
      </label>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Creando…' : 'Crear mi negocio'}
      </button>
    </form>
  );
}
