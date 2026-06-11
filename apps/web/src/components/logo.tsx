import Link from 'next/link';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Mercato — inicio">
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill={light ? '#ffffff' : '#4f46e5'} />
        <path
          d="M8 22V12.5L12 9l4 3.5L20 9l4 3.5V22h-4.5v-5.5h-7V22H8z"
          fill={light ? '#4f46e5' : '#ffffff'}
        />
      </svg>
      <span
        className={`text-xl font-extrabold tracking-tight ${
          light ? 'text-white' : 'text-zinc-900'
        }`}
      >
        Mercato
      </span>
    </Link>
  );
}
