'use client';

import { useState } from 'react';
import type { ProductImageDto } from '@marketplace/shared';

export function ProductGallery({
  images,
  title,
}: {
  images: ProductImageDto[];
  title: string;
}) {
  const [active, setActive] = useState(0);

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
      <div className="group relative flex aspect-[4/3] items-center justify-center bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- dominio de imagen arbitrario en MVP */}
        <img
          src={images[current].url}
          alt={title}
          className="h-full w-full object-contain"
        />

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
    </div>
  );
}
