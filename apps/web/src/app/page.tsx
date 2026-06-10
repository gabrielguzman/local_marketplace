import type { HealthResponse } from '@marketplace/shared';
import { apiFetch } from '@/lib/api';

// Estado en vivo: no prerenderizar en build
export const dynamic = 'force-dynamic';

async function getHealth(): Promise<HealthResponse | null> {
  try {
    return await apiFetch<HealthResponse>('/health');
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getHealth();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 bg-zinc-50 font-sans">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
        Marketplace
      </h1>
      <p className="text-zinc-600">Fase 0 — fundaciones del monorepo</p>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Estado del sistema
        </h2>
        <ul className="space-y-2 text-sm">
          <StatusRow label="Frontend (Next.js)" ok />
          <StatusRow label="API (NestJS)" ok={health !== null} />
          <StatusRow label="Base de datos (Postgres)" ok={health?.db === 'up'} />
        </ul>
        {health && (
          <p className="mt-4 text-xs text-zinc-400">
            Último check: {health.timestamp}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center justify-between gap-8">
      <span className="text-zinc-700">{label}</span>
      <span
        className={
          ok
            ? 'rounded-full bg-green-100 px-2 py-0.5 text-green-700'
            : 'rounded-full bg-red-100 px-2 py-0.5 text-red-700'
        }
      >
        {ok ? 'online' : 'offline'}
      </span>
    </li>
  );
}
