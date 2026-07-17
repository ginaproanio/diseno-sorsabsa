import { brandToCssVars, type BrandConfig } from './lib';
import { rgbTripletToHex } from './contrast';

export interface ResolvedBrandColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  surface: string;
  background: string;
  text: string;
  muted: string;
  border: string;
  destructive: string;
}

/**
 * Colores REALMENTE efectivos de una marca en runtime: llama a la MISMA
 * función que usa <BrandProvider> para inyectar variables CSS
 * (`brandToCssVars`, exportada por la librería) y convierte las tripletas
 * RGB de vuelta a hex. Así el showcase queda garantizado de reflejar
 * exactamente el fallback real de la librería — no una copia mantenida a
 * mano que puede desincronizarse si BrandProvider cambia sus defaults.
 */
export function resolveEffectiveColors(brand: BrandConfig): ResolvedBrandColors {
  const vars = brandToCssVars(brand) as unknown as Record<string, string>;
  return {
    primary: rgbTripletToHex(vars['--brand-primary']!),
    primaryForeground: rgbTripletToHex(vars['--brand-primary-foreground']!),
    secondary: rgbTripletToHex(vars['--brand-secondary']!),
    accent: rgbTripletToHex(vars['--brand-accent']!),
    surface: rgbTripletToHex(vars['--brand-surface']!),
    background: rgbTripletToHex(vars['--brand-background']!),
    text: rgbTripletToHex(vars['--brand-text']!),
    muted: rgbTripletToHex(vars['--brand-muted']!),
    border: rgbTripletToHex(vars['--brand-border']!),
    destructive: rgbTripletToHex(vars['--brand-destructive']!),
  };
}
