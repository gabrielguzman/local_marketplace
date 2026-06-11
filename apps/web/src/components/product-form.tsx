'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { createProductAction } from '@/lib/seller-actions';

const initialState: ActionState = { error: null };

export interface CategoryOption {
  id: string;
  label: string;
}

export function ProductForm({ categories }: { categories: CategoryOption[] }) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="field-label">Título</span>
        <input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          placeholder="Ej: Taladro percutor inalámbrico 20V"
          className="field-input"
        />
      </label>

      <label className="block">
        <span className="field-label">Categoría</span>
        <select name="categoryId" required className="field-input">
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
            defaultValue={1}
            className="field-input"
          />
        </label>
      </div>

      <label className="block">
        <span className="field-label">
          Descripción <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <textarea name="description" rows={5} maxLength={8000} className="field-input" />
      </label>

      <label className="block">
        <span className="field-label">
          URL de imagen <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <input
          name="imageUrl"
          type="url"
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
        {pending ? 'Publicando…' : 'Publicar producto'}
      </button>
    </form>
  );
}
