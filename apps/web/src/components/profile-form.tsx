'use client';

import { useActionState } from 'react';
import type { UserDto } from '@marketplace/shared';
import { updateProfileAction } from '@/lib/account-actions';
import type { ActionState } from '@/lib/auth-actions';
import { FormFeedback } from './form-feedback';

const initialState: ActionState = { error: null };

export function ProfileForm({ user }: { user: UserDto }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="field-label">Nombre</span>
        <input
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          defaultValue={user.name}
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">Email</span>
        <input
          type="email"
          value={user.email}
          disabled
          className="field-input bg-zinc-50 text-zinc-400"
        />
        <span className="mt-1 block text-xs text-zinc-400">
          {user.emailVerified ? '✓ Verificado' : 'Sin verificar'}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Teléfono</span>
          <input
            name="phone"
            type="tel"
            maxLength={20}
            defaultValue={user.phone ?? ''}
            placeholder="+54 11 1234-5678"
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Avatar (URL)</span>
          <input
            name="avatarUrl"
            type="url"
            defaultValue={user.avatarUrl ?? ''}
            placeholder="https://…"
            className="field-input"
          />
        </label>
      </div>

      <FormFeedback state={state} okMessage="Datos actualizados" />

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  );
}
