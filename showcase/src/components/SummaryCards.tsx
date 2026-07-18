import type { BrandConfig } from '../lib';

/** TOKEN_ORDER real de ColorPalette.tsx — mismo conteo, no un número inventado. */
const COLOR_TOKEN_COUNT = 8;

function SummaryCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{eyebrow}</div>
      <div className="mt-1.5 text-base font-bold text-zinc-900">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">{description}</p>
    </div>
  );
}

/** 4 tarjetas de resumen — mismos datos reales que Espaciado/Tipografía/
 * Color/Profundidad muestran en detalle más abajo, condensados. Sin lógica
 * nueva: brand.headingFont y shadowStyle ya existen; el conteo de tokens de
 * color es el largo fijo de TOKEN_ORDER en ColorPalette.tsx. */
export function SummaryCards({ brand, shadowStyle }: { brand: BrandConfig; shadowStyle: 'flat' | 'soft' }) {
  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <SummaryCard
        eyebrow="Espaciado"
        title="Sin escala propia"
        description="El preset de Tailwind no define una escala de espaciado del ecosistema — gap real, documentado más abajo."
      />
      <SummaryCard
        eyebrow="Tipografía"
        title={brand.headingFont ? `${brand.headingFont} + cuerpo` : 'Pila del sistema'}
        description="Titulares y cuerpo inyectados por marca vía BrandProvider, sin recompilar componentes."
      />
      <SummaryCard
        eyebrow="Color"
        title={`${COLOR_TOKEN_COUNT} tokens en vivo`}
        description="Paleta calculada en tiempo real desde brand.colors, con el mismo fallback que usa BrandProvider."
      />
      <SummaryCard
        eyebrow="Profundidad"
        title={shadowStyle === 'flat' ? 'Sombra plana' : 'Sombra suave'}
        description="Alternable en vivo entre dos tratamientos de elevación sobre los mismos componentes."
      />
    </div>
  );
}
