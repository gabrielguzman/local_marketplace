'use client';

import { useActionState, useRef } from 'react';
import type { CategoryDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { createCategoryAction } from '@/lib/category-actions';
import { FormFeedback } from './form-feedback';

const initialState: ActionState = { error: null };

export function CategoryAddForm({ parents }: { parents: CategoryDto[] }) {
  const [state, formAction, pending] = useActionState(
    createCategoryAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="block flex-1">
          <span className="field-label">Nombre</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={60}
            placeholder="Ej: Mascotas"
            className="field-input"
          />
        </label>
        <label className="block">
          <span className="field-label">Categoría padre</span>
          <select name="parentId" defaultValue="" className="field-input">
            <option value="">— Categoría principal —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? 'Creando…' : 'Crear'}
        </button>
      </div>
      <FormFeedback state={state} okMessage="Categoría creada" />
    </form>
  );
}
