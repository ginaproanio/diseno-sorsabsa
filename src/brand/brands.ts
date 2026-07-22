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
    wordmark: { first: 'Domus', second: 'CRM', tones: ['primary', 'accent'] },
    colors: {
      primary: '#1746A2',            // azul DomusCRM (visible) — botones, franjas, precios, "Domus"
      accent: '#1db4a5',             // turquesa DomusCRM — íconos, "CRM", highlights
      sidebar: '#000047',            // azul marino profundo — SOLO el fondo del menú lateral
      secondary: '#e0edff',
      surface: '#FFFFFF',
      background: '#f6f8fc',
      text: '#0b1220',
      muted: '#5b6472',
      border: '#dbe3ef',
    },
    radius: '0.25rem',
    shadowPreset: 'flat',
    borderPreset: 'soft',
    typographyScale: { base: '0.95rem', lg: '1.05rem', xl: '1.25rem', display: '2.25rem' },
    leadingPreset: 'tight',
    trackingPreset: 'tight',
  },

  agente24siete: {
    name: 'agente24siete',
    displayName: 'Agente24Siete',
    // Logotipo (definido por Gina, 16 jul 2026): "agente" y "siete" en VERDE
    // petróleo (accent), SOLO el "24" en ocre (primary). Minúsculas, mono.
    wordmark: { first: 'agente', second: '24', third: 'siete', tones: ['accent', 'primary', 'accent'], animated: ['none', 'spring-sweep', 'none'] },
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

  // Convertidor SORSABSA — servicio web de conversión documental PDF→MD/HTML/JSON.
  // Identidad provisional 21 jul 2026: azul técnico + amber para acciones.
  convertidor: {
    name: 'convertidor',
    displayName: 'Convertidor',
    wordmark: { first: 'Converti', second: 'dor' },
    colors: {
      primary: '#1e40af',            // azul técnico profesional
      accent: '#d97706',             // amber para CTAs y resaltados
      secondary: '#dbeafe',          // blue-100
      surface: '#FFFFFF',
      background: '#f8fafc',
      text: '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
    },
    radius: '0.5rem',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    headingFont: 'Inter',
    fontImport:
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
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
    wordmark: { first: 'ECO', second: 'INMOBILIARIA', tones: ['accent', 'primary'], animated: ['none', 'fade-slide'] },
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

  // Pagos SORSABSA — producto propio de pagos/transacciones.
  // Identidad provisional 17 jul 2026: verde éxito + dorado para acciones.
  pagos: {
    name: 'pagos',
    displayName: 'Pagos SORSABSA',
    wordmark: { first: 'Pagos', second: 'SORSABSA', tones: ['accent', 'primary'] },
    colors: {
      primary: '#16a34a',            // verde éxito transaccional
      accent: '#D1A153',             // dorado suave para CTAs y resaltados
      secondary: '#E3EAE6',          // sage claro
      surface: '#FFFFFF',
      background: '#F4F6F4',
      text: '#222925',
      muted: '#627269',
      border: '#D2DDD7',
    },
    radius: '0.75rem',
    fontFamily: "'Satoshi', system-ui, -apple-system, 'Segoe UI', sans-serif",
    headingFont: 'Fraunces',
    fontImport:
      'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Satoshi:wght@400;500;600;700&display=swap',
  },

  // Notificaciones SORSABSA — producto propio de alertas/notificaciones.
  // Identidad provisional 17 jul 2026: amber/ámbar para alertas + slate.
  notificaciones: {
    name: 'notificaciones',
    displayName: 'Notificaciones SORSABSA',
    wordmark: { first: 'Noti', second: 'SORSABSA', tones: ['accent', 'primary'] },
    colors: {
      primary: '#423F44',            // slate/antracita institucional
      accent: '#f59e0b',             // amber para alertas y CTAs
      secondary: '#D1D5DB',          // gris claro
      surface: '#FFFFFF',
      background: '#F9FAFB',
      text: '#212022',
      muted: '#67626A',
      border: '#DEDDDF',
    },
    radius: '0.5rem',
    fontFamily: "'Satoshi', system-ui, -apple-system, 'Segoe UI', sans-serif",
    headingFont: 'JetBrains Mono',
    fontImport:
      'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Satoshi:wght@400;500;600;700&display=swap',
  },

  // JustiRed — "Red de Justicia": plataforma que conecta ciudadanos con
  // abogados verificados en Ecuador (consume @sorsabsa/ui). Antes se llamaba
  // "LegalConnect"; renombrada a JustiRed el 18 jul 2026. Identidad extraída
  // de los tokens del proyecto (--legal-blue/--legal-gold) el 18 jul 2026:
  // azul corporativo (confianza/derecho) + oro (justicia), tipografía Inter,
  // escala neutra slate. En GitHub el repo aún se llama 'legaltech'.
  justired: {
    name: 'justired',
    displayName: 'JustiRed',
    wordmark: { first: 'Justi', second: 'Red' }, // Justi=accent(oro), Red=primary(azul)
    colors: {
      primary: '#0D47BA',            // azul corporativo (hsl 220 87% 39%)
      accent: '#E7B008',             // oro (hsl 45 93% 47%)
      secondary: '#F1F5F9',          // slate-100
      surface: '#FFFFFF',
      background: '#F8FAFC',         // slate-50
      text: '#020817',               // foreground (near-black navy)
      muted: '#64748B',              // slate-500
      border: '#E2E8F0',             // slate-200
    },
    radius: '0.5rem',
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    headingFont: 'Inter',
    fontImport:
      'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  },
};

/** Marca por parámetro (?app=…) con fallback institucional (nunca falla). */
export function getBrand(app: string | null | undefined): BrandConfig {
  return BRANDS[app ?? ''] ?? BRANDS.sorsabsa!;
}
