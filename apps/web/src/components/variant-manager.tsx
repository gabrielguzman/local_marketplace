'use client';

import { useActionState } from 'react';
import type { ProductVariantDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import {
  addVariantAction,
  deleteVariantAction,
  updateVariantInlineAction,
} from '@/lib/seller-actions';

const initialState: ActionState = { error: null };

function VariantRow({
  productId,
  variant,
  canDelete,
}: {
  productId: string;
  variant: ProductVariantDto;
  canDelete: boolean;
}) {
  const [updateState, updateAction, updating] = useActionState(
    updateVariantInlineAction,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteVariantAction,
    initialState,
  );

  const label =
    Object.entries(variant.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(' · ') || 'Estándar';

  return (
    <li className="space-y-1.5 px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-32 flex-1">
          <p className="text-sm font-medium text-zinc-700">
            {label}
            {variant.isDefault && (
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                PRINCIPAL
              </span>
            )}
          </p>
        </div>
        <form action={updateAction} className="flex items-end gap-2">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="variantId" value={variant.id} />
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
              Precio (ARS)
            </span>
            <input
              name="price"
              type="number"
              min={1}
              step="0.01"
              required
              defaultValue={variant.priceCents / 100}
              className="field-input w-28 !px-2 !py-1.5 text-xs"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
              Stock
            </span>
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={variant.stock}
              className="field-input w-20 !px-2 !py-1.5 text-xs"
            />
          </label>
          <button
            type="submit"
            disabled={updating}
            className="btn-secondary !px-3 !py-1.5 text-xs"
          >
            {updating ? '…' : 'Guardar'}
          </button>
        </form>
        {canDelete && (
          <form action={deleteAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="variantId" value={variant.id} />
            <button
              type="submit"
              disabled={deleting}
              className="pb-1.5 text-xs text-zinc-400 hover:text-red-600 hover:underline"
            >
              Eliminar
            </button>
          </form>
        )}
      </div>
      {(updateState.error || deleteState.error) && (
        <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {updateState.error ?? deleteState.error}
        </p>
      )}
    </li>
  );
}

export function VariantManager({
  productId,
  variants,
}: {
  productId: string;
  variants: ProductVariantDto[];
}) {
  const [addState, addAction, adding] = useActionState(
    addVariantAction,
    initialState,
  );

  return (
    <div className="space-y-4">
      <ul className="surface-card divide-y divide-zinc-50">
        {variants.map((variant) => (
          <VariantRow
            key={variant.id}
            productId={productId}
            variant={variant}
            canDelete={variants.length > 1}
          />
        ))}
      </ul>

      <form
        action={addAction}
        className="surface-card space-y-3 border-dashed p-4"
      >
        <input type="hidden" name="productId" value={productId} />
        <p className="text-sm font-semibold text-zinc-700">Agregar variante</p>
        <label className="block">
          <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
            Atributos (ej: color=rojo, talle=M)
          </span>
          <input
            name="attributes"
            type="text"
            placeholder="color=rojo, talle=M"
            className="field-input !py-2 text-xs"
          />
        </label>
        <div className="flex items-end gap-2">
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
              Precio (ARS)
            </span>
            <input
              name="price"
              type="number"
              min={1}
              step="0.01"
              required
              className="field-input w-28 !px-2 !py-1.5 text-xs"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
              Stock
            </span>
            <input
              name="stock"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={1}
              className="field-input w-20 !px-2 !py-1.5 text-xs"
            />
          </label>
          <button
            type="submit"
            disabled={adding}
            className="btn-primary !px-3 !py-1.5 text-xs"
          >
            {adding ? 'Agregando…' : '+ Agregar'}
          </button>
        </div>
        {addState.error && (
          <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">
            {addState.error}
          </p>
        )}
      </form>
    </div>
  );
}
