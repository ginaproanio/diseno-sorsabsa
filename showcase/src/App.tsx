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
import { TableDemo } from './components/TableDemo';
import { SpacingScale } from './components/SpacingScale';
import { TokenAudit } from './components/TokenAudit';
import { NotificationDemo } from './components/NotificationDemo';

const BRAND_KEYS = Object.keys(BRANDS);

export function BrandPanel({ brand, shadowStyle, onShadowStyleChange }: {
  brand: BrandConfig;
  shadowStyle: 'flat' | 'soft';
  onShadowStyleChange: (style: 'flat' | 'soft') => void;
}) {
  return (
    <BrandProvider brand={brand}>
      <div className="rounded-lg bg-brand-background p-6 text-brand-text sm:p-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Wordmark">
            <Wordmark className="text-4xl" />
          </Section>

          <Section
            title="Paleta de colores"
            description="Leída en vivo de BRANDS[...].colors — hex efectivo."
          >
            <ColorPalette brand={brand} />
          </Section>

          <Section
            title="Contraste WCAG"
            description="Razón de contraste real (luminancia relativa WCAG)."
          >
            <ContrastReport brand={brand} />
          </Section>

          <Section title="Tipografía">
            <TypographyDemo brand={brand} />
          </Section>

          <Section title="Estilos de sombra">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[11px] text-zinc-500">Sombra:</span>
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
                  Plano
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
                  Suave
                </button>
              </div>
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

          <Section title="Notificaciones (NotificationBell)" id="notificaciones">
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
            description="Tokens planeados. Valores actuales en gris si aún no existen."
          >
            <TokenAudit brand={brand} />
          </Section>
        </div>
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
          <div className="flex items-center gap-3">
            <a
              href="#notificaciones"
              className="relative p-2 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              aria-label="Ir a sección de notificaciones"
              title="Notificaciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">3</span>
            </a>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-brand-accent">
              @sorsabsa/ui — auditoría del sistema de diseño
            </span>
            <h1 className="font-['Fraunces'] text-2xl font-semibold leading-tight text-zinc-100 sm:text-3xl">
              Más consistente. Accesible. Con más carácter.
            </h1>
          </div>

          <BrandPanel key={active} brand={brand} shadowStyle={shadowStyle} onShadowStyleChange={setShadowStyle} />
        </div>
      </main>
    </div>
  );
}
