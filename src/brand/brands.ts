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

  // SorsabsaForensic — materialización de evidencia digital para pericias
  // (materializacion.sorsabsa.com). Extraído de su interfaz real,
  // SorsabsaForensic/web/index.html, 15-ago-2026.
  //
  // NO estrena paleta: viste la institucional de arriba (antracita + verde),
  // porque el informe pericial lo firma la perito bajo la marca SORSABSA y
  // darle colores propios habría sido inventar una identidad que el producto
  // no tiene. Lo suyo es el wordmark —"SORSABSA" + "Forensic"— y una paleta
  // semántica que la institucional no declaraba y este producto sí necesita:
  // un procesador puede estar listo, faltarle una dependencia, o correr
  // dando menos de lo debido, y esos tres estados tienen que distinguirse a
  // simple vista. Los tres valores salen del CSS que ya está en producción.
  // Convertidor. Decisión de Gina, 16-ago-2026: *"convertidor sube al showcase
  // y debe usar los mismos colores de sorsabsa forensic porque es parte del
  // ecosistema de sorsabsa"*.
  //
  // La paleta es LA MISMA que `sorsabsaforensic` (abajo), a propósito y no por
  // copiar-pegar sin pensar: los dos son herramientas del trabajo pericial, y
  // el Convertidor nació justamente como el OCR de la evidencia escaneada de
  // SorsabsaForensic (ARQUITECTURA-ECOSISTEMA.md §2). Lo que NO comparte es la
  // identidad: wordmark propio, porque son dos productos y una persona que
  // convierte un PDF no está usando el sistema forense.
  //
  // El día que esta paleta cambie hay que cambiarla en los dos — no se
  // referencia a la otra marca a propósito: `BRANDS` es un objeto de datos
  // planos que se lee de un vistazo, y una marca que herede de otra obliga a
  // saltar para saber de qué color es. Queda anotado acá, que es donde va a
  // mirar quien la toque.
  //
  // TRAMPA DE ESTA PALETA, aprendida el mismo día: declararla bien no alcanza.
  // Gina volvió con *"sigue en escala de grises"* con estos valores YA
  // aplicados y verificados en el HTML servido. El motivo es que `primary`
  // (#423F44) ES un gris: si un producto lo usa para todo —titulares, íconos,
  // botones, pastillas— y deja el verde en fondos al 10%, la pantalla se ve
  // gris aunque los tokens estén perfectos. Quien adopte esta paleta tiene que
  // repartir: `variant="accent"` en la acción principal y
  // `text-brand-accent-text` para el verde como texto (el crudo no pasa AA).
  // Ver la cabecera de `convertidor/frontend/src/app/page.tsx`.
  convertidor: {
    name: 'convertidor',
    displayName: 'SORSABSA Convertidor',
    wordmark: { first: 'SORSABSA', second: 'Convertidor', tones: ['primary', 'accent'] },
    colors: {
      primary: '#423F44',            // antracita institucional
      accent: '#70C051',             // verde institucional
      surface: '#FFFFFF',
      background: '#F6F5F7',
      text: '#212022',
      muted: '#6B676E',
      border: '#E3E1E4',
      destructive: '#B3261E',
    },
    radius: '0.375rem',
  },

  sorsabsaforensic: {
    name: 'sorsabsaforensic',
    displayName: 'SORSABSA Forensic',
    wordmark: { first: 'SORSABSA', second: 'Forensic', tones: ['primary', 'accent'] },
    colors: {
      primary: '#423F44',            // antracita institucional
      accent: '#70C051',             // verde institucional
      surface: '#FFFFFF',
      background: '#F6F5F7',         // --fondo
      text: '#212022',
      muted: '#6B676E',              // --tenue
      border: '#E3E1E4',             // --borde
      destructive: '#B3261E',        // --alerta: el procesador no corre
    },
    radius: '0.375rem',              // 6px, el de sus botones
    // Sin fuente decorativa: la interfaz usa la del sistema y el informe PDF
    // compone en Arial/Helvetica por requisito de la pericia. Declarar una
    // fuente de marca sería inventarla.
    //
    // TINTA SOBRE EL ACENTO: este producto ya resolvió en su CSS lo que la
    // auditoría del showcase lleva marcando `--brand-accent-ink: PENDIENTE`
    // para todo el ecosistema. El verde #70C051 es claro: texto blanco encima
    // da 2,25:1 y NO pasa AA. La interfaz usa #10240a (verde casi negro) y da
    // 7,31:1 — AAA. Medido, no estimado.
    //
    // No se declara como campo porque `BrandColors` no tiene todavía dónde
    // ponerlo, y añadírselo toca a las diez marcas: es una decisión del
    // sistema de diseño, no de este producto. Queda escrito acá para que el
    // día que se agregue el token exista un valor probado en producción del
    // que partir, en vez de volver a elegirlo a ojo.
  },
};

/**
 * Colores de ESTADO de SorsabsaForensic, fuera de `BrandColors` porque no
 * son identidad: son semántica de producto. Se declaran para que el showcase
 * los enseñe y para que nadie los vuelva a elegir a ojo en otra pantalla.
 *
 * El matiz que importa: "corre" y "no corre" no bastan. Un procesador puede
 * correr y entregar MENOS de lo debido —imagen forense sin `exiftool` deja
 * el examen de etiquetas sin practicar— y eso no es verde ni rojo. Sin el
 * tercer estado, la pantalla miente en una de las dos direcciones.
 */
export const ESTADOS_FORENSIC = {
  ok: { color: '#2F6B17', fondo: '#EAF7E4', significa: 'corre y entrega completo' },
  parcial: { color: '#8A6100', fondo: '#FFF8E1', significa: 'corre, pero le falta algo opcional y el resultado sale con menos' },
  alerta: { color: '#B3261E', fondo: '#FDECEB', significa: 'no corre: le falta una dependencia' },
} as const;

/** Marca por parámetro (?app=…) con fallback institucional (nunca falla). */
export function getBrand(app: string | null | undefined): BrandConfig {
  return BRANDS[app ?? ''] ?? BRANDS.sorsabsa!;
}
