import type { BrandConfig } from './BrandProvider';

/**
 * Identidades oficiales del ecosistema SORSABSA.
 * Una sola fuente de verdad: la consumen las apps y el SSO (?app=…).
 */
export const BRANDS: Record<string, BrandConfig> = {
  condomanager: {
    name: 'condomanager',
    displayName: 'CondoManager',
    colors: {
      primary: '#16a34a',        // el verde original (green-600)
      accent: '#22c55e',
    },
    radius: '0.5rem',
  },
  domuscrm: {
    name: 'domuscrm',
    displayName: 'DomusCRM',
    colors: {
      primary: '#1d4ed8',        // azul corporativo de la landing
      accent: '#22d3ee',         // cian de los degradados
    },
    radius: '0.75rem',
  },
  agente24siete: {
    name: 'agente24siete',
    displayName: 'Agente24Siete',
    colors: {
      primary: '#ea580c',        // provisional — ajustar al definir la marca
      accent: '#f97316',
    },
    radius: '0.5rem',
  },
  sorsabsa: {
    name: 'sorsabsa',
    displayName: 'SORSABSA',
    colors: {
      primary: '#1e293b',        // identidad institucional
      accent: '#0ea5e9',
    },
    radius: '0.5rem',
  },
};

/** Marca por parámetro (?app=…) con fallback institucional. */
export function getBrand(app: string | null | undefined): BrandConfig {
  return BRANDS[app ?? ''] ?? BRANDS.sorsabsa!;
}
