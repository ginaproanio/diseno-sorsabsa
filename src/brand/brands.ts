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
      accent: '#1d4ed8',             // mismo tono que primary — un solo
                                      // color sobrio (antes cián #22d3ee de
                                      // los degradados, retirado por pedido
                                      // explícito de la clienta)
      secondary: '#e0edff',
      surface: '#FFFFFF',
      background: '#f6f8fc',
      text: '#0b1220',
      muted: '#5b6472',
      border: '#dbe3ef',
    },
    radius: '0.25rem',
    // DomusCRM usa la UI sans del sistema; sin fuente especial que cargar.
  },

  agente24siete: {
    name: 'agente24siete',
    displayName: 'Agente24Siete',
    // Logotipo (definido por Gina, 16 jul 2026): "agente" y "siete" en VERDE
    // petróleo (accent), SOLO el "24" en ocre (primary). Minúsculas, mono.
    wordmark: { first: 'agente', second: '24', third: 'siete', tones: ['accent', 'primary', 'accent'] },
    // Identidad REAL (16 jul 2026), extraída de la landing original aprobada
    // (index.html, tema claro): ocre para acciones/resaltados, verde petróleo
    // para estados/identidad, titulares en monospace. Deja de ser provisional.
    colors: {
      primary: '#c1701b',            // ocre — CTAs y palabras resaltadas
      primaryForeground: '#17120a',  // texto casi negro sobre el ocre (original)
      accent: '#1f6f5c',             // verde petróleo — estados, chips, wordmark
      surface: '#FFFFFF',
      background: '#f4f6f9',
      text: '#191d24',
      muted: '#566072',
      border: '#dde2e9',
    },
    radius: '0.625rem',              // --radius: 10px del original
    // Titulares/logotipo en mono (el original usaba la pila ui-monospace del
    // sistema; se fija JetBrains Mono para que se vea IGUAL en toda máquina).
    headingFont: 'JetBrains Mono',
    fontImport:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap',
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
