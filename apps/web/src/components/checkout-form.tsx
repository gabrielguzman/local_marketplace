'use client';

import { useActionState, useMemo, useState } from 'react';
import type {
  AddressDto,
  CartDto,
  CartItemDto,
  ShippingMethod,
} from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { checkoutAction } from '@/lib/cart-actions';
import { formatPrice } from '@/lib/format';

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

interface Group {
  businessId: string;
  name: string;
  pickupEnabled: boolean;
  shippingCents: number | null;
  subtotalCents: number;
}

function groupByBusiness(items: CartItemDto[]): Group[] {
  const map = new Map<string, Group>();
  for (const item of items) {
    const b = item.business;
    const g = map.get(b.id) ?? {
      businessId: b.id,
      name: b.name,
      pickupEnabled: b.pickupEnabled,
      shippingCents: b.shippingCents,
      subtotalCents: 0,
    };
    g.subtotalCents += item.variant.priceCents * item.quantity;
    map.set(b.id, g);
  }
  return [...map.values()];
}

function defaultMethod(g: Group): ShippingMethod {
  if (g.shippingCents != null) return 'SHIPPING';
  if (g.pickupEnabled) return 'PICKUP';
  return 'TO_AGREE';
}

export function CheckoutForm({
  cart,
  addresses,
}: {
  cart: CartDto;
  addresses: AddressDto[];
}) {
  const [state, formAction, pending] = useActionState(
    checkoutAction,
    initialState,
  );

  const groups = useMemo(() => groupByBusiness(cart.items), [cart.items]);

  const defaultAddress =
    addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;
  const [selectedId, setSelectedId] = useState(defaultAddress?.id ?? '');
  const [fields, setFields] = useState<Fields>(
    defaultAddress ? toFields(defaultAddress) : EMPTY,
  );
  const [methods, setMethods] = useState<Record<string, ShippingMethod>>(() =>
    Object.fromEntries(groups.map((g) => [g.businessId, defaultMethod(g)])),
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

  const itemsTotal = cart.totalCents;
  const shippingTotal = groups.reduce(
    (sum, g) =>
      sum +
      (methods[g.businessId] === 'SHIPPING' ? (g.shippingCents ?? 0) : 0),
    0,
  );
  const total = itemsTotal + shippingTotal;

  const shippingPayload = groups.map((g) => ({
    businessId: g.businessId,
    method: methods[g.businessId],
  }));

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="shipping"
        value={JSON.stringify(shippingPayload)}
      />

      {/* ── Dirección ── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold tracking-tight">
          Dirección de envío
        </h2>
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
            <input name="street" type="text" required maxLength={120} value={fields.street} onChange={(e) => setField('street', e.target.value)} className="field-input" />
          </label>
          <label className="block">
            <span className="field-label">Número</span>
            <input name="number" type="text" required maxLength={10} value={fields.number} onChange={(e) => setField('number', e.target.value)} className="field-input" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="field-label">Ciudad</span>
            <input name="city" type="text" required maxLength={80} value={fields.city} onChange={(e) => setField('city', e.target.value)} className="field-input" />
          </label>
          <label className="block">
            <span className="field-label">Provincia</span>
            <input name="province" type="text" required maxLength={80} value={fields.province} onChange={(e) => setField('province', e.target.value)} className="field-input" />
          </label>
        </div>
        <label className="block max-w-40">
          <span className="field-label">Código postal</span>
          <input name="zipCode" type="text" required maxLength={12} value={fields.zipCode} onChange={(e) => setField('zipCode', e.target.value)} className="field-input" />
        </label>
        {!usingSaved && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input name="saveAddress" type="checkbox" className="h-4 w-4 rounded border-zinc-300" />
            Guardar esta dirección en mi cuenta
          </label>
        )}
      </section>

      {/* ── Envío por tienda ── */}
      <section className="space-y-3">
        <h2 className="text-base font-bold tracking-tight">Envío</h2>
        {groups.map((g) => {
          const options: { method: ShippingMethod; label: string; cost: number }[] =
            [];
          if (g.shippingCents != null) {
            options.push({
              method: 'SHIPPING',
              label: 'Envío a domicilio',
              cost: g.shippingCents,
            });
          }
          if (g.pickupEnabled) {
            options.push({ method: 'PICKUP', label: 'Retiro en persona', cost: 0 });
          }
          return (
            <div key={g.businessId} className="surface-card p-4">
              <p className="mb-2 text-sm font-semibold text-zinc-700">
                🏪 {g.name}
              </p>
              {options.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  A coordinar con el vendedor (sin costo en este paso).
                </p>
              ) : (
                <div className="space-y-1.5">
                  {options.map((o) => (
                    <label
                      key={o.method}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3.5 py-2 text-sm transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/50"
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`method-${g.businessId}`}
                          checked={methods[g.businessId] === o.method}
                          onChange={() =>
                            setMethods((m) => ({
                              ...m,
                              [g.businessId]: o.method,
                            }))
                          }
                          className="h-4 w-4"
                        />
                        {o.label}
                      </span>
                      <span className="font-medium">
                        {o.cost === 0 ? 'Gratis' : formatPrice(o.cost, cart.currency)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* ── Resumen ── */}
      <section className="surface-card p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-500">
            <dt>Productos</dt>
            <dd>{formatPrice(itemsTotal, cart.currency)}</dd>
          </div>
          <div className="flex justify-between text-zinc-500">
            <dt>Envío</dt>
            <dd>
              {shippingTotal === 0
                ? 'Gratis / a coordinar'
                : formatPrice(shippingTotal, cart.currency)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold text-zinc-900">
            <dt>Total</dt>
            <dd>{formatPrice(total, cart.currency)}</dd>
          </div>
        </dl>
      </section>

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
