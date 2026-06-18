// Color de identidad de una tienda, estable por slug. Lo comparten la card
// del home/directorio y el header del perfil, para que cada tienda tenga
// "su" color aunque no haya subido banner.
const GRADIENTS = [
  'from-indigo-500 to-violet-400',
  'from-sky-500 to-cyan-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-fuchsia-500 to-purple-400',
];

export function storeGradient(slug: string): string {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 997;
  return GRADIENTS[h % GRADIENTS.length];
}
