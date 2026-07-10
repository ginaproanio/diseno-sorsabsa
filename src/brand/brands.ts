import type { BrandConfig } from './BrandProvider';

/**
 * Identidades OFICIALES del ecosistema SORSABSA — extraídas de la fuente de
 * verdad de cada producto (no inventadas). Al vestir el chasis neutro de
 * @sorsabsa/ui, cada login/pantalla se ve como SU producto: si dice
 * CondoManager, el usuario va vestido con su identidad, sus colores, su tipo.
 */
export const BRANDS: Record<string, BrandConfig> = {
  // Extraído de condomanager/app/globals.css + docs/SISTEMA-DISENO.md
  // Paleta Sage/Oro · tipografía Fraunces · logotipo "Condo"+"Manager".
  condomanager: {
    name: 'condomanager',
    displayName: 'CondoManager',
    wordmark: { first: 'Condo', second: 'Manager' },
    colors: {
      primary: '#4A6055',            // verde bosque apagado ("Manager")
      accent: '#D1A153',             // oro/mostaza suave ("Condo")
      secondary: '#E3EAE6',          // sage claro
      surface: '#FFFFFF',
      background: '#F4F6F4',          // fondo gris-verde
      text: '#2A342E',
      muted: '#627269',
      border: '#DCE4DF',
    },
    radius: '0.75rem',
    headingFont: 'Fraunces',
    fontImport:
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap',
  },

  // Extraído de la landing de DomusCRM (webs/src/app/page.tsx + globals.css)
  domuscrm: {
    name: 'domuscrm',
    displayName: 'DomusCRM',
    wordmark: { first: 'Domus', second: 'CRM' },
    colors: {
      primary: '#1d4ed8',            // azul corporativo
      accent: '#22d3ee',             // cian de los degradados
      secondary: '#e0edff',
      surface: '#FFFFFF',
      background: '#f6f8fc',
      text: '#0b1220',
      muted: '#5b6472',
      border: '#dbe3ef',
    },
    radius: '0.75rem',
    // DomusCRM usa la UI sans del sistema; sin fuente especial que cargar.
  },

  agente24siete: {
    name: 'agente24siete',
    displayName: 'Agente24Siete',
    wordmark: { first: 'Agente', second: '24Siete' },
    colors: {
      primary: '#ea580c',            // provisional — ajustar al definir la marca
      accent: '#f97316',
      surface: '#FFFFFF',
      text: '#1c1917',
      muted: '#78716c',
      border: '#e7e5e4',
    },
    radius: '0.5rem',
  },

  sorsabsa: {
    name: 'sorsabsa',
    displayName: 'SORSABSA',
    colors: {
      primary: '#1e293b',            // institucional
      accent: '#0ea5e9',
      surface: '#FFFFFF',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
    },
    radius: '0.5rem',
  },
};

/** Marca por parámetro (?app=…) con fallback institucional (nunca falla). */
export function getBrand(app: string | null | undefined): BrandConfig {
  return BRANDS[app ?? ''] ?? BRANDS.sorsabsa!;
}
