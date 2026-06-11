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
          <span className="field-label">{field.label}</span>
          <input
            name={field.name}
            type={field.type}
            required
            minLength={field.minLength}
            placeholder={field.placeholder}
            className="field-input"
          />
        </label>
      ))}

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? 'Un momento…' : submitLabel}
      </button>
    </form>
  );
}
