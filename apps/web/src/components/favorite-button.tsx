'use client';

import { useState, useTransition } from 'react';
import { toggleFavoriteAction } from '@/lib/favorites-actions';
import { useToast } from '@/components/toast';

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path
        d="M12 20s-7-4.35-9.5-8.5C1 8.5 2.5 5.5 5.5 5.5c1.9 0 3.2 1.1 3.9 2.2.4.6.6.9 1.1.9s.7-.3 1.1-.9c.7-1.1 2-2.2 3.9-2.2 3 0 4.5 3 3 6C19 15.65 12 20 12 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavoriteButton({
  productId,
  slug,
  favorited,
  variant = 'button',
}: {
  productId: string;
  slug?: string;
  favorited: boolean;
  variant?: 'button' | 'icon';
}) {
  const [optimistic, setOptimistic] = useState(favorited);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function onSubmit(formData: FormData) {
    const willFavorite = !optimistic;
    setOptimistic(willFavorite);
    startTransition(() => toggleFavoriteAction(formData));
    show({
      message: willFavorite
        ? 'Guardado en favoritos'
        : 'Quitado de favoritos',
      href: willFavorite ? '/favoritos' : undefined,
      linkLabel: willFavorite ? 'Ver' : undefined,
    });
  }

  if (variant === 'icon') {
    return (
      <form action={onSubmit}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="favorited" value={favorited ? '1' : '0'} />
        {slug && <input type="hidden" name="slug" value={slug} />}
        <button
          type="submit"
          disabled={pending}
          aria-label={optimistic ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          aria-pressed={optimistic}
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:bg-white ${
            optimistic ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'
          }`}
        >
          <Heart filled={optimistic} />
        </button>
      </form>
    );
  }

  return (
    <form action={onSubmit}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="favorited" value={favorited ? '1' : '0'} />
      {slug && <input type="hidden" name="slug" value={slug} />}
      <button
        type="submit"
        disabled={pending}
        aria-pressed={optimistic}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
          optimistic
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-zinc-200 text-zinc-600 hover:border-red-200 hover:text-red-500'
        }`}
      >
        <Heart filled={optimistic} />
        {optimistic ? 'Guardado en favoritos' : 'Guardar en favoritos'}
      </button>
    </form>
  );
}
