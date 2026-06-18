'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Barra fina de progreso arriba: arranca al clickear un link interno y se
// completa cuando cambia la ruta. Mejora la sensación de velocidad.
export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams}`;
  const prevKey = useRef(key);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download'))
        return;
      let url: URL;
      try {
        url = new URL(anchor.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;

      if (timer.current) clearInterval(timer.current);
      setProgress(10);
      timer.current = setInterval(() => {
        setProgress((p) => (p >= 90 ? 90 : p + (90 - p) * 0.15));
      }, 200);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (prevKey.current === key) return;
    prevKey.current = key;
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setProgress(100);
    const t = setTimeout(() => setProgress(0), 300);
    return () => clearTimeout(t);
  }, [key]);

  if (progress === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-0.5">
      <div
        className="h-full bg-brand-500 transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
