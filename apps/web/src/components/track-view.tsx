'use client';

import { useEffect } from 'react';

const KEY = 'mk_recent';
const MAX = 12;

// Registra el slug del producto visto en localStorage (más reciente primero).
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = [slug, ...list.filter((s) => s !== slug)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // localStorage no disponible: no pasa nada
    }
  }, [slug]);

  return null;
}
