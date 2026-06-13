'use client';

import { useActionState, useState } from 'react';
import type { AddressDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { checkoutAction } from '@/lib/cart-actions';

const initialState: ActionState = { error: null };

type Fields = {
  street: string;
  number: string;
  city: string;
  province: string;
  zipCode: string;
};

const EMPTY: Fields = {
  street: '',
  number: '',
  city: '',
  province: '',
  zipCode: '',
};

function toFields(a: AddressDto): Fields {
  return {
    street: a.street,
    number: a.number,
    city: a.city,
    province: a.province,
    zipCode: a.zipCode,
  };
}

export function CheckoutForm({ addresses }: { addresses: AddressDto[] }) {
  const [state, formAction, pending] = useActionState(
    checkoutAction,
    initialState,
  );

  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  // '' = dirección nueva; si no, el id de una guardada
  const [selectedId, setSelectedId] = useState(defaultAddress?.id ?? '');
  const [fields, setFields] = useState<Fields>(
    defaultAddress ? toFields(defaultAddress) : EMPTY,
  );

  const usingSaved = selectedId !== '';

  function pickAddress(id: string) {
    setSelectedId(id);
    const address = addresses.find((a) => a.id === id);
    setFields(address ? toFields(address) : EMPTY);
  }

  function setField(key: keyof Fields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-4">
      {addresses.length > 0 && (
        <label className="block">
          <span className="field-label">Usar una dirección guardada</span>
          <select
            value={selectedId}
            onChange={(e) => pickAddress(e.target.value)}
            className="field-input"
          >
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.street} {address.number}, {address.city}
                {address.isDefault ? ' (principal)' : ''}
              </option>
            ))}
            <option value="">Otra dirección…</option>
          </select>
        </label>
      )}

      <div className="grid grid-cols-[1fr_110px] gap-4">
        <label className="block">
          <span className="field-label">Calle</span>
          <input
            name="street"
            type="text"
            required
            maxLength={120}
            value={fields.street}
            onChange={(e) => setField('street', e.target.value)}
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Número</span>
          <input
            name="number"
            type="text"
            required
            maxLength={10}
            value={fields.number}
            onChange={(e) => setField('number', e.target.value)}
            className="field-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Ciudad</span>
          <input
            name="city"
            type="text"
            required
            maxLength={80}
            value={fields.city}
            onChange={(e) => setField('city', e.target.value)}
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Provincia</span>
          <input
            name="province"
            type="text"
            required
            maxLength={80}
            value={fields.province}
            onChange={(e) => setField('province', e.target.value)}
            className="field-input"
          />
        </label>
      </div>

      <label className="block max-w-40">
        <span className="field-label">Código postal</span>
        <input
          name="zipCode"
          type="text"
          required
          maxLength={12}
          value={fields.zipCode}
          onChange={(e) => setField('zipCode', e.target.value)}
          className="field-input"
        />
      </label>

      {!usingSaved && (
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            name="saveAddress"
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300"
          />
          Guardar esta dirección en mi cuenta
        </label>
      )}

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Creando orden…' : 'Confirmar compra'}
      </button>
      <p className="text-center text-xs text-zinc-400">
        Después de confirmar vas a poder pagar la orden.
      </p>
    </form>
  );
}
