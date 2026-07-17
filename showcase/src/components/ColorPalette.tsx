import type { BrandConfig } from '../lib';
import { resolveEffectiveColors } from '../resolveColors';

const TOKEN_ORDER = ['primary', 'accent', 'secondary', 'background', 'surface', 'text', 'muted', 'border'] as const;

/** Paleta leída en vivo de BRANDS[...].colors — el swatch pinta el valor
 * EFECTIVO (con el mismo fallback que aplica BrandProvider en runtime);
 * si el campo no está definido en brands.ts, queda marcado "no definido"
 * en vez de disimularse como si fuera un valor real de la marca. */
export function ColorPalette({ brand }: { brand: BrandConfig }) {
  const resolved = resolveEffectiveColors(brand);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TOKEN_ORDER.map((key) => {
        const raw = brand.colors[key];
        const hex = resolved[key];
        return (
          <div key={key} className="overflow-hidden rounded border border-zinc-800">
            <div className="h-16 w-full" style={{ background: hex }} />
            <div className="space-y-0.5 bg-zinc-900 px-2 py-1.5 font-mono text-[11px]">
              <div className="text-zinc-300">{key}</div>
              <div className="text-zinc-500">{hex.toUpperCase()}</div>
              {!raw && <div className="text-amber-500">no definido (fallback)</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
