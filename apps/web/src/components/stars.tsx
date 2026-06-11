import type { RatingSummary } from '@marketplace/shared';

export function Stars({ rating }: { rating: RatingSummary }) {
  if (rating.count === 0) {
    return <span className="text-xs text-zinc-400">Sin reseñas todavía</span>;
  }
  const rounded = Math.round(rating.avg ?? 0);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span aria-hidden="true" className="tracking-tight text-amber-500">
        {'★'.repeat(rounded)}
        <span className="text-zinc-300">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="font-medium text-zinc-700">{rating.avg}</span>
      <span className="text-xs text-zinc-400">
        ({rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'})
      </span>
    </span>
  );
}
