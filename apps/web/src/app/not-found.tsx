import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 text-xl font-bold tracking-tight">
        No encontramos esta página
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Puede que el producto ya no exista o que el enlace esté mal escrito.
      </p>
      <Link href="/buscar" className="btn-primary mt-6">
        Explorar productos
      </Link>
    </div>
  );
}
