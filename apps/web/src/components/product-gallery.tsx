'use client';

import { useEffect, useState } from 'react';
import type { ProductImageDto } from '@marketplace/shared';

export function ProductGallery({
  images,
  title,
}: {
  images: ProductImageDto[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  // magnifier al pasar el mouse (solo en dispositivos con hover real)
  const [lens, setLens] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  function onEnter() {
    if (window.matchMedia('(hover: hover)').matches) setLens(true);
  }

  // en el lightbox: Escape cierra, flechas navegan, y se bloquea el scroll
  useEffect(() => {
    if (!zoom) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setZoom(false);
      else if (e.key === 'ArrowLeft')
        setActive((i) => (i - 1 + images.length) % images.length);
      else if (e.key === 'ArrowRight')
        setActive((i) => (i + 1) % images.length);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [zoom, images.length]);

  if (images.length === 0) {
    return (
      <div className="surface-card overflow-hidden">
        <div className="flex aspect-[4/3] items-center justify-center bg-white">
          <svg
            className="h-20 w-20 text-zinc-200"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="3"
              y="3"
              width="18"
              height="18"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="m4 17 5-5 4 4 3-3 4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  const current = Math.min(active, images.length - 1);
  const go = (dir: -1 | 1) =>
    setActive((i) => (i + dir + images.length) % images.length);

  return (
    <div className="surface-card overflow-hidden">
      <div
        className="group relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-white"
        onMouseEnter={onEnter}
        onMouseMove={(e) => lens && onMove(e)}
        onMouseLeave={() => setLens(false)}
      >
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Ampliar imagen"
          className="flex h-full w-full cursor-zoom-in items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP */}
          <img
            src={images[current].url}
            alt={title}
            className="h-full w-full object-contain transition-transform duration-100 ease-out"
            style={{
              transformOrigin: `${origin.x}% ${origin.y}%`,
              transform: lens ? 'scale(2.4)' : 'scale(1)',
            }}
          />
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white/90 p-2 text-zinc-700 shadow-sm transition hover:bg-white hover:text-brand-600 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m15 18-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Imagen siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white/90 p-2 text-zinc-700 shadow-sm transition hover:bg-white hover:text-brand-600 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m9 18 6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-zinc-900/60 px-2 py-0.5 text-xs font-medium text-white">
              {current + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 p-3">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ver imagen ${i + 1}`}
              aria-current={i === current}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === current
                  ? 'border-brand-500'
                  : 'border-transparent hover:border-zinc-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP */}
              <img
                src={image.url}
                alt=""
                className="h-16 w-16 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ✕
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP */}
          <img
            src={images[current].url}
            alt={title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[92vw] object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Imagen anterior"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Imagen siguiente"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
                {current + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
