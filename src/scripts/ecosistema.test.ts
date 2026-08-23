import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * La lista de productos de `ecosistema.mjs` tiene que coincidir con la tabla
 * de `docs/ARQUITECTURA-ECOSISTEMA.md`.
 *
 * **Por qué (23-ago-2026).** El workflow de modales clonaba los repos por el
 * nombre de la CARPETA local. DomusCRM vive en `c:\crm_inmobiliario` y en
 * GitHub es `domuscrm`, así que el clone daba 404 y el check **falló en todas
 * sus ejecuciones sin contar un solo modal**. El dato correcto estaba escrito
 * —con ⚠️ incluido— en la tabla "Carpeta local / Repo GitHub" del documento
 * de arquitectura. Nadie la abrió.
 *
 * El documento manda. Esta prueba existe para que el código no pueda alejarse
 * de él en silencio: si mañana se agrega un producto en uno y no en el otro,
 * o se corrige un nombre en un solo lado, esto falla.
 */

const RAIZ = join(__dirname, '..', '..');
const DOC = join(RAIZ, 'docs', 'ARQUITECTURA-ECOSISTEMA.md');

type Entrada = { nombre: string; repo: string; dirLocal: string; sub: string };

/** Se lee el módulo de verdad, no una copia: si `ecosistema.mjs` no carga,
 *  esta prueba tiene que enterarse. */
function tablaDelCodigo(): Entrada[] {
  const salida = execFileSync(
    process.execPath,
    ['-e', 'import("./src/scripts/ecosistema.mjs").then(m => console.log(JSON.stringify(m.ECOSISTEMA)))'],
    { cwd: RAIZ, encoding: 'utf8' },
  );
  return JSON.parse(salida);
}

/** Carpeta local -> repo de GitHub, sacado de la tabla del documento. */
function tablaDelDocumento(): Map<string, string> {
  const texto = readFileSync(DOC, 'utf8');
  const mapa = new Map<string, string>();
  for (const linea of texto.split('\n')) {
    // Solo filas que declaren una carpeta `c:\algo` y un repo `ginaproanio/algo`.
    const carpeta = linea.match(/`c:\\([a-z0-9_-]+)`/i);
    const repo = linea.match(/`ginaproanio\/([a-z0-9_.-]+)`/i);
    const c = carpeta?.[1];
    const r = repo?.[1];
    if (c && r) mapa.set(c.toLowerCase(), r.toLowerCase());
  }
  return mapa;
}

describe('ecosistema.mjs contra ARQUITECTURA-ECOSISTEMA.md', () => {
  const codigo = tablaDelCodigo();
  const doc = tablaDelDocumento();

  it('el documento declara la tabla de carpetas y repos', () => {
    // Si esto falla, alguien reescribió la tabla y las demás pruebas quedarían
    // pasando en verde sobre un mapa vacío — el caso "alerta que no puede sonar".
    expect(doc.size).toBeGreaterThanOrEqual(10);
    expect(doc.get('crm_inmobiliario')).toBe('domuscrm');
  });

  it.each(tablaDelCodigo().map((e) => [e.nombre, e] as const))(
    '%s: la carpeta local y el repo coinciden con el documento',
    (_nombre, entrada) => {
      const esperado = doc.get(entrada.dirLocal.toLowerCase());
      expect(esperado).toBeDefined();
      expect(esperado).toBe(entrada.repo.toLowerCase());
    },
  );

  it('ningún repo se confunde con su carpeta cuando los nombres difieren', () => {
    // El defecto real, escrito como prueba: usar `dirLocal` donde va `repo`.
    const distintos = codigo.filter((e) => e.dirLocal !== e.repo);
    expect(distintos.length).toBeGreaterThan(0); // si no, esta prueba no prueba nada
    for (const e of distintos) {
      expect(doc.has(e.dirLocal.toLowerCase())).toBe(true);
      expect(doc.get(e.dirLocal.toLowerCase())).not.toBe(e.dirLocal.toLowerCase());
    }
  });

  // NEGATIVA: la comparación tiene que poder fallar. Una entrada inventada con
  // el nombre de carpeta puesto como repo —exactamente el bug del workflow—
  // debe ser rechazada. Sin esto no hay forma de saber si el resto pasa porque
  // está bien o porque la comprobación no mira nada.
  it('rechaza una entrada que use la carpeta local como nombre de repo', () => {
    const malo = { nombre: 'domuscrm', repo: 'crm_inmobiliario', dirLocal: 'crm_inmobiliario', sub: 'webs' };
    expect(doc.get(malo.dirLocal)).not.toBe(malo.repo);
  });
});
