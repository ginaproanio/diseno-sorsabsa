#!/usr/bin/env node
/**
 * ¿Queda algún MODAL en el ecosistema?
 *
 * `docs/ESTANDAR-UI.md` §1 los prohíbe, y es la regla que Gina ha tenido que
 * repetir CUATRO veces —el Convertidor, agente24siete, y dos por JustiRed—.
 * Al medirlo por primera vez el 23-ago-2026 aparecieron 56 solo en
 * CondoManager. Nunca se habían contado: se corregían los que alguien veía en
 * pantalla.
 *
 * Es, además, **la única regla del estándar de UI que ninguna comprobación
 * vigilaba**: el check de conformidad mira duplicación de componentes, no uso
 * de modales.
 *
 * Busca dos familias:
 *   - Nativos del navegador: `alert()`, `confirm()`, `prompt()`. Bloquean la
 *     pestaña entera, no se pueden vestir con la marca y en móvil se ven como
 *     un aviso del sistema.
 *   - De componente: `<Dialog>`, `<AlertDialog>`, `<Modal>`, `<Sheet>`.
 *
 * NO son modales y no se marcan: los toasts (avisan sin bloquear ni tapar), y
 * los archivos de `components/ui/` que solo DEFINEN la primitiva — lo que
 * viola la regla es usarla, no que el archivo exista. Si nadie la usa, es
 * código muerto y eso lo dice otra comprobación.
 *
 * Uso:  node src/scripts/modales.mjs <dir> [<dir>...]
 * Sale con 1 si encuentra alguno. Comprobado en las dos direcciones antes de
 * conectarlo, que es lo que no se hizo con el check de conformidad y lo dejó
 * informando 13 desvíos en verde.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const IGNORAR = new Set(["node_modules", ".next", "dist", "build", "graphify-out", ".git", "coverage"]);
const EXT = /\.(tsx?|jsx?)$/;

/** Sin comentarios: un comentario que MENCIONA un modal no es un modal. Es el
 *  falso positivo que ya apareció en el check de la costura. */
const sinComentarios = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const PATRONES = [
  // `alert(` pero no `.alert(` ni `toast.alert(` — el punto delante indica que
  // es el método de otra cosa, no el diálogo del navegador.
  { re: /(^|[^.\w$])(alert|confirm|prompt)\s*\(/g, tipo: "nativo", nombre: (m) => `${m[2]}()` },
  // 23-ago-2026: acá también se marcaba `<Dialog>`, `<AlertDialog>`, `<Modal>`
  // y `<Sheet>`. Se quitó. La regla es sobre el diálogo del NAVEGADOR —el
  // cuadro gris con `sitio.com dice:` y tipografía del sistema—, no sobre una
  // capa con la marca. Precisión de Gina después de que este check hiciera
  // retirar de JustiRed una ventana de suscripción que estaba bien hecha:
  // marcarla fue aplicar de más una regla mal escrita.
];

function archivos(dir, acc = []) {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entradas) {
    if (IGNORAR.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) archivos(p, acc);
    else if (EXT.test(e.name)) acc.push(p);
  }
  return acc;
}

/** `components/ui/` solo DEFINE primitivas; usarlas es lo que viola la regla. */
const esDefinicionDePrimitiva = (rel) =>
  /(^|[\\/])components[\\/]ui[\\/]/.test(rel);

/**
 * Una prueba no le muestra un cuadro de diálogo a nadie.
 *
 * 23-ago-2026: este check informaba 2 modales en auth-sorsabsa. No existen.
 * Eran la carga `<script>alert(1)</script>` DENTRO de una cadena, en la prueba
 * que verifica que el subtítulo del login se sanea contra XSS. O sea que el
 * check estaba señalando justo a la prueba que hace lo correcto.
 *
 * Se excluyen las pruebas enteras en vez de intentar quitar las cadenas del
 * código: reconocer una cadena de JavaScript a fuerza de expresión regular
 * —comillas escapadas, plantillas, apóstrofes en texto en español— es
 * justamente la cirugía por regex que ya salió mal antes. Y el alcance de la
 * regla es la interfaz que ve un usuario, que es exactamente lo que un archivo
 * de prueba no es.
 *
 * Queda vivo un falso positivo conocido y sin resolver: un `alert(` dentro de
 * una cadena en código de producción. Anotado a propósito en vez de darlo por
 * cubierto.
 */
const esPrueba = (rel) =>
  /\.(test|spec)\.[tj]sx?$/.test(rel) || /(^|[\\/])__tests__[\\/]/.test(rel);

let total = 0;
let inalcanzables = 0;
const raices = process.argv.slice(2);
if (!raices.length) {
  console.error("Uso: node src/scripts/modales.mjs <dir> [<dir>...]");
  process.exit(2);
}

for (const raiz of raices) {
  let base;
  try {
    base = statSync(raiz).isDirectory() ? raiz : null;
  } catch {
    base = null;
  }
  if (!base) {
    // NO se omite en silencio. Un check que no pudo mirar tiene que ser
    // indistinguible de uno que encontró algo: si en CI se equivoca un nombre
    // de repo, "no miré nada" no puede salir en verde. Regla 4 de la parte II
    // de ESTANDAR-DESARROLLO — una alerta que no puede sonar tampoco es una
    // alerta.
    console.log(`\n### ${raiz}: NO SE PUDO LEER — la ruta no existe`);
    inalcanzables++;
    continue;
  }

  const hallazgos = [];
  for (const f of archivos(base)) {
    const rel = relative(base, f);
    if (esDefinicionDePrimitiva(rel) || esPrueba(rel)) continue;
    const src = sinComentarios(readFileSync(f, "utf8"));
    for (const { re, tipo, nombre } of PATRONES) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        const linea = src.slice(0, m.index).split("\n").length;
        hallazgos.push({ rel, linea, tipo, que: nombre(m) });
      }
    }
  }

  // El nombre del producto, no el de su subcarpeta. Con `domuscrm/webs` y
  // `convertidor/frontend` el informe decía "### webs" y "### frontend", que no
  // le dicen a nadie de qué producto se habla.
  const GENERICOS = new Set(["webs", "frontend", "backend", "app", "src", "apps", "packages"]);
  const partes = base.split(/[\\/]/).filter(Boolean);
  const ultimo = partes[partes.length - 1];
  const nombreRepo =
    GENERICOS.has(ultimo) && partes.length > 1
      ? `${partes[partes.length - 2]}/${ultimo}`
      : ultimo;
  console.log(`\n### ${nombreRepo}`);
  if (!hallazgos.length) {
    console.log("   sin modales");
    continue;
  }
  total += hallazgos.length;
  const porArchivo = new Map();
  for (const h of hallazgos) {
    if (!porArchivo.has(h.rel)) porArchivo.set(h.rel, []);
    porArchivo.get(h.rel).push(h);
  }
  console.log(`   ${hallazgos.length} modal(es) en ${porArchivo.size} archivo(s):`);
  for (const [rel, lista] of [...porArchivo].sort((a, b) => b[1].length - a[1].length)) {
    const detalle = lista.map((h) => `${h.que}:${h.linea}`).join(" ");
    console.log(`   ${String(lista.length).padStart(3)}  ${rel.split(sep).join("/")}  —  ${detalle}`);
  }
}

console.log("");
if (inalcanzables > 0) {
  console.log(`${inalcanzables} ruta(s) no se pudieron leer: este resultado NO vale.`);
  process.exit(2);
}
if (total === 0) {
  console.log("Sin modales en todo el ecosistema. ESTANDAR-UI.md §1 se cumple.");
  process.exit(0);
}
console.log(`${total} modal(es) en total. ESTANDAR-UI.md §1 los prohíbe.`);
process.exit(1);
