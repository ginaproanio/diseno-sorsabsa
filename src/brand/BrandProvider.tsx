'use client';

/**
 * BrandProvider — LA GUÍA DE INYECCIÓN DE MARCA (Whitelabel Engine)
 *
 * Recibe la configuración visual de la app que lo consume (colores, logo,
 * fuente, radio) y la inyecta como variables CSS en el árbol que envuelve.
 * Los componentes de la librería usan clases Tailwind atadas a esas
 * variables (preset), así que se "visten" solos: verde para CondoManager,
 * azul para DomusCRM — sin recompilar, sin duplicar componentes.
 */

import { createContext, useContext, useMemo, type CSSProperties, type ReactNode } from 'react';

export interface BrandColors {
  primary: string;              // hex, ej. '#16a34a'
  primaryForeground?: string;   // texto sobre primary (default blanco)
  secondary?: string;
  accent?: string;
  surface?: string;             // fondo de tarjetas/superficies
  background?: string;          // fondo general de la página
  text?: string;
  muted?: string;
  border?: string;
  destructive?: string;
}

export interface BrandConfig {
  /** Identificador de la app: 'condomanager' | 'domuscrm' | 'agente24siete' | 'sorsabsa'… */
  name: string;
  displayName: string;
  logoUrl?: string;
  /** Logotipo de texto de dos tonos: primera parte en accent, segunda en primary.
   *  Ej. CondoManager = {first:'Condo', second:'Manager'}. Si falta, se usa displayName. */
  wordmark?: { first: string; second: string };
  colors: BrandColors;
  /** Radio de esquinas, ej. '0.5rem' (CondoManager) o '0.75rem' */
  radius?: string;
  /** Pila tipográfica del CUERPO (texto normal) */
  fontFamily?: string;
  /** Pila tipográfica de TITULARES y logotipo (ej. 'Fraunces' de CondoManager) */
  headingFont?: string;
  /** URL de Google Fonts (u otra) a cargar para las fuentes de la marca */
  fontImport?: string;
}

const BrandContext = createContext<BrandConfig | null>(null);

/** Acceso a la marca activa (logo, nombre, colores) desde cualquier componente. */
export function useBrand(): BrandConfig {
  const brand = useContext(BrandContext);
  if (!brand) {
    throw new Error('useBrand debe usarse dentro de <BrandProvider>');
  }
  return brand;
}

/** '#1276bd' → '18 118 189' (tripleta RGB para los tokens con opacidad). */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) {
    throw new Error(`Color hex inválido: "${hex}"`);
  }
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Convierte la config de marca en variables CSS listas para inyectar. */
export function brandToCssVars(brand: BrandConfig): CSSProperties {
  const c = brand.colors;
  const cuerpo = brand.fontFamily ?? "system-ui, -apple-system, 'Segoe UI', sans-serif";
  const vars: Record<string, string> = {
    '--brand-primary': hexToRgbTriplet(c.primary),
    '--brand-primary-foreground': hexToRgbTriplet(c.primaryForeground ?? '#ffffff'),
    '--brand-secondary': hexToRgbTriplet(c.secondary ?? '#64748b'),
    '--brand-accent': hexToRgbTriplet(c.accent ?? c.primary),
    '--brand-surface': hexToRgbTriplet(c.surface ?? '#ffffff'),
    '--brand-background': hexToRgbTriplet(c.background ?? c.surface ?? '#f8fafc'),
    '--brand-text': hexToRgbTriplet(c.text ?? '#0f172a'),
    '--brand-muted': hexToRgbTriplet(c.muted ?? '#64748b'),
    '--brand-border': hexToRgbTriplet(c.border ?? '#e2e8f0'),
    '--brand-destructive': hexToRgbTriplet(c.destructive ?? '#dc2626'),
    '--brand-radius': brand.radius ?? '0.5rem',
    '--brand-font': cuerpo,
    // Titulares y logotipo: la fuente de marca (Fraunces en CondoManager),
    // con degradación elegante al cuerpo si no se define.
    '--brand-heading-font': brand.headingFont ? `'${brand.headingFont}', ${cuerpo}` : cuerpo,
  };
  return vars as CSSProperties;
}

export function BrandProvider({
  brand,
  children,
  className,
}: {
  brand: BrandConfig;
  children: ReactNode;
  className?: string;
}) {
  const style = useMemo(() => brandToCssVars(brand), [brand]);
  return (
    <BrandContext.Provider value={brand}>
      <div data-brand={brand.name} style={style} className={className}>
        {children}
      </div>
    </BrandContext.Provider>
  );
}

/**
 * URLs de fuentes de todas las marcas del ecosistema. Cada app las importa
 * ESTÁTICAMENTE en su globals.css (`@import`) — cargar `<link>` dinámicos
 * dentro del árbol de React 19 rompe la hidratación. Aquí solo se listan
 * como referencia; el navegador solo descarga la que la marca activa use.
 */
export const BRAND_FONT_IMPORTS: string[] = [
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap');",
];
