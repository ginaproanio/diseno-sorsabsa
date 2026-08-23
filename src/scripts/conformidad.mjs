#!/usr/bin/env node
/**
 * Check de conformidad del ecosistema SORSABSA.
 *
 * **Por qué existe.** Los sistemas compartidos existen —portero, pagos,
 * notificaciones, design system— y aun así cada producto vuelve a resolver el
 * último tramo por su cuenta, y nadie se entera. Casos reales del 22-ago-2026:
 * la campana estaba en `@sorsabsa/ui` y tres productos la reimplementaron;
 * `/auth/register` existía y ninguna pantalla enlazaba a él; `pagos-sorsabsa`
 * llevaba dentro una lista de productos escrita a mano.
 *
 * Todos se encontraron **a mano, leyendo**. Y arreglarlos a mano no impide el
 * siguiente. Lo que faltaba no era otro sistema: era algo que NOTE cuando un
 * producto se desvía. ESTANDAR-DESARROLLO.md, parte II, regla 2: *"una
 * comprobación desconectada es una comprobación que no existe"* — y hasta hoy
 * no existía ninguna que preguntara "¿este producto usa lo compartido?".
 *
 * **Se apoya en el grafo de conocimiento, no en grep.** Cada repo publica su
 * `graphify-out/graph.json` con los símbolos que define y dónde. Esta es la
 * pregunta que ese grafo sí puede responder hoy, y responderla no requiere
 * leer una línea de código.
 *
 * Uso:
 *   node conformidad.mjs --local C:/condomanager C:/legaltech ...
 *   node conformidad.mjs                # en CI: descarga los grafos por API
 *
 * Sale con código 1 si encuentra desvíos, para que CI se ponga en rojo.
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));

/**
 * Repos del ecosistema. `repo` es el nombre en GitHub y `dirLocal` el de la
 * carpeta en disco: no siempre coinciden (DomusCRM vive en `crm_inmobiliario`,
 * JustiRed en `legaltech`), y darlo por supuesto hace que el check informe
 * "sin grafo" sobre un repo que sí lo tiene — o sea, una falsa alarma en la
 * herramienta que existe para no dar falsas alarmas.
 */
const ECOSISTEMA = [
  { nombre: "condomanager", repo: "condomanager", dirLocal: "condomanager", sub: "" },
  { nombre: "domuscrm", repo: "domuscrm", dirLocal: "crm_inmobiliario", sub: "webs" },
  { nombre: "justired", repo: "legaltech", dirLocal: "legaltech", sub: "" },
  { nombre: "agente24siete", repo: "agente24siete", dirLocal: "agente24siete", sub: "" },
  { nombre: "auth-sorsabsa", repo: "auth-sorsabsa", dirLocal: "auth-sorsabsa", sub: "" },
  { nombre: "convertidor", repo: "convertidor", dirLocal: "convertidor", sub: "" },
  { nombre: "pagos-sorsabsa", repo: "pagos-sorsabsa", dirLocal: "pagos-sorsabsa", sub: "" },
];

/** Lo que exporta el design system, leído de su propio índice. */
function exportadosDelDesignSystem() {
  // En CI corre desde el repo; instalado, desde node_modules/@sorsabsa/ui/src.
  const candidatos = [
    join(AQUI, "..", "index.ts"),
    join(process.cwd(), "src", "index.ts"),
    join(process.cwd(), "node_modules", "@sorsabsa", "ui", "src", "index.ts"),
  ];
  const ruta = candidatos.find((c) => existsSync(c));
  if (!ruta) throw new Error("No se encontró el index.ts de @sorsabsa/ui");

  const texto = readFileSync(ruta, "utf8");
  const nombres = new Set();
  for (const m of texto.matchAll(/export\s*(?:\{([^}]*)\}|(?:function|const)\s+(\w+))/g)) {
    if (m[2]) nombres.add(m[2]);
    if (m[1]) {
      for (const parte of m[1].split(",")) {
        const nombre = parte.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
        if (nombre && /^[A-Za-z]/.test(nombre)) nombres.add(nombre);
      }
    }
  }
  return nombres;
}

async function grafoDe(entrada, basesLocales) {
  const rel = entrada.sub
    ? `${entrada.sub}/graphify-out/graph.json`
    : "graphify-out/graph.json";

  if (basesLocales) {
    const base = basesLocales.find((b) =>
      b.toLowerCase().replace(/[\\/]+$/, "").endsWith(entrada.dirLocal.toLowerCase())
    );
    if (!base) return null;
    const ruta = join(base, ...rel.split("/"));
    return existsSync(ruta) ? JSON.parse(readFileSync(ruta, "utf8")) : null;
  }

  const token = process.env.GH_ECOSISTEMA_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("Falta GH_ECOSISTEMA_TOKEN para leer los repos del ecosistema");
  const url = `https://api.github.com/repos/ginaproanio/${entrada.repo}/contents/${rel}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.raw+json",
      "User-Agent": "conformidad-sorsabsa",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub respondió ${res.status} para ${entrada.repo}`);
  return JSON.parse(await res.text());
}

/**
 * ¿El grafo describe el código de HOY?
 *
 * **El agujero que tapa (23-ago-2026).** Este check corrió a las 10:09 y
 * denunció que JustiRed redefinía `Card`, `CardContent`, `CardDescription`,
 * `CardHeader` y `CardTitle`. Ese archivo se había borrado la noche anterior.
 * graphify —que reconstruye el grafo— terminó a las 10:10, 69 segundos DESPUÉS.
 * El check leyó un grafo del código viejo y afirmó cinco duplicaciones que ya
 * no existían.
 *
 * Cinco falsas alarmas en la herramienta cuyo único trabajo es no dar falsas
 * alarmas. Y del lado contrario es peor: entre que alguien introduce una
 * duplicación y graphify la publica, este check dice "sin desvíos" mirando un
 * grafo que todavía no la contiene. **Sale verde sin haber mirado el código
 * actual.**
 *
 * **Cómo se pregunta, y el intento que NO sirvió.** La primera versión comparó
 * `built_at_commit` del grafo contra la cabeza del repo: si en el medio cambió
 * un archivo de código, grafo atrasado. Está mal, y se vio al conectarlo.
 * graphify **no commitea nada cuando el grafo le sale igual**, así que
 * `built_at_commit` se queda atrás en todo arreglo que no mueva símbolos —una
 * cadena, un comentario, el cuerpo de una función— que son la mayoría. Marcó
 * agente24siete y pagos-sorsabsa como atrasados teniendo los dos el grafo al
 * día. Un guardia que grita en cada arreglo de bug se termina ignorando, que
 * es la misma muerte que la de no existir.
 *
 * La pregunta correcta no es *"¿cambió el código desde que se construyó el
 * grafo?"* sino **"¿graphify ya corrió sobre este código?"**. Si corrió y no
 * cambió nada, el grafo ES el de hoy. Se responde con el estado del workflow
 * en la cabeza del repo, que es el hecho, no una inferencia sobre él.
 *
 * Devuelve null si el grafo sirve, o el motivo si no se puede afirmar nada.
 */
/** El token: de CI por variable, o del `gh` ya autenticado al correr a mano.
 *  Sin esto, `conformidad:local` no podría preguntarle nada a GitHub y la
 *  guardia de frescura quedaría apagada justo en el modo que más se usa. */
let tokenCache;
function tokenGitHub() {
  if (tokenCache !== undefined) return tokenCache;
  tokenCache = process.env.GH_ECOSISTEMA_TOKEN || process.env.GITHUB_TOKEN || null;
  if (!tokenCache) {
    try {
      tokenCache = execFileSync("gh", ["auth", "token"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || null;
    } catch {
      tokenCache = null;
    }
  }
  return tokenCache;
}

async function pedirGitHub(ruta) {
  const token = tokenGitHub();
  if (!token) return null;
  const res = await fetch(`https://api.github.com/${ruta}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "conformidad-sorsabsa",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * El commit de CÓDIGO más reciente: el último que no sea de graphify.
 *
 * graphify publica el grafo en un commit propio (`chore(graphify): ...`) con
 * `[skip ci]`, así que **no vuelve a correr sobre su propio commit**. Preguntar
 * "¿graphify corrió en la cabeza?" da que no en todos los repos cuya cabeza es
 * justamente ese commit — que son casi todos. El ancla correcta es el último
 * commit que trajo código.
 */
async function ultimoCommitDeCodigo(entrada, basesLocales) {
  const esDeGraphify = (msg) => /^chore\(graphify\)/.test((msg ?? "").trim());

  if (basesLocales) {
    const dir = basesLocales.find((b) =>
      b.toLowerCase().replace(/[\\/]+$/, "").endsWith(entrada.dirLocal.toLowerCase())
    );
    if (!dir) return null;
    try {
      const salida = execFileSync("git", ["-C", dir, "log", "-30", "--format=%H%x1f%s"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      for (const linea of salida.split("\n")) {
        const [sha, msg] = linea.split("\u001f");
        if (sha && !esDeGraphify(msg)) return sha.trim();
      }
    } catch {
      return null;
    }
    return null;
  }

  const commits = await pedirGitHub(`repos/ginaproanio/${entrada.repo}/commits?per_page=30`);
  if (!commits) return null;
  for (const c of commits) {
    if (!esDeGraphify(c?.commit?.message)) return c.sha;
  }
  return null;
}

/**
 * ¿Ya corrió graphify sobre ese código? Es el hecho, no una inferencia sobre él.
 *
 * No sirve mirar `built_at_commit` contra la cabeza: graphify **no commitea
 * nada cuando el grafo le sale igual**, así que ese campo se queda atrás en
 * todo arreglo que no mueva símbolos —una cadena, un comentario, el cuerpo de
 * una función— que son la mayoría. La primera versión de esta guardia hacía
 * eso y marcó como atrasados dos repos que tenían el grafo perfectamente al
 * día. Un guardia que grita en cada arreglo de bug se termina ignorando, que
 * es la misma muerte que la de no existir.
 */
async function grafoAtrasado(entrada, grafo, basesLocales) {
  const construido = grafo?.built_at_commit;
  if (!construido) return "el grafo no dice en qué commit se construyó";

  const ancla = await ultimoCommitDeCodigo(entrada, basesLocales);
  if (!ancla) return null; // sin forma de saberlo: no se inventa un veredicto

  if (ancla.startsWith(construido) || construido.startsWith(ancla)) return null;

  const runs = await pedirGitHub(
    `repos/ginaproanio/${entrada.repo}/actions/runs?head_sha=${ancla}&status=success&per_page=20`
  );
  if (runs === null) return null; // sin token o API caída: no se afirma nada
  const corrio = (runs.workflow_runs ?? []).some(
    (r) => /graphify/i.test(r.name ?? "") || /graphify/i.test(r.path ?? "")
  );
  if (corrio) return null;

  return `graphify todavía no corrió sobre ${ancla.slice(0, 7)} (el grafo es de ${construido.slice(0, 7)})`;
}

(async () => {
  const args = process.argv.slice(2);
  const iLocal = args.indexOf("--local");
  const basesLocales = iLocal >= 0 ? args.slice(iLocal + 1) : null;

  const exportados = exportadosDelDesignSystem();
  const hallazgos = [];
  const lineas = [];

  lineas.push(`Conformidad del ecosistema · ${new Date().toISOString()}`);
  lineas.push(`@sorsabsa/ui exporta ${exportados.size} símbolos\n`);

  for (const entrada of ECOSISTEMA) {
    let grafo;
    try {
      grafo = await grafoDe(entrada, basesLocales);
    } catch (err) {
      lineas.push(`  ⚠️  ${entrada.nombre}: no se pudo leer su grafo — ${err.message}`);
      continue;
    }

    // Un producto sin grafo está fuera del sistema que debería vigilarlo: no se
    // le puede comprobar nada, y eso ya es el hallazgo.
    if (!grafo) {
      hallazgos.push({
        producto: entrada.nombre,
        tipo: "sin_grafo",
        detalle: "No publica graphify-out/graph.json: queda fuera de esta comprobación",
      });
      lineas.push(`  🔴 ${entrada.nombre}: SIN GRAFO — fuera del grafo de conocimiento`);
      continue;
    }

    // Antes de afirmar NADA sobre este producto: ¿el grafo es del código de hoy?
    // Un grafo atrasado miente en las dos direcciones — inventa duplicaciones
    // ya borradas y no ve las recién introducidas.
    const atraso = await grafoAtrasado(entrada, grafo, basesLocales);
    if (atraso) {
      hallazgos.push({
        producto: entrada.nombre,
        tipo: "grafo_atrasado",
        detalle: atraso,
      });
      lineas.push(`  ⚠️  ${entrada.nombre}: GRAFO ATRASADO — ${atraso}`);
      lineas.push(`       No se comprueba: cualquier resultado sobre este producto sería inventado.`);
      continue;
    }

    const choques = (grafo.nodes ?? []).filter(
      (n) => exportados.has(n.label) && !/node_modules/.test(n.source_file ?? "")
    );

    // Se agrupa por archivo: veinte símbolos de un mismo `components/ui` son UN
    // desvío (un design system paralelo), no veinte problemas distintos.
    const porArchivo = new Map();
    for (const c of choques) {
      const f = c.source_file ?? "(desconocido)";
      if (!porArchivo.has(f)) porArchivo.set(f, []);
      porArchivo.get(f).push(c.label);
    }

    if (porArchivo.size === 0) {
      lineas.push(`  ✅ ${entrada.nombre}: sin redefiniciones`);
      continue;
    }

    lineas.push(`  🔴 ${entrada.nombre}: redefine ${choques.length} símbolo(s) que @sorsabsa/ui ya da`);
    for (const [archivo, símbolos] of porArchivo) {
      lineas.push(`       ${archivo} → ${símbolos.join(", ")}`);
      hallazgos.push({
        producto: entrada.nombre,
        tipo: "redefine_compartido",
        archivo,
        simbolos: símbolos,
      });
    }
  }

  lineas.push("");
  lineas.push(
    hallazgos.length
      ? `RESULTADO: ${hallazgos.length} desvío(s). Cada uno es código que se mantiene dos veces y se arregla una.`
      : "RESULTADO: sin desvíos."
  );

  const informe = lineas.join("\n");
  console.log(informe);

  // Para que el workflow pueda armar el correo y el issue sin re-parsear.
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.GITHUB_OUTPUT, `hallazgos=${hallazgos.length}\n`);
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `informe<<INFORME_EOF\n${informe}\nINFORME_EOF\n`
    );
  }

  process.exit(hallazgos.length ? 1 : 0);
})();
