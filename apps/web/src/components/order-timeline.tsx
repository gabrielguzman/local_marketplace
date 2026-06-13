import type { SubOrderStatus } from '@marketplace/shared';

// Pasos visibles del envío (CANCELLED se maneja aparte)
const STEPS: { status: SubOrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pendiente' },
  { status: 'CONFIRMED', label: 'Confirmada' },
  { status: 'SHIPPED', label: 'En camino' },
  { status: 'DELIVERED', label: 'Entregada' },
];

export function OrderTimeline({ status }: { status: SubOrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <p className="flex items-center gap-2 text-sm text-red-600">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs">
          ✕
        </span>
        Esta entrega fue cancelada
      </p>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="flex items-center">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-brand-600 text-white'
                    : 'bg-zinc-100 text-zinc-400'
                } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}
              >
                {done ? '✓' : index + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[11px] font-medium ${
                  done ? 'text-zinc-700' : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={`mx-1 mb-5 h-0.5 flex-1 rounded ${
                  index < currentIndex ? 'bg-brand-600' : 'bg-zinc-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
