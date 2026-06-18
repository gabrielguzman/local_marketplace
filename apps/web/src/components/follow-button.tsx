'use client';

import { useState, useTransition } from 'react';
import { toggleFollowAction } from '@/lib/follow-actions';
import { useToast } from '@/components/toast';

export function FollowButton({
  businessId,
  businessName,
  slug,
  following,
  followers,
}: {
  businessId: string;
  businessName: string;
  slug?: string;
  following: boolean;
  followers: number;
}) {
  const [optimistic, setOptimistic] = useState(following);
  const [count, setCount] = useState(followers);
  const [pending, startTransition] = useTransition();
  const { show } = useToast();

  function onClick() {
    const willFollow = !optimistic;
    setOptimistic(willFollow);
    setCount((c) => c + (willFollow ? 1 : -1));
    startTransition(() => toggleFollowAction(businessId, optimistic, slug));
    show({
      message: willFollow
        ? `Siguiendo a ${businessName}`
        : `Dejaste de seguir a ${businessName}`,
      href: willFollow ? '/siguiendo' : undefined,
      linkLabel: willFollow ? 'Ver novedades' : undefined,
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={optimistic}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
        optimistic
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-zinc-300 text-zinc-700 hover:border-brand-300 hover:text-brand-700'
      }`}
    >
      <span aria-hidden="true">{optimistic ? '✓' : '+'}</span>
      {optimistic ? 'Siguiendo' : 'Seguir'}
      {count > 0 && (
        <span className="font-normal text-zinc-400">· {count}</span>
      )}
    </button>
  );
}
