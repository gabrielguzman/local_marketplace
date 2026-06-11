'use client';

import { deleteProductAction } from '@/lib/seller-actions';

export function DeleteProductButton({ productId }: { productId: string }) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!confirm('¿Eliminar este producto? No se puede deshacer.')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="productId" value={productId} />
      <button
        type="submit"
        className="text-xs text-zinc-400 transition hover:text-red-600 hover:underline"
      >
        Eliminar
      </button>
    </form>
  );
}
