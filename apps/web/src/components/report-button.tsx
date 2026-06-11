'use client';

import { useActionState, useState } from 'react';
import { REPORT_REASON_LABELS, REPORT_REASONS } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { reportProductAction } from '@/lib/trust-actions';

const initialState: ActionState = { error: null };

export function ReportButton({ productId }: { productId: string }) {
  const [state, formAction, pending] = useActionState(
    reportProductAction,
    initialState,
  );
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent && !state.error) {
    return (
      <p className="text-center text-xs text-zinc-400">
        Gracias, vamos a revisar esta publicación.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-center text-xs text-zinc-400 hover:text-red-600 hover:underline"
      >
        🚩 Denunciar publicación
      </button>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setSent(true)}
      className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3"
    >
      <input type="hidden" name="productId" value={productId} />
      <select name="reason" required className="field-input !py-2 text-xs">
        {REPORT_REASONS.map((reason) => (
          <option key={reason} value={reason}>
            {REPORT_REASON_LABELS[reason]}
          </option>
        ))}
      </select>
      <textarea
        name="details"
        rows={2}
        maxLength={2000}
        placeholder="Detalles (opcional)"
        className="field-input !py-2 text-xs"
      />
      {state.error && (
        <p className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-secondary !px-3 !py-1.5 text-xs !text-red-600"
        >
          {pending ? 'Enviando…' : 'Enviar denuncia'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-400 hover:underline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
