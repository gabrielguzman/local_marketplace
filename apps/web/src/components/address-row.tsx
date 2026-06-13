'use client';

import { useActionState, useState } from 'react';
import type { AddressDto } from '@marketplace/shared';
import {
  deleteAddressAction,
  setDefaultAddressAction,
  updateAddressAction,
} from '@/lib/account-actions';
import type { ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

export function AddressRow({ address }: { address: AddressDto }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateAddressAction,
    initialState,
  );

  if (editing && !state.ok) {
    return (
      <li className="rounded-xl border border-brand-200 p-4">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="addressId" value={address.id} />
          <div className="grid grid-cols-[1fr_90px] gap-3">
            <label className="block">
              <span className="field-label">Calle</span>
              <input name="street" defaultValue={address.street} required maxLength={120} className="field-input !py-1.5" />
            </label>
            <label className="block">
              <span className="field-label">Número</span>
              <input name="number" defaultValue={address.number} required maxLength={10} className="field-input !py-1.5" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="field-label">Ciudad</span>
              <input name="city" defaultValue={address.city} required maxLength={80} className="field-input !py-1.5" />
            </label>
            <label className="block">
              <span className="field-label">Provincia</span>
              <input name="province" defaultValue={address.province} required maxLength={80} className="field-input !py-1.5" />
            </label>
            <label className="block">
              <span className="field-label">CP</span>
              <input name="zipCode" defaultValue={address.zipCode} required maxLength={12} className="field-input !py-1.5" />
            </label>
          </div>
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="btn-primary !px-3 !py-1.5 text-xs">
              {pending ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-zinc-400 hover:underline">
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">
          {address.street} {address.number}
          {address.isDefault && (
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              Principal
            </span>
          )}
        </p>
        <p className="text-sm text-zinc-500">
          {address.city}, {address.province} (CP {address.zipCode})
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-xs">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-medium text-brand-600 hover:underline"
        >
          Editar
        </button>
        {!address.isDefault && (
          <form action={setDefaultAddressAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <button type="submit" className="font-medium text-zinc-500 hover:text-zinc-900 hover:underline">
              Hacer principal
            </button>
          </form>
        )}
        <form
          action={deleteAddressAction}
          onSubmit={(e) => {
            if (!confirm('¿Eliminar esta dirección?')) e.preventDefault();
          }}
        >
          <input type="hidden" name="addressId" value={address.id} />
          <button type="submit" className="text-zinc-400 hover:text-red-600 hover:underline">
            Eliminar
          </button>
        </form>
      </div>
    </li>
  );
}
