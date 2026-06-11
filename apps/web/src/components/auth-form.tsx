'use client';

import { useActionState } from 'react';
import type { ActionState } from '@/lib/auth-actions';

const initialState: ActionState = { error: null };

interface Field {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  minLength?: number;
}

export function AuthForm({
  action,
  fields,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  fields: Field[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {fields.map((field) => (
        <label key={field.name} className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            {field.label}
          </span>
          <input
            name={field.name}
            type={field.type}
            required
            minLength={field.minLength}
            placeholder={field.placeholder}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </label>
      ))}

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
        {pending ? 'Un momento…' : submitLabel}
      </button>
    </form>
  );
}
