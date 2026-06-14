'use client';

import { useActionState, useState } from 'react';
import type { ActionState } from '@/lib/auth-actions';
import {
  deleteCategoryAction,
  renameCategoryAction,
} from '@/lib/category-actions';

const initialState: ActionState = { error: null };

export function CategoryRow({
  id,
  name,
  child = false,
}: {
  id: string;
  name: string;
  child?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [renameState, renameAction, renaming] = useActionState(
    renameCategoryAction,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteCategoryAction,
    initialState,
  );

  return (
    <div className={child ? 'pl-6' : ''}>
      <div className="flex items-center justify-between gap-3 py-1.5">
        {editing ? (
          <form action={renameAction} className="flex flex-1 items-center gap-2">
            <input type="hidden" name="id" value={id} />
            <input
              name="name"
              defaultValue={name}
              required
              minLength={2}
              maxLength={60}
              className="field-input !py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={renaming}
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              {renaming ? '…' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs text-zinc-400 hover:underline"
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <span
              className={`text-sm ${child ? 'text-zinc-600' : 'font-semibold text-zinc-800'}`}
            >
              {child && <span className="text-zinc-300">└ </span>}
              {name}
            </span>
            <span className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="font-medium text-brand-600 hover:underline"
              >
                Renombrar
              </button>
              <form
                action={deleteAction}
                onSubmit={(e) => {
                  if (!confirm(`¿Borrar la categoría "${name}"?`)) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  disabled={deleting}
                  className="text-zinc-400 hover:text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </form>
            </span>
          </>
        )}
      </div>
      {(renameState.error || deleteState.error) && (
        <p className="pb-1 text-xs text-red-600">
          {renameState.error ?? deleteState.error}
        </p>
      )}
    </div>
  );
}
