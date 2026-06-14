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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">
            URL del logo{' '}
            <span className="font-normal text-zinc-400">(opcional)</span>
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
            URL del banner{' '}
            <span className="font-normal text-zinc-400">(opcional)</span>
          </span>
          <input
            name="bannerUrl"
            type="url"
            defaultValue={business.bannerUrl ?? ''}
            placeholder="https://…"
            className="field-input"
          />
        </label>
      </div>

      <fieldset className="space-y-4 border-t border-zinc-100 pt-5">
        <legend className="text-sm font-bold tracking-tight">Contacto</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Teléfono</span>
            <input
              name="phone"
              type="tel"
              maxLength={30}
              defaultValue={business.phone ?? ''}
              placeholder="011 4123-4567"
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="field-label">WhatsApp</span>
            <input
              name="whatsapp"
              type="tel"
              maxLength={30}
              defaultValue={business.whatsapp ?? ''}
              placeholder="+54 9 11 1234-5678"
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="field-label">Email</span>
            <input
              name="email"
              type="email"
              maxLength={120}
              defaultValue={business.email ?? ''}
              placeholder="ventas@mitienda.com"
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="field-label">Sitio web</span>
            <input
              name="website"
              type="text"
              maxLength={120}
              defaultValue={business.website ?? ''}
              placeholder="mitienda.com"
              className="field-input"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="field-label">Instagram</span>
            <input
              name="instagram"
              type="text"
              maxLength={60}
              defaultValue={business.instagram ?? ''}
              placeholder="@mitienda"
              className="field-input"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-zinc-100 pt-5">
        <legend className="text-sm font-bold tracking-tight">Ubicación</legend>
        <label className="block">
          <span className="field-label">Dirección</span>
          <input
            name="address"
            type="text"
            maxLength={160}
            defaultValue={business.address ?? ''}
            placeholder="Av. Corrientes 1234"
            className="field-input"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Ciudad</span>
            <input
              name="city"
              type="text"
              maxLength={80}
              defaultValue={business.city ?? ''}
              className="field-input"
            />
          </label>
          <label className="block">
            <span className="field-label">Provincia</span>
            <input
              name="province"
              type="text"
              maxLength={80}
              defaultValue={business.province ?? ''}
              className="field-input"
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t border-zinc-100 pt-5">
        <legend className="text-sm font-bold tracking-tight">Operación</legend>
        <label className="block">
          <span className="field-label">Horarios</span>
          <input
            name="hours"
            type="text"
            maxLength={300}
            defaultValue={business.hours ?? ''}
            placeholder="Lun a Vie de 9 a 18 hs"
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">
            Políticas de la tienda{' '}
            <span className="font-normal text-zinc-400">
              (envíos, cambios, devoluciones)
            </span>
          </span>
          <textarea
            name="policies"
            rows={3}
            maxLength={2000}
            defaultValue={business.policies ?? ''}
            className="field-input"
          />
        </label>
      </fieldset>

      <fieldset className="space-y-4 border-t border-zinc-100 pt-5">
        <legend className="text-sm font-bold tracking-tight">Envíos</legend>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          <input
            name="pickupEnabled"
            type="checkbox"
            defaultChecked={business.pickupEnabled}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Ofrezco retiro en persona (gratis)
        </label>
        <label className="block max-w-xs">
          <span className="field-label">
            Costo de envío a domicilio (ARS){' '}
            <span className="font-normal text-zinc-400">
              (vacío = a coordinar)
            </span>
          </span>
          <input
            name="shippingCost"
            type="number"
            min={0}
            step="0.01"
            defaultValue={
              business.shippingCents != null
                ? business.shippingCents / 100
                : ''
            }
            placeholder="Ej: 2500"
            className="field-input"
          />
        </label>
      </fieldset>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <div className="border-t border-zinc-100 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full sm:w-auto sm:px-10"
        >
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
