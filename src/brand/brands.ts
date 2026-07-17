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
      text: '#222925',                // gris carbón real de globals.css (no #2A342E)
      muted: '#627269',
      border: '#D2DDD7',              // borde suave real de globals.css (no #DCE4DF)
    },
    radius: '0.75rem',
    // Cuerpo REAL de CondoManager: Satoshi (Fontshare) — resguardado 16 jul
    // 2026 al hacerlo consumidor; antes solo estaba Fraunces (titulares).
    fontFamily: "'Satoshi', system-ui, -apple-system, 'Segoe UI', sans-serif",
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

  // Extraído del logo oficial SORSABSA (PNG), 17 jul 2026 — ver conversación
  // con Claude sobre corrección de identidad. El logo es un ícono "S" en
  // verde y gris carbón/antracita con acabado metálico (nada de azul
  // institucional: los valores previos #1e293b/#0ea5e9 eran inventados).
  // text/muted/border derivados del mismo tono casi neutro del primary
  // (H≈276°, S≈4%) en vez de la escala azulada anterior, siguiendo la misma
  // lógica de escala tonal que condomanager y agente24siete.
  sorsabsa: {
    name: 'sorsabsa',
    displayName: 'SORSABSA',
    colors: {
      primary: '#423F44',            // gris carbón/antracita del logo
      accent: '#70C051',             // verde del logo
      surface: '#FFFFFF',
      text: '#212022',
      muted: '#67626A',
      border: '#DEDDDF',
    },
    radius: '0.5rem',
  },

  // EcoInmobiliaria — empresa ALIADA que consume DomusCRM (no es producto
  // propio de SORSABSA), su identidad vive aquí porque es la carta de
  // presentación de lo que vendemos con DomusCRM.
  // Extraído del isotipo y portada oficiales (PNG), 17 jul 2026.
  ecoinmobiliaria: {
    name: 'ecoinmobiliaria',
    displayName: 'EcoInmobiliaria',
    wordmark: { first: 'ECO', second: 'INMOBILIARIA', tones: ['accent', 'primary'] },
    colors: {
      primary: '#0075BE',      // azul del isotipo (casa)
      accent: '#EF8C12',       // naranja ("ECO" + ondas wifi)
      secondary: '#1669B2',    // azul del wordmark "INMOBILIARIA" (tono distinto al del isotipo)
      surface: '#FFFFFF',
      background: '#F5F9FC',  // AJUSTAR si tienen un fondo de marca definido — no viene del logo
      text: '#0B1F33',         // AJUSTAR — no viene del logo, es una aproximación oscura sobre el azul primario
      muted: '#5B7690',        // AJUSTAR — mismo caso
      border: '#DCE7F0',       // AJUSTAR — mismo caso
    },
    radius: '0.75rem',         // AJUSTAR según su manual de marca si difiere
  },
};

/** Marca por parámetro (?app=…) con fallback institucional (nunca falla). */
export function getBrand(app: string | null | undefined): BrandConfig {
  return BRANDS[app ?? ''] ?? BRANDS.sorsabsa!;
}
