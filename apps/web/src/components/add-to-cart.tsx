'use client';

import { useActionState, useState } from 'react';
import type { ProductVariantDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { addToCartAction } from '@/lib/cart-actions';
import { formatPrice } from '@/lib/format';

const initialState: ActionState = { error: null };
const MAX_PER_PURCHASE = 10;

function variantLabel(variant: ProductVariantDto) {
  return Object.values(variant.attributes).join(' · ') || 'Estándar';
}

// Caja de compra: precio + variante + cantidad + agregar al carrito.
// El precio y el stock siguen a la variante seleccionada.
export function BuyBox({ variants }: { variants: ProductVariantDto[] }) {
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];
  const [selectedId, setSelectedId] = useState(defaultVariant.id);
  const [quantity, setQuantity] = useState(1);
  const [state, formAction, pending] = useActionState(
    addToCartAction,
    initialState,
  );

  const selected = variants.find((v) => v.id === selectedId) ?? defaultVariant;
  const maxQuantity = Math.min(selected.stock, MAX_PER_PURCHASE);

  function selectVariant(id: string) {
    setSelectedId(id);
    setQuantity(1);
  }

  return (
    <div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight">
        {formatPrice(selected.priceCents, selected.currency)}
      </p>

      <p className="mt-2 inline-flex items-center gap-1.5 text-sm">
        {selected.stock > 0 ? (
          <>
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-green-700">
              Stock disponible ({selected.stock})
            </span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-red-600">Sin stock</span>
          </>
        )}
      </p>

      {variants.length > 1 && (
        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-semibold text-zinc-700">
            Variantes
          </legend>
          <div className="space-y-1.5">
            {variants.map((variant) => {
              const isSelected = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  aria-pressed={isSelected}
                  disabled={variant.stock === 0}
                  className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2 text-left text-sm transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                      : 'border-zinc-200 hover:border-brand-300'
                  } ${variant.stock === 0 ? 'opacity-45' : ''}`}
                >
                  <span className="text-zinc-600">
                    {variantLabel(variant)}
                    {variant.stock === 0 && (
                      <span className="ml-2 text-xs text-red-500">
                        sin stock
                      </span>
                    )}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(variant.priceCents, variant.currency)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <form action={formAction} className="mt-6 space-y-3">
        <input type="hidden" name="variantId" value={selected.id} />
        {maxQuantity > 1 && (
          <label className="flex items-center gap-2 text-sm text-zinc-600">
            Cantidad
            <select
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="field-input !w-auto !px-2.5 !py-1.5"
            >
              {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {maxQuantity <= 1 && (
          <input type="hidden" name="quantity" value={1} />
        )}
        <button
          type="submit"
          disabled={selected.stock === 0 || pending}
          className="btn-primary w-full"
        >
          {pending
            ? 'Agregando…'
            : selected.stock === 0
              ? 'Sin stock'
              : 'Agregar al carrito'}
        </button>
        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-700">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
