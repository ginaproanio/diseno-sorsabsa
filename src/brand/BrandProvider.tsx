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
  /** Fondo de menús laterales oscuros (default: primary). Permite un navy
   *  profundo para el sidebar sin oscurecer botones/acciones (primary). */
  sidebar?: string;
}

export interface BrandConfig {
  /** Identificador de la app: 'condomanager' | 'domuscrm' | 'agente24siete' | 'sorsabsa'… */
  name: string;
  displayName: string;
  logoUrl?: string;
  /** Logotipo de texto por partes. Por defecto dos tonos: primera parte en
   *  accent, segunda en primary (ej. CondoManager = {first:'Condo',
   *  second:'Manager'}). `third` permite un segmento final y `tones` otro
   *  mapeo de color por parte ('text' = color de texto normal) — ej.
   *  agente24siete = "agente"+"24"+"siete" donde SOLO "24" lleva color.
   *  `animated` permite animar partes específicas una sola vez al entrar
   *  en pantalla, sin loop. */
  wordmark?: {
    first: string;
    second: string;
    third?: string;
    tones?: WordmarkTone[];
    animated?: WordmarkAnimation[];
  };
  colors: BrandColors;
  /** Radio de esquinas, ej. '0.5rem' (CondoManager) o '0.75rem' */
  radius?: string;
  /** Pila tipográfica del CUERPO (texto normal) */
  fontFamily?: string;
  /** Pila tipográfica de TITULARES y logotipo (ej. 'Fraunces' de CondoManager) */
  headingFont?: string;
  /** URL de Google Fonts (u otra) a cargar para las fuentes de la marca */
  fontImport?: string;
  spacingScale?: readonly [string, string, string, string, string, string, string, string, string, string, string, string, string];
  shadowPreset?: 'flat' | 'soft' | 'dramatic';
  borderPreset?: 'soft' | 'medium' | 'hard';
  surfaceElevated?: string;
  typographyScale?: {
    xs?: string;
    sm?: string;
    base?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    display?: string;
  };
  leadingPreset?: 'tight' | 'normal' | 'relaxed';
  trackingPreset?: 'tight' | 'normal' | 'wide';
}

/** Tonos disponibles para cada parte del wordmark. */
export type WordmarkTone = 'text' | 'primary' | 'accent';

/** Variantes de animación disponibles para partes del wordmark. */
export type WordmarkAnimation = 'none' | 'spring-sweep' | 'fade-slide';

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

/** '#c1701b' → [193, 112, 27] */
function hexToRgb(hex: string): [number, number, number] {
  const t = hexToRgbTriplet(hex).split(' ').map(Number);
  return [t[0]!, t[1]!, t[2]!];
}

/** Luminancia relativa WCAG 2.1 de un color RGB 0-255. */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** Razón de contraste WCAG entre dos colores. */
function contrastRatio(a: [number, number, number], b: [number, number, number]): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function toHex([r, g, b]: [number, number, number]): string {
  return '#' + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
}

/**
 * Oscurece `color` lo mínimo necesario para alcanzar `target` de contraste
 * contra `bg`. Devuelve el color intacto si ya cumple.
 *
 * Existe porque varios primaries del ecosistema son legibles como FONDO pero
 * no como TEXTO: el ocre de Agente24Siete (#c1701b) rinde 3.46:1 y el turquesa
 * de DomusCRM 2.43:1. Los componentes que pintan el color de marca sobre claro
 * (p. ej. Button `secondary`) heredaban ese fallo en todos los productos.
 */
function darkenToContrast(color: string, bg: string, target: number): string {
  const rgb = hexToRgb(color);
  const bgRgb = hexToRgb(bg);
  if (contrastRatio(rgb, bgRgb) >= target) return color;
  for (let k = 0.98; k >= 0; k -= 0.02) {
    const probe: [number, number, number] = [rgb[0] * k, rgb[1] * k, rgb[2] * k];
    if (contrastRatio(probe, bgRgb) >= target) return toHex(probe);
  }
  return '#000000';
}

/** Blanco o casi-negro, el que mejor contraste dé sobre `bg`. */
function readableOn(bg: string): string {
  const bgRgb = hexToRgb(bg);
  const blanco = contrastRatio([255, 255, 255], bgRgb);
  const oscuro = contrastRatio([17, 17, 17], bgRgb);
  return blanco >= oscuro ? '#ffffff' : '#111111';
}

/** Convierte la config de marca en variables CSS listas para inyectar. */
export function brandToCssVars(brand: BrandConfig): CSSProperties {
  const c = brand.colors;
  const cuerpo = brand.fontFamily ?? "system-ui, -apple-system, 'Segoe UI', sans-serif";
  /**
   * Cada preset es una RAMPA de tres pasos (sm → md → lg), no un valor único.
   *
   * Antes había un solo valor por preset y los tres tokens se resolvían con
   * `shadowMap[brand.shadowPreset ?? '<otro default>']`: el `??` solo actúa
   * cuando el preset es undefined, así que en cuanto una marca lo declaraba
   * los tres colapsaban al MISMO valor y la escala de elevación desaparecía.
   *
   * La rampa `soft` reproduce exactamente los tres valores que se obtenían sin
   * preset, así que las marcas que no lo declaran no cambian de aspecto.
   */
  const shadowRamps: Record<string, readonly [string, string, string]> = {
    flat: [
      '0 1px 2px 0 rgb(0 0 0 / 0.04)',
      '0 1px 3px 0 rgb(0 0 0 / 0.07)',
      '0 2px 6px -1px rgb(0 0 0 / 0.10)',
    ],
    soft: [
      '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.06)',
      '0 12px 40px -8px rgb(0 0 0 / 0.18), 0 4px 16px -4px rgb(0 0 0 / 0.12)',
    ],
    dramatic: [
      '0 2px 4px 0 rgb(0 0 0 / 0.08)',
      '0 8px 20px -4px rgb(0 0 0 / 0.14)',
      '0 24px 60px -12px rgb(0 0 0 / 0.28), 0 8px 24px -8px rgb(0 0 0 / 0.18)',
    ],
  };
  const ramp = shadowRamps[brand.shadowPreset ?? 'soft'] ?? shadowRamps['soft']!;
  const borderMap: Record<string, string> = {
    soft: '13%',
    medium: '22%',
    hard: '0%',
  };
  const scale = brand.typographyScale ?? {};
  const leadingMap: Record<string, string> = { tight: '1.25', normal: '1.5', relaxed: '1.75' };
  const trackingMap: Record<string, string> = { tight: '-0.02em', normal: '0', wide: '0.02em' };
  const vars: Record<string, string> = {
    '--brand-primary': hexToRgbTriplet(c.primary),
    '--brand-primary-foreground': hexToRgbTriplet(c.primaryForeground ?? '#ffffff'),
    // Variante del primary garantizada legible como TEXTO sobre el fondo de la
    // marca (AA 4.5:1). Si el primary ya cumple, es el mismo color.
    '--brand-primary-text': hexToRgbTriplet(
      darkenToContrast(c.primary, c.background ?? c.surface ?? '#ffffff', 4.5),
    ),
    // Foreground del acento calculado, no asumido: `accent` usaba
    // primaryForeground (blanco por defecto), que sobre acentos claros como el
    // turquesa de DomusCRM daba 2.58:1.
    '--brand-accent-foreground': hexToRgbTriplet(readableOn(c.accent ?? c.primary)),
    '--brand-secondary': hexToRgbTriplet(c.secondary ?? '#64748b'),
    '--brand-accent': hexToRgbTriplet(c.accent ?? c.primary),
    '--brand-surface': hexToRgbTriplet(c.surface ?? '#ffffff'),
    '--brand-background': hexToRgbTriplet(c.background ?? c.surface ?? '#f8fafc'),
    '--brand-text': hexToRgbTriplet(c.text ?? '#0f172a'),
    '--brand-muted': hexToRgbTriplet(c.muted ?? '#64748b'),
    '--brand-border': hexToRgbTriplet(c.border ?? '#e2e8f0'),
    '--brand-destructive': hexToRgbTriplet(c.destructive ?? '#dc2626'),
    '--brand-sidebar': hexToRgbTriplet(c.sidebar ?? c.primary),
    '--brand-radius': brand.radius ?? '0.5rem',
    '--brand-font': cuerpo,
    '--brand-heading-font': brand.headingFont ? `'${brand.headingFont}', ${cuerpo}` : cuerpo,
    '--brand-shadow-sm': ramp[0],
    '--brand-shadow-md': ramp[1],
    '--brand-shadow-lg': ramp[2],
    '--brand-border-light-alpha': borderMap[brand.borderPreset ?? 'soft'] ?? borderMap['soft']!,
    '--brand-elevated': brand.surfaceElevated ?? c.surface ?? '#ffffff',
    '--brand-space-1': '0.25rem',
    '--brand-space-2': '0.5rem',
    '--brand-space-3': '0.75rem',
    '--brand-space-4': '1rem',
    '--brand-space-5': '1.25rem',
    '--brand-space-6': '1.5rem',
    '--brand-space-8': '2rem',
    '--brand-space-10': '2.5rem',
    '--brand-space-12': '3rem',
    '--brand-space-16': '4rem',
    '--brand-text-xs': scale.xs ?? '0.75rem',
    '--brand-text-sm': scale.sm ?? '0.875rem',
    '--brand-text-base': scale.base ?? '1rem',
    '--brand-text-lg': scale.lg ?? '1.125rem',
    '--brand-text-xl': scale.xl ?? '1.25rem',
    '--brand-text-2xl': scale['2xl'] ?? '1.5rem',
    '--brand-text-display': scale.display ?? '1.875rem',
    '--brand-leading-body': leadingMap[brand.leadingPreset ?? 'normal'] ?? leadingMap['normal']!,
    '--brand-tracking-display':
      trackingMap[brand.trackingPreset ?? 'tight'] ?? trackingMap['tight']!,
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
  "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');",
];
