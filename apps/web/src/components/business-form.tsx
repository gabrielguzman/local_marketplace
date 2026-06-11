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
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Nombre del negocio
        </span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={60}
          placeholder="Ej: Almacén Doña Rosa"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Descripción <span className="text-zinc-400">(opcional)</span>
        </span>
        <textarea
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Contale a tus clientes qué vendés"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? 'Creando…' : 'Crear mi negocio'}
      </button>
    </form>
  );
}
