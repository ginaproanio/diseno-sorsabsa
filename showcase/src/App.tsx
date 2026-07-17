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
import { SpacingScale } from './components/SpacingScale';

// Una pestaña por cada key real de BRANDS — no una lista fija: si mañana
// se agrega una marca nueva a brands.ts, aparece sola aquí.
const BRAND_KEYS = Object.keys(BRANDS);

export function BrandPanel({ brand }: { brand: BrandConfig }) {
  return (
    <BrandProvider brand={brand}>
      {/* bg-brand-background/text-brand-text: el "lienzo" real de la marca
          (no un color inventado del shell) — así los componentes se ven
          exactamente como en el producto, sobre SU fondo real. */}
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

        <Section title="Estados de Button">
          <ButtonMatrix />
        </Section>

        <Section title="Card + StatusBadge">
          <CardStatusDemo />
        </Section>

        <Section title="TypingDots">
          <TypingDotsDemo />
        </Section>

        <Section title="Formulario (Input)">
          <FormDemo />
        </Section>

        <Section title="Catálogo de íconos (Icon)">
          <IconCatalog />
        </Section>

        <Section title="Escala de espaciado">
          <SpacingScale />
        </Section>
      </div>
    </BrandProvider>
  );
}

export default function App() {
  const [active, setActive] = useState(BRAND_KEYS[0]!);
  const brand = BRANDS[active]!;

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
        {/* key={active}: remonta el panel al cambiar de marca, para que el
            useEffect de fontImport en TypographyDemo limpie el <link> de la
            pestaña anterior y cargue el de la nueva. */}
        <BrandPanel key={active} brand={brand} />
      </main>
    </div>
  );
}
