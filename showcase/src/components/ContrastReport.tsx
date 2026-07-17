import type { BrandConfig } from '../lib';
import { resolveEffectiveColors } from '../resolveColors';
import { contrastRatio, wcagLevel, type WcagLevel } from '../contrast';

function LevelBadge({ level }: { level: WcagLevel }) {
  const cls =
    level === 'AAA'
      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
      : level === 'AA'
        ? 'bg-blue-950 text-blue-400 border-blue-800'
        : 'bg-red-950 text-red-400 border-red-800';
  return <span className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${cls}`}>{level}</span>;
}

/** Razón de contraste REAL (luminancia relativa WCAG), no una etiqueta a
 * mano. "primaryForeground sobre primary" mide el par que efectivamente
 * pinta <Button variant="primary"> (con su fallback blanco si no está
 * definido) — no "text sobre primary", que ningún componente real usa. */
export function ContrastReport({ brand }: { brand: BrandConfig }) {
  const c = resolveEffectiveColors(brand);
  const filas = [
    { label: 'text sobre background', a: c.text, b: c.background },
    { label: 'text sobre surface', a: c.text, b: c.surface },
    { label: 'primaryForeground sobre primary (Button primario)', a: c.primaryForeground, b: c.primary },
  ];
  return (
    <div>
      <table className="w-full max-w-2xl border-collapse font-mono text-xs">
        <thead>
          <tr className="text-left text-zinc-500">
            <th className="pb-2 font-normal">Par</th>
            <th className="pb-2 font-normal">Razón</th>
            <th className="pb-2 font-normal">Nivel</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const ratio = contrastRatio(f.a, f.b);
            return (
              <tr key={f.label} className="border-t border-zinc-800">
                <td className="py-2 pr-4 text-zinc-300">
                  {f.label}
                  <div className="mt-1 flex items-center gap-1">
                    <span className="inline-block h-3 w-3 rounded-sm border border-zinc-700" style={{ background: f.a }} />
                    <span className="text-zinc-600">/</span>
                    <span className="inline-block h-3 w-3 rounded-sm border border-zinc-700" style={{ background: f.b }} />
                  </div>
                </td>
                <td className="py-2 pr-4 text-zinc-400">{ratio.toFixed(2)}:1</td>
                <td className="py-2">
                  <LevelBadge level={wcagLevel(ratio)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 font-mono text-[10px] text-zinc-600">
        Umbrales para texto normal: AA ≥ 4.5:1, AAA ≥ 7:1. Para texto grande (≥18pt o ≥14pt negrita) el mínimo baja a 3:1 / 4.5:1.
      </p>
    </div>
  );
}
