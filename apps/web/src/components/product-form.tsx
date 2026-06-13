'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

export interface CategoryOption {
  id: string;
  label: string;
}

export interface ProductFormInitial {
  title: string;
  categoryId: string;
  price: string; // en pesos, como texto del input
  stock: number;
  description: string;
  images: string; // una URL por línea
}

export function ProductForm({
  categories,
  action,
  submitLabel,
  pendingLabel,
  initial,
  hidden = {},
  allowDraft = false,
}: {
  categories: CategoryOption[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  pendingLabel: string;
  initial?: ProductFormInitial;
  hidden?: Record<string, string>;
  // muestra un segundo botón "Guardar como borrador"
  allowDraft?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <label className="block">
        <span className="field-label">Título</span>
        <input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          defaultValue={initial?.title}
          placeholder="Ej: Taladro percutor inalámbrico 20V"
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">Categoría</span>
        <select
          name="categoryId"
          required
          defaultValue={initial?.categoryId ?? ''}
          className="field-input"
        >
          <option value="">Elegí una categoría…</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className="field-label">Precio (ARS)</span>
          <input
            name="price"
            type="number"
            required
            min={1}
            step="0.01"
            defaultValue={initial?.price}
            placeholder="85000"
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Stock</span>
          <input
            name="stock"
            type="number"
            required
            min={0}
            step={1}
            defaultValue={initial?.stock ?? 1}
            className="field-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="field-label">
          Descripción <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <textarea
          name="description"
          rows={5}
          maxLength={8000}
          defaultValue={initial?.description}
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">
          Imágenes <span className="font-normal text-zinc-400">(una URL por línea, hasta 8)</span>
        </span>
        <textarea
          name="images"
          rows={3}
          defaultValue={initial?.images}
          placeholder={'https://…/foto-1.jpg\nhttps://…/foto-2.jpg'}
          className="field-input font-mono text-xs"
        />
      </label>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      {allowDraft ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            name="status"
            value="ACTIVE"
            disabled={pending}
            className="btn-primary flex-1"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
          <button
            type="submit"
            name="status"
            value="DRAFT"
            disabled={pending}
            className="btn-secondary flex-1"
          >
            Guardar como borrador
          </button>
        </div>
      ) : (
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? pendingLabel : submitLabel}
        </button>
      )}
    </form>
  );
}
