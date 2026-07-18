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
    <div className="flex flex-wrap items-center gap-4">
      {TOKEN_ORDER.map((key) => {
        const raw = brand.colors[key];
        const hex = resolved[key];
        return (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <div
              className="h-8 w-8 rounded-full border border-zinc-200 shadow-sm"
              style={{ background: hex }}
              title={hex.toUpperCase()}
            />
            <div className="text-center font-mono text-[10px] leading-tight">
              <div className="text-zinc-500">{key}</div>
              <div className="text-zinc-600">{hex.toUpperCase()}</div>
              {!raw && <div className="text-amber-600">no definido</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
