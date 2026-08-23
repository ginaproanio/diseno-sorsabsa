#!/usr/bin/env node
/**
 * La costura entre la interfaz y la API — para cualquier producto.
 *
 * **Por qué existe.** Gina, después de una noche encontrando a mano defectos
 * que llevaban meses: *"no sé cómo esto se te va de la auditoría, del grafo y
 * además del grep"*. La respuesta es concreta: **quien llama a un endpoint no
 * lo importa, escribe una cadena de texto.**
 *
 *     fetch("/api/admin/leads")   ← una string, no un import
 *
 * El grafo de conocimiento une código con código, así que en esa frontera no
 * tiene nada que unir. Medido sobre CondoManager el 23-ago-2026: **52 llamadas
 * `fetch("/api/…")` y CERO aristas** que las representen; los 41 archivos de
 * ruta sí son nodos, o sea que el grafo tiene los dos extremos de la costura y
 * ninguna cuerda. Consecuencia: **las 41 rutas parecen huérfanas, el 100 %**, y
 * las 41 están vivas. `tsc` tampoco cruza: una ruta que nadie llama compila
 * perfecto, y una llamada a una ruta borrada también.
 *
 * En agente24siete esta comprobación encontró, la primera vez que corrió,
 * **once rutas sin llamador**, ocho de ellas huecos reales: el formulario
 * "Solicitar acceso" guardaba solicitudes que nadie veía, no había forma de
 * habilitar a otra persona sin escribir SQL, el cliente no veía su consumo ni
 * sus pagos. Ese historial es la razón de generalizarla: **es lo único que ha
 * encontrado defectos reales por sí solo.**
 *
 * Las dos direcciones importan:
 *   - ruta sin llamador  → trabajo hecho que el usuario no puede usar
 *   - llamada sin ruta   → un 404 esperando a alguien
 *
 * **Formas de repo que entiende** (se detectan solas, no se configuran):
 *   - Pages Router:  `pages/api/x.ts`         → `/api/x`
 *   - App Router:    `app/api/x/route.ts`     → `/api/x`  (y `src/app/api`)
 *   - Funciones sueltas (Vercel): `api/x.js`  → `/api/x`
 *
 * **Rutas llamadas desde afuera** (webhooks, formularios públicos) se declaran
 * en `costura.config.json` en la raíz del producto:
 *
 *     { "externas": { "/api/webhook": "Meta / WhatsApp Cloud API" } }
 *
 * Es una lista declarada a propósito, no una regla adivinada del tipo "todo lo
 * que diga webhook": un nombre no es un permiso, y el día que alguien llame
 * `webhook-algo` a una pantalla, la adivinanza lo dejaría pasar en silencio.
 *
 * Salidas:  0 sin desconexiones · 1 con desconexiones · 2 no pudo mirar.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, sep, dirname, resolve } from "node:path";

const IGNORAR = new Set([
  "node_modules", ".next", "dist", "build", "graphify-out", ".git",
  "coverage", ".vercel", "out", "public",
]);
const EXT_CODIGO = /\.(tsx?|jsx?)$/;

function recorrer(dir, fn) {
  let entradas;
  try { entradas = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entradas) {
    if (IGNORAR.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) recorrer(p, fn);
    else fn(p, e.name);
  }
}

/** Un comentario que MENCIONA una ruta no la llama — y una ruta citada en un
 *  docblock parecía tener llamador. Pasó de verdad: `/api/admin/whoami`, ya
 *  borrado, figuraba como "llamada rota" porque su nombre estaba en el
 *  comentario que explicaba por qué se había borrado. */
const sinComentarios = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const aBarras = (p) => p.split(sep).join("/");
const esDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };

/** Descubre las rutas de API sin que nadie declare la forma del repo. */
function descubrirRutas(raiz) {
  const rutas = new Map(); // ruta -> archivo que la define
  const anotar = (ruta, archivo) => { if (!rutas.has(ruta)) rutas.set(ruta, archivo); };

  // 1. Pages Router
  const pagesApi = join(raiz, "pages", "api");
  if (esDir(pagesApi)) {
    recorrer(pagesApi, (p, name) => {
      if (!/\.(jsx?|tsx?)$/.test(name)) return;
      const rel = aBarras(relative(pagesApi, p)).replace(/\.(jsx?|tsx?)$/, "");
      anotar("/api/" + rel.replace(/\/index$/, ""), aBarras(relative(raiz, p)));
    });
  }

  // 2. App Router — `app/api/**/route.ts` y su variante bajo `src/`
  for (const base of [join(raiz, "app", "api"), join(raiz, "src", "app", "api")]) {
    if (!esDir(base)) continue;
    recorrer(base, (p, name) => {
      if (!/^route\.(jsx?|tsx?)$/.test(name)) return;
      const rel = aBarras(relative(base, p)).replace(/\/?route\.(jsx?|tsx?)$/, "");
      anotar("/api" + (rel ? "/" + rel : ""), aBarras(relative(raiz, p)));
    });
  }

  // 3. Funciones sueltas en `api/` (Vercel), solo si no hay router de Next.
  const apiSuelta = join(raiz, "api");
  if (!rutas.size && esDir(apiSuelta)) {
    recorrer(apiSuelta, (p, name) => {
      if (!/\.(jsx?|tsx?)$/.test(name)) return;
      const rel = aBarras(relative(apiSuelta, p)).replace(/\.(jsx?|tsx?)$/, "");
      anotar("/api/" + rel, aBarras(relative(raiz, p)));
    });
  }
  return rutas;
}

/**
 * ¿Este archivo le habla a OTRO servicio del ecosistema?
 *
 * Un cliente de servicio arma la URL con una base que viene del entorno:
 *
 *     fetch(`${process.env.NOTIFICACIONES_API_URL}${path}`)
 *
 * y entonces sus cadenas `/api/…` son rutas **del otro servicio**, no de este
 * producto. Sin esta distinción, `lib/notificacionesCliente.js` de agente24siete
 * hacía que `/api/crear` —que vive en notificaciones-sorsabsa— apareciera como
 * "un 404 esperando".
 *
 * **Se pregunta por el NOMBRE del servicio, no por la forma de la plantilla.**
 * La primera versión saltaba cualquier archivo con `fetch(\`${`, y eso barrió
 * de más: `app/api/registro-residente/route.ts` de CondoManager llama a su
 * PROPIA ruta con `fetch(\`${appUrl}/api/onboarding/residente-registrado\`)`,
 * o sea una URL absoluta hacia sí mismo. Al saltarlo entero, esa ruta aparecía
 * como "trabajo que el usuario no puede usar" teniendo llamador — un falso
 * positivo en la comprobación que existe para no darlos.
 */
const hablaConOtroServicio = (src, envServicios) =>
  envServicios.some((v) => src.includes(v));

/**
 * Igual que arriba, pero mirando también **un nivel de imports**.
 *
 * Un puente no nombra la variable: la nombra el cliente que importa.
 * `pages/api/notificaciones.js` de agente24siete recibe al navegador y
 * reenvía al servicio llamando a `llamarNotificaciones("/api/listar")`, y
 * `NOTIFICACIONES_API_URL` vive en `lib/notificacionesCliente.js`. Mirando
 * solo el archivo, sus rutas parecen locales y salen como "un 404 esperando".
 *
 * Un nivel alcanza para los puentes reales del ecosistema y no obliga a
 * resolver el árbol entero de imports, que sería otra cosa y más frágil.
 */
function hablaConServicioViaImport(raiz, archivo, src, envServicios) {
  if (hablaConOtroServicio(src, envServicios)) return true;
  const dir = dirname(join(raiz, archivo));
  // Relativos **y con alias `@/`**: el Convertidor importa su cliente como
  // `@/lib/notificaciones-servidor`, y mirando solo los relativos sus tres
  // puentes salían como "un 404 esperando".
  for (const m of src.matchAll(/from\s*["']([.@][^"']+)["']|require\(\s*["']([.@][^"']+)["']/g)) {
    const esp = m[1] || m[2];
    if (!esp) continue;
    const bases = esp.startsWith("@/")
      ? [join(raiz, "src", esp.slice(2)), join(raiz, esp.slice(2))]
      : [resolve(dir, esp)];
    const cands = bases.flatMap((base) => [
      base, base + ".ts", base + ".js", base + ".tsx", base + ".jsx",
      join(base, "index.ts"), join(base, "index.js"),
    ]);
    for (const cand of cands) {
      try {
        if (statSync(cand).isFile() && hablaConOtroServicio(readFileSync(cand, "utf8"), envServicios)) {
          return true;
        }
      } catch { /* no existe, se prueba el siguiente */ }
    }
  }
  return false;
}

/**
 * Toda cadena `"/api/…"` en código, descontando la que un archivo de ruta hace
 * sobre SÍ MISMO.
 *
 * **Una ruta sí puede llamar a otra ruta**, y saltarse los archivos de ruta
 * enteros —como hacía la primera versión— borra ese caso. Pasó en CondoManager:
 * `app/api/registro-residente/route.ts` llama a
 * `/api/onboarding/residente-registrado`, y esta última aparecía como
 * "trabajo que el usuario no puede usar" teniendo un llamador perfectamente
 * visible. Lo que hay que descontar es la AUTO-referencia, no el archivo.
 */
function descubrirLlamadas(raiz, rutaDeArchivo, envServicios = []) {
  const llamadas = new Map();
  recorrer(raiz, (p, name) => {
    if (!EXT_CODIGO.test(name)) return;
    const rel = aBarras(relative(raiz, p));
    if (/\.(test|spec)\./.test(name)) return; // una prueba no es la interfaz
    let src;
    try { src = sinComentarios(readFileSync(p, "utf8")); } catch { return; }
    if (hablaConServicioViaImport(raiz, rel, src, envServicios)) return;
    const propia = rutaDeArchivo.get(rel);    // si este archivo ES una ruta
    // Comilla **o `}`**: en `fetch(`${appUrl}/api/x`)` la ruta viene después de
    // cerrar la interpolación, no de una comilla. Exigir comilla dejaba fuera
    // toda URL absoluta armada con una base — el mismo descuido que ya había
    // costado un falso positivo en la comprobación entre repos.
    for (const m of src.matchAll(/(?:["'`]|\})(\/api\/[A-Za-z0-9_\-/]+)/g)) {
      if (propia && m[1] === propia) continue; // no se llama a sí misma
      // `${id}` y similares cortan la ruta: se guarda el prefijo, y más abajo
      // una llamada cuenta como satisfecha si alguna ruta empieza igual.
      if (!llamadas.has(m[1])) llamadas.set(m[1], new Set());
      llamadas.get(m[1]).add(rel);
    }
  });
  return llamadas;
}

/**
 * La costura ENTRE REPOS: ¿las rutas que un producto le pide a un servicio
 * existen de verdad en ese servicio?
 *
 * **Es la dirección que atrapa el bug real.** El 23-ago-2026 agente24siete
 * llamaba a `${NOTIFICACIONES_API_URL}/api/marcar-todas`, y la ruta del
 * servicio se llama `marcar-todas-leidas`. Devolvía 404, el puente se tragaba
 * el error para no tumbar la pantalla, y **"marcar todas como leídas" no hacía
 * nada, en silencio**. Nada podía verlo: no es un import (el grafo no lo ve),
 * compila perfecto (`tsc` no lo ve), y vive en dos repos distintos (ninguna
 * comprobación de un solo repo lo ve).
 *
 * Y la comprobación local tampoco: dentro de agente24siete esa llamada sale
 * hacia AFUERA, y dentro de notificaciones-sorsabsa la ruta no tiene llamador
 * local **como todas las suyas**, porque es un servicio.
 */
async function revisarEcosistema() {
  const { ECOSISTEMA, SERVICIOS } = await import("./ecosistema.mjs");
  // `SORSABSA_RAIZ` permite apuntar a un ecosistema de mentira para probar esta
  // comprobación sin tocar los repos de verdad. Se agregó porque la primera vez
  // que se verificó una guardia de este tipo se hizo commiteando en el repo real
  // de un producto y revirtiendo después: funcionó, pero probar una herramienta
  // no debería escribir en el trabajo de nadie.
  const RAIZ = process.env.SORSABSA_RAIZ ?? "C:";
  const raizDe = (e) => `${RAIZ}/${e.dirLocal}` + (e.sub ? `/${e.sub}` : "");

  const servicios = SERVICIOS().map((s) => ({ ...s, rutas: descubrirRutas(raizDe(s)) }));
  console.log("Servicios y sus rutas:");
  for (const s of servicios) console.log(`   ${s.nombre}: ${s.rutas.size} ruta(s)`);

  const sinRutas = servicios.filter((s) => !s.rutas.size);
  if (sinRutas.length) {
    console.error(`\nNo se pudieron leer las rutas de: ${sinRutas.map((s) => s.nombre).join(", ")}`);
    console.error("Sin eso no se puede afirmar nada sobre quien las llama.");
    process.exit(2);
  }

  // **La atribución es por ARCHIVO, no por línea, y eso es lo importante.**
  // El primer intento buscó `${NOTIF_URL}/api/x` en una sola expresión, y
  // resultó ciego justo donde estaba el bug: agente24siete no escribe la
  // variable en la plantilla, la guarda antes —
  //
  //     const url = process.env.NOTIFICACIONES_API_URL;
  //     fetch(`${url}${path}`)              ← la ruta llega como argumento
  //
  // Con la regex "de una línea" ese archivo daba CERO llamadas y el check salía
  // en verde sin haber mirado el caso que existe para mirar. Probado contra el
  // bug histórico de `/api/marcar-todas`: no lo veía.
  //
  // Así que: si un archivo nombra la variable de UN servicio, sus cadenas
  // `/api/…` son rutas de ese servicio. Se excluyen las que coincidan con una
  // ruta propia del repo, para no confundir una llamada local con una remota.
  const rotas = [];
  let revisadas = 0;
  for (const e of ECOSISTEMA) {
    const raizRepo = raizDe(e);
    if (!esDir(raizRepo)) continue;
    const propias = new Set(descubrirRutas(raizRepo).keys());
    recorrer(raizRepo, (p, name) => {
      if (!EXT_CODIGO.test(name) || /\.(test|spec)\./.test(name)) return;
      let src;
      try { src = sinComentarios(readFileSync(p, "utf8")); } catch { return; }

      const apuntados = servicios.filter((s) => (s.env ?? []).some((v) => src.includes(v)));
      if (apuntados.length !== 1) return;  // ninguno, o ambiguo: no se adivina
      const servicio = apuntados[0];

      // Sin exigir comilla delante: en `${url}/api/marcar-todas` la ruta viene
      // después de `}`, y exigirla dejaba pasar exactamente ese caso — que es
      // el del bug histórico. Acá se puede relajar porque ya se sabe que este
      // archivo le habla a un solo servicio.
      for (const m of src.matchAll(/(\/api\/[A-Za-z0-9_\-/]+)/g)) {
        const ruta = m[1].replace(/\/$/, "");
        if (propias.has(ruta)) continue;   // es una ruta de este mismo repo
        revisadas++;
        if (![...servicio.rutas.keys()].some((r) => r === ruta || ruta.startsWith(r + "/"))) {
          rotas.push({ desde: e.nombre, archivo: aBarras(relative(raizRepo, p)), servicio: servicio.nombre, ruta });
        }
      }
    });
  }

  console.log(`\nLlamadas entre servicios revisadas: ${revisadas}`);
  if (!rotas.length) {
    console.log("Sin contratos rotos: cada ruta que un producto pide existe en su servicio.");
    process.exit(0);
  }
  console.log(`\nCONTRATOS ROTOS — un 404 silencioso entre dos repos (${rotas.length}):`);
  for (const r of rotas) {
    console.log(`   ${r.desde} → ${r.servicio}${r.ruta}`);
    console.log(`      no existe en ${r.servicio}   (${r.archivo})`);
  }
  console.log("");
  process.exit(1);
}

if (process.argv[2] === "--ecosistema") {
  await revisarEcosistema();
}

const raiz = process.argv[2] ?? ".";
if (!esDir(raiz)) {
  console.error(`No se pudo leer ${raiz}: este check NO puede afirmar nada.`);
  process.exit(2);
}

let externas = {};
let placeholders = {};
const cfg = join(raiz, "costura.config.json");
if (existsSync(cfg)) {
  try {
    const j = JSON.parse(readFileSync(cfg, "utf8"));
    externas = j.externas ?? {};
    // `placeholders` es distinto de `externas` a propósito. Una ruta externa la
    // llama alguien de afuera; un placeholder no lo llama NADIE, y está bien
    // porque todavía no se construyó. Meterlo en `externas` sería declarar algo
    // falso para que el check se calle — que es la clase de arreglo que este
    // ecosistema ya pagó caro. Se lista aparte y el informe lo dice.
    placeholders = j.placeholders ?? {};
  } catch (e) {
    console.error(`costura.config.json ilegible: ${e.message}`);
    process.exit(2);
  }
}

const rutas = descubrirRutas(raiz);
// archivo -> la ruta que ese archivo DEFINE, para descontar auto-referencias.
const rutaDeArchivo = new Map([...rutas].map(([ruta, arch]) => [arch, ruta]));
// Los nombres de variable con que se llama a otro servicio salen de la tabla
// del ecosistema, no de adivinar por la forma de la plantilla.
const { ECOSISTEMA: TABLA } = await import("./ecosistema.mjs");
const ENV_SERVICIOS = TABLA.flatMap((e) => e.env ?? []);
const llamadas = descubrirLlamadas(raiz, rutaDeArchivo, ENV_SERVICIOS);

console.log(`Rutas de API: ${rutas.size} · llamadas desde el código: ${llamadas.size}`);
if (Object.keys(externas).length) {
  console.log(`Declaradas como externas: ${Object.keys(externas).length}`);
}
if (Object.keys(placeholders).length) {
  console.log(`Declaradas como placeholder (nadie las llama todavía, a propósito): ${Object.keys(placeholders).length}`);
}

// Cero y cero no es "todo en orden": es que no se miró nada.
if (rutas.size === 0 && llamadas.size === 0) {
  console.error(`\nNO SE MIRÓ NADA en ${raiz}: ni una ruta de API ni una llamada.`);
  process.exit(2);
}

// En un SERVICIO, buscarle llamador local a cada ruta da 100 % de falsos
// positivos —16 de 16 en pagos-sorsabsa, 5 de 5 en notificaciones—: sus
// llamadores viven en otros repos por definición. A un servicio se lo
// comprueba al revés, con `--ecosistema`.
const normal = (p) => aBarras(p).toLowerCase().replace(/\/+$/, "");
const entrada = TABLA.find((e) => normal(raiz).endsWith(normal(e.dirLocal + (e.sub ? "/" + e.sub : ""))));
if (entrada?.tipo === "servicio") {
  console.log(`\n${entrada.nombre} es un SERVICIO: sus rutas las llaman otros repos.`);
  console.log("Buscarles llamador acá adentro no dice nada — se comprueba con:");
  console.log("   node src/scripts/costura.mjs --ecosistema");
  process.exit(0);
}

const listaRutas = [...rutas.keys()];
// Una ruta está llamada si alguien nombra su prefijo: `/api/x/${id}` aparece
// en el código como `/api/x/`, y contarla como rota sería un falso positivo.
const llamada = (r) =>
  [...llamadas.keys()].some((l) => l === r || l.startsWith(r + "/") || r.startsWith(l));
const existe = (l) =>
  listaRutas.some((r) => r === l || l.startsWith(r + "/") || r.startsWith(l));

const huerfanas = listaRutas.filter((r) => !llamada(r) && !externas[r] && !placeholders[r]).sort();
const rotas = [...llamadas.keys()].filter((l) => !existe(l)).sort();
// La lista tambien envejece: si una declarada ya no existe, esta mintiendo.
const externasFaltantes = [...Object.keys(externas), ...Object.keys(placeholders)]
  .filter((r) => !rutas.has(r));

const bloque = (titulo, lista, detalle) => {
  if (!lista.length) return;
  console.log(`\n${titulo} (${lista.length}):`);
  for (const x of lista) console.log(`   ${x}${detalle ? detalle(x) : ""}`);
};
bloque("RUTAS QUE NADIE LLAMA — trabajo hecho que el usuario no puede usar", huerfanas,
  (r) => `   (${rutas.get(r)})`);
bloque("LLAMADAS A RUTAS QUE NO EXISTEN — un 404 esperando", rotas,
  (l) => `   <- ${[...llamadas.get(l)].slice(0, 3).join(", ")}`);
bloque("DECLARADAS COMO EXTERNAS PERO YA NO EXISTEN", externasFaltantes);

const problemas = huerfanas.length + rotas.length + externasFaltantes.length;
console.log("");
if (!problemas) {
  console.log("Sin desconexiones: cada ruta tiene quien la llame, y cada llamada una ruta.");
  process.exit(0);
}
console.log(`${problemas} desconexión(es).`);
process.exit(1);
