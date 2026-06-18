'use client';

import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type Variant = 'success' | 'error';

interface ToastData {
  id: number;
  message: string;
  variant: Variant;
  href?: string;
  linkLabel?: string;
}

interface ToastInput {
  message: string;
  variant?: Variant;
  href?: string;
  linkLabel?: string;
}

const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(
  null,
);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback((t: ToastInput) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [
      ...prev,
      { id, message: t.message, variant: t.variant ?? 'success', href: t.href, linkLabel: t.linkLabel },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3800);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-[var(--shadow-card-hover)]"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm text-white ${
                t.variant === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`}
              aria-hidden="true"
            >
              {t.variant === 'error' ? '!' : '✓'}
            </span>
            <p className="flex-1 text-sm text-zinc-800">{t.message}</p>
            {t.href && t.linkLabel && (
              <Link
                href={t.href}
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-sm font-semibold text-brand-600 hover:underline"
              >
                {t.linkLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar"
              className="shrink-0 text-zinc-400 transition hover:text-zinc-700"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
