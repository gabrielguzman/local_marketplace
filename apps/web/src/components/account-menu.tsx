'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { logoutAction } from '@/lib/auth-actions';

interface AccountMenuProps {
  name: string;
  isAdmin: boolean;
}

const ITEM =
  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900';

export function AccountMenu({ name, isAdmin }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const firstName = name.trim().split(/\s+/)[0] || 'Mi cuenta';
  const initial = firstName.charAt(0).toUpperCase();

  // cerrar al click afuera o con Escape
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-24 truncate lg:block">{firstName}</span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200 bg-white p-1.5 shadow-[var(--shadow-card-hover)]"
        >
          <div className="px-3 py-2">
            <p className="text-xs text-zinc-400">Hola,</p>
            <p className="truncate text-sm font-semibold text-zinc-900">
              {firstName}
            </p>
          </div>
          <div className="my-1 h-px bg-zinc-100" />

          <Link href="/cuenta" className={ITEM} onClick={() => setOpen(false)}>
            <span aria-hidden="true">👤</span> Mi cuenta
          </Link>
          <Link href="/compras" className={ITEM} onClick={() => setOpen(false)}>
            <span aria-hidden="true">📦</span> Mis compras
          </Link>
          <Link href="/favoritos" className={ITEM} onClick={() => setOpen(false)}>
            <span aria-hidden="true">❤️</span> Favoritos
          </Link>
          <Link href="/vender" className={ITEM} onClick={() => setOpen(false)}>
            <span aria-hidden="true">🏪</span> Mi negocio
          </Link>

          {isAdmin && (
            <>
              <div className="my-1 h-px bg-zinc-100" />
              <Link
                href="/admin"
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">🛡️</span> Panel de admin
              </Link>
            </>
          )}

          <div className="my-1 h-px bg-zinc-100" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
            >
              <span aria-hidden="true">↩️</span> Cerrar sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
