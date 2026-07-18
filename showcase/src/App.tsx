import { useState } from 'react';
import { BRANDS, BrandProvider, Wordmark, type BrandConfig } from './lib';
import { Section } from './components/Section';
import { ColorPalette } from './components/ColorPalette';
import { ContrastReport } from './components/ContrastReport';
import { TypographyDemo } from './components/TypographyDemo';
import { ButtonMatrix } from './components/ButtonMatrix';
import { CardStatusDemo } from './components/CardStatusDemo';
import { TypingDotsDemo } from './components/TypingDotsDemo';
import { FormDemo } from './components/FormDemo';
import { IconCatalog } from './components/IconCatalog';
import { NotificationDemo } from './components/NotificationDemo';
import { TableDemo } from './components/TableDemo';
import { SpacingScale } from './components/SpacingScale';
import { TokenAudit } from './components/TokenAudit';

const BRAND_KEYS = Object.keys(BRANDS);

export function BrandPanel({ brand, shadowStyle, onShadowStyleChange }: {
  brand: BrandConfig;
  shadowStyle: 'flat' | 'soft';
  onShadowStyleChange: (style: 'flat' | 'soft') => void;
}) {
  return (
    <BrandProvider brand={brand}>
      <div className="rounded-lg bg-brand-background p-6 text-brand-text sm:p-8">
        <Section title="Wordmark">
          <Wordmark className="text-4xl" />
        </Section>

        <Section
          title="Paleta de colores"
          description="Leída en vivo de BRANDS[...].colors — hex efectivo (con el mismo fallback que aplica BrandProvider en runtime)."
        >
          <ColorPalette brand={brand} />
        </Section>

        <Section
          title="Contraste WCAG"
          description="Razón de contraste real (luminancia relativa WCAG), calculada sobre los colores efectivos — no una etiqueta puesta a mano."
        >
          <ContrastReport brand={brand} />
        </Section>

        <Section title="Tipografía">
          <TypographyDemo brand={brand} />
        </Section>

        <Section title="Estilos de sombra">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] text-zinc-500">Sombra aplicada a cards y botones:</span>
            <div className="flex rounded border border-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={() => onShadowStyleChange('flat')}
                aria-pressed={shadowStyle === 'flat'}
                className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                  shadowStyle === 'flat'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                Plano (antes)
              </button>
              <button
                type="button"
                onClick={() => onShadowStyleChange('soft')}
                aria-pressed={shadowStyle === 'soft'}
                className={`px-3 py-1.5 font-mono text-xs transition-colors border-l border-zinc-800 ${
                  shadowStyle === 'soft'
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                Suave (ahora)
              </button>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">
              {shadowStyle === 'flat'
                ? 'shadow: 0 1px 2px rgba(0,0,0,0.08)'
                : 'shadow: capa base + elevación al hover'}
            </span>
          </div>
        </Section>

        <Section title="Estados de Button">
          <ButtonMatrix shadowStyle={shadowStyle} />
        </Section>

        <Section title="Card + StatusBadge">
          <CardStatusDemo shadowStyle={shadowStyle} />
        </Section>

        <Section title="TypingDots">
          <TypingDotsDemo />
        </Section>

        <Section title="Formulario (Input)">
          <FormDemo />
        </Section>

        <Section title="Notificaciones (NotificationBell)">
          <NotificationDemo />
        </Section>

        <Section title="Catálogo de íconos (Icon)">
          <IconCatalog shadowStyle={shadowStyle} />
        </Section>

        <Section title="Tabla (Table)">
          <TableDemo />
        </Section>

        <Section title="Escala de espaciado">
          <SpacingScale />
        </Section>

        <Section
          title="Auditoría de tokens"
          description="Tokens planeados para esta iteración. Los valores actuales de @sorsabsa/ui se muestran en gris si aún no existen en tokens.css."
        >
          <TokenAudit brand={brand} />
        </Section>
      </div>
    </BrandProvider>
  );
}

export default function App() {
  const [active, setActive] = useState(BRAND_KEYS[0]!);
  const brand = BRANDS[active]!;
  const [shadowStyle, setShadowStyle] = useState<'flat' | 'soft'>('soft');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">SORSABSA</div>
            <h1 className="font-mono text-sm font-bold text-zinc-100">Showcase de marcas — @sorsabsa/ui</h1>
          </div>
          <nav className="flex flex-wrap gap-1" aria-label="Marcas">
            {BRAND_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                aria-pressed={key === active}
                className={`rounded px-3 py-1.5 font-mono text-xs transition-colors ${
                  key === active
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {BRANDS[key]!.displayName}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="p-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-10 flex flex-col gap-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-brand-accent">
              @sorsabsa/ui — auditoría del sistema de diseño
            </span>
            <h1 className="font-['Fraunces'] text-3xl font-semibold leading-tight text-zinc-100 sm:text-4xl">
              Más consistente. Accesible.<br className="hidden sm:block" />Con más carácter.
            </h1>
            <p className="max-w-2xl font-mono text-sm leading-relaxed text-zinc-400">
              Unificamos la escala de espaciado y los pesos tipográficos, y corregimos cada combinación de color que fallaba el contraste WCAG AA — sin perder la identidad de marca de cada producto. Encima, evolucionamos el lenguaje visual: sombras en capas, microinteracciones sutiles y una jerarquía tipográfica más dinámica.
            </p>
          </div>

          <BrandPanel key={active} brand={brand} shadowStyle={shadowStyle} onShadowStyleChange={setShadowStyle} />
        </div>
      </main>
    </div>
  );
}
