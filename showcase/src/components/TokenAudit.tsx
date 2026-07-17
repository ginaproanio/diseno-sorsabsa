import { useBrand } from '../lib';

const TOKENS = [
  { key: '--brand-weight-medium', value: '500', label: 'Peso medio (500)', exists: true },
  { key: '--brand-weight-semibold', value: '600', label: 'Peso semibold (600)', exists: true },
  { key: '--brand-space-1', value: '4px', label: 'Espaciado XS', exists: false },
  { key: '--brand-space-4', value: '16px', label: 'Espaciado MD', exists: false },
  { key: '--brand-space-6', value: '24px', label: 'Espaciado LG', exists: false },
  { key: '--brand-space-8', value: '32px', label: 'Espaciado XL', exists: false },
  { key: '--brand-accent-ink', value: 'rgb(...)', label: 'Texto accesible sobre accent', exists: false },
];

export function TokenAudit() {
  const brand = useBrand();
  const primaryRgb = brand.colors.primary.replace('#', '');
  const accentRgb = brand.colors.accent.replace('#', '');

  const rgbTriplet = (hex: string) => {
    const clean = hex.replace('#', '');
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    const n = parseInt(full, 16);
    if (Number.isNaN(n) || full.length !== 6) return hex;
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOKENS.map((t) => (
          <div
            key={t.key}
            className={`rounded border p-3 ${
              t.exists ? 'border-zinc-700 bg-zinc-900/50' : 'border-zinc-800 bg-zinc-900/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-zinc-300">{t.key}</span>
              <span
                className={`font-mono text-[10px] uppercase tracking-wider ${
                  t.exists ? 'text-emerald-400' : 'text-zinc-600'
                }`}
              >
                {t.exists ? 'Listo' : 'Pendiente'}
              </span>
            </div>
            <div className="mt-1 font-mono text-sm text-zinc-100">{t.value}</div>
            <div className="mt-1 font-mono text-[11px] text-zinc-500">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="mb-2 font-mono text-xs uppercase tracking-wider text-zinc-400">:root planificado</div>
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-zinc-300">
{`:root {
  --brand-primary: ${rgbTriplet(brand.colors.primary)};
  --brand-accent: ${rgbTriplet(brand.colors.accent)};
  --brand-accent-ink: ${rgbTriplet(brand.colors.accent)};  /* pendiente */
  --brand-weight-medium: 500;
  --brand-weight-semibold: 600;
  --brand-space-1: 4px;  --brand-space-4: 16px;
  --brand-space-6: 24px; --brand-space-8: 32px;
  --brand-radius: ${brand.radius ?? '0.5rem'};
}`}
        </pre>
      </div>
    </div>
  );
}
