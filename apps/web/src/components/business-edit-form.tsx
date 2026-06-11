'use client';

import { useActionState } from 'react';
import type { BusinessDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { updateBusinessAction } from '@/lib/seller-actions';

const initialState: ActionState = { error: null };

export function BusinessEditForm({ business }: { business: BusinessDto }) {
  const [state, formAction, pending] = useActionState(
    updateBusinessAction,
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
          defaultValue={business.name}
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">Descripción</span>
        <textarea
          name="description"
          rows={4}
          maxLength={2000}
          defaultValue={business.description}
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">
          URL del logo <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <input
          name="logoUrl"
          type="url"
          defaultValue={business.logoUrl ?? ''}
          placeholder="https://…"
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">
          URL del banner <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <input
          name="bannerUrl"
          type="url"
          defaultValue={business.bannerUrl ?? ''}
          placeholder="https://…"
          className="field-input"
        />
      </label>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
