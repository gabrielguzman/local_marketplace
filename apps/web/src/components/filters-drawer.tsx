'use client';

import { useState, type ReactNode } from 'react';

// Contenedor de filtros: barra lateral fija en desktop (md+) y panel
// deslizable con botón "Filtros" en mobile.
export function FiltersDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <aside className="w-full shrink-0 md:w-60">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary w-full md:hidden"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M3 5h14M6 10h8M9 15h2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Filtros
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`${
          open
            ? 'fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] overflow-y-auto bg-zinc-50 p-4 shadow-xl'
            : 'hidden'
        } md:static md:z-auto md:block md:w-auto md:max-w-none md:overflow-visible md:bg-transparent md:p-0 md:shadow-none`}
      >
        <div className="mb-3 flex items-center justify-between md:hidden">
          <span className="text-sm font-bold">Filtros</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar filtros"
            className="text-zinc-400 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </aside>
  );
}
