'use client';

import { useEffect, useRef, useState } from 'react';
import { setZonaAction } from '@/lib/zona-actions';

const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export function ZoneSelector({
  province,
  city,
}: {
  province?: string;
  city?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const label = province
    ? city
      ? `${city}, ${province}`
      : province
    : 'Elegí tu zona';

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100"
        aria-expanded={open}
      >
        <span aria-hidden="true">📍</span>
        <span className="max-w-32 truncate">
          Enviando a <span className="text-zinc-900">{label}</span>
        </span>
        <svg className="h-3.5 w-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-[var(--shadow-card-hover)]">
          <p className="mb-3 text-sm font-semibold text-zinc-900">¿De qué zona sos?</p>
          <form action={setZonaAction} className="space-y-3" onSubmit={() => setOpen(false)}>
            <label className="block">
              <span className="field-label">Provincia</span>
              <select name="province" defaultValue={province ?? ''} className="field-input">
                <option value="">Todas</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">
                Ciudad <span className="font-normal text-zinc-400">(opcional)</span>
              </span>
              <input
                name="city"
                type="text"
                defaultValue={city ?? ''}
                placeholder="Ej: Rosario"
                className="field-input"
              />
            </label>
            <button type="submit" className="btn-primary w-full !py-2">
              Aplicar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
