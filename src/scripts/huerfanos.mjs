#!/usr/bin/env node
/**
 * Archivos que NADIE importa — código muerto, o trabajo que quedó desconectado.
 *
 * **Por qué existe (23-ago-2026).** Gina preguntó si auditar los imports no
 * sería más eficiente que mantener el grafo de conocimiento. Lo es, y por
 * bastante: esto tarda **0,26 s por repo**, sin instalar nada, sin CI propio y
 * sin commitear un archivo de vuelta. El grafo, para el mismo repo, instala
 * Python, parsea el AST, commitea y pushea, en cada push, en diez repos.
 *
 * Lo que encontró la primera vez que corrió, y que el grafo tenía como nodos
 * desde hacía meses sin decir nada:
 *
 *   - CondoManager: `lib/pagos/factory.ts` y `lib/pagos/service.ts` con **cero
 *     bytes**, mientras `docs/PAGOS.md` los daba por *"✅ IMPLEMENTADO"*. Más
 *     otros dos vacíos al lado.
 *   - agente24siete: `lib/vozTwilio.js`, un cliente de SMS de Twilio de 31
 *     líneas, funcional y documentado, que **ningún código importa**.
 *   - JustiRed: una copia duplicada de `use-toast` de 85 bytes que nadie usa.
 *
 * Es la regla 1 de la parte II de ESTANDAR-DESARROLLO —*código que no se puede
 * ejecutar no existe*— hecha comprobación, en vez de esperar a que alguien lo
 * note leyendo.
 *
 * **La trampa, y por qué las convenciones son el 90 % del valor.** Un archivo
 * sin importador NO es código muerto si el framework lo carga por convención:
 * `page.tsx`, `route.ts`, `middleware.ts`, todo `pages/`, `next-env.d.ts`, los
 * `*.config.*`. Sin descontarlos, **todo parece muerto** y el informe se vuelve
 * ruido — exactamente la enfermedad del grafo, donde las 41 rutas de API de
 * CondoManager aparecen huérfanas y las 41 están vivas.
 *
 * La primera versión de esto daba 11 candidatos en CondoManager y 26 en
 * agente24siete; casi todos falsos. Descontando convenciones y arreglando el
 * reconocimiento de imports de varias líneas, quedaron **10 en siete repos, y
 * 6 reales**.
 *
 * Uso:
 *   node src/scripts/huerfanos.mjs --local        # los repos del ecosistema
 *   node src/scripts/huerfanos.mjs --ci           # dentro del runner
 *   node src/scripts/huerfanos.mjs <dir>          # uno suelto
 *
 * Salidas: 0 sin huérfanos · 1 con huérfanos · 2 no pudo mirar.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep, dirname, resolve } from "node:path";
import { rutasLocales, rutasCI } from "./ecosistema.mjs";

const IGNORAR = new Set([
  "node_modules", ".next", "dist", "build", "graphify-out", ".git",
  "coverage", "public", ".vercel", "out",
]);
const EXT = /\.(tsx?|jsx?)$/;

/**
 * Lo que el framework carga sin que nadie lo importe. **No es código muerto.**
 * Esta lista es lo que separa una comprobación útil de un generador de ruido.
 */
const POR_CONVENCION = [
  /(^|\/)(page|layout|route|loading|error|not-found|template|default|middleware|instrumentation)\.(tsx?|jsx?)$/,
  /(^|\/)pages\//,                    // Pages Router: cada archivo es una URL
  /(^|\/)api\//,                      // funciones serverless sueltas
  /(^|\/)(index|main|server)\.(tsx?|jsx?)$/,
  /\.d\.ts$/,                         // declaraciones (next-env.d.ts)
  /\.(config|setup)\.(ts|js|mjs|cjs)$/,
  /(^|\/)(next|tailwind|postcss|jest|eslint|vite)\.config\./,
  /(^|\/)app\/(icon|apple-icon|opengraph-image|robots|sitemap|manifest)\./,
  /(^|\/)(scripts|migrations|supabase|scratch)\//,
  /(^|\/)\.browser-tools\//,          // utilidades sueltas, no son producto
  /\.(test|spec)\./,
];

const aBarras = (p) => p.split(sep).join("/");
const esDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const sinComentarios = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function archivos(dir, acc = []) {
  let e;
  try { e = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const x of e) {
    if (IGNORAR.has(x.name)) continue;
    const p = join(dir, x.name);
    if (x.isDirectory()) archivos(p, acc);
    else if (EXT.test(x.name)) acc.push(p);
  }
  return acc;
}

/**
 * `[^;]` SIN excluir el salto de línea, a propósito. Un import de varias líneas
 *
 *     import {
 *       ToastProps,
 *     } from "@/components/ui/toast"
 *
 * es de lo más común, y exigir que `import` y `from` estén en la misma línea lo
 * deja fuera. Con la versión que lo exigía, `components/ui/toast.tsx` aparecía
 * como huérfano teniendo dos importadores — un falso positivo en la
 * herramienta que existe para no darlos.
 */
const IMPORT = /(?:^|\n)\s*(?:import|export)[^;]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']|require\(\s*["']([^"']+)["']/g;

function revisar(raiz) {
  const todos = archivos(raiz);
  if (!todos.length) return null;                 // no se pudo mirar
  const rel = (p) => aBarras(relative(raiz, p));

  // Índice de destinos, para resolver un import a un archivo real.
  const porClave = new Map();
  for (const f of todos) {
    const r = rel(f);
    const sinExt = r.replace(EXT, "");
    porClave.set(sinExt, r);
    if (sinExt.endsWith("/index")) porClave.set(sinExt.replace(/\/index$/, ""), r);
  }

  const importado = new Set();
  for (const f of todos) {
    let src;
    try { src = sinComentarios(readFileSync(f, "utf8")); } catch { continue; }
    for (const m of src.matchAll(IMPORT)) {
      const esp = m[1] || m[2] || m[3];
      if (!esp) continue;
      let clave = null;
      if (esp.startsWith(".")) {
        clave = aBarras(relative(raiz, resolve(dirname(f), esp))).replace(EXT, "");
      } else if (esp.startsWith("@/")) {
        clave = esp.slice(2).replace(EXT, "");
        if (!porClave.has(clave) && porClave.has("src/" + clave)) clave = "src/" + clave;
      }
      if (!clave) continue;
      for (const cand of [clave, clave + "/index"]) {
        if (porClave.has(cand)) { importado.add(porClave.get(cand)); break; }
      }
    }
  }

  const convencion = (r) => POR_CONVENCION.some((re) => re.test(r));
  const sinImportador = todos.map(rel).filter((r) => !importado.has(r));
  return {
    total: todos.length,
    porConvencion: sinImportador.filter(convencion).length,
    huerfanos: sinImportador.filter((r) => !convencion(r)).sort(),
  };
}

const args = process.argv.slice(2);
const raices =
  args[0] === "--local" ? rutasLocales(args[1] ?? "C:") :
  args[0] === "--ci" ? rutasCI() :
  args;

if (!raices.length) {
  console.error("Uso: node src/scripts/huerfanos.mjs --local [raiz] | --ci | <dir> [<dir>...]");
  process.exit(2);
}

let total = 0;
let inalcanzables = 0;
for (const raiz of raices) {
  const nombre = aBarras(raiz);
  if (!esDir(raiz)) {
    // Igual que el check de modales: no poder mirar tiene que ser
    // distinguible de haber mirado y no encontrar nada.
    console.log(`\n### ${nombre}: NO SE PUDO LEER`);
    inalcanzables++;
    continue;
  }
  const r = revisar(raiz);
  if (!r) {
    console.log(`\n### ${nombre}: NO SE PUDO LEER — sin archivos de código`);
    inalcanzables++;
    continue;
  }
  console.log(`\n### ${nombre}`);
  console.log(`   ${r.total} archivo(s) · ${r.porConvencion} sin importador que carga el framework (no cuentan)`);
  if (!r.huerfanos.length) {
    console.log("   sin huérfanos");
    continue;
  }
  total += r.huerfanos.length;
  console.log(`   ${r.huerfanos.length} sin importador y sin convención que lo explique:`);
  for (const h of r.huerfanos) console.log(`      ${h}`);
}

console.log("");
if (inalcanzables > 0) {
  console.log(`${inalcanzables} ruta(s) no se pudieron leer: este resultado NO vale.`);
  process.exit(2);
}
if (total === 0) {
  console.log("Sin huérfanos: todo archivo tiene quien lo importe, o una convención que lo carga.");
  process.exit(0);
}
console.log(`${total} archivo(s) que nadie importa. Revisar uno por uno: no todos son código muerto.`);
process.exit(1);
