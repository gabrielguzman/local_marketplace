// Form nativo GET → /buscar?q=... Funciona sin JavaScript.
export function SearchBar() {
  return (
    <form action="/buscar" className="flex w-full max-w-xl">
      <input
        type="search"
        name="q"
        placeholder="Buscar productos, marcas y más…"
        className="w-full rounded-l-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
      />
      <button
        type="submit"
        className="rounded-r-md border border-l-0 border-zinc-300 bg-white px-4 text-sm text-zinc-600 hover:bg-zinc-100"
      >
        Buscar
      </button>
    </form>
  );
}
