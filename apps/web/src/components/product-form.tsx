'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import { createProductAction } from '@/lib/seller-actions';

const initialState: ActionState = { error: null };

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500';

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
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Título
        </span>
        <input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          placeholder="Ej: Taladro percutor inalámbrico 20V"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Categoría
        </span>
        <select name="categoryId" required className={inputClass}>
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
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Precio (ARS)
          </span>
          <input
            name="price"
            type="number"
            required
            min={1}
            step="0.01"
            placeholder="85000"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Stock
          </span>
          <input
            name="stock"
            type="number"
            required
            min={0}
            step={1}
            defaultValue={1}
            className={inputClass}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          Descripción <span className="text-zinc-400">(opcional)</span>
        </span>
        <textarea
          name="description"
          rows={5}
          maxLength={8000}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          URL de imagen <span className="text-zinc-400">(opcional)</span>
        </span>
        <input
          name="imageUrl"
          type="url"
          placeholder="https://…"
          className={inputClass}
        />
      </label>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {pending ? 'Publicando…' : 'Publicar producto'}
      </button>
    </form>
  );
}
