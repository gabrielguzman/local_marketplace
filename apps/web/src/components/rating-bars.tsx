import type { RatingSummary, ReviewDto } from '@marketplace/shared';

// Distribución de estrellas calculada a partir de las reseñas mostradas.
export function RatingBars({
  rating,
  reviews,
}: {
  rating: RatingSummary;
  reviews: ReviewDto[];
}) {
  if (rating.count === 0 || reviews.length === 0) return null;

  const counts = [5, 4, 3, 2, 1].map(
    (star) => reviews.filter((r) => r.rating === star).length,
  );
  const total = reviews.length;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="text-center sm:w-32">
        <p className="text-4xl font-extrabold tracking-tight">{rating.avg}</p>
        <p className="text-sm text-amber-500" aria-hidden="true">
          {'★'.repeat(Math.round(rating.avg ?? 0))}
          <span className="text-zinc-200">
            {'★'.repeat(5 - Math.round(rating.avg ?? 0))}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {rating.count} {rating.count === 1 ? 'reseña' : 'reseñas'}
        </p>
      </div>
      <div className="flex-1 space-y-1">
        {counts.map((count, i) => {
          const star = 5 - i;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-8 text-zinc-500">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-zinc-400">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
