import { useState } from 'react';
import { BRANDS, BrandProvider, Wordmark, type BrandConfig } from './lib';
import { resolveEffectiveColors } from './resolveColors';
import { Section } from './components/Section';
import { SummaryCards } from './components/SummaryCards';
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
import { PropertyCarouselDemo } from './components/PropertyCarouselDemo';
import { DomusLanding } from './components/DomusLanding';
import { AtomShowcase } from './components/AtomShowcase';

const BRAND_KEYS = Object.keys(BRANDS);

export function BrandPanel({ brand, shadowStyle, onShadowStyleChange }: {
  brand: BrandConfig;
  shadowStyle: 'flat' | 'soft';
  onShadowStyleChange: (style: 'flat' | 'soft') => void;
}) {
  return (
    <div className="brand-panel-wrapper">
        <div className="brand-section">
          <Section title="Identidad">
            <div className="space-y-4">
              <Wordmark className="text-4xl" />
              <TypographyDemo brand={brand} />
            </div>
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Paleta">
            <ColorPalette brand={brand} />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Tokens">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-zinc-500">Sombra:</span>
                <div className="flex rounded border border-zinc-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onShadowStyleChange('flat')}
                    aria-pressed={shadowStyle === 'flat'}
                    className={`px-3 py-1.5 font-mono text-xs transition-colors ${
                      shadowStyle === 'flat'
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    Plano
                  </button>
                  <button
                    type="button"
                    onClick={() => onShadowStyleChange('soft')}
                    aria-pressed={shadowStyle === 'soft'}
                    className={`px-3 py-1.5 font-mono text-xs transition-colors border-l border-zinc-300 ${
                      shadowStyle === 'soft'
                        ? 'bg-zinc-900 text-white'
                        : 'bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                    }`}
                  >
                    Suave
                  </button>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Botones">
            <ButtonMatrix shadowStyle={shadowStyle} />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Cards y status">
            <CardStatusDemo shadowStyle={shadowStyle} />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Feedback">
            <TypingDotsDemo />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Formulario">
            <FormDemo />
          </Section>
        </div>

        <div className="brand-section" id="notificaciones">
          <Section title="Notificaciones">
            <NotificationDemo />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Catálogo de propiedades">
            <PropertyCarouselDemo />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Íconos">
            <IconCatalog shadowStyle={shadowStyle} />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Tabla">
            <TableDemo />
          </Section>
        </div>

        <div className="brand-section">
          <Section title="Espaciado">
            <SpacingScale />
          </Section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="brand-section">
            <Section
              title="Contraste WCAG"
              description="Métrica técnica: razón de contraste real sobre colores efectivos."
            >
              <ContrastReport brand={brand} />
            </Section>
          </div>

          <div className="brand-section">
            <Section
              title="Auditoría de tokens"
              description="Tokens planeados. Valores actuales en gris si aún no existen."
            >
              <TokenAudit />
            </Section>
          </div>
        </div>
      </div>
  );
}

export default function App() {
  const [active, setActive] = useState(BRAND_KEYS[0]!);
  const brand = BRANDS[active]!;
  const [shadowStyle, setShadowStyle] = useState<'flat' | 'soft'>('soft');

  return (
    <BrandProvider brand={brand} className="min-h-screen bg-[#fafafa] text-zinc-900">
      <div className="mx-auto max-w-[1200px] px-4 pb-6 pt-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          SORSABSA/UI — AUDITORÍA DEL SISTEMA DE DISEÑO
        </p>
        <h1
          className="font-brand-heading mt-3 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl"
          style={{ fontFamily: 'var(--brand-heading-font)' }}
        >
          Más consistente. Accesible.
          <br />
          Con más carácter.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Cada componente de @sorsabsa/ui auditado en vivo contra los tokens reales de marca: paleta,
          tipografía, contraste WCAG y profundidad — sin mockups, sin datos inventados.
        </p>
      </div>

      <div className="sticky top-0 z-10 border-y border-zinc-200 bg-[#fafafa]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav className="flex flex-wrap gap-1.5" aria-label="Marcas">
            {BRAND_KEYS.map((key) => {
              const b = BRANDS[key]!;
              const isActive = key === active;
              const resolved = resolveEffectiveColors(b);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActive(key)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? ''
                      : 'border border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900'
                  }`}
                  style={isActive ? { background: resolved.primary, color: resolved.primaryForeground } : undefined}
                >
                  {b.displayName}
                </button>
              );
            })}
          </nav>
          <a
            href="#notificaciones"
            className="relative shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:text-zinc-900"
            aria-label="Ir a sección de notificaciones"
            title="Notificaciones"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">3</span>
          </a>
        </div>
      </div>

      <main className="p-4 sm:p-6">
        <div className="mx-auto max-w-[1200px]">
          <SummaryCards brand={brand} shadowStyle={shadowStyle} />

          <BrandPanel key={active} brand={brand} shadowStyle={shadowStyle} onShadowStyleChange={setShadowStyle} />

          <DomusLanding />
        </div>
      </main>
    </BrandProvider>
  );
}
