'use client';

import { useActionState, useState } from 'react';
import {
  PRODUCT_CONDITIONS,
  PRODUCT_CONDITION_LABELS,
  type ProductCondition,
  type ProductSpec,
} from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';

export interface CategoryOption {
  id: string;
  label: string;
}

export interface VariantRow {
  attrs: string; // "color=rojo, talle=M" (vacío = variante estándar)
  price: string; // en pesos
  stock: string;
}

export interface ProductFormInitial {
  title: string;
  categoryId: string;
  description: string;
  brand: string;
  condition: ProductCondition;
  images: string[];
  specs: ProductSpec[];
  // sólo para create (en edit las variantes se manejan aparte)
  variants?: VariantRow[];
}

const emptyVariant = (): VariantRow => ({ attrs: '', price: '', stock: '1' });

export function ProductForm({
  categories,
  action,
  submitLabel,
  pendingLabel,
  initial,
  hidden = {},
  allowDraft = false,
  mode = 'create',
}: {
  categories: CategoryOption[];
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  pendingLabel: string;
  initial?: ProductFormInitial;
  hidden?: Record<string, string>;
  allowDraft?: boolean;
  mode?: 'create' | 'edit';
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  const [variants, setVariants] = useState<VariantRow[]>(
    initial?.variants?.length ? initial.variants : [emptyVariant()],
  );
  const [specs, setSpecs] = useState<ProductSpec[]>(initial?.specs ?? []);
  const [images, setImages] = useState<string[]>(initial?.images ?? ['']);

  const cleanSpecs = specs.filter((s) => s.key.trim() && s.value.trim());
  const cleanImages = images.map((u) => u.trim()).filter(Boolean);

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {/* datos dinámicos serializados */}
      <input type="hidden" name="specs" value={JSON.stringify(cleanSpecs)} />
      <input type="hidden" name="images" value={JSON.stringify(cleanImages)} />
      {mode === 'create' && (
        <input type="hidden" name="variants" value={JSON.stringify(variants)} />
      )}

      <label className="block">
        <span className="field-label">Título</span>
        <input
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          defaultValue={initial?.title}
          placeholder="Ej: Taladro percutor inalámbrico 20V"
          className="field-input"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Categoría</span>
          <select
            name="categoryId"
            required
            defaultValue={initial?.categoryId ?? ''}
            className="field-input"
          >
            <option value="">Elegí una categoría…</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Marca</span>
          <input
            name="brand"
            type="text"
            maxLength={60}
            defaultValue={initial?.brand}
            placeholder="Ej: Stanley"
            className="field-input"
          />
        </label>
      </div>

      <fieldset>
        <span className="field-label">Condición</span>
        <div className="flex gap-2">
          {PRODUCT_CONDITIONS.map((c) => (
            <label
              key={c}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm transition has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50/60 has-[:checked]:font-medium has-[:checked]:text-brand-700"
            >
              <input
                type="radio"
                name="condition"
                value={c}
                defaultChecked={(initial?.condition ?? 'NEW') === c}
                className="sr-only"
              />
              {PRODUCT_CONDITION_LABELS[c]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="field-label">
          Descripción <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <textarea
          name="description"
          rows={5}
          maxLength={8000}
          defaultValue={initial?.description}
          className="field-input"
        />
      </label>

      {/* ── Variantes (sólo al crear) ── */}
      {mode === 'create' && (
        <div className="space-y-2">
          <span className="field-label">Precio y stock</span>
          <p className="text-xs text-zinc-400">
            Agregá una fila por variante (talle, color…). Dejá los atributos
            vacíos si el producto no tiene variantes.
          </p>
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <label className="block flex-1">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
                    Atributos
                  </span>
                  <input
                    type="text"
                    value={v.attrs}
                    onChange={(e) =>
                      setVariants((vs) =>
                        vs.map((x, j) =>
                          j === i ? { ...x, attrs: e.target.value } : x,
                        ),
                      )
                    }
                    placeholder="color=rojo, talle=M"
                    className="field-input !py-1.5 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
                    Precio
                  </span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    required
                    value={v.price}
                    onChange={(e) =>
                      setVariants((vs) =>
                        vs.map((x, j) =>
                          j === i ? { ...x, price: e.target.value } : x,
                        ),
                      )
                    }
                    className="field-input w-28 !py-1.5 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="mb-0.5 block text-[10px] font-medium uppercase text-zinc-400">
                    Stock
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={v.stock}
                    onChange={(e) =>
                      setVariants((vs) =>
                        vs.map((x, j) =>
                          j === i ? { ...x, stock: e.target.value } : x,
                        ),
                      )
                    }
                    className="field-input w-20 !py-1.5 text-xs"
                  />
                </label>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setVariants((vs) => vs.filter((_, j) => j !== i))
                    }
                    className="pb-2 text-xs text-zinc-400 hover:text-red-600"
                    aria-label="Quitar variante"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {variants.length < 20 && (
            <button
              type="button"
              onClick={() => setVariants((vs) => [...vs, emptyVariant()])}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              + Agregar variante
            </button>
          )}
        </div>
      )}

      {/* ── Ficha técnica ── */}
      <div className="space-y-2">
        <span className="field-label">
          Ficha técnica{' '}
          <span className="font-normal text-zinc-400">(opcional)</span>
        </span>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={s.key}
                onChange={(e) =>
                  setSpecs((ss) =>
                    ss.map((x, j) =>
                      j === i ? { ...x, key: e.target.value } : x,
                    ),
                  )
                }
                placeholder="Material"
                maxLength={40}
                className="field-input w-40 !py-1.5 text-sm"
              />
              <input
                type="text"
                value={s.value}
                onChange={(e) =>
                  setSpecs((ss) =>
                    ss.map((x, j) =>
                      j === i ? { ...x, value: e.target.value } : x,
                    ),
                  )
                }
                placeholder="Aluminio"
                maxLength={200}
                className="field-input flex-1 !py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setSpecs((ss) => ss.filter((_, j) => j !== i))}
                className="text-xs text-zinc-400 hover:text-red-600"
                aria-label="Quitar fila"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {specs.length < 30 && (
          <button
            type="button"
            onClick={() => setSpecs((ss) => [...ss, { key: '', value: '' }])}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            + Agregar especificación
          </button>
        )}
      </div>

      {/* ── Imágenes ── */}
      <div className="space-y-2">
        <span className="field-label">
          Imágenes{' '}
          <span className="font-normal text-zinc-400">(URL, hasta 8)</span>
        </span>
        <div className="space-y-2">
          {images.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {url.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element -- preview de URL arbitraria
                  <img src={url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-zinc-300">{i + 1}</span>
                )}
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) =>
                  setImages((is) =>
                    is.map((x, j) => (j === i ? e.target.value : x)),
                  )
                }
                placeholder="https://…/foto.jpg"
                className="field-input flex-1 !py-1.5 text-sm"
              />
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() =>
                    setImages((is) => {
                      const next = [...is];
                      [next[i - 1], next[i]] = [next[i], next[i - 1]];
                      return next;
                    })
                  }
                  className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
                  aria-label="Subir"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={i === images.length - 1}
                  onClick={() =>
                    setImages((is) => {
                      const next = [...is];
                      [next[i + 1], next[i]] = [next[i], next[i + 1]];
                      return next;
                    })
                  }
                  className="text-xs text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
                  aria-label="Bajar"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                onClick={() => setImages((is) => is.filter((_, j) => j !== i))}
                className="text-xs text-zinc-400 hover:text-red-600"
                aria-label="Quitar imagen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {images.length < 8 && (
          <button
            type="button"
            onClick={() => setImages((is) => [...is, ''])}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            + Agregar imagen
          </button>
        )}
      </div>

      {state.error && (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <span aria-hidden="true">⚠️</span> {state.error}
        </p>
      )}

      {allowDraft ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            name="status"
            value="ACTIVE"
            disabled={pending}
            className="btn-primary flex-1"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
          <button
            type="submit"
            name="status"
            value="DRAFT"
            disabled={pending}
            className="btn-secondary flex-1"
          >
            Guardar como borrador
          </button>
        </div>
      ) : (
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? pendingLabel : submitLabel}
        </button>
      )}
    </form>
  );
}

const initialState: ActionState = { error: null };
