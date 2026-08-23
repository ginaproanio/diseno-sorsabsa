#!/usr/bin/env node
/**
 * Los repos del ecosistema, en UN solo lugar.
 *
 * **Por qué existe (23-ago-2026).** Esta lista vivía en cinco sitios: la tabla
 * `ECOSISTEMA` de `conformidad.mjs`, la lista de clonado del workflow de
 * modales, las rutas con las que ese workflow invoca el script, y los dos
 * `*:local` de `package.json`. Dos de las cinco **ya estaban en desacuerdo**
 * (una apuntaba a `crm_inmobiliario` y la otra a `crm_inmobiliario/webs`).
 *
 * Y costó caro: el workflow de modales clonaba los repos por el nombre de la
 * CARPETA local, y DomusCRM en GitHub es `domuscrm`. **Falló en todas sus
 * ejecuciones sin contar un solo modal.** El dato correcto estaba escrito
 * —con ⚠️ y todo— en `docs/ARQUITECTURA-ECOSISTEMA.md`, en la tabla "Carpeta
 * local / Repo GitHub". Nadie la abrió.
 *
 * **El documento manda; esto lo refleja.** `ecosistema.test.mjs` compara esta
 * tabla contra la del documento y falla si divergen: si mañana se agrega un
 * producto en el `.md` y no acá (o al revés), la prueba lo dice. Es la regla 5
 * de la parte II de ESTANDAR-DESARROLLO —lo que se declara no se deduce—
 * aplicada a las herramientas, y la única forma de que un dato duplicado a
 * propósito no se pudra.
 *
 * `sub` NO sale del documento: la subcarpeta de la app está en prosa
 * (`webs/` de DomusCRM en una nota, `frontend/` del Convertidor entre
 * paréntesis), y forzar un parser sobre eso sería más frágil que el dato.
 * Se declara acá y se comprueba a mano.
 */

/** @type {{nombre:string, repo:string, dirLocal:string, sub:string}[]} */
export const ECOSISTEMA = [
  { nombre: "condomanager", repo: "condomanager", dirLocal: "condomanager", sub: "" },
  { nombre: "domuscrm", repo: "domuscrm", dirLocal: "crm_inmobiliario", sub: "webs" },
  { nombre: "justired", repo: "legaltech", dirLocal: "legaltech", sub: "" },
  { nombre: "agente24siete", repo: "agente24siete", dirLocal: "agente24siete", sub: "" },
  { nombre: "auth-sorsabsa", repo: "auth-sorsabsa", dirLocal: "auth-sorsabsa", sub: "" },
  { nombre: "convertidor", repo: "convertidor", dirLocal: "convertidor", sub: "frontend" },
  { nombre: "pagos-sorsabsa", repo: "pagos-sorsabsa", dirLocal: "pagos-sorsabsa", sub: "" },
];

/** Ruta a la app dentro del repo — la raíz, salvo que la app viva en un sub. */
const conSub = (base, sub) => (sub ? `${base}/${sub}` : base);

/**
 * Raíces en disco, SIN el subdirectorio de la app.
 *
 * `conformidad.mjs` las quiere así porque él le agrega el `sub` para armar
 * la ruta del grafo. `modales.mjs` en cambio quiere la ruta completa, porque
 * escanea archivos. Confundirlas es lo que hizo que conformidad informara
 * "Convertidor: SIN GRAFO" mirando la raíz cuando su grafo cuelga de
 * `frontend/`.
 */
export const raicesLocales = (raiz = "C:") =>
  ECOSISTEMA.map((e) => `${raiz}/${e.dirLocal}`);

/** Rutas en disco hasta la app, para las herramientas que leen archivos. */
export const rutasLocales = (raiz = "C:") =>
  ECOSISTEMA.map((e) => conSub(`${raiz}/${e.dirLocal}`, e.sub));

/** Rutas dentro del runner de CI, donde cada repo se clona en su propio nombre. */
export const rutasCI = () => ECOSISTEMA.map((e) => conSub(e.repo, e.sub));

/** Nombres de repo en GitHub — lo que hay que clonar. NO son las carpetas. */
export const reposGitHub = () => ECOSISTEMA.map((e) => e.repo);

// Se puede consultar desde bash sin escribir un script aparte:
//   node src/scripts/ecosistema.mjs repos   -> para el `git clone`
//   node src/scripts/ecosistema.mjs ci      -> rutas dentro del runner
//   node src/scripts/ecosistema.mjs locales -> rutas en disco
if (process.argv[1] && process.argv[1].endsWith("ecosistema.mjs")) {
  const que = process.argv[2];
  const salidas = { repos: reposGitHub, ci: rutasCI, locales: rutasLocales, raices: raicesLocales };
  if (salidas[que]) console.log(salidas[que]().join(" "));
  else {
    console.error("Uso: node src/scripts/ecosistema.mjs repos|ci|locales|raices");
    process.exit(2);
  }
}
