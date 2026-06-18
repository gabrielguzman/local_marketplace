'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ITEM =
  'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50';

export function MobileMenu({
  categories,
  isAuthenticated,
}: {
  categories: Category[];
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  // bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 md:hidden"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span className="text-sm font-bold tracking-tight">Menú</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                ✕
              </button>
            </div>

            <nav
              className="flex flex-col gap-0.5 p-3"
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a')) setOpen(false);
              }}
            >
              <Link href="/buscar" className={ITEM}>
                <span aria-hidden="true">🔍</span> Explorar productos
              </Link>
              <Link href="/tiendas" className={ITEM}>
                <span aria-hidden="true">🏪</span> Tiendas
              </Link>
              <Link href="/vender" className={ITEM}>
                <span aria-hidden="true">🚀</span> Vender
              </Link>

              {!isAuthenticated && (
                <>
                  <div className="my-2 h-px bg-zinc-100" />
                  <Link href="/login" className={ITEM}>
                    <span aria-hidden="true">👤</span> Ingresar
                  </Link>
                  <Link
                    href="/registro"
                    className="btn-primary mt-1 w-full"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}

              {categories.length > 0 && (
                <>
                  <p className="mt-3 px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Categorías
                  </p>
                  {categories.map((cat) => (
                    <Link key={cat.id} href={`/c/${cat.slug}`} className={ITEM}>
                      {cat.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
