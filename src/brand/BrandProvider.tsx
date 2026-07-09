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
  surface?: string;
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
  colors: BrandColors;
  /** Radio de esquinas, ej. '0.5rem' (CondoManager) o '0.75rem' */
  radius?: string;
  /** Pila tipográfica CSS */
  fontFamily?: string;
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
  const vars: Record<string, string> = {
    '--brand-primary': hexToRgbTriplet(c.primary),
    '--brand-primary-foreground': hexToRgbTriplet(c.primaryForeground ?? '#ffffff'),
    '--brand-secondary': hexToRgbTriplet(c.secondary ?? '#64748b'),
    '--brand-accent': hexToRgbTriplet(c.accent ?? c.primary),
    '--brand-surface': hexToRgbTriplet(c.surface ?? '#ffffff'),
    '--brand-text': hexToRgbTriplet(c.text ?? '#0f172a'),
    '--brand-muted': hexToRgbTriplet(c.muted ?? '#64748b'),
    '--brand-border': hexToRgbTriplet(c.border ?? '#e2e8f0'),
    '--brand-destructive': hexToRgbTriplet(c.destructive ?? '#dc2626'),
    '--brand-radius': brand.radius ?? '0.5rem',
    '--brand-font': brand.fontFamily ?? "system-ui, -apple-system, 'Segoe UI', sans-serif",
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
