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
    // Isotipo real (casa en dos trazos, azul DomusCRM), 10-ago-2026 — el
    // primero del ecosistema con imagen además de wordmark de texto. Fondo
    // blanco removido (era una captura, no un export limpio) y recortado al
    // contenido real. Data URI embebida (no un archivo aparte en el repo ni
    // en R2): @sorsabsa/ui se consume como fuente vía `github:`, cada
    // producto la compila con SU propio bundler — un import de PNG normal
    // dependería de que cada consumidor sepa resolver un asset que vive
    // dentro de node_modules de un paquete de código fuente, no siempre
    // garantizado. Mismo principio que icon-paths.ts (datos embebidos, no
    // archivos sueltos) aplicado a un raster en vez de un path SVG. R2 es la
    // convención correcta para objetos DE PRODUCTO (fotos, documentos) —
    // esto es un asset DEL sistema de diseño, versionado junto al código.
    logoUrl:
      'data:image/png;base64,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',
    wordmark: { first: 'Domus', second: 'CRM', tones: ['primary', 'accent'] },
    colors: {
      primary: '#1746A2',            // azul DomusCRM — menú, botones, franjas, precios, "Domus"
      // Turquesa OFICIAL DomusCRM — íconos, "CRM", highlights. NO cambiarlo por
      // contraste: rinde 2.43:1 y reprueba AA como texto, pero eso lo resuelve
      // `--brand-accent-text`, que lo oscurece solo donde se pinta como texto.
      // (Se oscureció a #0d7d72 el 26 jul 2026 y se revirtió el mismo día: la
      // identidad manda, la accesibilidad se resuelve con el token.)
      accent: '#1db4a5',
      // (sin `sidebar`: el menú hereda `primary` → menú y franjas del MISMO color)
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
      // Ocre OFICIAL de la marca — CTAs y palabras resaltadas. NO cambiarlo por
      // contraste: rinde 3.46:1 sobre el fondo y reprueba AA como texto, pero
      // eso lo resuelve `--brand-primary-text`, que lo oscurece solo donde se
      // pinta como texto y deja la marca intacta en fondos y rellenos.
      // (Se oscureció a #a35a10 el 26 jul 2026 y se revirtió el mismo día: la
      // identidad manda, la accesibilidad se resuelve con el token.)
      primary: '#c1701b',
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

  // Convertidor: su identidad se retiró el 2026-07-30 al decidir que NO es
  // producto hoy (herramienta forense interna; su front quedó aparcado — ver
  // docs/ARQUITECTURA-ECOSISTEMA.md §1). Se saca de BRANDS para que no aparezca
  // en el showcase. getBrand('convertidor') cae al institucional. Restaurable
  // desde git si se revive el front.

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

  // iot (Inspección Ocular Técnica — nombre engañoso, no dispositivos IoT,
  // ver ARQUITECTURA-ECOSISTEMA.md §4-bis). Hasta 08-ago-2026 usaba la marca
  // institucional (arriba) en todo el login/correo — pero SÍ tenía identidad
  // propia, aislada en el CSS de sus informes PDF
  // (iot_system/app/services/report.css) y nunca extraída hasta ahora.
  // Extraído literal de ese archivo, no inventado: navy de portada/
  // encabezados + dorado de acentos/divisores + azul info de metadatos.
  iot: {
    name: 'iot',
    displayName: 'IOT',
    wordmark: { first: 'I', second: 'OT', tones: ['accent', 'primary'] },
    colors: {
      primary: '#1B2A40',      // navy de portada y encabezados de evidencia
      accent: '#D4AC0D',       // dorado de acentos, divisores, numeración
      secondary: '#2980B9',    // azul de etiquetas de sección/metadatos
      surface: '#FFFFFF',
      background: '#F4F6F8',
      text: '#1A1A2E',
      muted: '#7F8C8D',
      border: '#D5D8DC',
    },
    radius: '0.5rem',
    // report.css usa system sans ("Segoe UI", Helvetica, Arial) sin fuente
    // decorativa — no se agrega headingFont/fontImport, sería inventado.
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
