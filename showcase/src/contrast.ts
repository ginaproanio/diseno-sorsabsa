/**
 * Matemática real de contraste WCAG 2.x (fórmula de luminancia relativa,
 * spec 1.4.3/1.4.6 — https://www.w3.org/TR/WCAG21/#contrast-minimum).
 * Cálculo real a partir del hex, no una etiqueta puesta a mano por color.
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channelLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa (0 = negro, 1 = blanco) de un color hex. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLinear(r) + 0.7152 * channelLinear(g) + 0.0722 * channelLinear(b);
}

/** Razón de contraste real entre dos colores (de 1:1 a 21:1). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = 'AAA' | 'AA' | 'Falla';

/** Nivel WCAG para texto normal (el umbral de texto grande ≥18pt/14pt-bold es más laxo: 3:1/4.5:1). */
export function wcagLevel(ratio: number): WcagLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  return 'Falla';
}

/** '18 118 189' (tripleta RGB que inyecta BrandProvider) → '#1276bd'. */
export function rgbTripletToHex(triplet: string): string {
  const [r, g, b] = triplet.trim().split(/\s+/).map(Number);
  return '#' + [r, g, b].map((c) => (c ?? 0).toString(16).padStart(2, '0')).join('');
}
