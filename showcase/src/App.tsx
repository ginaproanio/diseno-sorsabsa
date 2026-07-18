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

const BRAND_KEYS = Object.keys(BRANDS);

export function BrandPanel({ brand, shadowStyle, onShadowStyleChange }: {
  brand: BrandConfig;
  shadowStyle: 'flat' | 'soft';
  onShadowStyleChange: (style: 'flat' | 'soft') => void;
}) {
  return (
    <BrandProvider brand={brand}>
      <div className="brand-panel-wrapper animate-fade-in-up">
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
            <span className="shadow-label">Sombra aplicada a cards y botones:</span>
            <div className="shadow-toggle">
              <button
                type="button"
                onClick={() => onShadowStyleChange('flat')}
                aria-pressed={shadowStyle === 'flat'}
              >
                Plano (antes)
              </button>
              <button
                type="button"
                onClick={() => onShadowStyleChange('soft')}
                aria-pressed={shadowStyle === 'soft'}
              >
                Suave (ahora)
              </button>
            </div>
            <span className="shadow-label">
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
    <div className="min-h-screen bg-[#05060a] text-zinc-200">
      <header className="sticky top-0 z-20 border-b border-zinc-800/60 bg-[#05060a]/80 px-6 py-5 backdrop-blur-md">
        <div className="mx-auto max-w-[1200px] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="hero-eyebrow">SORSABSA</div>
            <h1 className="font-['Fraunces'] text-base font-semibold text-zinc-100 tracking-tight">
              Showcase de marcas — <span className="text-zinc-400">@sorsabsa/ui</span>
            </h1>
          </div>
          <nav className="flex flex-wrap gap-1.5" aria-label="Marcas">
            {BRAND_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActive(key)}
                aria-pressed={key === active}
                className={`rounded-lg px-3.5 py-2 font-mono text-[11px] transition-all duration-200 ${
                  key === active
                    ? 'bg-zinc-100 text-zinc-950 shadow-lg shadow-zinc-900/50'
                    : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {BRANDS[key]!.displayName}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="px-6 py-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-12 flex flex-col gap-4 animate-fade-in-up">
            <span className="hero-eyebrow">@sorsabsa/ui — auditoría del sistema de diseño</span>
            <h1 className="hero-title">
              Más consistente.<br />Accesible.<br />Con más carácter.
            </h1>
            <p className="hero-body">
              Unificamos la escala de espaciado y los pesos tipográficos, y corregimos cada combinación de color que fallaba el contraste WCAG AA — sin perder la identidad de marca de cada producto. Encima, evolucionamos el lenguaje visual: sombras en capas, microinteracciones sutiles y una jerarquía tipográfica más dinámica.
            </p>
            <div className="hero-divider" />
          </div>

          <BrandPanel key={active} brand={brand} shadowStyle={shadowStyle} onShadowStyleChange={setShadowStyle} />
        </div>
      </main>
    </div>
  );
}
