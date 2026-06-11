// Form nativo GET → /buscar?q=... Funciona sin JavaScript.
export function SearchBar() {
  return (
    <form action="/buscar" className="relative mx-auto w-full max-w-xl">
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
  );
}
