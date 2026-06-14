'use client';

import { useEffect, useState } from 'react';
import type { ProductSummaryDto } from '@marketplace/shared';
import { ProductCard } from './product-card';

const KEY = 'mk_recent';
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function RecentlyViewed() {
  const [products, setProducts] = useState<ProductSummaryDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(KEY);
        const slugs: string[] = raw ? JSON.parse(raw) : [];
        if (slugs.length === 0) return;
        const res = await fetch(
          `${API_URL}/search/by-slugs?slugs=${slugs.map(encodeURIComponent).join(',')}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as ProductSummaryDto[];
        if (!cancelled) setProducts(data);
      } catch {
        // sin recientes
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold tracking-tight">
        Vistos recientemente
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
