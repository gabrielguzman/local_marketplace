'use client';

import { useEffect } from 'react';

// Error boundary global: atrapa errores de render/SSR (p.ej. API caída)
// manteniendo header y footer visibles.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl">😵</p>
      <h1 className="mt-4 text-xl font-bold tracking-tight">
        Algo salió mal
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Tuvimos un problema cargando esta página. Probá de nuevo en unos
        segundos.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="btn-primary mt-6"
      >
        Reintentar
      </button>
    </div>
  );
}
