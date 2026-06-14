'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import type { SearchSuggestion } from '@marketplace/shared';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export function SearchBar() {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setValue(next);
    if (debounce.current) clearTimeout(debounce.current);
    if (next.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/search/suggest?q=${encodeURIComponent(next)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as SearchSuggestion[];
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch {
        // sin sugerencias; el form sigue funcionando igual
      }
    }, 200);
  }

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <form action="/buscar" autoComplete="off">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
          <path
            d="m14 14 3.5 3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="search"
          name="q"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar productos, marcas y más…"
          className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-24 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/15"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          Buscar
        </button>
      </form>

      {open && (
        <ul className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/p/${s.slug}`}
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-zinc-300"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
                  <path d="m14 14 3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="truncate">{s.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
