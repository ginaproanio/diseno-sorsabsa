import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Pruebas del check de huérfanos.
 *
 * **Por qué existen.** Al auditar mi propio trabajo contra ESTANDAR-DESARROLLO
 * (`PENDIENTES-ECOSISTEMA.md` §29.7, hallazgo A-2), la pregunta 17 —*¿qué
 * prueba fallaría si el defecto volviera mañana?*— tenía una sola respuesta
 * honesta para los checks del ecosistema: **ninguna**. Todo se había
 * comprobado escribiendo comandos en una terminal, que es el *"alguien, alguna
 * vez"* que la regla 1 rechaza.
 *
 * La mitad son NEGATIVAS a propósito (regla 3): comprueban que lo que NO debe
 * marcarse, no se marca. Un check de código muerto que marca de más es peor
 * que no tenerlo, porque se deja de mirar — es lo que le pasa al grafo de
 * conocimiento, donde las 41 rutas de API de CondoManager aparecen huérfanas
 * y las 41 están vivas.
 *
 * Se corre sobre repos de mentira en un directorio temporal, nunca sobre los
 * repos de los productos: probar una herramienta no debe escribir en el
 * trabajo de nadie (hallazgo A-7 de esa misma autoauditoría).
 */

const GUION = join(__dirname, 'huerfanos.mjs');

function correr(raiz: string): { code: number; salida: string } {
  try {
    const salida = execFileSync(process.execPath, [GUION, raiz], { encoding: 'utf8' });
    return { code: 0, salida };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? -1, salida: (err.stdout ?? '') + (err.stderr ?? '') };
  }
}

describe('huerfanos.mjs', () => {
  let raiz: string;

  beforeEach(() => {
    raiz = mkdtempSync(join(tmpdir(), 'huerfanos-'));
    mkdirSync(join(raiz, 'lib'), { recursive: true });
    mkdirSync(join(raiz, 'app'), { recursive: true });
  });
  afterEach(() => rmSync(raiz, { recursive: true, force: true }));

  it('marca un archivo que nadie importa', () => {
    writeFileSync(join(raiz, 'lib', 'nadie.ts'), 'export const a = 1;\n');
    const { code, salida } = correr(raiz);
    expect(code).toBe(1);
    expect(salida).toContain('lib/nadie.ts');
  });

  // NEGATIVA: si esto fallara, el check marcaría archivos vivos.
  it('NO marca un archivo que sí tiene quien lo importe', () => {
    writeFileSync(join(raiz, 'lib', 'usado.ts'), 'export const a = 1;\n');
    writeFileSync(join(raiz, 'app', 'page.tsx'),
      'import { a } from "../lib/usado";\nexport default function P() { return a; }\n');
    const { code } = correr(raiz);
    expect(code).toBe(0);
  });

  // NEGATIVA, y la que más importa: sin descontar convenciones, TODO parece
  // muerto y el informe se vuelve ruido.
  it('NO marca lo que el framework carga por convención', () => {
    writeFileSync(join(raiz, 'app', 'page.tsx'), 'export default function P() { return null; }\n');
    writeFileSync(join(raiz, 'app', 'layout.tsx'), 'export default function L() { return null; }\n');
    writeFileSync(join(raiz, 'next-env.d.ts'), '/// <reference types="next" />\n');
    const { code, salida } = correr(raiz);
    expect(code).toBe(0);
    expect(salida).not.toContain('page.tsx');
  });

  // NEGATIVA: el import de varias líneas es lo más común que hay, y exigir que
  // `import` y `from` compartan línea daba huérfanos falsos.
  it('reconoce un import repartido en varias líneas', () => {
    writeFileSync(join(raiz, 'lib', 'pieza.ts'), 'export const Pieza = 1;\nexport const Otra = 2;\n');
    writeFileSync(join(raiz, 'app', 'page.tsx'),
      'import {\n  Pieza,\n  Otra,\n} from "../lib/pieza";\nexport default function P() { return Pieza + Otra; }\n');
    const { code, salida } = correr(raiz);
    expect(code).toBe(0);
    expect(salida).not.toContain('lib/pieza.ts');
  });

  it('una ruta que no se puede leer sale con 2, no con 0', () => {
    // Un check que no pudo mirar tiene que ser indistinguible de uno que
    // encontró algo. Si esto saliera 0, renombrar un repo dejaría el check en
    // verde sin haber revisado nada.
    const { code } = correr(join(raiz, 'no-existe'));
    expect(code).toBe(2);
  });
});
