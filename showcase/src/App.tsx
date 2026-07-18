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
      <div className="rounded-lg bg-white p-5 text-zinc-900 sm:p-6 border border-zinc-200 shadow-sm">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Section title="Identidad" description="Wordmark y tipografía de la marca.">
            <div className="space-y-4">
              <Wordmark className="text-4xl" />
              <TypographyDemo brand={brand} />
            </div>
          </Section>

          <Section title="Paleta" description="Colores oficiales de la marca.">
            <ColorPalette brand={brand} />
          </Section>

          <Section title="Tokens" description="Radio, sombras y espaciado.">
            <div className="space-y-4">
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
            </div>
          </Section>

          <Section title="Botones">
            <ButtonMatrix shadowStyle={shadowStyle} />
          </Section>

          <Section title="Cards y status">
            <CardStatusDemo shadowStyle={shadowStyle} />
          </Section>

          <Section title="Feedback">
            <TypingDotsDemo />
          </Section>

          <Section title="Formulario">
            <FormDemo />
          </Section>

          <Section title="Notificaciones" id="notificaciones">
            <NotificationDemo />
          </Section>

          <Section title="Íconos">
            <IconCatalog shadowStyle={shadowStyle} />
          </Section>

          <Section title="Tabla">
            <TableDemo />
          </Section>

          <Section title="Espaciado">
            <SpacingScale />
          </Section>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Section
            title="Contraste WCAG"
            description="Métrica técnica: razón de contraste real sobre colores efectivos."
          >
            <ContrastReport brand={brand} />
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
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-[1200px] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">SORSABSA</div>
            <h1 className="font-mono text-sm font-bold text-zinc-900">Showcase de marcas — @sorsabsa/ui</h1>
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
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                {BRANDS[key]!.displayName}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#notificaciones"
              className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
              aria-label="Ir a sección de notificaciones"
              title="Notificaciones"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white">3</span>
            </a>
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex flex-col gap-1">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              @sorsabsa/ui — manual de marca
            </span>
            <h1 className="font-['Fraunces'] text-xl font-semibold leading-tight text-zinc-900 sm:text-2xl">
              {brand.displayName}
            </h1>
          </div>

          <BrandPanel key={active} brand={brand} shadowStyle={shadowStyle} onShadowStyleChange={setShadowStyle} />
        </div>
      </main>
    </div>
  );
}
